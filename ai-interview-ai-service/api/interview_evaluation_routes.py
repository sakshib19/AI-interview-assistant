"""Interview route module extracted from interview_routes.py."""
from typing import Any, Dict, cast

from fastapi import APIRouter, HTTPException

from core.config import SCORING_DIMENSIONS, TERMINATION_RULES, groq_client, logger
from models.schemas import (
    DecisionRequest,
    FeedbackRequest,
    GenerateQuestionRequest,
    HintRequest,
    ProbeRequest,
    RoadmapRequest,
    ScoreAnswerRequest,
)
from services.interview_engine import (
    INTERVIEW_STATE,
    analyze_whiteboard_image,
    build_score_prompt,
    calculate_performance_metrics,
    call_decision,
    call_probe,
    condense_resume_for_verification,
    derive_verdict_from_score,
    enforce_budget,
    extract_json_from_text,
    extract_whiteboard_keywords,
    llm_call,
    normalize_overall_score,
    redact_pii,
    run_async_blocking,
    safe_truncate,
    should_verify_resume,
)

router = APIRouter()

@router.post("/generate_hint")
def generate_hint(req: HintRequest):
    """
    Context-Aware Socratic Hint. 
    Analyzes the user's partial answer to give specific, unblocking advice.
    """
    q_type = req.context_type
    partial = req.current_answer.strip() if req.current_answer else ""
    partial = safe_truncate(partial, 1500) # prevent context overflow

    # 1. Define Persona & Strategy
    if q_type == "coding_challenge":
        system_instruction = """
        You are a Senior Engineer mentoring a student.
        The candidate is writing code but is stuck.
        
        ANALYSIS STRATEGY:
        1. If 'PARTIAL CODE' is empty: Suggest a high-level approach or Data Structure (e.g., "Try a Hash Map").
        2. If 'PARTIAL CODE' has syntax errors: Point them out gently.
        3. If 'PARTIAL CODE' has bad logic (e.g., O(n^2)): Hint at optimization.
        4. If they are almost done: Suggest checking edge cases.
        
        DO NOT write the corrected code. Nudge them.
        """
    elif q_type == "system_design":
        system_instruction = """
        You are a System Architect.
        The candidate is designing a system on a whiteboard.
        
        ANALYSIS STRATEGY:
        1. If empty: Suggest starting with Functional Requirements or API definition.
        2. If they have components but no DB: "How will you store the data?"
        3. If they have a DB but no Scale: "How will this handle 1M users?"
        """
    else:
        system_instruction = """
        You are an Interviewer.
        The candidate is answering a conceptual question.
        If they are off-track, guide them back. If they are stuck, give an analogy.
        """

    prompt = f"""
    SYSTEM: {system_instruction}
    
    INTERVIEW QUESTION:
    "{req.question}"
    
    CANDIDATE'S CURRENT PARTIAL WORK:
    ```
    {partial if partial else "(Candidate has not started yet)"}
    ```
    
    OUTPUT:
    Provide a single, specific hint (max 2 short sentences).
    """
    
    try:
        # Temperature 0.3 for helpful, consistent advice
        resp = llm_call(prompt, temperature=0.3, max_tokens=150)
        
        if not resp.get("ok"):
             raise HTTPException(status_code=502, detail="AI hint generation failed")
        
        raw_hint = resp["raw"].strip().replace('"', '')
        return {"hint": raw_hint}
    except Exception as e:
        logger.error(f"Hint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/score_answer")
