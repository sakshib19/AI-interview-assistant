"""Project extraction and coding-challenge normalization helpers."""

import json
import re
from typing import Any, Dict, List

from core.config import logger
from services.common import extract_json_from_text, llm_call, normalize_project_name, safe_truncate

def extract_technical_projects(resume: str) -> List[Dict[str, str]]:
    """Extract technical projects from resume for targeted questioning"""
    projects = []
    
    # Look for project sections
    lines = resume.split('\n')
    current_project = None
    
    for i, line in enumerate(lines):
        line_lower = line.lower().strip()
        
        # Detect project headers
        if any(keyword in line_lower for keyword in ['project', 'built', 'developed', 'created', 'implemented']):
            if current_project:
                projects.append(current_project)
            title = line.strip()[:100]
            current_project = {
                "title": title,
                "project_id": normalize_project_name(title),
                "description": "",
                "technologies": []
            }
        
        # Collect project details
        elif current_project:
            current_project["description"] += " " + line.strip()
            
            # Extract technologies
            tech_keywords = ['python', 'java', 'javascript', 'react', 'node', 'sql', 'aws', 
                           'docker', 'kubernetes', 'tensorflow', 'pytorch', 'api', 'rest', 'graphql']
            for tech in tech_keywords:
                if tech in line_lower and tech not in current_project["technologies"]:
                    current_project["technologies"].append(tech)
    
    if current_project:
        projects.append(current_project)
    
    return projects[:5]  # Return top 5 projects
def classify_project_domain(text: str) -> str:
    DOMAIN_SIGNALS = {
        'ml_ai': ['machine learning', 'neural network', 'nlp', 'vision'],
        'web_dev': ['api', 'frontend', 'backend', 'rest', 'graphql'],
        'data_engineering': ['etl', 'pipeline', 'spark', 'airflow'],
        'devops': ['docker', 'kubernetes', 'ci/cd', 'terraform'],
        'mobile': ['android', 'ios', 'flutter'],
    }

    text = text.lower()
    scores = {k: sum(kw in text for kw in v) for k, v in DOMAIN_SIGNALS.items()}
    return max(scores, key=scores.get) if max(scores.values()) > 0 else "general"


def extract_action_keywords(text: str) -> List[str]:
    ACTIONS = [
        'implemented', 'developed', 'built', 'designed',
        'optimized', 'scaled', 'deployed', 'debugged'
    ]
    t = text.lower()
    return [a for a in ACTIONS if a in t]


def calculate_project_complexity(project: Dict) -> float:
    score = 0.0
    score += min(len(project.get("technologies", [])) / 10, 0.4)
    score += min(len(project.get("description", "").split()) / 120, 0.3)
    score += min(len(project.get("keywords", [])) / 8, 0.3)
    return round(min(score, 1.0), 2)
def validate_and_fix_test_cases(
    test_cases: List[Dict[str, str]],
    reference_code: str,
    language: str = "python"
) -> List[Dict[str, str]]:
    """
    HARD VALIDATION:
    - Execute reference code for each test case
    - Replace expected output with execution output
    - Drop invalid test cases
    """

    validated = []

    for tc in test_cases:
        raw_input = tc.get("input", "")
        if raw_input is None:
            continue

        # 🔥 Execute reference solution
        result = run_code_in_sandbox(
            language=language,
            code=reference_code,
            stdin=raw_input
        )

        # ❌ If execution failed → INVALID TEST CASE
        if not result.get("success"):
            continue

        output = str(result.get("output", "")).strip()

        # ❌ Empty output → INVALID
        if output == "":
            continue

        validated.append({
            "input": str(raw_input),
            "expected": output
        })

    # ❌ If fewer than 2 valid cases → reject question
    if len(validated) < 2:
        raise HTTPException(
            status_code=422,
            detail="Reference solution could not validate enough test cases"
        )

    return validated[:3]  # cap for UI

