"""Route module extracted from api/routes.py."""

from typing import Optional

import requests
from fastapi import APIRouter, File, Form, UploadFile

from core.config import GROQ_MODEL, logger
from services.interview_engine import (
    ai_parse_resume,
    extract_text_from_docx_bytes,
    extract_text_from_pdf_bytes,
    regex_parse_resume,
)

router = APIRouter()

@router.post("/parse_resume")
async def parse_resume(
    file: UploadFile = File(None),
    s3_url: Optional[str] = Form(None),
    text: Optional[str] = Form(None),
    resume_id: Optional[str] = Form(None)
):
    """Parse resume into structured format with AI + fallback"""
    raw_text = ""
    
    # Extract text from various sources
    if file is not None:
        contents = await file.read()
        filename = (file.filename or "").lower()
        
        if filename.endswith(".pdf"):
            raw_text = extract_text_from_pdf_bytes(contents)
        elif filename.endswith(".docx"):
            raw_text = extract_text_from_docx_bytes(contents)
        else:
            try:
                raw_text = contents.decode("utf-8", errors="ignore")
            except:
                raw_text = ""
                
    elif text:
        raw_text = text
        
    elif s3_url:
        try:
            r = requests.get(s3_url, timeout=15)
            if r.status_code == 200:
                content_type = r.headers.get("content-type", "")
                if "pdf" in content_type or s3_url.lower().endswith(".pdf"):
                    raw_text = extract_text_from_pdf_bytes(r.content)
                elif s3_url.lower().endswith(".docx"):
                    raw_text = extract_text_from_docx_bytes(r.content)
                else:
                    raw_text = r.text
        except Exception as e:
            logger.exception(f"Failed to fetch from S3: {e}")
            raw_text = ""
    
    raw_text = (raw_text or "").strip()
    
    if not raw_text:
        return {
            "parsed": {
                "error": "no_text_extracted",
                "name": None,
                "skills": [],
                "summary": ""
            }
        }
    
    try:
        # ✅ FIXED: Added the 'await' keyword here!
        parsed = await ai_parse_resume(raw_text)
    except Exception as e:
        logger.exception(f"Resume parsing failed: {e}")
        # If AI completely fails, it falls back to the regex parser
        parsed = regex_parse_resume(raw_text)
    
    return {"parsed": parsed, "raw_text_length": len(raw_text)}

@router.get("/performance_metrics")
def get_performance_metrics(session_id: str):
    """Get current interview performance metrics (mock endpoint - would query from DB)"""
    # In production, this would query your database
    # For now, return a template
    return {
        "session_id": session_id,
        "metrics": {
            "question_count": 0,
            "average_score": 0.0,
            "trend": "unknown",
            "recommendation": "continue"
        }
    }

@router.get("/")
def root():
    return {
        "status": "ok",
        "service": "Enhanced AI Interview Service",
        "model": GROQ_MODEL,
        "version": "2.0",
        "features": [
            "Deep technical question generation",
            "Multi-dimensional scoring",
            "Aggressive termination rules",
            "Bluff detection",
            "Gray-area probing",
            "Performance analytics"
        ]
    }