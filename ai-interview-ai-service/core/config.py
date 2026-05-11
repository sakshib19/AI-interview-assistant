import os
import re
import logging
from typing import Any, Dict

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from google import genai
from groq import AsyncGroq          # Using Async Client
from openai import AsyncOpenAI      # Using Async Client
from ultralytics import YOLO
from deepface import DeepFace

# Prevent OMP duplicate runtime crash when DeepFace + YOLO are both loaded.
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

FACE_DB: Dict[str, Dict[str, Any]] = {}

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ai-service")
JUDGE0_URL = "http://localhost:2358/submissions?base64_encoded=false&wait=true"
load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
if not OPENROUTER_API_KEY:
    raise RuntimeError("OPENROUTER_API_KEY not set")

openrouter_client = AsyncOpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=OPENROUTER_API_KEY,
)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if GROQ_API_KEY:
    groq_client = AsyncGroq(api_key=GROQ_API_KEY)
else:
    logger.warning("GROQ_API_KEY not set. Groq-based parsing will fail.")
    groq_client = None

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
try:
    google_client = genai.Client(api_key=GOOGLE_API_KEY) if GOOGLE_API_KEY else None
except Exception:
    google_client = None

GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
MAX_PROMPT_CHARS = int(os.getenv("MAX_PROMPT_CHARS", "14000"))
DEFAULT_TOKEN_BUDGET = int(os.getenv("DEFAULT_TOKEN_BUDGET", "5000"))
PISTON_API_URL = "https://emkc.org/api/v2/piston/execute"

app = FastAPI(title="Enhanced AI Interview Service")
STRICT_DISTANCE_THRESHOLD = 0.65
print("Loading VGG-Face model... please wait...")
DeepFace.build_model("VGG-Face")
print("Loading YOLOv8 model (for phone detection)...")
object_model = YOLO("yolov8s.pt")
print("All models loaded")

# Kept your exact original models
RESUME_PARSER_CHAIN = [
    {"provider": "groq", "model": "llama-3.3-70b-versatile"},
    {"provider": "groq", "model": "mixtral-8x7b-32768"},
]

# Kept your exact original models
INTERVIEW_MODELS = [
    # Best quality / reasoning
    "deepseek/deepseek-r1-distill-llama-70b",

    # Strong structured + coding intelligence
    "qwen/qwen2.5-14b-instruct",

    # Excellent balance of quality + cost
    "google/gemma-3-12b-it",

    # Cheap reliable fallback
    "meta-llama/llama-3.1-8b-instruct",
]

INTERVIEW_FLOW = [
    "project_discussion",
    "experience",
    "coding_challenge",
    "project_discussion",
    "coding_challenge",
    "achievement",
    "coding_challenge",
    "conceptual",
]

INTERVIEW_ROUNDS = {
    "screening": {
        "name": "Screening Round",
        "focus": ["experience", "resume_basics", "fundamentals"],
        "min_questions": 1,
        "max_questions": 2,
        "pass_threshold": 0.55,
        "elimination": True,
    },
    "technical": {
        "name": "Technical Round",
        "focus": ["project_discussion", "coding_challenge", "system_design", "debugging"],
        "min_questions": 4,
        "max_questions": 7,
        "pass_threshold": 0.60,
        "elimination": True,
    },
    "behavioral": {
        "name": "Behavioral Round",
        "focus": ["achievement", "collaboration", "ownership"],
        "min_questions": 1,
        "max_questions": 2,
        "pass_threshold": 0.5,
        "elimination": True,
    },
}

QUESTION_TYPE_TO_ROUND = {
    "experience": "screening",
    "resume_basics": "screening",
    "fundamentals": "screening",
    "conceptual": "screening",
    "project_discussion": "technical",
    "coding_challenge": "technical",
    "system_design": "technical",
    "debugging": "technical",
    "behavioral": "behavioral",
    "achievement": "behavioral",
    "ownership": "behavioral",
    "collaboration": "behavioral",
    "hr": "behavioral",
}

TERMINATION_RULES = {
    "instant_fail_threshold": 0.20,
    "consecutive_fail_count": 2,
    "consecutive_fail_threshold": 0.45,
    "excellence_threshold": 0.85,
    "excellence_count": 3,
    "max_questions": 10,
    "min_confidence_to_end": 0.85,
    "max_questions_soft_limit": 9,
    "gray_zone_min": 0.40,
    "gray_zone_max": 0.75,
}

