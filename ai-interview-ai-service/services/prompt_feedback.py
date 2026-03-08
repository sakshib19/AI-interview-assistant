"""Round and interview feedback prompts."""

from typing import Any, Dict, List

from services.common import extract_json_from_text, llm_call, safe_truncate

def build_feedback_prompt(round_name: str, history: List[Dict[str, Any]]) -> str:
    """
    Generates a prompt to summarize performance for a specific interview round.
    """
    
    # 1. Compile History
    summary_text = ""
    scores = []
    
    for i, h in enumerate(history, 1):
        q = h.get("question", "")[:150]
        a = h.get("answer", "")[:200]
        s = h.get("score", 0)
        scores.append(s)
        
        # Extract technical diagnosis if available
        # We use nested lookups to handle potentially missing result structures
        res_block = h.get("result") or {}
        diag = res_block.get("technical_diagnosis") or h.get("technical_diagnosis") or {}
        
        win = diag.get("win", "N/A")
        
        # 🔥 CRITICAL FIX: Handle if 'gap' is explicitly None (JSON null)
        gap_obj = diag.get("gap")
        if gap_obj is None: 
            gap_obj = {}
            
        gap = gap_obj.get("issue", "N/A")
        
        summary_text += f"""
Q{i}: {q}
Score: {s:.2f}
Strengths: {win}
Weaknesses: {gap}
---"""

    # Avoid division by zero
    avg_score = sum(scores) / max(len(scores), 1)

    schema = '''{
  "score": 0.0-1.0,
  "feedback": "string (2-3 sentences summarizing performance in this round)",
  "strengths": ["list of specific skills shown"],
  "weaknesses": ["list of specific areas to improve"],
  "recommendation": "string (e.g., 'Focus on Time Complexity', 'Review System Design basics')"
}'''

    prompt = f"""
SYSTEM: You are a Senior Tech Interviewer.
TASK: Generate a performance summary for the "{round_name.upper()}" round.

INPUT DATA:
{summary_text}

METRICS:
Average Score: {avg_score:.2f}

INSTRUCTIONS:
1. **Analyze Patterns**: Look for recurring issues (e.g., did they fail multiple DSA questions? did they struggle with communication?).
2. **Be Specific**: Do not say "Good job". Say "Strong understanding of HashMaps but weak on Graph traversal".
3. **Score**: Provide an aggregate score (0.0 - 1.0) reflecting this round specifically.
4. **Tone**: Constructive, professional, and encouraging.

OUTPUT JSON ONLY:
{schema}
"""
    return prompt.strip()

def build_assessment_prompt(resume_text: str, difficulty: str) -> str:
    """
    Generates a high-fidelity, LeetCode-style coding assessment.
    Enforces strict structure: Constraints, Input/Output formats, and Edge Cases.
    """
    
    # Contextualize difficulty based on user request
    if difficulty == "easy":
        diff_desc = "Problem 1: Easy (Arrays/Strings). Problem 2: Medium (HashMaps/Two Pointers)."
    elif difficulty == "hard":
        diff_desc = "Problem 1: Medium (Trees/Graphs). Problem 2: Hard (DP/Advanced Recursion)."
    else: # medium
        diff_desc = "Problem 1: Easy-Medium (Arrays/Logic). Problem 2: Medium (Stack/Queue/Tree)."

    prompt = f"""
    ROLE: Senior Competitive Programming Problem Setter (LeetCode/Codeforces).
    TASK: Generate a 2-question Online Assessment (OA) JSON for a Python developer.
    
    CANDIDATE CONTEXT (Tailor themes to this, but keep problems algorithmic):
    {safe_truncate(resume_text, 800)}

    DIFFICULTY SETTING: {difficulty.upper()}
    SCOPE:
    {diff_desc}

    REQUIREMENTS FOR EACH PROBLEM:
    1. **Title**: Professional and catchy.
    2. **Description**: Clear, formal problem statement. Include a brief scenario if applicable.
    3. **Input/Output Format**: Explicitly state what the input looks like (e.g., "A list of integers nums").
    4. **Constraints**: Define data limits (e.g., "1 <= len(nums) <= 10^5", "-10^9 <= val <= 10^9").
    5. **Starter Code**: Valid Python function signature with type hints (e.g., `def solve(nums: List[int]) -> int:`).
    6. **Test Cases**: 
       - `public`: 2 simple cases (Happy path).
       - `hidden`: 3 robust cases (Edge cases: empty list, max constraints, negatives).
       - INPUTS MUST BE STRINGS OR JSON-COMPATIBLE.

    OUTPUT JSON FORMAT (STRICT):
    {{
        "assessment_id": "auto_generated_id",
        "problems": [
            {{
                "problem_id": "1",
                "title": "Problem Title",
                "description": "Full markdown description...",
                "input_format": "Detailed input description...",
                "output_format": "Detailed output description...",
                "constraints": ["Constraint 1", "Constraint 2"],
                "difficulty": "{difficulty}",
                "starter_code": "from typing import List\\n\\ndef solution(args):\\n    pass",
                "public_test_cases": [
                    {{"input": "[1, 2, 3]", "expected": "6"}},
                    {{"input": "[10, -5]", "expected": "5"}}
                ],
                "hidden_test_cases": [
                    {{"input": "[]", "expected": "0"}}, 
                    {{"input": "[0, 0, 0]", "expected": "0"}}
                ]
            }}
        ]
    }}
    
    DO NOT return markdown code fences. Return RAW JSON only.
    """
    return prompt.strip()

