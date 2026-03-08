"""Shared utility and scoring helpers."""

import base64
import binascii
import io
import json
import re
from typing import Any, Dict, List, Optional

import cv2
import docx2txt
import numpy as np
import pdfplumber

from core.config import (
    DEFAULT_TOKEN_BUDGET,
    EMAIL_RE,
    INTERVIEW_MODELS,
    MAX_PROMPT_CHARS,
    PHONE_RE,
    TERMINATION_RULES,
    logger,
    object_model,
    openrouter_client,
)

def extract_text_from_pdf_bytes(b: bytes) -> str:
    text_parts = []
    try:
        with pdfplumber.open(io.BytesIO(b)) as pdf:
            for page in pdf.pages:
                try:
                    txt = page.extract_text() or ""
                    if txt:
                        text_parts.append(txt)
                except Exception:
                    continue
    except Exception:
        return ""
    return "\n".join(text_parts)

def decode_base64_image(base64_string: str) -> Optional[np.ndarray]:
    """Decodes a Base64 string (data:image/jpeg;base64,...) to an OpenCV NumPy array."""
    if not base64_string:
        logger.error("Received empty base64 string.")
        return None

    original_start = base64_string[:50]
    
    # 1. Strip common prefixes (e.g., 'data:image/jpeg;base64,')
    if "," in base64_string:
        base64_string = base64_string.split(",", 1)[1]
    
    # Add a check for padding issues (DeepFace images are usually padded with '=')
    # base64.b64decode requires the input length to be a multiple of 4.
    padding_needed = len(base64_string) % 4
    if padding_needed != 0:
        base64_string += "=" * (4 - padding_needed)

    # Log the state after stripping/padding
    logger.info(f"[B64] Original Start: {original_start} | Final Length: {len(base64_string)}")

    try:
        # 2. Decode base64 to bytes (Note: DeepFace doesn't always send canonical Base64)
        image_bytes = base64.b64decode(base64_string, validate=True) 
        
        # 3. Convert bytes to a NumPy array
        np_arr = np.frombuffer(image_bytes, np.uint8)
        
        # 4. Decode the NumPy array into an image (OpenCV format)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        
        if img is None:
            logger.error("cv2.imdecode failed, possibly invalid image data.")
        return img
    except binascii.Error as e:
        logger.error(f"[B64 ERROR] Base64 decoding failed: {e}. Check padding/chars.")
        return None
    except Exception as e:
        logger.error(f"[CONV ERROR] Image conversion failed: {e}")
        return None
def extract_text_from_docx_bytes(b: bytes) -> str:
    try:
        return docx2txt.process(io.BytesIO(b))
    except Exception:
        return ""
def make_thumbnail_b64(img: np.ndarray, max_w: int = 160) -> str:
    try:
        h, w = img.shape[:2]
        if w > max_w:
            scale = max_w / float(w)
            img_small = cv2.resize(img, (int(w * scale), int(h * scale)))
        else:
            img_small = img.copy()
        # convert BGR -> JPEG bytes
        ok, buf = cv2.imencode(".jpg", img_small, [int(cv2.IMWRITE_JPEG_QUALITY), 60])
        if not ok:
            return ""
        return "data:image/jpeg;base64," + base64.b64encode(buf.tobytes()).decode("ascii")
    except Exception:
        return ""
# ================= SMART PROJECT INTELLIGENCE =================

def normalize_text(text: str) -> str:
    return re.sub(r'[^a-z0-9 ]', '', text.lower()).strip()

def compute_similarity(text1: str, text2: str) -> float:
    """Jaccard similarity for semantic deduplication"""
    w1 = set(normalize_text(text1).split())
    w2 = set(normalize_text(text2).split())
    if not w1 or not w2:
        return 0.0
    return len(w1 & w2) / len(w1 | w2)