FALLBACK_QUESTIONS = {
    "coding_challenge": {
        "question": "Write a Python function to check if a string is a valid palindrome...",
        "type": "coding_challenge",
        "coding_challenge": {
            "language": "python",
            "starter_code": "def is_palindrome(s):\n    pass",
            "test_cases": [
                {"input": "\"A man, a plan, a canal: Panama\"", "expected": "true"},
                {"input": "\"race a car\"", "expected": "false"},
            ],
        },
    },
    "project_discussion": {
        "question": "Can you walk me through the most challenging bug you encountered in your recent project?",
        "type": "project_discussion",
    },
    "conceptual": {
        "question": "Explain the difference between a process and a thread in an operating system.",
        "type": "conceptual",
    },
    "behavioral": {
        "question": "Tell me about a time you had to learn a new technology quickly. How did you approach it?",
        "type": "behavioral",
    },
    "collaboration": {
        "question": "Describe a situation where you had a disagreement with a team member. How did you resolve it?",
        "type": "collaboration",
    },
    "ownership": {
        "question": "Tell me about a time you made a mistake in a project. How did you handle it?",
        "type": "ownership",
    },
    "achievement": {
        "question": "What is your most significant professional achievement?",
        "type": "achievement",
    },
    "debugging": {
        "question": "The following function is supposed to find the maximum sum of a contiguous subarray (Kadane's Algorithm). However, it fails for arrays containing only negative numbers. Find the bug and fix it.",
        "type": "debugging",
        "coding_challenge": {
            "language": "python",
            "starter_code": """def max_subarray_sum(nums):
    max_so_far = 0  # BUG: Should be float('-inf') to handle negative arrays
    current_max = 0

    for x in nums:
        current_max = current_max + x
        if current_max < 0:
            current_max = 0
        if max_so_far < current_max:
            max_so_far = current_max

    return max_so_far""",
            "test_cases": [
                {"input": "[-2, -3, -1, -5]", "expected": "-1"},
                {"input": "[1, -2, 3, 4]", "expected": "7"},
            ],
        },
    },
}

INTERVIEW_MODE = {
    "role": "campus_recruiter",
    "target_level": "intern_or_fresher",
    "focus": ["resume_projects", "core_cs_fundamentals", "practical_implementation"],
}

SCORING_DIMENSIONS = {
    "technical_accuracy": {
        "weight": 0.50,
        "description": "Correctness of code, logic, complexity analysis, and algorithms",
    },
    "depth_of_understanding": {
        "weight": 0.30,
        "description": "Ability to explain 'why' (trade-offs, edge cases, optimizations)",
    },
    "practical_experience": {
        "weight": 0.15,
        "description": "Evidence of real implementation, debugging, and clean code standards",
    },
    "communication_clarity": {
        "weight": 0.05,
        "description": "Ability to articulate ideas (less critical than code correctness)",
    },
}

INTERVIEW_TRACKS = {
    "FAANG": {
        "focus": ["algorithmic_optimization", "system_scalability", "low_level_internals", "complexity_analysis"],
        "style_instruction": "Focus on Big-O optimization and handling massive scale. Accept only efficient solutions.",
        "difficulty_boost": 0.2,
    },
    "STARTUP": {
        "focus": ["practical_implementation", "debugging_speed", "fullstack_integration", "product_sense"],
        "style_instruction": "Focus on shipping speed, code maintainability, and practical trade-offs. Accept brute force if it's clean and works.",
        "difficulty_boost": 0.0,
    },
    "ENTERPRISE": {
        "focus": ["security", "reliability", "legacy_integration", "testing"],
        "style_instruction": "Focus on robustness, error handling, and testing strategies.",
        "difficulty_boost": 0.1,
    },
}

ROLE_TEMPLATES = {
    "Backend": ["databases", "concurrency", "api_design", "caching", "distributed_systems"],
    "Frontend": ["state_management", "rendering_performance", "accessibility", "css_architecture", "browser_apis"],
    "DevOps": ["infrastructure_as_code", "ci_cd", "containerization", "monitoring", "networking"],
    "FullStack": ["api_integration", "db_modeling", "state_sync", "deployment"],
    "General": ["core_cs_fundamentals"],
}

INTERVIEW_MODE.update(
    {
        "company_style": "FAANG",
        "role_title": "Backend Engineer",
    }
)

EMAIL_RE = re.compile(r"[\w\.-]+@[\w\.-]+\.\w+")
PHONE_RE = re.compile(r"(\+?\d{1,3}[\s-]?)?(?:\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}|\d{10})")


# --- Safe Generation Function (Uses YOUR exact model list) ---
async def safe_generate_text(prompt: str, system_instruction: str, max_tokens: int = 800) -> str:
    """
    Cascades through your chosen INTERVIEW_MODELS to prevent crashes 
    from 402 errors or malformed NoneType responses.
    """
    
    # Iterate exactly through your model list
    for model_name in INTERVIEW_MODELS:
        try:
            response = await openrouter_client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=max_tokens
            )
            
            # This specific block catches the 'NoneType' error Qwen gave you
            if response and response.choices and response.choices[0].message:
                return response.choices[0].message.content
            else:
                logger.warning(f"Model {model_name} returned empty data. Falling back to next...")
                
        except Exception as e:
            logger.warning(f"Model {model_name} failed with error: {e}. Falling back to next...")

    # If your entire OpenRouter list fails (e.g., out of credits entirely)
    # Use Groq as the ultimate emergency net if it's available
    if groq_client:
        try:
            logger.info("OpenRouter exhausted. Using Groq emergency fallback.")
            response = await groq_client.chat.completions.create(
                model=GROQ_MODEL,
                messages=[
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=max_tokens
            )
            if response and response.choices and response.choices[0].message:
                return response.choices[0].message.content
        except Exception as e:
            logger.error(f"Groq emergency fallback failed: {e}")

    # Prevent the 502 collapse by raising a clear HTTP exception you can handle
    logger.error("CRITICAL: All models in INTERVIEW_MODELS failed.")
    raise HTTPException(status_code=502, detail="AI generation failed across all fallback models.")