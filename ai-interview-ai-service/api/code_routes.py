"""Route module extracted from api/routes.py."""

import re
from fastapi import APIRouter

from models.schemas import CodeSubmissionRequest
from services.interview_engine import run_code_in_sandbox

router = APIRouter()

@router.post("/run_code")
def run_code(req: CodeSubmissionRequest):
    import json, re

    # ---------- 1. NORMALIZE STDIN ----------
    if isinstance(req.stdin, (list, dict)):
        req.stdin = json.dumps(req.stdin)
    elif req.stdin is None:
        req.stdin = ""

    # ---------- 2. NORMALIZE TEST CASES ----------
    clean_test_cases = []
    for tc in req.test_cases or []:
        inp = tc.get("input") or tc.get("stdin") or tc.get("test_case_input") or ""
        exp = tc.get("expected") or tc.get("expected_output") or tc.get("output") or ""
        clean_test_cases.append({
            "input": str(inp),
            "expected": str(exp)
        })

    final_code = req.code

    # ---------- 3. DRIVER INJECTION (PYTHON ONLY) ----------
    if (
        req.language.lower() == "python"
        and "def " in final_code
        and "if __name__" not in final_code
    ):
        target_func = "solve"
        match = re.search(r"def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(", final_code)
        if match:
            target_func = match.group(1)

        # ✅ SAFE DRIVER (NO inspect, NO reflection bugs)
        driver = f'''
import sys, json, traceback

def _parse_input(raw):
    raw = raw.strip()
    if raw == "":
        return None
    try:
        return json.loads(raw)
    except:
        return raw

if __name__ == "__main__":
    try:
        raw_input = sys.stdin.read()
        input_data = _parse_input(raw_input)

        func = globals().get("{target_func}")
        if func is None:
            raise RuntimeError("Target function not found")

        if input_data is None:
            result = func()
        else:
            result = func(input_data)

        if result is None:
            print("null")
        else:
            print(json.dumps(result))

    except Exception as e:
        print("DRIVER_ERROR")
        print(json.dumps({{
            "error": str(e),
            "traceback": traceback.format_exc()
        }}))
'''
        final_code += "\n\n" + driver

    # ---------- 4. SELECT TEST CASES ----------
    cases_to_run = clean_test_cases or [{
        "input": req.stdin or "",
        "expected": req.expected_output or ""
    }]

    # ---------- 5. EXECUTION LOOP ----------
    results = []
    all_passed = True

    def normalize(val):
        if val is None:
            return None
        if isinstance(val, str):
            v = val.strip()
            try:
                return json.loads(v)
            except:
                return v
        return val

    for case in cases_to_run:
        c_input = case["input"]
        c_expected = case["expected"]

        run_result = run_code_in_sandbox(
            req.language,
            final_code,
            c_input
        )

        stdout = str(run_result.get("output", "")).strip()

        passed = False
        error_msg = None

        if "DRIVER_ERROR" in stdout:
            error_msg = stdout
        else:
            if run_result.get("success") and c_expected != "":
                norm_out = normalize(stdout)
                norm_exp = normalize(c_expected)
                passed = (
                    norm_out == norm_exp
                    or str(norm_out) == str(norm_exp)
                )

        if not passed:
            all_passed = False

        results.append({
            "input": c_input,
            "expected": c_expected,
            "stdout": stdout,
            "passed": passed,
            "success": run_result.get("success", False),
            "error": run_result.get("error_type") or error_msg
        })

    return {
        "success": True,
        "all_passed": all_passed,
        "results": results
    }