def get_diverse_question_hint(history: List[Dict[str, Any]], required_type: str) -> str:
    """
    Generates STRICT constraints to prevent topic repetition.
    NOW: Detects probe patterns and FORCES topic switch after 1 probe.
    """
    if not history:
        return "STARTING INTERVIEW: Scan the resume. Identify the MOST COMPLEX project or skill listed and start there."
    
    # ==============================================================================
    # 1. ENHANCED STAGNATION DETECTION (CATCHES PROBE LOOPS)
    # ==============================================================================
    pivot_instruction = ""
    
    # A. Detect Probe Pattern (Last 2 questions are similar)
    if len(history) >= 2:
        last_q = history[-1].get("question", "")
        prev_q = history[-2].get("question", "")
        
        similarity = compute_similarity(last_q, prev_q)
        
        # If similarity > 0.25, we JUST probed. MANDATORY SWITCH.
        if similarity > 0.25:
            pivot_instruction += f"""
🚨 PROBE LOOP DETECTED (Similarity: {similarity:.2f})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MANDATORY ACTION: COMPLETE TOPIC SWITCH
- The last question was ALREADY a follow-up/probe
- You MUST ask about a COMPLETELY DIFFERENT topic now
- Switch category entirely (e.g., Project → DSA, DSA → Experience)
- DO NOT reference anything from the last 2 questions
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""

    # B. Detect Chronic Weakness (Last answer scored low)
    last_entry = history[-1]
    last_score = last_entry.get("score")
    
    if last_score is not None and float(last_score) < 0.50:
        pivot_instruction += f"""
⚠️ LOW SCORE DETECTED ({float(last_score):.2f})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Candidate struggled with this topic
- Give them a FRESH START on a different area
- DO NOT drill deeper into this weakness
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""

    # ==============================================================================
    # 2. EXISTING LOGIC: EXTRACT FORBIDDEN WORDS (Preserved)
    # ==============================================================================
    recent_words = set()
    recent_questions_text = []
    
    for h in history[-6:]:
        q = h.get("question", "").lower()
        recent_questions_text.append(q[:100])
        
        words = re.findall(r'\b[a-z]{5,}\b', q)
        stopwords = {'would', 'could', 'should', 'please', 'explain', 'describe', 
                     'implement', 'create', 'write', 'function', 'method', 'class', 
                     'what', 'how', 'when', 'why'}
        technical_words = [w for w in words if w not in stopwords]
        recent_words.update(technical_words[:15])
    
    tech_patterns = [
        r'\b(python|java|javascript|react|node|sql|aws|docker|kubernetes)\b',
        r'\b(machine learning|deep learning|neural network|nlp|cnn|lstm)\b',
        r'\b(api|rest|graphql|microservices|database|optimization)\b',
        r'\b(algorithm|data structure|sorting|searching|dynamic programming)\b'
    ]
    
    mentioned_techs = set()
    combined_history = " ".join(recent_questions_text)
    for pattern in tech_patterns:
        matches = re.findall(pattern, combined_history)
        mentioned_techs.update(matches)
    
    forbidden_list = list(recent_words)[:12] + list(mentioned_techs)[:8]
    
    hint = f"\n⛔ ABSOLUTE PROHIBITION - DO NOT ASK ABOUT:\n"
    hint += f"   Topics: {', '.join(forbidden_list)}\n"
    hint += f"   Context: These were ALREADY covered in previous questions.\n"
    
    # ==============================================================================
    # 3. MERGE: PREPEND PIVOT INSTRUCTION (Most Important)
    # ==============================================================================
    hint = pivot_instruction + hint

    # ==============================================================================
    # 4. TYPE CONSTRAINTS (Preserved)
    # ==============================================================================
    if required_type == "project_discussion":
        hint += "\n🎯 MANDATORY REQUIREMENTS:\n"
        hint += "   1. Pick a DIFFERENT project than previously discussed\n"
        hint += "   2. Focus on a SPECIFIC feature, metric, or technical decision\n"
        hint += "   3. Ask 'HOW did you implement X?' not 'What is X?'\n"
        hint += "   4. Reference exact tools/frameworks from the resume\n"
    
    elif required_type == "coding_challenge":
        hint += "\n🎯 MANDATORY REQUIREMENTS:\n"
        hint += "   1. Create a problem using a DIFFERENT algorithm/data structure\n"
        hint += "   2. Avoid problems similar to what was already asked\n"
        hint += "   3. Focus on: Arrays, Strings, HashMaps, Trees, or Graphs\n"
        hint += "   4. Make it solvable in 10-15 minutes\n"
    
    elif required_type == "conceptual":
        hint += "\n🎯 MANDATORY REQUIREMENTS:\n"
        hint += "   1. Ask about a DIFFERENT technical concept\n"
        hint += "   2. Focus on trade-offs or architecture decisions\n"
        hint += "   3. Relate to their resume but use NEW terminology\n"
    
    return hint
  
