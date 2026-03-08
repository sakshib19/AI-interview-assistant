"""Code execution and test-case generation utilities."""

import time
from typing import Any, Dict, List

import requests

from core.config import JUDGE0_URL, logger
from services.common import extract_json_from_text, llm_call


def run_code_in_sandbox(language: str, code: str, stdin: str = "") -> Dict[str, Any]:
    """
    Execute code using Judge0 sandbox.

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
    # 1. Language Mapping (Judge0 IDs)
    # ============================================================
    LANG_CONFIG = {
        "python": 71,
        "cpp": 54
    }

    language_id = LANG_CONFIG.get(language.lower())

    if not language_id:
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
    payload = {
        "language_id": language_id,
        "source_code": code,
        "stdin": stdin or ""
    }

    # ============================================================
    # 3. Retry Logic
    # ============================================================
    max_attempts = 3
    backoff = 0.5
    last_exception = None

    for attempt in range(1, max_attempts + 1):
        try:
            resp = requests.post(
                JUDGE0_URL,
                json=payload,
                timeout=30
            )
        except Exception as e:
            logger.warning(
                "Judge0 request failed (attempt %d/%d): %s",
                attempt, max_attempts, e
            )
            last_exception = e
            time.sleep(backoff)
            backoff *= 2
            continue

        status_code = resp.status_code

        # ========================================================
        # 4. Parse Response
        # ========================================================
        try:
            raw = resp.json()
        except Exception:
            raw = resp.text

        if status_code != 200:
            logger.error("Judge0 API error %s: %s", status_code, raw)
            return {
                "success": False,
                "output": "Sandbox execution service unavailable.",
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
        # 5. Judge0 Result Handling
        # ========================================================
        stdout = raw.get("stdout")
        stderr = raw.get("stderr")
        compile_output = raw.get("compile_output")
        status = raw.get("status", {})
        status_id = status.get("id")
        status_desc = status.get("description")

        # --------------------------------------------------------
        # Compilation Error
        # --------------------------------------------------------
        if compile_output:
            return {
                "success": False,
                "output": compile_output.strip(),
                "error_type": "Compilation Error",
                "status_code": status_code,
                "raw": raw,
                "run_stage": raw,
                "compile_stage": raw
            }

        # --------------------------------------------------------
        # Runtime Error
        # --------------------------------------------------------
        if stderr:
            return {
                "success": False,
                "output": stderr.strip(),
                "error_type": "Runtime Error",
                "status_code": status_code,
                "raw": raw,
                "run_stage": raw,
                "compile_stage": None
            }

        # --------------------------------------------------------
        # Success
        # --------------------------------------------------------
        output = ""

        if stdout and stdout.strip():
            output = stdout.strip()
        else:
            output = status_desc or ""

        return {
            "success": True,
            "output": output,
            "error_type": None,
            "status_code": status_code,
            "raw": raw,
            "run_stage": raw,
            "compile_stage": None
        }

    # ============================================================
    # 6. Exhausted Retries
    # ============================================================
    logger.error(
        "Judge0 execution failed after %d attempts: %s",
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