def condense_resume_for_verification(resume_text: str) -> str:
    """
    Extracts only the 'verifiable claims' (Skills, Work, Projects) 
    to save tokens. Removes headers, contact info, and fluff.
    """
    if not resume_text: 
        return ""

    # If your system already has the parsed JSON resume, use that instead!
    # But assuming we only have text, we do a quick keyword extraction:
    
    lines = resume_text.split('\n')
    relevant_lines = []
    
    capture = False
    # Keywords that start a "Claim Section"
    triggers = ['experience', 'work', 'employment', 'projects', 'technical skills', 'technologies', 'history']
    
    for line in lines:
        l = line.lower().strip()
        
        # Always keep lines with specific tech keywords
        # (This catches skills even if they are at the top)
        if any(t in l for t in ['python', 'java', 'aws', 'sql', 'react', 'node', 'manager', 'lead']):
            relevant_lines.append(line)
            continue

        # Toggle capture mode on section headers
        if any(trig in l for trig in triggers) and len(l) < 50:
            capture = True
            relevant_lines.append(f"\n--- {line.upper()} ---")
            continue
            
        # Stop capturing on non-claim sections
        if any(x in l for x in ['education', 'references', 'hobbies', 'declaration']) and len(l) < 50:
            capture = False
            continue
            
        if capture:
            relevant_lines.append(line)

    # Join and strictly truncate to safe limit (e.g. 2500 chars)
    condensed = "\n".join(relevant_lines)
    return safe_truncate(condensed, 2500)
def extract_projects_smart(resume_text: str) -> List[Dict[str, Any]]:
    """
    GENERALIZED project extraction – works for ANY resume format
    """
    projects = []
    lines = resume_text.split('\n')
    current = None

    PROJECT_INDICATORS = [
        r'\b(project|assignment|thesis|capstone)\b',
        r'\b(built|developed|created|implemented|designed|engineered)\b',
        r'\b(worked on|contributed to|led)\b'
    ]

    TECH_PATTERNS = {
        'languages': r'\b(python|java|javascript|c\+\+|go|rust|kotlin|swift|r)\b',
        'frameworks': r'\b(react|angular|vue|django|flask|spring|fastapi)\b',
        'databases': r'\b(sql|mysql|postgresql|mongodb|redis)\b',
        'cloud': r'\b(aws|azure|gcp|docker|kubernetes)\b',
        'ml_ai': r'\b(tensorflow|pytorch|scikit-learn|nlp|cnn|rnn)\b',
    }

    for line in lines:
        l = line.strip()
        ll = l.lower()

        if len(l) < 10:
            continue

        is_project = any(re.search(p, ll) for p in PROJECT_INDICATORS)

        if is_project:
            if current and current["description"]:
                projects.append(current)

            current = {
                "title": l[:150],
                "project_id": normalize_project_name(l),
                "description": "",
                "technologies": [],
                "domain": "general",
                "complexity_score": 0.0,
                "keywords": []
            }
        elif current:
            current["description"] += " " + l

    if current and current["description"]:
        projects.append(current)

    # Post processing
    for p in projects:
        desc = p["description"].lower()

        for _, pattern in TECH_PATTERNS.items():
            p["technologies"].extend(re.findall(pattern, desc, re.I))

        p["technologies"] = list(set(p["technologies"]))[:10]
        p["domain"] = classify_project_domain(p["description"])
        p["keywords"] = extract_action_keywords(p["description"])
        p["complexity_score"] = calculate_project_complexity(p)

    return sorted(projects, key=lambda x: x["complexity_score"], reverse=True)[:6]