def is_repetitive_question(new_q: str, history: List[Dict[str, Any]]) -> bool:
    """🔧 IMPROVED: Better repetition detection with multiple checks"""
    if not new_q or not history:
        return False

    new_norm = normalize_text(new_q)
    new_words = set(new_norm.split())
    
    # Check last 8 questions (increased from 6)
    for h in history[-8:]:
        prev = h.get("question", "")
        prev_norm = normalize_text(prev)
        prev_words = set(prev_norm.split())
        prev_type = h.get("type", "conceptual")
        # Exact match
        if prev_type in ["collaboration", "ownership", "achievement", "behavioral"]:
            continue
        if new_norm == prev_norm:
            logger.warning(f"Exact match detected: '{new_q[:50]}...'")
            return True

        # High semantic overlap (lowered threshold from 0.70 to 0.65)
        similarity = compute_similarity(new_q, prev)
        if similarity > 0.65:
            logger.warning(f"High similarity ({similarity:.2f}): '{new_q[:50]}...'")
            return True
        
        # Check if >70% of key words are shared (new check)
        if len(new_words) > 0 and len(new_words & prev_words) / len(new_words) > 0.70:
            logger.warning(f"Word overlap detected: '{new_q[:50]}...'")
            return True

    return False

def extract_question_topics(question: str) -> set:
    """Extract key technical topics from a question for comparison"""
    q_lower = question.lower()
    
    # Technical terms to extract
    tech_terms = set()
    
    # Programming languages
    langs = ['python', 'java', 'javascript', 'typescript', 'c++', 'go', 'rust']
    for lang in langs:
        if lang in q_lower:
            tech_terms.add(lang)
    
    # Frameworks/Libraries
    frameworks = ['react', 'angular', 'vue', 'django', 'flask', 'spring', 'express', 'fastapi']
    for fw in frameworks:
        if fw in q_lower:
            tech_terms.add(fw)
    
    # Concepts
    concepts = ['api', 'database', 'optimization', 'algorithm', 'data structure', 
                'machine learning', 'neural network', 'microservices', 'docker', 'kubernetes']
    for concept in concepts:
        if concept in q_lower:
            tech_terms.add(concept.replace(' ', '_'))
    
    # Algorithm types
    algos = ['sorting', 'searching', 'tree', 'graph', 'array', 'string', 'hash', 'dynamic programming']
    for algo in algos:
        if algo in q_lower:
            tech_terms.add(algo)
    
    return tech_terms
def normalize_project_name(name: str) -> str:
    if not name:
        return ""
    name = name.lower()
    name = re.sub(r'[^a-z0-9 ]', '', name)
    name = re.sub(r'\s+', ' ', name).strip()
    return name
    
def redact_pii(text: str) -> Dict[str, Any]:
    if not text:
        return {"redacted": "", "redaction_log": []}
    log = []
    for m in set(EMAIL_RE.findall(text)):
        log.append({"type":"email","value":m})
        text = text.replace(m, "[REDACTED_EMAIL]")
    text = PHONE_RE.sub("[REDACTED_PHONE]", text)
    return {"redacted": text, "redaction_log": log}