def score_answer(req: ScoreAnswerRequest):
    """
    Score answer using Groq (Llama 3.3) for ultra-low latency.
    Falls back to OpenRouter only if Groq fails.
    """
    payload = req.dict()

    # ------------------------------------------------------------------
    # 1. PII redaction
    # ------------------------------------------------------------------
    redaction_log = []
    if not payload.get("allow_pii") and payload.get("resume_summary"):
        r = redact_pii(payload["resume_summary"])
        payload["resume_summary"] = r["redacted"]
        redaction_log = r["redaction_log"]

    enforced = enforce_budget(payload)
    resume_context = condense_resume_for_verification(payload.get("resume_summary", ""))

    # ------------------------------------------------------------------
    # Whiteboard context (system design only)
    # ------------------------------------------------------------------
    whiteboard_context = ""
    if payload.get("question_type") == "system_design":
        if payload.get("whiteboard_snapshot"):
            vision_desc = analyze_whiteboard_image(payload["whiteboard_snapshot"])
            if vision_desc:
                whiteboard_context = f"AI VISION ANALYSIS OF DIAGRAM:\n{vision_desc}"

        if not whiteboard_context:
            elements = payload.get("whiteboard_elements", [])
            whiteboard_context = extract_whiteboard_keywords(elements)

    context = {
        "resume": resume_context,
        "chunks": enforced.get("chunks", []),
        "question_type": payload.get("question_type", "text"),
        "code_execution_result": payload.get("code_execution_result"),
        "whiteboard_text_summary": whiteboard_context,
        "playback_history": payload.get("playback_history", []),
    }

    prompt = build_score_prompt(
        payload.get("question_text", ""),
        payload.get("ideal_outline", ""),
        payload.get("candidate_answer", ""),
        context=context,
        user_time_complexity=payload.get("user_time_complexity"),
        user_space_complexity=payload.get("user_space_complexity"),
    )

    # ------------------------------------------------------------------
    # 3. LLM CALL (Groq → fallback)
    # ------------------------------------------------------------------
    parsed: Dict[str, Any] | None = None
    raw_text = ""
    used_source = "groq"

    if groq_client:
        try:
            resp = run_async_blocking(groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,
                max_tokens=1500,
                response_format={"type": "json_object"},
            ))
            raw_text = resp.choices[0].message.content
            parsed = extract_json_from_text(raw_text)
        except Exception:
            used_source = "openrouter_fallback"

    if not parsed:
        resp = llm_call(prompt, temperature=0.1, max_tokens=1500)
        if not resp.get("ok"):
            raise HTTPException(status_code=502, detail="Scoring failed")
        raw_text = resp["raw"]
        parsed = extract_json_from_text(raw_text)

    # ------------------------------------------------------------------
    # 🔒 TYPE GUARD (FIXES PYLANCE ERROR)
    # ------------------------------------------------------------------
    if parsed is None or not isinstance(parsed, dict):
        raise HTTPException(status_code=502, detail="LLM returned invalid JSON")

    parsed = cast(Dict[str, Any], parsed)

    # ------------------------------------------------------------------
    # Force consistency PASS for coding questions (early, safe)
    # ------------------------------------------------------------------
    if payload.get("question_type") == "coding_challenge":
        parsed["consistency_check"] = {
            "status": "PASS",
            "flagged_claim": None,
            "reason": None,
        }

    parsed.setdefault(
        "consistency_check",
        {"status": "PASS", "flagged_claim": None, "reason": None},
    )

    # ------------------------------------------------------------------
    # 4. Validation & Post-processing
    # ------------------------------------------------------------------
    validated = {
        "overall_score": None,
        "dimension_scores": {},
        "complexity_analysis": {}, # <--- ADDED FIELD
        "confidence": 0.5,
        "verdict": "weak",
        "rationale": "",
        "feedback_for_candidate": "No feedback provided.",
        "red_flags_detected": [],
        "missing_elements": [],
        "follow_up_probe": None,
        "technical_diagnosis": {"sub_topics": [], "gap": {}, "fix": {}},
    }

    needs_review = False

    try:
        # ---------------- Overall score ----------------
        score = parsed.get("overall_score")
        if score is not None:
            validated["overall_score"] = max(0.0, min(1.0, float(score)))

        # ---------------- Dimension scores ----------------
        dim_scores = parsed.get("dimension_scores", {})
        for dim in SCORING_DIMENSIONS.keys():
            val = dim_scores.get(dim)
            if val is not None:
                validated["dimension_scores"][dim] = max(0.0, min(1.0, float(val)))

        # ---------------- COMPLEXITY ANALYSIS (NEW) ----------------
        if payload.get("question_type") == "coding_challenge":
            comp = parsed.get("complexity_analysis")
            if comp and isinstance(comp, dict):
                # Trust the LLM extraction
                validated["complexity_analysis"] = {
                    "claimed_time": comp.get("claimed_time", "N/A"),
                    "claimed_space": comp.get("claimed_space", "N/A"),
                    "actual_time": comp.get("actual_time", "N/A"),
                    "actual_space": comp.get("actual_space", "N/A"),
                    "verdict": comp.get("verdict", "NOT_PROVIDED")
                }
            else:
                # Fallback: Construct using UI inputs so frontend doesn't break
                validated["complexity_analysis"] = {
                    "claimed_time": payload.get("user_time_complexity", "NOT_PROVIDED"),
                    "claimed_space": payload.get("user_space_complexity", "NOT_PROVIDED"),
                    "actual_time": "Analysis failed",
                    "actual_space": "Analysis failed",
                    "verdict": "NOT_PROVIDED"
                }

        # ---------------- Meta fields FIRST ----------------
        validated["confidence"] = max(
            0.0, min(1.0, float(parsed.get("confidence", 0.5)))
        )
        validated["verdict"] = parsed.get("verdict", "weak")
        validated["rationale"] = parsed.get("rationale", "")
        validated["feedback_for_candidate"] = (
            parsed.get("feedback_for_candidate") or validated["rationale"]
        )
        validated["red_flags_detected"] = parsed.get("red_flags_detected", [])
        validated["missing_elements"] = parsed.get("missing_elements", [])
        validated["follow_up_probe"] = parsed.get("follow_up_probe")

        # ---------------- Resume consistency (AFTER confidence) ----------------
        if should_verify_resume(payload):
            status = parsed["consistency_check"].get("status")

            if status == "SUSPICIOUS":
                validated["confidence"] = min(validated["confidence"], 0.6)
                validated["red_flags_detected"].append("Claim Inflation")

            elif status == "CONTRADICTION":
                validated["confidence"] = min(validated["confidence"], 0.4)
                validated["overall_score"] = min(validated["overall_score"], 0.65)
                validated["red_flags_detected"].append(
                    "Resume / Answer Contradiction"
                )
                needs_review = True

        # ---------------- Normalize score ----------------
        validated["overall_score"] = normalize_overall_score(
            validated, payload.get("question_history", [])
        )

        # 🔁 Re-enforce contradiction cap AFTER normalization
        if should_verify_resume(payload):
            if parsed["consistency_check"].get("status") == "CONTRADICTION":
                validated["overall_score"] = min(validated["overall_score"], 0.65)

        # ---------------- Hint penalty ----------------
        if payload.get("hint_used"):
            validated["overall_score"] = round(validated["overall_score"] * 0.85, 2)

        validated["verdict"] = derive_verdict_from_score(validated["overall_score"])

        # ---------------- Technical diagnosis ----------------
        raw_diag = parsed.get("technical_diagnosis") or {}
        topics = raw_diag.get("sub_topics", [])
        if not topics:
            topics = [{"name": "Core Concepts", "confidence": 1.0}]

        validated["technical_diagnosis"] = {
            "sub_topics": topics,
            "win": raw_diag.get("win", "Good attempt."),
            "gap": raw_diag.get("gap", {}),
            "fix": raw_diag.get("fix", {}),
        }

        # ---------------- Review triggers ----------------
        rules = TERMINATION_RULES
        if (
            validated["overall_score"] is not None
            and rules["gray_zone_min"]
            <= validated["overall_score"]
            <= rules["gray_zone_max"]
        ):
            needs_review = True

        if validated["confidence"] < 0.4:
            needs_review = True

    except Exception as e:
        logger.exception(f"Score validation failed: {e}")
        needs_review = True

    # ------------------------------------------------------------------
    # Response
    # ------------------------------------------------------------------
    return {
        "request_id": payload["request_id"],
        "llm_raw": raw_text,
        "parsed": parsed,
        "consistency_check": parsed.get("consistency_check"),
        "validated": validated,
        "technical_diagnosis": validated["technical_diagnosis"],
        "complexity_analysis": validated.get("complexity_analysis"), # <--- ENSURE RETURNED
        "needs_human_review": needs_review,
        "source": used_source,
        "redaction_log": redaction_log,
    }

