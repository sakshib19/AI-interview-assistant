"""Question-generation prompt builders."""

from typing import Any, Dict, List
import random

from core.config import INTERVIEW_MODE, INTERVIEW_ROUNDS, INTERVIEW_TRACKS, ROLE_TEMPLATES
from services.common import get_diverse_question_hint, safe_truncate
from services.projects import extract_projects_smart

def build_generate_question_prompt(
    context: dict,
    mode: str = "first",
    required_type: str = "coding_challenge",
    state=None
) -> str:
    resume = context.get("resume", "")
    history = context.get("history", []) or []
    
    # --- NEW: Context Injection ---
    company = INTERVIEW_MODE.get("company_style", "General")
    role = INTERVIEW_MODE.get("role_title", "Software Engineer")
    track_config = INTERVIEW_TRACKS.get(company, INTERVIEW_TRACKS["FAANG"])
    role_topics = ROLE_TEMPLATES.get(role.split()[0], ROLE_TEMPLATES["General"]) # Naive match
    
    track_instruction = f"""
    CONTEXT - TARGET ROLE: {role}
    CONTEXT - COMPANY STYLE: {company}
    
    STYLE GUIDE: {track_config['style_instruction']}
    PRIORITY TOPICS FOR THIS ROLE: {', '.join(role_topics)}
    """
    
    # 1. Build STRICT history context with Status Tags
    # This helps the LLM see if the previous topic was a failure
    recent_q_text_list = []
    for i, h in enumerate(history[-5:]):
        score = h.get("score", 1.0)
        status = "PASSED" if score >= 0.5 else "FAILED"
        recent_q_text_list.append(f"Q{i+1} [{status}]: {h.get('question','')[:120]}")
        
    recent_q_text = "\n".join(recent_q_text_list)
    
    diversity_hint = get_diverse_question_hint(history, required_type)
    round_context = ""
    
    if state:
        if state.current_round == "complete":
            round_context = """
═══════════════════════════════════════════════════════════════════
🎯 CURRENT ROUND: INTERVIEW COMPLETE
Status: All rounds finished.
Action: Generate a closing statement or final check.
═══════════════════════════════════════════════════════════════════
"""    
        elif state.current_round in INTERVIEW_ROUNDS:
            round_config = INTERVIEW_ROUNDS[state.current_round]
            round_progress = len(state.round_history[state.current_round]["questions"])
        
            round_context = f"""
═══════════════════════════════════════════════════════════════════
🎯 CURRENT ROUND: {round_config['name'].upper()}
Progress: Question {round_progress + 1} of {round_config['max_questions']}
Focus Areas: {', '.join(round_config['focus'])}
Pass Threshold: {round_config['pass_threshold'] * 100}%

⚠️ ELIMINATION ROUND: Candidate must maintain {round_config['pass_threshold'] * 100}%+ average to advance
═══════════════════════════════════════════════════════════════════
"""    
    difficulty_level = state.difficulty_level if state else "medium"

    # 2. Smart Project Selection
    projects = extract_projects_smart(resume)
    history_blob = " ".join([h.get("question", "").lower() for h in history])
    covered_projects = state.covered_projects if state else set()

    # Identify LAST project discussed to prevent immediate re-selection
    last_project_id = None
    if history:
        last_project_id = history[-1].get("target_project")

    available_projects = [
        p for p in projects 
        if p["project_id"] not in covered_projects 
        and p["project_id"] != last_project_id # <--- Added: Force switch if we just discussed this
        and p["title"].lower()[:15] not in history_blob
    ]
    
    target_project = None
    if required_type == "project_discussion":
        if available_projects:
            target_project = random.choice(available_projects)
        elif projects:
            # Force a different angle on a revisited project, but try to avoid the very last one
            candidates = [p for p in projects if p["project_id"] != last_project_id]
            if candidates:
                target_project = random.choice(candidates)
            else:
                target_project = random.choice(projects)
    
    # 3. Universal Strategy Controller with Resume Validation
    project_focus = "" 
    
    if required_type == "coding_challenge":
        # List already-asked algorithm types
        asked_algos = set()
        for h in history:
            q = h.get("question", "").lower()
            if "array" in q or "list" in q:
                asked_algos.add("arrays")
            if "string" in q or "substring" in q:
                asked_algos.add("strings")
            if "hash" in q or "map" in q or "dict" in q:
                asked_algos.add("hashmaps")
            if "tree" in q or "binary" in q:
                asked_algos.add("trees")
            if "graph" in q or "node" in q:
                asked_algos.add("graphs")
            if "sort" in q:
                asked_algos.add("sorting")
            if "search" in q:
                asked_algos.add("searching")
            if "dynamic" in q or "dp" in q:
                asked_algos.add("dynamic_programming")
        
        remaining_algos = ["arrays", "strings", "hashmaps", "trees", "graphs", "sorting", "searching", "dynamic programming", "two pointers", "sliding window"]
        remaining_algos = [a for a in remaining_algos if a not in asked_algos]
        
        project_focus = f"""
🎯 FOCUS: DATA STRUCTURES & ALGORITHMS (DSA)
- Ignore resume projects for this turn
- Algorithm types ALREADY ASKED: {', '.join(asked_algos) if asked_algos else 'None'}
- **MANDATORY**: Use one of these UNUSED types: {', '.join(remaining_algos[:5]) if remaining_algos else 'any algorithm'}
- Difficulty: {difficulty_level}
- Language: Python
- Create a solvable problem (not just theory)
- **CRITICAL**: This MUST be a coding problem with test cases, NOT a conceptual question
"""
    elif required_type == "system_design":
        project_focus = f"""
🎯 FOCUS: SYSTEM DESIGN (WHITEBOARD SESSION)
- The candidate has indicated backend/architecture skills.
- Ask a High-Level Design (HLD) question appropriate for a fresher/intern.
- **Classic Examples**: Design a URL Shortener, Design a Chat App, Design a Parking Lot, Design an Image Upload Service.
- **Constraints**:
  1. Ask for High Level Architecture (API, DB, Key Components).
  2. Do NOT ask for code. Ask for the *Structure*.
  3. Mention: "You can use the whiteboard to draw your components."
- Difficulty: {difficulty_level}
"""    
    elif required_type == "debugging":
        project_focus = f"""
🎯 FOCUS: DEBUGGING / SABOTAGE ROUND
- You must generate a **coding problem** and provide a **BUGGY solution**.
- The candidate's job is to FIX the code.
- **Rules for the Bug**:
  1. It must be a **LOGICAL bug** (e.g., off-by-one, missing edge case handling, wrong variable update).
  2. It must **NOT** be a syntax error (the code should run but produce wrong output).
  3. The problem difficulty should be: {difficulty_level}.
  4. Choose a classic algorithm (e.g., Binary Search, Merge Sort, BFS, Sliding Window).
  
- **Starter Code Requirement**:
  - Provide a complete function implementation.
  - Insert exactly ONE or TWO subtle bugs.
  - Add a comment near the bug ONLY if it's internal context (do not reveal it to the candidate in the description).
"""
    elif required_type == "experience":
        # ✅ CHECK: Does resume have work experience?
        has_experience = any(kw in resume.lower() for kw in ['experience', 'work history', 'employment', 'intern at', 'developer at', 'engineer at', 'worked at'])
        
        if not has_experience:
            # Fallback to skills-based conceptual question
            project_focus = """
🎯 FOCUS: Core Technical Skills (No Work Experience Found)
- Scan the 'Skills' section for their STRONGEST technology
- Ask an advanced concept question about that skill
- Example: "Explain how garbage collection works in Java" or "What's the difference between REST and GraphQL?"
- Focus on trade-offs and real-world applications
"""
        else:
            project_focus = """
🎯 FOCUS: PROFESSIONAL EXPERIENCE (WORK HISTORY)
- SCAN the 'Experience' or 'Work History' section
- Identify a SPECIFIC company and role mentioned
- Ask about a SPECIFIC responsibility, achievement, or technical decision
- Example: "At [Company Name], you mentioned [specific task]. What was the technical challenge?"
- **FORBIDDEN**: Generic questions like "Tell me about your experience"
"""

    elif required_type == "achievement":
        # ✅ CHECK: Does resume have achievements?
        has_achievements = any(kw in resume.lower() for kw in ['achievement', 'award', 'competition', 'hackathon', 'certification', 'rank', 'winner', 'finalist', 'prize'])
        
        if not has_achievements:
            # Fallback to advanced skills question
            project_focus = """
🎯 FOCUS: Advanced Technical Concepts (No Achievements Found)
- Scan the 'Skills' section
- Ask about system design or architectural trade-offs
- Example: "When would you use NoSQL vs SQL databases?" or "How would you design a scalable API?"
- Focus on decision-making and real-world scenarios
"""
        else:
            project_focus = """
🎯 FOCUS: ACHIEVEMENTS, AWARDS & CERTIFICATIONS
- SCAN for competitions, hackathons, rankings, certifications
- Pick the MOST impressive entry
- Ask about the TECHNICAL challenge solved or skill acquired
- Example: "What algorithmic approach won you [Competition Name]?" or "How did you apply [Certification skill] in practice?"
"""
    elif required_type == "collaboration":
        project_focus = """
🎯 FOCUS: TEAMWORK & CONFLICT RESOLUTION (Behavioral)
- Ask about a time the candidate faced a disagreement or conflict in a team.
- Focus on: Communication, Empathy, and Resolution.
- Example: "Tell me about a time you disagreed with a teammate's technical decision. How did you resolve it?"
- **Constraint**: Do NOT ask about technical details, ask about the *interaction*.
"""

    elif required_type == "ownership":
        project_focus = """
🎯 FOCUS: OWNERSHIP & INITIATIVE (Behavioral)
- Ask about a time the candidate went above and beyond or took responsibility for a failure.
- Focus on: Accountability, Proactivity, and Learning.
- Example: "Tell me about a mistake you made in a project. How did you fix it and what did you learn?"
- **Constraint**: Look for "I" statements, not just "We".
"""

    elif required_type in ("behavioral", "hr"):
        project_focus = """
🎯 FOCUS: GENERAL BEHAVIORAL / CULTURE FIT
- Ask a standard behavioral question using the STAR method.
- Topics: Adaptability, Time Management, or Motivation.
- Example: "Describe a situation where you had to learn a new technology very quickly."
""" 

    elif required_type == "project_discussion" and target_project:
        project_focus = f"""
🎯 FOCUS: PROJECT DEEP DIVE
- Target Project: "{target_project['title']}"
- Tech Stack: {', '.join(target_project.get('technologies', []))}
- **MANDATORY**: Ask about ONE of these aspects:
  • A specific bug they encountered and how they debugged it
  • Why they chose technology X over alternative Y
  • A performance optimization they made (with numbers/metrics)
  • A specific architectural decision (e.g., "Why microservices vs monolith?")
  • A challenging edge case they handled
  
- **FORBIDDEN**: Generic questions like "How did you build this?" or "What challenges did you face?"
- **REQUIRED**: Reference the exact project title in your question
"""
    
    else:
        project_focus = """
🎯 FOCUS: Advanced Technical Concepts
- Scan the 'Skills' section for their STRONGEST technology
- Ask about an ADVANCED concept in that technology
- Example: "Explain the event loop in Node.js" or "How does Python's GIL affect multithreading?"
- Focus on trade-offs, internals, or best practices
"""

    # 4. Build the final prompt with STRICT enforcement
    
    # 🔥 FIX: Dynamic starter code hint to prevent leaking answers
    if required_type == "debugging":
        starter_code_hint = "def function_name(params):\\n    # TODO: Fix the bug in this function\\n    # (Paste the BUGGY implementation here)\\n    pass"
    else:
        starter_code_hint = "def function_name(params):\\n    # Write your solution here\\n    pass"

    prompt = f"""
SYSTEM: You are a Senior Technical Recruiter for {company}. 
Your goal is to verify skills for a {role} position.
{track_instruction}
⚠️ CRITICAL RULES (VIOLATING THESE = FAILURE):
1. **NO REPETITION**: You MUST NOT ask about topics mentioned in previous questions
2. **BE SPECIFIC**: Quote exact claims from the resume (e.g., "You mentioned 'reduced latency by 40%'...")
3. **NO HALLUCINATIONS**: Only ask about content present in the resume below
4. **FORCE DEPTH**: Ask "HOW" and "WHY", not just "WHAT"
5. **TYPE ENFORCEMENT**: If type is coding_challenge, it MUST be a coding problem with test cases
6. **NO SPOILERS**: If type is coding_challenge, `starter_code` MUST ONLY contain the function signature. NEVER include the solution logic.

═══════════════════════════════════════════════════════════════════
CANDIDATE RESUME:
{resume[:4000]}
{round_context}

═══════════════════════════════════════════════════════════════════
PREVIOUS QUESTIONS (DO NOT REPEAT THESE TOPICS):
{recent_q_text if recent_q_text else "None - This is the first question"}

{diversity_hint}

═══════════════════════════════════════════════════════════════════
CURRENT QUESTION TYPE: {required_type.upper().replace('_', ' ')}
DIFFICULTY: {difficulty_level.upper()}

{project_focus}

═══════════════════════════════════════════════════════════════════
OUTPUT FORMAT (JSON ONLY, NO MARKDOWN):
{{
  "question": "The interview question (If debugging: Explain the scenario/failure, e.g. 'This code fails for empty lists')",
  "type": "{required_type}",
  "target_project": "{target_project['project_id'] if target_project else 'general'}",
  "sub_topic": "Identify specific skill being tested",
  "difficulty": "{difficulty_level}",
  "coding_challenge": {{
      "language": "python",
      "starter_code": "{starter_code_hint}",
      "reference_solution": "def function_name(params):\\n    # FULL WORKING SOLUTION REQUIRED FOR VALIDATION\\n    return result",
      "test_cases": [
          {{"input": "\\"json_value\\"", "expected": "\\"expected_output\\""}},
          {{"input": "\\"different_input\\"", "expected": "\\"different_output\\""}}
      ]
  }}
}}
🚨 FINAL CHECK: Re-read the PREVIOUS QUESTIONS section. Is your new question about the SAME topic? If yes, CHANGE IT."""
    return prompt.strip()

def should_verify_resume(payload):
    return payload.get("question_type") in {"system_design", "text"}