def scan_frame_for_violations(img_array: np.ndarray) -> Dict[str, Any]:
    """
    Scans for BOTH prohibited items and multiple people using YOLOv8.
    """
    # Run inference
    results = object_model(img_array, verbose=False, conf=0.3)
    
    detected_items = []
    person_count = 0
    
    # YOLO COCO Class IDs: 0 = Person, 67 = Cell Phone
    PROHIBITED_CLASSES = {67: "cell phone"} 
    
    for r in results:
        for box in r.boxes:
            cls_id = int(box.cls[0])
            
            # Check for People
            if cls_id == 0:
                person_count += 1
            
            # Check for Objects
            if cls_id in PROHIBITED_CLASSES:
                item_name = PROHIBITED_CLASSES[cls_id]
                detected_items.append(item_name)
                
    return {
        "person_count": person_count,
        "prohibited_items": list(set(detected_items))
    } 
def calculate_resume_coverage(projects: List[Dict], history: List[Dict]) -> Dict[str, Any]:
    coverage = {p["project_id"]: False for p in projects}

    for h in history:
        pid = h.get("target_project")

        if pid and pid in coverage:
            coverage[pid] = True

    return {
        "total": len(coverage),
        "covered": sum(coverage.values()),
        "uncovered_projects": [
            p["title"] for p in projects if not coverage[p["project_id"]]
        ]
    }


        
def extract_json_from_text(s: str) -> Optional[dict]:
    if not s:
        return None
    s = s.strip()
    
    # Try direct parse first
    try:
        return json.loads(s)
    except:
        pass
    
    # Remove markdown code fences
    s = re.sub(r'```json\s*', '', s)
    s = re.sub(r'```\s*', '', s)
    
    # Find JSON object
    start = s.find("{")
    if start == -1:
        return None
    
    stack = 0
    for i in range(start, len(s)):
        if s[i] == "{":
            stack += 1
        elif s[i] == "}":
            stack -= 1
            if stack == 0:
                try:
                    return json.loads(s[start:i+1])
                except:
                    break
    return None

def safe_truncate(s: str, max_chars: int) -> str:
    if not s or len(s) <= max_chars:
        return s or ""
    return s[:max_chars-3] + "..."
def enforce_budget(payload: dict) -> dict:
    """
    CRITICAL FIX: Aggressively truncates context to prevent token explosion.
    - Limits RAG chunks to top 3 (saves ~1000 tokens)
    - Limits Conversation History to last 6 turns (saves ~infinite tokens)
    - Truncates individual text fields
    """
    # 1. Default Token Budget Safety Net
    token_budget = int(payload.get("token_budget") or 4000)
    
    # 2. Limit Resume (Strict 1500 chars ~ 375 tokens)
    # Enough for key skills/projects, prevents bloating
    resume = safe_truncate(payload.get("resume_summary",""), 1500)
    
    # 3. Limit RAG Chunks (Top 3 is sufficient for context)
    # Reduced from 5 to 3 to save money/tokens
    raw_chunks = payload.get("retrieved_chunks", []) or []
    chunks = raw_chunks[:3]
    chunks = [
        {
            "doc_id": c.get("doc_id"),
            "chunk_id": c.get("chunk_id"),
            # Truncate content to 500 chars (~125 tokens) per chunk
            "snippet": safe_truncate(c.get("snippet",""), 500),
            "score": c.get("score", 0)
        }
        for c in chunks
    ]
    
    # 4. Limit Conversation History (Last 3 pairs = 6 turns)
    # This prevents the "infinite history" bug
    raw_conv = payload.get("conversation", []) or []
    conv = raw_conv[-6:] # Strict slice
    
    # Sanitize each turn to prevent massive user pastes or system prompt leaks
    conv = [
        {
            "role": t.get("role"), 
            "text": safe_truncate(t.get("text",""), 600) # Max 600 chars per message
        } 
        for t in conv
    ]
    
    # 5. Question Truncation
    question = safe_truncate(payload.get("question",""), 1000)
    
    return {
        "resume": resume,
        "chunks": chunks,
        "conv": conv,
        "question": question
    }
