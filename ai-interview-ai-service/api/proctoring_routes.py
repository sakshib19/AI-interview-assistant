"""Route module extracted from api/routes.py."""

import time

import cv2
import numpy as np
from deepface import DeepFace
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from scipy.spatial.distance import cosine

from core.config import FACE_DB, STRICT_DISTANCE_THRESHOLD, logger, object_model
from models.schemas import (
    FaceRegisterRequest,
    FaceVerificationRequest,
)
from services.interview_engine import decode_base64_image, make_thumbnail_b64

router = APIRouter()

@router.post("/interview/register-face")
async def register_face(request: FaceRegisterRequest):
    """
    Decode, validate, detect face, create embedding, and store it for the session.
    Returns 400 if image invalid / no face detected so frontend won't proceed.
    """
    try:
        if not request.image:
            raise HTTPException(status_code=400, detail="No image provided")

        # 1) decode base64 into OpenCV image
        img = decode_base64_image(request.image)
        if img is None:
            raise HTTPException(status_code=400, detail="Image decoding failed. Check Base64/data URL format.")

        # 2) quick quality checks (brightness + contrast/variance)
        try:
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            mean, stddev = cv2.meanStdDev(gray)
            mean_val = float(mean[0][0])
            stddev_val = float(stddev[0][0])
        except Exception as e:
            logger.warning("Image quality check failed to compute stats: %s", e)
            mean_val, stddev_val = 0.0, 0.0

        if mean_val < 16:
            raise HTTPException(status_code=400, detail=f"Captured image too dark (mean={mean_val:.1f}). Improve lighting.")
        if mean_val > 250:
            raise HTTPException(status_code=400, detail=f"Captured image too bright (mean={mean_val:.1f}). Avoid bright backlight.")
        if stddev_val < 6:
            raise HTTPException(status_code=400, detail=f"Captured image low-contrast or blurry (stddev={stddev_val:.1f}). Please hold still and ensure face is focused.")

        # 3) attempt to extract an embedding via DeepFace (enforce_detection => raises if no face)
        try:
            # DeepFace.represent returns a list of embeddings when given an image array
            # We force enforce_detection=True so it raises if a face isn't found.
            rep = DeepFace.represent(img_path=img, model_name="VGG-Face", detector_backend="mtcnn", enforce_detection=True)
            # The representation can be returned in different formats depending on deepface version.
            # Normalize to a plain list of floats
            embedding = None
            if isinstance(rep, list) and len(rep) > 0:
                # rep might be a list of dicts or list of vectors
                first = rep[0]
                if isinstance(first, dict) and "embedding" in first:
                    embedding = list(map(float, first["embedding"]))
                elif isinstance(first, (list, tuple, np.ndarray)):
                    embedding = [float(x) for x in first]
                else:
                    # best-effort fallback
                    embedding = [float(x) for x in np.array(first).reshape(-1).tolist()]
            elif isinstance(rep, (np.ndarray, list, tuple)):
                # fallback convert
                embedding = [float(x) for x in np.array(rep).reshape(-1).tolist()]

            if not embedding or len(embedding) < 50:
                # embedding length check - VGG-Face embeddings are large (~2622 in some builds) but we just sanity-check
                logger.warning("Unexpected embedding form/length from DeepFace: len=%s", None if embedding is None else len(embedding))
                raise HTTPException(status_code=500, detail="Failed to extract face embedding (unexpected format).")
        except ValueError as e:
            # Typical DeepFace message when no face detected
            logger.warning("DeepFace enforce_detection error during register_face: %s", e)
            raise HTTPException(status_code=400, detail="No face detected in reference image. Please align your face and try again.")
        except Exception as e:
            logger.exception("Unexpected DeepFace error during register_face")
            raise HTTPException(status_code=500, detail=f"Face processing failed: {str(e)}")

        # 4) store embedding + small diagnostic thumbnail in memory (persist to DB in prod)
        try:
            thumb_b64 = make_thumbnail_b64(img)
            FACE_DB[request.sessionId] = {
                "embedding": embedding,
                "thumbnail": thumb_b64,
                "created": time.time(),
                "mean_brightness": mean_val,
                "stddev": stddev_val
            }
            logger.info("Registered face for session=%s; embedding_len=%d mean=%.1f std=%.1f", request.sessionId, len(embedding), mean_val, stddev_val)
        except Exception as e:
            logger.exception("Failed to store face registration")
            raise HTTPException(status_code=500, detail="Server failed to store face registration.")

        # 5) Respond success (frontend should require resp.ok before proceeding)
        return {"status": "registered", "message": "Face identity saved", "sessionId": request.sessionId}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Unexpected error in register_face")
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")