@router.post("/probe")
def probe(req: ProbeRequest):
    """Generate diagnostic probe question for weak/vague answers"""
    payload = req.dict()
    
    # PII redaction
    redaction_log = []
    if not payload.get("allow_pii") and payload.get("resume_summary"):
        r = redact_pii(payload["resume_summary"])
        payload["resume_summary"] = r["redacted"]
        redaction_log = r["redaction_log"]
    
    enforced = enforce_budget(payload)
    
    context = {
        "resume": enforced.get("resume", ""),
        "chunks": enforced.get("chunks", []),
        "conv": enforced.get("conv", [])
    }
    
    probe_result = call_probe(
        payload.get("weakness_topic", ""),
        payload.get("prev_question", ""),
        payload.get("prev_answer", ""),
        context
    )
    
    return {
        "request_id": payload["request_id"],
        "llm_raw": probe_result.get("raw"),
        "parsed": probe_result.get("parsed"),
        "redaction_log": redaction_log
    }

@router.post("/finalize_decision")
def finalize_decision(req: DecisionRequest):
    """Make final hiring decision with performance-based termination"""
    payload = req.dict()
    
    if not payload.get("allow_pii") and payload.get("resume_summary"):
        r = redact_pii(payload["resume_summary"])
        payload["resume_summary"] = r["redacted"]
    
    enforced = enforce_budget(payload)
    
    metrics = calculate_performance_metrics(payload.get("question_history", []))
    
    context = {
        "resume": enforced.get("resume", ""),
        "conversation": payload.get("conversation", []),
        "question_history": payload.get("question_history", []),
        "retrieved_chunks": enforced.get("chunks", [])
    }
    
    result = call_decision(context, temperature=0.0)
    
    is_final = False
    
    if result.get("ok") and result.get("parsed"):
        decision = result["parsed"]
        verdict = decision.get("verdict")
        confidence = decision.get("confidence", 0.0)

        if result.get("raw") == "hard_rule_triggered":
            is_final = True
        elif payload.get("accept_model_final", True):
            if verdict in ("hire", "reject") and confidence >= 0.75:
                is_final = True
            elif verdict == "reject" and metrics["average_score"] < 0.45:
                is_final = True

    return {
        "request_id": payload["request_id"],
        "result": result,
        "is_final": is_final,
        "performance_metrics": metrics,
        "termination_rule_triggered": result.get("raw") == "hard_rule_triggered"
    }

@router.get("/coverage/{session_id}")
def get_coverage(session_id: str):
    """Debug endpoint to see interview coverage"""
    if session_id not in INTERVIEW_STATE:
        return {"error": "Session not found"}
    
    state = INTERVIEW_STATE[session_id]
    
    uncovered = [
        p["title"] for p in state.projects 
        if p["project_id"] not in state.covered_projects
    ]
    
    covered = [
        p["title"] for p in state.projects 
        if p["project_id"] in state.covered_projects
    ]
    
    return {
        "session_id": session_id,
        "total_questions": len(state.history),
        "difficulty": state.difficulty_level,
        "section_counts": state.section_counts,
        "projects": {
            "total": len(state.projects),
            "covered": len(covered),
            "covered_list": covered,
            "uncovered_list": uncovered
        },
        "visited_topics": list(state.visited_topics)[:20]  # Top 20 topics
    }