def normalize_overall_score(validated: dict, history: List[Dict[str, Any]]) -> float:
    """
    Stabilizes scoring across interview.
    - Penalizes repeated weakness
    - Rewards fast improvement
    - Prevents noisy LLM jumps
    """
    score = validated.get("overall_score")
    if score is None:
        return 0.0

    score = float(score)

    # Penalize repeated weak answers
    recent = history[-3:]
    weak_count = sum(1 for h in recent if h.get("score", 1) < 0.4)
    if weak_count >= 2:
        score -= 0.10

    # Reward learning curve
    if history:
        prev = history[-1].get("score")
        if prev is not None and score > prev + 0.20:
            score += 0.05

    # Penalize low confidence mismatch
    confidence = validated.get("confidence", 0.5)
    if confidence < 0.35:
        score -= 0.05

    return max(0.0, min(1.0, score))
# Locate the existing function and REPLACE it with this robust version
def extract_whiteboard_keywords(scene_elements: List[Dict[str, Any]]) -> str:
    """
    Parses Excalidraw JSON to find what the user wrote.
    CRITICAL: Filters out deleted elements so AI doesn't see erased text.
    """
    if not scene_elements:
        return "Whiteboard is empty."

    found_text = []
    
    for el in scene_elements:
        # 1. Skip deleted elements (Excalidraw soft-deletes)
        if el.get("isDeleted", False):
            continue

        # 2. Extract text from 'text' elements
        if el.get("type") == "text" and "text" in el:
            clean_txt = el["text"].strip()
            if len(clean_txt) > 1: 
                found_text.append(clean_txt)
                
        # 3. Extract text from labeled arrows/shapes
        if "label" in el and el["label"] and "text" in el["label"]:
             clean_txt = str(el["label"]["text"]).strip()
             if len(clean_txt) > 1:
                found_text.append(clean_txt)

    if not found_text:
        return "Whiteboard contains shapes but NO text labels."

    return "Items drawn on whiteboard: " + ", ".join(found_text)
def analyze_whiteboard_image(base64_img: str) -> str:
    """
    Analyze a whiteboard image using available Groq multimodal models.
    Falls back gracefully if vision models are unavailable.
    """
    if not base64_img or not groq_client:
        return ""

    # Ordered by preference (newest / recommended first)
    VISION_MODELS = [
        "meta-llama/llama-4-scout-17b-16e-instruct",
        "meta-llama/llama-4-maverick-17b-128e-instruct",
    ]

    # Strip base64 header if present
    if "base64," in base64_img:
        base64_img = base64_img.split("base64,", 1)[1]

    for model in VISION_MODELS:
        try:
            resp = groq_client.chat.completions.create(
                model=model,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": (
                                    "Describe this system design architecture diagram. "
                                    "List the main components (e.g., Load Balancer, API, DB, Cache) "
                                    "and explain how they connect. Be concise."
                                ),
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{base64_img}"
                                },
                            },
                        ],
                    }
                ],
                temperature=0.1,
                max_tokens=500,
            )

            return resp.choices[0].message.content or ""

        except Exception as e:
            logger.warning(
                f"Vision model failed ({model}), trying fallback. Error: {e}"
            )
            continue

    # ---- FINAL FALLBACK (TEXT-ONLY MODE) ----
    logger.error(
        "All vision models unavailable. Falling back to text-only interview flow."
    )
    return ""

def derive_verdict_from_score(score: float) -> str:
    """
    Calibrated grading scale for technical interviews.
    Previous scale was too harsh (0.85+ for Strong).
    """
    if score < 0.35:
        return "fail"
    if score < 0.55:
        return "weak"
    if score < 0.75:
        return "acceptable" # 55% - 74% is passing for an Intern
    if score < 0.90:
        return "strong"     # 75% - 89% is Strong
    return "exceptional"    # 90%+ is Exceptional