@router.post("/verify_face")
def verify_face(req: FaceVerificationRequest):
    """
    MTCNN Verification:
    - Returns 200 OK for violations (so frontend handles them as valid checks).
    - Returns 400 only for session/image errors.
    """
    # 1. Validate Session
    if req.session_id not in FACE_DB:
        # This is a setup error, so 400 is appropriate here
        return JSONResponse(status_code=400, content={"verified": False, "error": "Session not found."})

    reference_embedding = FACE_DB[req.session_id]["embedding"]

    # 2. Decode image
    img2 = decode_base64_image(req.current_image)
    if img2 is None:
        return JSONResponse(status_code=400, content={"verified": False, "error": "Image decode failed"})

    # 
    # CHECK 1: COUNT FACES with MTCNN=========================================================================
    # =========================================================================
    try:
        face_objs = DeepFace.extract_faces(
            img_path=img2,
            detector_backend="mtcnn",   # Strict detector
            enforce_detection=False,    # Don't crash if 0 faces
            align=True
        )
        
        # Filter low confidence (ghost faces)
        valid_faces = [f for f in face_objs if f.get('confidence', 0) > 0.80]
        face_count = len(valid_faces)
        
    except Exception as e:
        logger.error(f"MTCNN error: {e}")
        face_count = 0

    # =========================================================================
    # CHECK 2: PROHIBITED OBJECTS (YOLO Only)
    # =========================================================================
    detected_items = []
    try:
        results = object_model(img2, verbose=False, conf=0.40)
        PROHIBITED_CLASSES = {67: "cell phone"} 
        
        for r in results:
            for box in r.boxes:
                cls_id = int(box.cls[0])
                if cls_id in PROHIBITED_CLASSES:
                    detected_items.append(PROHIBITED_CLASSES[cls_id])
                    
    except Exception as e:
        logger.warning(f"Object detection skipped: {e}")

    # =========================================================================
    # DECISION LOGIC (UPDATED: Return Dicts = 200 OK)
    # =========================================================================
    
    # 1. Check Multiple People
    if face_count > 1:
        return {
            "verified": False,
            "violation_type": "multiple_people",
            "error": "Multiple people detected",
            "person_count": face_count,
            "details": f"MTCNN detected {face_count} distinct faces."
        }
    
    # 2. Check Objects
    if detected_items:
        return {
            "verified": False, 
            "violation_type": "prohibited_object", 
            "objects": detected_items, 
            "error": "Prohibited object detected"
        }

    # 3. Check No Face
    if face_count == 0:
         return {
             "verified": False, 
             "error": "No face detected", 
             "violation_type": "no_face_detected"
         }

    # =========================================================================
    # CHECK 3: IDENTITY MATCH (VGG-Face via MTCNN)
    # =========================================================================
    try:
        embedding_objs = DeepFace.represent(
            img_path=img2,
            model_name="VGG-Face",
            detector_backend="mtcnn",
            enforce_detection=True
        )
        
        current_embedding = embedding_objs[0]["embedding"]
        
        distance = cosine(reference_embedding, current_embedding)
        
        if distance <= STRICT_DISTANCE_THRESHOLD:
            return {"verified": True, "distance": distance}
        else:
            # Return 200 OK with verified=False
            return {
                "verified": False, 
                "distance": distance, 
                "error": "Face mismatch", 
                "violation_type": "face_mismatch"
            }

    except Exception as e:
        # Return 200 with error so frontend doesn't crash
        return {
            "verified": False, 
            "error": f"Identity check failed: {str(e)}"
        }

