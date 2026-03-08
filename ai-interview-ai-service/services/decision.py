"""Decision and probe generation logic."""

from typing import Any, Dict

from core.config import TERMINATION_RULES, logger
from services.common import calculate_performance_metrics, extract_json_from_text, llm_call, check_termination_rules

def build_decision_prompt(context: dict) -> str:
    """
    Generate comprehensive decision prompt with specific technical evidence.
    Decision authority may be enforced externally; the model must not override it.
    """
    resume = context.get("resume", "")
    history = context.get("question_history", [])
    forced_verdict = context.get("final_verdict")  # Passed from call_decision if Hard Rule triggered
    
    metrics = calculate_performance_metrics(history)

    # 1. Build detailed evidence log from Technical Diagnosis
    evidence_log = ""
    for i, h in enumerate(history[-8:], 1):  # Last 8 questions only
        q_type = h.get("type", "conceptual")
        score = h.get("score", 0)

        result = h.get("result", {})
        # Safety check for diagnosis structure
        diag = result.get("technical_diagnosis") or h.get("technical_diagnosis") or {}

        strength = diag.get("win", "N/A")

        gap_obj = diag.get("gap") or {}
        weakness = gap_obj.get("issue", "N/A") if isinstance(gap_obj, dict) else "N/A"

        evidence_log += f"""
Q{i} [{q_type.upper()}]: Score {score:.2f}
- Verified Strength: "{strength}"
- Detected Gap: "{weakness}"
"""

    schema = '''{
  "ended": boolean,
  "verdict": "hire|reject|maybe",
  "confidence": 0.0-1.0,
  "reason": "Internal justification for the hiring manager",
  "feedback_summary": "Candidate-facing summary grounded strictly in evidence",
  "recommended_role": "string|null",
  "key_strengths": ["specific, recurring technical strengths"],
  "critical_weaknesses": ["specific, recurring technical gaps"]
}'''

    # Refined prompt to handle Forced Verdicts more naturally
    prompt = f"""
ROLE: You are a senior interviewer writing professional hiring feedback.

TASK:
Generate a final hiring decision summary strictly based on the verified evidence below.

IMPORTANT CONSTRAINTS:
- The hiring decision may already be determined by system rules.
- **FINAL_VERDICT (MANDATORY): {forced_verdict if forced_verdict else "Decide based on evidence"}**
- If a verdict is specified above, you MUST adopt that stance in your summary.
- Do NOT invent strengths, weaknesses, or examples.

METRICS:
- Questions Asked: {metrics['question_count']}
- Average Score: {metrics['average_score']:.2f}
- Performance Trend: {metrics['trend']}

INTERVIEW EVIDENCE LOG:
{evidence_log}

--------------------------------------------------
INSTRUCTIONS FOR 'feedback_summary':
--------------------------------------------------
Write a 3-4 sentence candidate-facing summary.

1. **IF VERDICT IS 'REJECT'**:
   - Be direct but professional. 
   - State clearly that the technical bar was not met.
   - Cite the specific gaps from the log (e.g., "While you have basic knowledge of X, deeper understanding of Y is required").

2. **IF VERDICT IS 'HIRE'**:
   - Highlight the specific areas of excellence found in the log.
   - Confirm readiness for the role.

3. **IF VERDICT IS 'MAYBE' (Gray Zone)**:
   - Highlight the **INCONSISTENCY**.
   - Example: "You showed strong potential in Python basics but struggled to apply them in System Design."

4. **NO GENERIC FILLER**:
   ❌ "You did well and we wish you luck."
   ✅ "Your explanation of Concurrency was strong, but the coding implementation lacked error handling."

--------------------------------------------------
INSTRUCTIONS FOR 'key_strengths' / 'critical_weaknesses':
--------------------------------------------------
- Extract the top 2-3 recurring themes from the Evidence Log.
- Be technical and specific.
  ✅ "Concurrency control", "Edge-case handling"
  ❌ "Hard working", "Good attitude"

--------------------------------------------------
DECISION RULES (Only use if FINAL_VERDICT is not specified):
--------------------------------------------------
1. CONTINUE (ended: false):
   Confidence < {TERMINATION_RULES['min_confidence_to_end']}

2. HIRE (ended: true):
   Strong, consistent signals across multiple topics.

3. REJECT (ended: true):
   Repeated failures in fundamentals, guessing, or bluffing.

--------------------------------------------------
Output JSON ONLY:
{schema}
"""

    return prompt.strip()