def llm_call(prompt: str, temperature=0.3, max_tokens=1200) -> dict:
    """
    Robust LLM caller that cycles through the INTERVIEW_MODELS list.
    """
    for model in INTERVIEW_MODELS:
        try:
            resp = openrouter_client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": prompt}],
                temperature=temperature,
                max_tokens=max_tokens,
                extra_headers={
                    "HTTP-Referer": "http://localhost",
                    "X-Title": "ai-interview-assistant"
                }
            )

            raw = resp.choices[0].message.content
            if raw:
                return {
                    "ok": True,
                    "raw": raw,
                    "model_used": model
                }

        except Exception as e:
            logger.warning(f"Model {model} failed: {e}")
            # Continue to next model in list

    # If we reach here, all models failed
    return {"ok": False, "error": "all_models_failed"}


# ==========================================
# PERFORMANCE ANALYTICS
# ==========================================

def calculate_performance_metrics(history: List[Dict]) -> Dict[str, Any]:
    """Calculate comprehensive performance metrics from question history"""
    if not history:
        return {
            "question_count": 0,
            "average_score": 0.0,
            "last_score": None,
            "consecutive_fails": 0,
            "consecutive_wins": 0,
            "trend": "unknown",
            "confidence": 0.0
        }
    
    scores = []
    for h in history:
        s = h.get("score")
        if s is not None:
            try:
                scores.append(float(s))
            except:
                pass
    
    if not scores:
        return {
            "question_count": len(history),
            "average_score": 0.0,
            "last_score": None,
            "consecutive_fails": 0,
            "consecutive_wins": 0,
            "trend": "unknown",
            "confidence": 0.0
        }
    
    avg_score = sum(scores) / len(scores)
    last_score = scores[-1]
    
    # Calculate streaks
    consecutive_fails = 0
    consecutive_wins = 0
    
    for s in reversed(scores):
        if s < TERMINATION_RULES["consecutive_fail_threshold"]:
            consecutive_fails += 1
            consecutive_wins = 0
        elif s > TERMINATION_RULES["excellence_threshold"]:
            consecutive_wins += 1
            consecutive_fails = 0
        else:
            break
    
    # Calculate trend
    if len(scores) >= 3:
        recent_avg = sum(scores[-3:]) / 3
        earlier_avg = sum(scores[:-3]) / len(scores[:-3]) if len(scores) > 3 else avg_score
        if recent_avg > earlier_avg + 0.15:
            trend = "improving"
        elif recent_avg < earlier_avg - 0.15:
            trend = "declining"
        else:
            trend = "stable"
    else:
        trend = "insufficient_data"
    
    # Calculate confidence based on consistency
    if len(scores) >= 3:
        variance = sum((s - avg_score) ** 2 for s in scores) / len(scores)
        std_dev = variance ** 0.5
        confidence = max(0.0, min(1.0, 1.0 - std_dev))
    else:
        confidence = 0.5
    
    return {
        "question_count": len(history),
        "average_score": avg_score,
        "last_score": last_score,
        "consecutive_fails": consecutive_fails,
        "consecutive_wins": consecutive_wins,
        "trend": trend,
        "confidence": confidence,
        "score_variance": variance if len(scores) >= 3 else 0.0
    }

