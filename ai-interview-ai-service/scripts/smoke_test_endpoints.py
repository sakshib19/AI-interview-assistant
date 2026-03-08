import json
import os
import sys
import types
import importlib.util

# Ensure service root (parent of scripts/) is importable.
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)


def install_model_stubs() -> None:
    deepface_mod = types.ModuleType("deepface")

    class _DeepFace:
        @staticmethod
        def build_model(_name):
            return object()

        @staticmethod
        def represent(*_args, **_kwargs):
            return [{"embedding": [0.01] * 128}]

        @staticmethod
        def extract_faces(*_args, **_kwargs):
            return [{"confidence": 0.99}]

    deepface_mod.DeepFace = _DeepFace
    sys.modules["deepface"] = deepface_mod

    ultralytics_mod = types.ModuleType("ultralytics")

    class _YOLO:
        def __init__(self, *_args, **_kwargs):
            pass

        def __call__(self, *_args, **_kwargs):
            return []

    ultralytics_mod.YOLO = _YOLO
    sys.modules["ultralytics"] = ultralytics_mod


def install_sdk_stubs() -> None:
    if importlib.util.find_spec("google") is None:
        google_mod = types.ModuleType("google")
        genai_mod = types.ModuleType("google.genai")
        types_mod = types.ModuleType("google.genai.types")

        class _GenerateContentConfig:
            def __init__(self, *args, **kwargs):
                pass

        class _Client:
            def __init__(self, *args, **kwargs):
                pass

        types_mod.GenerateContentConfig = _GenerateContentConfig
        genai_mod.Client = _Client
        genai_mod.types = types_mod
        google_mod.genai = genai_mod
        sys.modules["google"] = google_mod
        sys.modules["google.genai"] = genai_mod
        sys.modules["google.genai.types"] = types_mod

    if importlib.util.find_spec("groq") is None:
        groq_mod = types.ModuleType("groq")

        class _Groq:
            def __init__(self, *args, **kwargs):
                pass

        groq_mod.Groq = _Groq
        sys.modules["groq"] = groq_mod

    if importlib.util.find_spec("openai") is None:
        openai_mod = types.ModuleType("openai")

        class _OpenAI:
            def __init__(self, *args, **kwargs):
                self.chat = types.SimpleNamespace(
                    completions=types.SimpleNamespace(create=lambda *a, **k: None)
                )

        openai_mod.OpenAI = _OpenAI
        sys.modules["openai"] = openai_mod

    if importlib.util.find_spec("requests") is None:
        requests_mod = types.ModuleType("requests")

        class _Resp:
            def __init__(self, status_code=503, text=""):
                self.status_code = status_code
                self.text = text
                self.content = b""
                self.headers = {}

            def json(self):
                return {}

        def _not_available(*args, **kwargs):
            return _Resp()

        requests_mod.get = _not_available
        requests_mod.post = _not_available
        sys.modules["requests"] = requests_mod

    if importlib.util.find_spec("scipy") is None:
        scipy_mod = types.ModuleType("scipy")
        spatial_mod = types.ModuleType("scipy.spatial")
        distance_mod = types.ModuleType("scipy.spatial.distance")

        def _cosine(_a, _b):
            return 0.0

        distance_mod.cosine = _cosine
        spatial_mod.distance = distance_mod
        scipy_mod.spatial = spatial_mod

        sys.modules["scipy"] = scipy_mod
        sys.modules["scipy.spatial"] = spatial_mod
        sys.modules["scipy.spatial.distance"] = distance_mod


def run_smoke() -> int:
    os.environ.setdefault("OPENROUTER_API_KEY", "smoke-test-key")

    # Default: mock heavy CV models so test runs offline and fast.
    if os.getenv("SMOKE_MOCK_MODELS", "1") == "1":
        install_model_stubs()
    install_sdk_stubs()

    from fastapi.testclient import TestClient
    from main import app
    import api.interview_generation_routes as gen_routes

    # Keep /generate_question deterministic and network-free.
    def fake_llm_call(_prompt: str, temperature: float = 0.3, max_tokens: int = 1200):
        return {"ok": False, "error": "smoke-test offline", "raw": ""}

    gen_routes.llm_call = fake_llm_call

    client = TestClient(app)

    checks = []

    r1 = client.get("/")
    checks.append(("GET /", r1.status_code, r1.json() if r1.headers.get("content-type", "").startswith("application/json") else r1.text))

    r2 = client.get("/performance_metrics", params={"session_id": "smoke-session"})
    checks.append(("GET /performance_metrics", r2.status_code, r2.json() if r2.headers.get("content-type", "").startswith("application/json") else r2.text))

    payload = {
        "request_id": "smoke-req-1",
        "session_id": "smoke-session",
        "user_id": "smoke-user",
        "mode": "first",
        "resume_summary": "Built a FastAPI backend and React frontend project.",
        "question_history": [],
        "conversation": [],
        "retrieved_chunks": [],
        "options": {},
    }
    r3 = client.post("/generate_question", json=payload)
    checks.append(("POST /generate_question", r3.status_code, r3.json() if r3.headers.get("content-type", "").startswith("application/json") else r3.text))

    failed = False
    for name, code, body in checks:
        ok = code == 200
        if not ok:
            failed = True
        print(f"[{ 'PASS' if ok else 'FAIL' }] {name} -> {code}")
        if name == "POST /generate_question" and code == 200:
            parsed = body.get("parsed", {}) if isinstance(body, dict) else {}
            print("  type=", parsed.get("type"))
            q = parsed.get("question", "")
            print("  question=", q[:120])

    if failed:
        print("\nOne or more smoke checks failed.")
        return 1

    print("\nAll smoke checks passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(run_smoke())