def call_decision(context: dict, temperature: float = 0.0) -> Dict[str, Any]:
    """Make hiring decision with performance-based termination"""
    
    # 1. First check hard rules
    hard_decision = check_termination_rules(context.get("question_history", []))
    
    if hard_decision:
        hard_decision["ended"] = True

        # =========================================================
        # 🔥 FIX: FORCE AI TO WRITE SUMMARY FOR HARD RULES
        # =========================================================
        try:
            # Prepare context for the AI, enforcing the rule's verdict
            decision_context = context.copy()
            decision_context["final_verdict"] = hard_decision["verdict"] 

            # Build the prompt
            prompt = build_decision_prompt(decision_context)
            
            # Call AI (use slightly higher temp for better writing)
            logger.info(f"🤖 Generating summary for Hard Rule: {hard_decision['trigger']}")
            ai_resp = llm_call(prompt, temperature=0.3, max_tokens=600)
            
            if ai_resp.get("ok"):
                ai_data = extract_json_from_text(ai_resp["raw"]) or {}
                
                # Merge AI text into the Hard Decision
                if ai_data.get("feedback_summary"):
                    hard_decision["feedback_summary"] = ai_data["feedback_summary"]
                
                if ai_data.get("key_strengths"):
                    hard_decision["key_strengths"] = ai_data["key_strengths"]
                    
                if ai_data.get("critical_weaknesses"):
                    hard_decision["critical_weaknesses"] = ai_data["critical_weaknesses"]
                    
                if ai_data.get("recommended_role") and not hard_decision.get("recommended_role"):
                    hard_decision["recommended_role"] = ai_data["recommended_role"]

        except Exception as e:
            logger.error(f"Failed to generate AI summary for termination rule: {e}")

        # =========================================================
        # FALLBACKS (Only used if AI failed above)
        # =========================================================
        
        # Ensure strengths exist
        if not hard_decision.get("key_strengths"):
            if hard_decision.get("verdict") == "hire":
                 hard_decision["key_strengths"] = ["Strong overall performance", "Met technical requirements"]
            else:
                 hard_decision["key_strengths"] = ["Participation in technical assessment"] 
        
        # Ensure weaknesses exist
        if not hard_decision.get("critical_weaknesses"):
             if hard_decision.get("verdict") == "reject":
                 hard_decision["critical_weaknesses"] = [hard_decision.get("reason", "Did not meet technical bar.")]
             else:
                 hard_decision["critical_weaknesses"] = []

        # Ensure summary exists (This was the specific bug causing your generic message)
        if not hard_decision.get("feedback_summary"):
             if hard_decision.get("verdict") == "reject":
                hard_decision["feedback_summary"] = f"The interview concluded. {hard_decision.get('reason')}"
             else:
                hard_decision["feedback_summary"] = f"Review complete. {hard_decision.get('reason')}"
            
        return {"ok": True, "parsed": hard_decision, "raw": "hard_rule_triggered"}

    # 2. Safety Guard (Prevent premature rejection on short interviews)
    history = context.get("question_history", [])
    metrics = calculate_performance_metrics(history) 
    
    if len(history) < 3 and metrics["average_score"] > 0.40:
        logger.info(f"🛡️ Safety Guard Triggered: Forcing CONTINUE")
        return {
            "ok": True, 
            "parsed": {
                "ended": False,
                "verdict": "maybe",
                "confidence": 1.0,
                "reason": "Interview too short.",
                "feedback_summary": "Please continue to the next section."
            }, 
            "raw": "safety_guard_triggered"
        }

    # 3. Consult AI (Standard Flow)
    prompt = build_decision_prompt(context)
    resp = llm_call(prompt, temperature=temperature, max_tokens=600)
    
    if not resp.get("ok"):
        return {"ok": False, "parsed": None, "raw": resp.get("error")}
    
    parsed = extract_json_from_text(resp["raw"])
    if not parsed:
        # Fallback
        return {
            "ok": True,
            "parsed": {
                "ended": metrics["question_count"] >= 6,
                "verdict": "maybe",
                "confidence": 0.5,
                "reason": "Model parse failed",
                "feedback_summary": "Review complete. Pending final analysis."
            },
            "raw": resp["raw"]
        }
    
    # Normalize
    normalized = {
        "ended": bool(parsed.get("ended", False)),
        "verdict": parsed.get("verdict", "maybe"),
        "confidence": float(parsed.get("confidence", 0.5)),
        "reason": parsed.get("reason", ""),
        "feedback_summary": parsed.get("feedback_summary") or "Thank you for completing the interview.",
        "recommended_role": parsed.get("recommended_role"),
        "key_strengths": parsed.get("key_strengths", []),
        "critical_weaknesses": parsed.get("critical_weaknesses", [])
    }

    # Ensure lists are not empty if we have data
    if not normalized["key_strengths"] and normalized["verdict"] == "hire":
        normalized["key_strengths"] = ["Strong overall performance"]
    
    if not normalized["critical_weaknesses"] and normalized["verdict"] == "reject":
        normalized["critical_weaknesses"] = [normalized["reason"]]
    
    if len(history) >= TERMINATION_RULES["max_questions"]:
        normalized["ended"] = True
    
    return {"ok": True, "parsed": normalized, "raw": resp["raw"]}