# ==========================================
# TERMINATION LOGIC
# ==========================================
def check_termination_rules(history: List[Dict]) -> Optional[Dict[str, Any]]:
    """
    BALANCED termination logic for campus / fresher interviews.
    Avoids early over-rejection while preventing endless interviews.
    """
    if not history or len(history) < 2:
        return None  # Need at least 2 questions

    metrics = calculate_performance_metrics(history)
    rules = TERMINATION_RULES

    qn = metrics["question_count"]
    avg = metrics["average_score"]
    last = metrics["last_score"]

    # --------------------------------------------------
    # RULE 1: Catastrophic Failure (Immediate Reject)
    # --------------------------------------------------
    if last is not None and last < rules["instant_fail_threshold"]:
        return {
            "ended": True,
            "verdict": "reject",
            "confidence": 0.95,
            "reason": f"Catastrophic failure (score {last:.2f}). Candidate lacks basic understanding.",
            "recommended_role": None,
            "trigger": "instant_fail",
            "elimination": True,
            "key_strengths": [],
            "critical_weaknesses": [],
            "feedback_summary": None # Allow AI to generate
        }

    # --------------------------------------------------
    # RULE 2: Consecutive Failures (Efficiency Reject)
    # --------------------------------------------------
    if metrics["consecutive_fails"] >= rules["consecutive_fail_count"]:
        return {
            "ended": True,
            "verdict": "reject",
            "confidence": 0.90,
            "reason": f"Failed {metrics['consecutive_fails']} consecutive questions.",
            "recommended_role": None,
            "trigger": "consecutive_fails",
            "elimination": True,
            "key_strengths": [],
            "critical_weaknesses": [],
            "feedback_summary": None # Allow AI to generate
        }

    # --------------------------------------------------
    # RULE 3: Clear Excellence (Early Hire)
    # --------------------------------------------------
    if (
        qn >= 6 and
        avg >= rules["excellence_threshold"] and
        metrics["consecutive_wins"] >= 3
    ):
        return {
            "ended": True,
            "verdict": "hire",
            "confidence": 0.95,
            "reason": f"Consistent excellence across {qn} questions.",
            "recommended_role": "SDE-1 / Entry-Level",
            "trigger": "proven_excellence",
            "elimination": False,
            "key_strengths": [],
            "critical_weaknesses": [],
            "feedback_summary": None # Allow AI to generate
        }

    # --------------------------------------------------
    # RULE 4: Chronic Weakness (Fair Reject)
    # --------------------------------------------------
    if qn >= 5:
        weak_answers = sum(1 for h in history if h.get("score", 1) < 0.45)
        weak_ratio = weak_answers / qn

        if weak_ratio >= 0.70:
            return {
                "ended": True,
                "verdict": "reject",
                "confidence": 0.88,
                "reason": f"Below minimum bar in {weak_answers}/{qn} questions.",
                "recommended_role": None,
                "trigger": "chronic_underperformance",
                "elimination": True,
                "key_strengths": [],
                "critical_weaknesses": [],
                "feedback_summary": None # Allow AI to generate
            }

    # --------------------------------------------------
    # RULE 5: Gray-Zone Timeout (Make a Call)
    # --------------------------------------------------
    if qn >= 7:
        gray_answers = sum(
            1 for h in history
            if rules["gray_zone_min"] <= h.get("score", 0) <= rules["gray_zone_max"]
        )

        if gray_answers >= 4:
            verdict = "hire" if avg >= 0.58 else "reject"
            return {
                "ended": True,
                "verdict": verdict,
                "confidence": 0.70,
                "reason": (
                    f"Prolonged gray-zone performance. "
                    f"Final decision based on average score {avg:.2f}."
                ),
                "recommended_role": "Intern" if verdict == "hire" else None,
                "trigger": "gray_zone_timeout",
                "elimination": verdict == "reject",
                "feedback_summary": None # Allow AI to generate
            }

    # --------------------------------------------------
    # RULE 6: Hard Safety Limit (Neutral Completion)
    # --------------------------------------------------
    if qn >= rules.get("max_questions", 10):
        final_average = avg
        
        HIRE_THRESHOLD = 0.60   # > 60% = Hire
        REJECT_THRESHOLD = 0.45 # < 45% = Reject
        
        if final_average >= HIRE_THRESHOLD:
            verdict = "hire"
            summary = f"Completed with strong performance. Average: {final_average:.0%}"
        elif final_average < REJECT_THRESHOLD:
            verdict = "reject"
            summary = f"Did not meet technical bar. Average: {final_average:.0%}"
        else:
            verdict = "maybe"
            summary = f"Borderline performance. Average: {final_average:.0%}"
        
        # 🔥 CRITICAL FIX: feedback_summary set to None implies "AI MUST GENERATE THIS"
        return {
            "ended": True,
            "elimination": False, 
            "verdict": verdict,   
            "confidence": 0.90, 
            "reason": summary, # Keep internal reason for logs
            "recommended_role": "SDE-1" if verdict == "hire" else None,
            "trigger": "max_questions",
            "key_strengths": [],
            "critical_weaknesses": [],
            "feedback_summary": None # <--- CHANGED from 'summary' to None
        }
    return None  # Continue interview# ==========================================

