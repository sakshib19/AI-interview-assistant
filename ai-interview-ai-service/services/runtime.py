"""Code execution and test-case generation utilities."""

import os
import time
from typing import Any, Dict, List
import requests
from dotenv import load_dotenv

# Standard direct imports for your project structure
from core.config import logger
from services.common import extract_json_from_text, llm_call

# Load environment variables (API Keys)
load_dotenv()

# Glot.io Config
GLOT_TOKEN = os.getenv("GLOT_API_TOKEN")


def run_code_in_sandbox(language: str, code: str, stdin: str = "") -> Dict[str, Any]:
    """
    Execute code securely using the free Glot.io public API.

    Returns:
    {
        "success": bool,
        "output": str,
        "error_type": str | None,
        "status_code": int | None,
        "raw": dict | str | None,
        "run_stage": dict | None,
        "compile_stage": dict | None
    }
    """

    # ============================================================
    # 1. Language Mapping (Glot.io Configs)
    # ============================================================
    LANG_CONFIG = {
        "python": {"lang": "python", "ext": "py"},
        "cpp": {"lang": "cpp", "ext": "cpp"}
    }

    config = LANG_CONFIG.get(language.lower())

    if not config:
        return {
            "success": False,
            "output": f"Language '{language}' not supported. Only Python and C++ are allowed.",
            "error_type": "Config Error",
            "status_code": None,
            "raw": None,
            "run_stage": None,
            "compile_stage": None
        }

    # ============================================================
    # 2. Build Payload
    # ============================================================
    # Glot.io requires a virtual filename to run the code
    file_name = f"main.{config['ext']}"
    
    payload = {
        "stdin": stdin or "",
        "files": [
            {
                "name": file_name,
                "content": code
            }
        ]
    }

    headers = {
        "Authorization": f"Token {GLOT_TOKEN}",
        "Content-Type": "application/json"
    }
    
    url = f"https://glot.io/api/run/{config['lang']}/latest"

    # ============================================================
    # 3. Retry Logic (For Network/API stability)
    # ============================================================
    max_attempts = 3
    backoff = 0.5
    last_exception = None

    for attempt in range(1, max_attempts + 1):
        try:
            resp = requests.post(url, json=payload, headers=headers, timeout=15)
            status_code = resp.status_code
            
            # Parse Response
            try:
                raw = resp.json()
            except Exception:
                raw = resp.text

            if status_code != 200:
                logger.error("Glot.io API error %s: %s", status_code, raw)
                return {
                    "success": False,
                    "output": f"Sandbox execution service unavailable: {raw}",
                    "error_type": "API Error",
                    "status_code": status_code,
                    "raw": raw,
                    "run_stage": None,
                    "compile_stage": None
                }

            if not isinstance(raw, dict):
                return {
                    "success": False,
                    "output": str(raw),
                    "error_type": "API Error",
                    "status_code": status_code,
                    "raw": raw,
                    "run_stage": None,
                    "compile_stage": None
                }

            # ========================================================
            # 4. Glot.io Result Handling
            # ========================================================
            # Glot.io cleanly separates stdout, stderr, and container errors.
            # We combine them into 'output' to match your existing grader expectations.
            stdout = raw.get("stdout", "")
            stderr = raw.get("stderr", "")
            sys_error = raw.get("error", "")

            combined_output = ""
            error_type = None

            if sys_error or stderr:
                error_type = "Runtime/Compile Error"
                combined_output = (sys_error + "\n" + stderr).strip()
            else:
                combined_output = stdout.strip()

            return {
                "success": True,  # True means the API call succeeded, even if the code had a bug
                "output": combined_output,
                "error_type": error_type,
                "status_code": status_code,
                "raw": raw,
                "run_stage": raw,       
                "compile_stage": None   
            }

        except Exception as e:
            logger.warning(
                "Glot.io request failed (attempt %d/%d): %s",
                attempt, max_attempts, e
            )
            last_exception = e
            time.sleep(backoff)
            backoff *= 2
            continue

    # ============================================================
    # 5. Exhausted Retries
    # ============================================================
    logger.error(
        "Glot.io execution failed after %d attempts: %s",
        max_attempts,
        last_exception
    )

    return {
        "success": False,
        "output": str(last_exception) if last_exception else "Network error",
        "error_type": "Network Error",
        "status_code": None,
        "raw": None,
        "run_stage": None,
        "compile_stage": None
    }


def generate_missing_test_cases(question_text: str, starter_code: str) -> List[Dict[str, str]]:
    """
    Dedicated repair function. If the main prompt fails to generate tests,
    this focused prompt forces the AI to create them based on the question.
    """

    prompt = f"""
SYSTEM: You are a QA Engineer.
TASK: Generate 3 strict JSON test cases for this coding problem.

PROBLEM:
{question_text}

CODE STUB:
{starter_code}

OUTPUT FORMAT:
Return ONLY a raw JSON list of objects. No markdown.
[
  {{"input": "valid_input_string", "expected": "valid_output_string"}},
  {{"input": "edge_case_input", "expected": "edge_case_output"}}
]
"""

    try:
        resp = llm_call(prompt, temperature=0.0, max_tokens=300)

        cases = extract_json_from_text(resp.get("raw", ""))

        valid = []

        if isinstance(cases, list):
            for c in cases:
                if isinstance(c, dict) and "input" in c and "expected" in c:
                    valid.append({
                        "input": str(c["input"]),
                        "expected": str(c["expected"])
                    })

        return valid

    except Exception:
        return []