def build_probe_prompt(weakness_topic: str, prev_question: str, prev_answer: str, context: dict) -> str:
    """Generate targeted probe questions for gray-zone answers"""
    resume = context.get("resume", "")
    
    system = """You are a Technical Interviewer conducting a diagnostic probe.

PROBE STRATEGY:
The candidate gave a VAGUE or INCOMPLETE answer. Your job: Get them to be SPECIFIC.

Good probes:
- "Can you show me the actual code structure for that?"
- "What specific error did you encounter, and what was in the stack trace?"
- "Walk me through the exact steps your algorithm takes with a sample input."
- "Why did you choose approach X over Y? What were the performance numbers?"

Bad probes:
- "Can you tell me more?" (too open-ended)
- "That's interesting, continue" (not diagnostic)
"""

    schema = '''{
  "probe_question": "string (specific, forces concrete details)",
  "what_to_listen_for": ["specific signals of real knowledge"],
  "red_flags_if_missing": ["signs they're still bluffing"],
  "difficulty": "medium|hard",
  "expected_answer_length": "short|medium",
  "scoring_criteria": ["list of what makes answer acceptable"]
}'''

    prompt = f"""SYSTEM: {system}

WEAKNESS DETECTED: {weakness_topic}

ORIGINAL QUESTION:
```
{prev_question[:300]}
```

CANDIDATE'S VAGUE ANSWER:
```
{prev_answer[:400]}
```

RESUME CONTEXT:
```
{resume[:500]}
```

INSTRUCTION:
Generate a probe that forces the candidate to provide:
1. Specific technical details (code, algorithms, architectures)
2. Concrete examples (actual bug, real metric, specific file)
3. Evidence they personally implemented it (not just "we" or "the team")

Output JSON: {schema}
"""
    
    return prompt.strip()

def call_probe(weakness_topic: str, prev_question: str, prev_answer: str, context: dict) -> Dict[str, Any]:
    """Generate probe with fallback"""
    prompt = build_probe_prompt(weakness_topic, prev_question, prev_answer, context)
    resp = llm_call(prompt, temperature=0.0, max_tokens=500)
    
    if not resp.get("ok"):
        # Fallback probe
        return {
            "ok": True,
            "parsed": {
                "probe_question": f"Can you provide a specific code example or pseudocode for how you implemented {weakness_topic}?",
                "what_to_listen_for": ["code structure", "algorithm steps", "specific libraries"],
                "red_flags_if_missing": ["still vague", "changes subject", "uses 'we' without 'I'"],
                "difficulty": "medium",
                "expected_answer_length": "medium",
                "scoring_criteria": ["provides code or detailed logic", "explains specific choices"]
            },
            "raw": "fallback"
        }
    
    parsed = extract_json_from_text(resp["raw"])
    if not parsed:
        return call_probe(weakness_topic, prev_question, prev_answer, context)  # Retry once
    
    return {"ok": True, "parsed": parsed, "raw": resp["raw"]}