def enforce_test_cases_for_challenge(parsed: dict, resp_raw: str, original_prompt: str, max_attempts: int = 3):
    """
    Ensure parsed (which is a dict) that contains a coding_challenge ends up with:
      coding_challenge.test_cases -> list of >=2 {"input": "<json-string>", "expected": "<string>"}
    If repair succeeds, returns the updated 'challenge' dict.
    If fails after attempts, raises HTTPException(status_code=422, detail={...})
    """
    # Defensive checks
    if not isinstance(parsed, dict):
        raise HTTPException(status_code=500, detail="internal: parsed must be dict for repair")

    challenge = parsed.get("coding_challenge") or {}
    # quick normalization: ensure legacy fields are strings if present
    if "test_case_input" in challenge and not isinstance(challenge["test_case_input"], str):
        try:
            challenge["test_case_input"] = json.dumps(challenge["test_case_input"])
        except:
            challenge["test_case_input"] = str(challenge["test_case_input"])
    if "expected_output" in challenge and not isinstance(challenge["expected_output"], str):
        try:
            challenge["expected_output"] = json.dumps(challenge["expected_output"])
        except:
            challenge["expected_output"] = str(challenge["expected_output"])

    # helper to validate normalized list
    def is_valid_tc_list(tc_list):
        if not isinstance(tc_list, list) or len(tc_list) < 2:
            return False
        for tc in tc_list:
            if not isinstance(tc, dict) or "input" not in tc or "expected" not in tc:
                return False
            if not isinstance(tc["input"], str) or not isinstance(tc["expected"], str):
                return False
        return True

    # If already good, return
    if is_valid_tc_list(challenge.get("test_cases", [])):
        # ensure legacy fields reflect first case
        first = challenge["test_cases"][0]
        challenge["test_case_input"] = first["input"]
        challenge["expected_output"] = first["expected"]
        parsed["coding_challenge"] = challenge
        return challenge

    # Build a *strict* repair prompt with original prompt + raw model output + parsed
    repair_prompt_template = """
ERROR: A coding question was generated but the required 'test_cases' array (>=2 entries) is missing or malformed.

You will be given:
1) The original human-readable generation PROMPT (below).
2) The original LLM RAW output (below).
3) The original parsed JSON object (below).

Return ONLY a single JSON object with one key "test_cases". The value MUST be an array of at least 2 test case objects. Each test case object must be exactly:
{ "input": "<valid JSON string>", "expected": "<exact expected output as string>" }

Rules (must follow exactly):
- Do not return any keys other than "test_cases".
- Do not add commentary or explanation.
- Inputs must be valid JSON strings (e.g., arrays like "[1,2,3]", strings like "\"abc\"", numbers like "5").
- If expected result is None, use "null". If boolean, use "true"/"false".
- Make tests relevant and consistent with the problem statement; include 2 different cases (e.g., typical and edge).

--- ORIGINAL PROMPT:
{orig_prompt}

--- ORIGINAL LLM RAW:
{llm_raw}

--- ORIGINAL PARSED (truncated):
{parsed_json}
""".strip()

    repair_raws = []
    for attempt in range(1, max_attempts + 1):
        repair_prompt = repair_prompt_template.format(
            orig_prompt=safe_truncate(original_prompt or "", 6000),
            llm_raw=safe_truncate(resp_raw or "", 4000),
            parsed_json=safe_truncate(json.dumps(parsed, default=str), 2000)
        )
        try:
            repair_resp = llm_call(repair_prompt, temperature=0.0, max_tokens=500)
        except Exception as e:
            repair_raws.append(f"exception:{e}")
            logger.warning("Repair llm_call exception attempt %d: %s", attempt, e)
            continue

        if not repair_resp.get("ok"):
            repair_raws.append(repair_resp.get("raw") or repair_resp.get("error") or "no_raw")
            continue

        repair_raw = repair_resp.get("raw", "")
        repair_raws.append(repair_raw[:4000])

        candidate = extract_json_from_text(repair_raw)
        if not candidate or not isinstance(candidate, dict):
            logger.info("Repair attempt %d returned non-JSON or unparsable text.", attempt)
            continue

        tc_list = candidate.get("test_cases")
        if not tc_list or not isinstance(tc_list, list) or len(tc_list) < 2:
            logger.info("Repair attempt %d returned test_cases but invalid length/format.", attempt)
            continue

        # Normalize each entry -> strings
        normalized = []
        malformed = False
        for tc in tc_list:
            if not isinstance(tc, dict) or "input" not in tc or "expected" not in tc:
                malformed = True
                break
            inp = tc["input"]
            exp = tc["expected"]
            if not isinstance(inp, str):
                try:
                    inp = json.dumps(inp)
                except:
                    inp = str(inp)
            if not isinstance(exp, str):
                try:
                    exp = json.dumps(exp)
                except:
                    exp = str(exp)
            normalized.append({"input": inp, "expected": exp})

        if malformed or len(normalized) < 2:
            logger.info("Repair attempt %d returned malformed test_cases.", attempt)
            continue

        # success
        challenge["test_cases"] = normalized
        first = normalized[0]
        challenge["test_case_input"] = first["input"]
        challenge["expected_output"] = first["expected"]
        parsed["coding_challenge"] = challenge
        parsed["_auto_repaired_test_cases"] = True
        parsed["confidence"] = min(parsed.get("confidence", 0.6), 0.6)
        logger.info("Repair succeeded on attempt %d (added %d tests).", attempt, len(normalized))
        return challenge

    # If we reach here, all attempts failed -> return structured 422 (so frontend can prompt regen)
    detail = {
        "error": "model_failed_to_provide_test_cases",
        "message": "LLM failed to return required test_cases after repair attempts.",
        "repair_raws": repair_raws[:3],
        "original_llm_raw": (resp_raw or "")[:3000]
    }
    logger.error("Test-case repair failed. Samples: %s", repair_raws[:2])
    raise HTTPException(status_code=422, detail=detail)

