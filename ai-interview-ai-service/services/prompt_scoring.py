"""Scoring and behavior-analysis prompts."""

import json
from typing import Any, Dict, List,Optional

from core.config import INTERVIEW_ROUNDS, SCORING_DIMENSIONS
from services.common import derive_verdict_from_score, normalize_overall_score

def analyze_coding_behavior(playback: List[Dict[str, Any]]) -> str:
    """
    Analyzes coding history for behavioral signals (Paste Detection, Debugging, Timing).
    """
    if not playback:
        return "No playback data available."

    signals = []
    
    # 1. Check for Massive Paste (Anti-Cheat)
    max_jump = 0
    prev_len = 0
    for snap in playback:
        curr_len = len(snap.get("code", ""))
        jump = curr_len - prev_len
        # Ignore initial load or small edits
        if jump > 50 and snap.get("trigger") != 'initial': 
            max_jump = max(max_jump, jump)
        prev_len = curr_len
    
    if max_jump > 300:
        signals.append(f"⚠️ MAJOR RED FLAG: Detected huge paste of {max_jump} chars in <5s. Likely copied solution.")
    elif max_jump > 100:
        signals.append(f"⚠️ Warning: Detected large paste of {max_jump} chars.")

    # 2. Check Debugging (Process)
    run_count = sum(1 for snap in playback if snap.get("trigger") == 'run')
    if run_count == 0:
        signals.append("🤔 Suspicious: User never ran the code. Wrote perfectly in one go?")
    elif run_count > 3:
        signals.append(f"✅ Good Process: User tested code {run_count} times, showing iterative debugging.")

    # 3. Time
    if len(playback) > 1:
        try:
            start = float(playback[0].get('timestamp', 0))
            end = float(playback[-1].get('timestamp', 0))
            duration = (end - start) / 60000
            signals.append(f"⏱️ Coding Time: {duration:.1f} minutes.")
        except:
            pass

    return "\n".join(signals)

def build_score_prompt(
    question_text: str,
    ideal_outline: str,
    candidate_answer: str,
    context: Optional[Dict[str, Any]] = None,
    user_time_complexity: Optional[str] = None,
    user_space_complexity: Optional[str] = None
) -> str:
    """
    CAMPUS-LEVEL MULTI-DIMENSIONAL SCORING PROMPT

    Target Audience:
    - Students / Freshers / Interns
    - Placement & campus interviews

    Philosophy:
    - Honest partial understanding > perfect copied answers
    - Harsh on bluffing, fair on learning intent
    - Deterministic scoring (less LLM freedom)
    """

    context = context or {}

    # -------------------- Context Extraction --------------------
    question_type = context.get("question_type", "text")
    resume = context.get("resume", "")
    chunks = context.get("chunks", [])
    exec_result = context.get("code_execution_result", {})
    
    playback_history = context.get("playback_history")
    q_history = context.get("question_history", [])
    history_text = "No previous history."
    if q_history:
        # Format last 3 questions for context checking
        history_text = "\n".join([
            f"Q: {h.get('question', '')[:100]}...\nA: {h.get('answer', '')[:100]}..." 
            for h in q_history[-3:]
        ])
    playback_summary = (
        analyze_coding_behavior(playback_history)
        if playback_history else "No behavioral data available."
    )

    reference_chunks = ""
    if chunks:
        reference_chunks = "\n".join(
            f"[Ref {c.get('doc_id')}:{c.get('chunk_id')}] {c.get('snippet','')[:300]}"
            for c in chunks[:3]
        )


    dimensions_text = "\n".join(
    f"- {name} (weight {info['weight']}): {info['description']}"
    for name, info in SCORING_DIMENSIONS.items()
)    
    debugging_instruction = ""
    if question_type == "debugging":
        debugging_instruction = """
--------------------------------------------------
DEBUGGING ROUND SCORING RULES
--------------------------------------------------
1. **Diagnosis (30%)**: Did they identify WHY the code was failing?
2. **The Fix (40%)**: Did they modify the logic correctly without breaking existing functionality?
3. **Efficiency (20%)**: Did they fix the bug in a clean way, or did they write a messy patch?
4. **Verification (10%)**: Did they run tests to prove the fix works?

- **Bonus**: If they explain the root cause clearly (e.g., "The previous loop condition caused an index out of bounds").
- **Penalty**: If they rewrote the entire function from scratch instead of debugging the existing code.
"""

    CONSISTENCY_RULES = ""
    if question_type != "coding_challenge":
        CONSISTENCY_RULES = """
12. **RESUME & HISTORY CONSISTENCY CHECK (NON-CODING ONLY)**
- Apply ONLY for system design or explanation questions.
- Compare candidate claims against:
  a) RESUME CONTEXT
  b) PREVIOUS ANSWERS (if provided)

Output:
"consistency_check": {
  "status": "PASS | SUSPICIOUS | CONTRADICTION",
  "flagged_claim": "exact quoted claim or null",
  "reason": "brief factual explanation or null"
}

Rules:
- PASS: Claim is supported or not verifiable.
- SUSPICIOUS: Claim inflates ownership/scope beyond resume.
- CONTRADICTION: Claim directly conflicts with resume or earlier answer.

Do NOT guess intent. Do NOT penalize learning progression.
If the candidate explicitly corrects or downgrades an earlier claim
(e.g., "Earlier I said I led it — to clarify, I implemented one module"),
treat this as HONEST SELF-CORRECTION, not contradiction.

"""
    
    # ============================================================
    # CODING QUESTION PROMPT (STRICT CAMPUS LOGIC)
    # ============================================================
    complexity_block = ""
    if question_type == "coding_challenge":
        passed = exec_result.get("passed", False)
        output_log = exec_result.get("output", "No output")
        error_type = exec_result.get("error", "None")

        # UPDATED: More robust checking for complexity presence
        if user_time_complexity or user_space_complexity:
            c_time = user_time_complexity if user_time_complexity else "NOT_PROVIDED"
            c_space = user_space_complexity if user_space_complexity else "NOT_PROVIDED"

            complexity_block = f"""
--------------------------------------------------
COMPLEXITY AUDIT (MANDATORY)
--------------------------------------------------
Candidate Explicitly Claimed:
- Time: {c_time}
- Space: {c_space}

YOUR TASK:
1. Analyze the 'CANDIDATE ANSWER' code to find the ACTUAL Time and Space complexity.
2. Compare ACTUAL vs CLAIMED.
3. Fill the `complexity_analysis` JSON object at the bottom.

SCORING RULES FOR COMPLEXITY:
- If CLAIMED is 'NOT_PROVIDED' → Deduct 0.10 from technical_accuracy.
- If CLAIMED matches ACTUAL → Award +0.05 Bonus.
- If CLAIMED differs from ACTUAL → Deduct 0.20 (Mismatch Penalty).
- If ACTUAL Time Complexity is strictly worse than Optimal (e.g. O(n^2) vs O(n)) → Cap overall_score at 0.75.
"""

        return f"""
ROLE:
You are a **Campus Placement Code Evaluator**.

Candidate Profile:
- Fresher / Student / Intern
- Expect correctness and clarity, not elite optimization unless justified

QUESTION:
{question_text}

IDEAL OUTLINE (FOR REFERENCE ONLY):
{ideal_outline}

CANDIDATE ANSWER:
{candidate_answer}

EXECUTION FACTS (DO NOT IGNORE):
- Tests Passed: {passed}
- Error Type: {error_type}

EXECUTION OUTPUT (TRUNCATED):
{output_log[:800]}

{complexity_block}
PREVIOUS ANSWERS (for interviewer context only):
{history_text}


REFERENCE MATERIAL (if any):
{reference_chunks}

BEHAVIORAL SIGNALS:
{playback_summary}

--------------------------------------------------
STRICT SCORING RULES (NON-NEGOTIABLE)
--------------------------------------------------

1. IF TESTS FAILED:
   - MAX overall score = 0.50
   - Minor syntax / edge-case miss → 0.35-0.45
   - Core logic misunderstanding → < 0.30

2. IF TESTS PASSED:
   - BASE SCORE = 0.70
   - +0.05 to +0.25 ONLY for:
     • clear logic
     • meaningful variable names
     • edge-case handling
     • appropriate data structures
     • correct complexity analysis

3. OPTIMIZATION CAPS:
   - If optimal is O(n) but solution is O(n²):
     → overall score CANNOT exceed 0.75
   - Passing brute force ≠ excellent solution

4. CODE QUALITY PENALTIES:
   - Single-letter variables (except i, j, n) → penalty
   - Deep nesting without explanation → penalty
   - No comments for non-trivial logic → penalty

5. CHEATING / BLUFFING CHECK (ZERO TOLERANCE):
   - Hardcoded outputs → overall_score = 0.0
   - Printing expected answers → overall_score = 0.0

6. BEHAVIOR-BASED ADJUSTMENTS:
   - "MAJOR RED FLAG (Paste Detected)":
       • confidence < 0.30
       • add "Possible Plagiarism" to red_flags
       • cap overall score at 0.50
   - "Good Iterative Debugging":
       • +0.15 practical_experience
       • explicitly praise debugging process
{debugging_instruction}
--------------------------------------------------
SCORING DIMENSIONS (YOU MUST SCORE ALL):
{dimensions_text}

CAMPUS CONTEXT REMINDERS:
- Partial but genuine attempts > copied perfection
- Penalize bluffing harder than ignorance

FINAL TASK:
1. Score EACH dimension strictly (0.0-1.0).
2. Apply ALL caps, penalties, and bonuses.
3. Provide:
   - overall_score
   - dimension_scores
   - strengths
   - concrete improvement advice
   - red_flags_detected (if any)

DO NOT be generous. Be fair, strict, and consistent.
"""

    # =========================================================
    # 2. SYSTEM DESIGN SCORING (Whiteboard Consistency)
    # =========================================================
    elif question_type == "system_design":
        # Extract the text labels found in the diagram
        wb_summary = context.get("whiteboard_text_summary", "No whiteboard usage detected")
        
        system = f"""
You are a SENIOR SOFTWARE ARCHITECT evaluating a SYSTEM DESIGN interview.

CANDIDATE LEVEL: Intern / Entry-Level (Expect fundamentals, not distributed-systems mastery)

INPUTS:
- Verbal Explanation → see CANDIDATE ANSWER
- Whiteboard Text Labels → {wb_summary}

--------------------------------------------------
MANDATORY WHITEBOARD AUDIT
--------------------------------------------------
Step 1: COMPONENT COMPLETENESS CHECK
Check presence of ALL THREE: [Client/Frontend], [Backend/API], [Database/Storage]
Output: components_present, components_missing
RULE: If ANY missing → max architecture_completeness = 0.6, max overall = 0.6.

--------------------------------------------------
Step 2: SPECIFICITY & "THE BECAUSE TEST" (CRITICAL)
--------------------------------------------------
Classify components based on Justification:

1. BUZZWORD DROPPING (BLUFFING):
   - Example: "I used Redis and Kafka." (Lists tools, no reasoning)
   - ACTION: Treat as "Generic", max depth_of_understanding = 0.5.
   - Add "Keyword Stuffing" to red_flags.

2. REASONED CHOICE (STRONG):
   - Example: "I used Redis *because* we need to reduce DB load for read-heavy traffic."
   - ACTION: Treat as "Specific", boost depth_of_understanding.

SCORING RULE:
- Generic terms ("DB", "Cache") → depth ≤ 0.6
- Specific Tools (Redis, Mongo) WITHOUT 'Why' → depth ≤ 0.65 (BLUFF PENALTY)
- Specific Tools WITH 'Why' (Trade-offs, Bottlenecks) → depth ≥ 0.8

--------------------------------------------------
Step 3: SCALABILITY SIGNAL CHECK
--------------------------------------------------
Look for: Load Balancer, Queue/Kafka, Sharding, Replicas.
RULE: If Question asks for scale and these are missing → Deduct 0.15 from depth.

--------------------------------------------------
Step 4: WHITEBOARD ↔ VERBAL ALIGNMENT
--------------------------------------------------
- Diagram contradicts explanation → clarity ≤ 0.5
- Diagram unused → mention as red flag
- Diagram actively referenced → boost clarity (+0.1)

--------------------------------------------------
SCORING DIMENSIONS (SCORE ALL):
{dimensions_text}

FINAL OUTPUT REQUIREMENTS:
- components_present, components_missing
- justification_quality: "MISSING" | "WEAK" | "STRONG" (Did they explain WHY?)
- overall_score, dimension_scores, strengths, improvements, red_flags_detected
"""        
    # =========================================================
    # 3. TEXT SCORING (Standard / Fallback)
    # =========================================================
    else:
        system = f"""
You are a CAMPUS RECRUITER evaluating a technical answer for INTERNSHIP / PLACEMENT.

CANDIDATE CONTEXT:
- Student or fresher
- Answer should match what they claim in their resume
- Expect understanding, not expert depth

SCORING DIMENSIONS:
{dimensions_text}

SCORING GUIDELINES:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
THE "BECAUSE TEST" (BLUFF DETECTION):
A candidate is BLUFFING if they list a concept without a constraint or reason.
- BLUFF: "I used a HashMap." (Score: WEAK/ACCEPTABLE)
- REAL: "I used a HashMap *because* I needed O(1) lookups to avoid a nested loop." (Score: STRONG)

FAIL (0.0-0.3):
• Incorrect, irrelevant, or clearly plagiarism.
• Uses buzzwords entirely out of context.

WEAK (0.3-0.5):
• Correct keywords but NO reasoning ("It uses Hashing" - ok, but why?).
• Generic explanation, sounds memorized.

ACCEPTABLE (0.6-0.75):
• Understands core idea and basic flow.
• Explains "How" it works, but misses "Why" we use it (Trade-offs).

STRONG (0.8-0.9):
• Explains "Why" (Optimization/Bottleneck).
• Connects the concept to the specific problem constraints.

EXCEPTIONAL (0.9-1.0):
• Discusses edge cases, failure modes, or alternative approaches.

CRITICAL BLUFF SIGNALS:
- Overuse of “we” instead of “I”
- Vague phrases: “industry best practices”
- No file names, functions, or examples
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL RULES:
1. MECHANISM DEPTH: If they claim a benefit (e.g., "It's fast"), they MUST name the mechanism (e.g., "Indexing"). If they name the mechanism, they MUST explain the trade-off.
   - Missing Mechanism = Max 0.7
   - Missing Trade-off = Max 0.8

2. HONESTY: Admitting a limitation ("This fails for large N") is better than a fake perfect answer.
   - Self-correction = +0.1 bonus.
"""

    # =========================================================
    # OUTPUT SCHEMA (UPDATED WITH COMPLEXITY FIELD)
    # =========================================================
    schema = '''{
  "overall_score": 0.0-1.0,
  "dimension_scores": {
    "technical_accuracy": 0.0-1.0,
    "depth_of_understanding": 0.0-1.0,
    "practical_experience": 0.0-1.0,
    "communication_clarity": 0.0-1.0
  },
  "complexity_analysis": {
      "claimed_time": "string | null",
      "claimed_space": "string | null",
      "actual_time": "string",
      "actual_space": "string",
      "verdict": "MATCH | MISMATCH | PARTIAL_MATCH | NOT_PROVIDED"
  },
  "confidence": 0.0-1.0,
    "consistency_check": {
    "status": "PASS|SUSPICIOUS|CONTRADICTION",
    "flagged_claim": "string or null",
    "reason": "string or null"
  },

  "verdict": "fail|weak|acceptable|strong|exceptional",
  "technical_diagnosis": {
      "sub_topics": [
          {"name": "string (e.g. 'hashing')", "confidence": 0.0-1.0}
      ],
      "win": "string (Specific concept they got RIGHT)",
      "gap": null | {
          "issue": "string (The core missing concept, e.g. 'Time Complexity')",
          "expected_level": "string (e.g. 'O(n)')",
          "observed": "string (e.g. 'O(n^2)')",
          "severity": "high|medium|low"
      },
      "fix": {
          "action": "string (Specific study action)",
          "resource_type": "documentation|video|practice"
      }
  },
  "rationale": "string",
  "feedback_for_candidate": "string (Constructive criticism. Tell them specifically what they missed or what they did well)",
  "red_flags_detected": ["list"],
  "missing_elements": ["list"],
  "follow_up_probe": "string or null",
  "mentor_tip": "string"
}'''

    prompt = f"""SYSTEM:
ROLE: Senior Technical Interviewer
TASK: Evaluate the candidate's answer with strict technical scrutiny.
{system}

QUESTION ASKED:
{question_text}

IDEAL ANSWER SHOULD COVER:
{ideal_outline}

CANDIDATE ANSWER:
{candidate_answer[:800]}

RESUME CONTEXT:
{resume[:600]}

REFERENCE MATERIAL:
{reference_chunks}

INSTRUCTIONS:

1. **CORE SCORING PHILOSOPHY**
   - Score on a 0.0-1.0 scale.
   - **Honesty ≠ Competence.** If a candidate admits their solution is weak
     (e.g., "This isn't real-time"), do NOT call it "Strong".
   - Acknowledging a flaw makes it "Acceptable" (0.65-0.75), NEVER "Exceptional".

2. **ZERO TOLERANCE FOR BLUFFING**
   - Hardcoded outputs, pasted solutions, or clear plagiarism → Immediate 0.0.
   - Set `red_flags_detected` to ["Plagiarism/Hardcoding"].

3. **SCORE ↔ GAP CONSISTENCY (STRICT GATES)**
   - If overall_score ≥ 0.85:
     • `gap` MUST be null
     • "Communication Polish" is NOT allowed
   - If overall_score < 0.85:
     • A `gap` MUST be present (LOW | MEDIUM | HIGH)
   - If gap.severity == HIGH → overall_score ≤ 0.50
   - If gap.severity == MEDIUM → overall_score ≤ 0.75
   - If gap.severity == LOW → overall_score ≤ 0.85

   FINAL SCORE RULE:
   overall_score MUST equal the MINIMUM of all applicable caps
   (gap, complexity, bluff, optimization, honesty).

4. **TOPIC EXTRACTION (MANDATORY)**
   - `sub_topics`: Extract at least 2 technical concepts mentioned by the candidate.
   - ⚠️ This list must NEVER be empty.
   - `win`: One concrete thing they did right.
   - `gap`: The single most important missing element (or null).
   - `fix`: Targeted learning action (or null).

5. **GAP CLASSIFICATION & PRECISION (NO GENERIC TERMS)**
   - 🚫 BANNED PHRASES:
     "Error handling", "Edge cases", "Robustness", "Best practices",
     "Needs more depth", "Could be improved".

   - ✅ REQUIRED:
     Gap MUST name a **specific missing pattern, mechanism, or scenario**.

     Examples:
     - ❌ "Missing error handling"
       ✅ "No retry strategy (Exponential Backoff + Jitter) for API rate limits"
     - ❌ "Edge cases not handled"
       ✅ "No handling for WebSocket disconnect / reconnection events"

   - **GAP LIMIT RULE**:
     Identify ONLY ONE gap — the most impactful one.
     Do NOT list multiple gaps.

6. **FEEDBACK FORMAT (SENIOR ENGINEER VOICE)**
   - Tone: Direct, technical, constructive (not academic, not HR).
   - Structure (MANDATORY):

     "You used [X], which is appropriate because [WHY].
      However, you missed [SPECIFIC GAP], which causes [CONCRETE FAILURE SCENARIO]."

   - ⚠️ CONSTRAINTS:
     - You MUST describe what breaks in a real system due to the gap.
     - Abstract praise or criticism is DISALLOWED.

7. **ACTIONABLE ADVICE (RESOURCE TARGETING)**
   - `fix.action` MUST be a **searchable technical term**.
   - The advice must tell the candidate exactly what to study or Google.

     Examples:
     - ❌ "Improve API stability"
       ✅ "Study Circuit Breaker Pattern and Exponential Backoff with Jitter"
     - ❌ "Handle failures better"
       ✅ "Implement WebSocket heartbeat + reconnect logic"

8. **FOLLOW-UP PROBE**
   - Mandatory if score ∈ [0.35, 0.75].
   - Probe MUST directly target the identified gap.

9. **COMPLEXITY CHECKS**
   - Suboptimal complexity (e.g., O(n²) where O(n) exists):
     → MEDIUM gap
     → overall_score ≤ 0.75

10. **OUTPUT SAFETY**
    - Output valid JSON only.
    - If `gap` is null → `fix` MUST be null.
    - `sub_topics` must never be empty.

11. **MECHANISM DEPTH RULE (UNIVERSAL)**
    - If a benefit is claimed ("fast", "scales", "efficient"):
      → the mechanism MUST be named.
    - Outcome without mechanism:
      → depth_of_understanding ≤ 0.70
      → MEDIUM gap
      → overall_score ≤ 0.75
{CONSISTENCY_RULES}

IMPORTANT (INTERNAL CHECKS BEFORE OUTPUT):

1. **BECAUSE TEST**
   - Keyword/mechanism mentioned → WHY or HOW must be explained.
   - Keyword without reasoning → SOFT BLUFF
     → Max score 0.65 + red flag.

2. **ANCHORING RULE (MANDATORY)**
   - Every `win` and `gap` MUST reference a concrete element from the candidate answer
     (tool mentioned, flow described, or where explanation stopped).

3. **SELF-ADMITTED LIMITATIONS**
   - Honest admission caps score at ACCEPTABLE (≤ 0.75).

4. **FINAL SCORE**
   - overall_score = MIN of all applicable caps.

BLUFFING LEVELS:
- HARD BLUFF → Immediate 0.0
- SOFT BLUFF → Max 0.65 + red flag

DO NOT expose chain-of-thought.
Only output the final JSON.


OUTPUT FORMAT:

{schema}
"""
    return prompt.strip()

