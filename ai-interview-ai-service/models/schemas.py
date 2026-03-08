import os
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict

DEFAULT_TOKEN_BUDGET = int(os.getenv("DEFAULT_TOKEN_BUDGET", "5000"))


class GenerateQuestionRequest(BaseModel):
    request_id: str
    session_id: str
    user_id: str
    mode: Optional[str] = "first"
    resume_summary: Optional[str] = ""
    retrieved_chunks: Optional[List[Dict[str, Any]]] = []
    conversation: Optional[List[Dict[str, Any]]] = []
    question_history: Optional[List[Dict[str, Any]]] = []
    token_budget: Optional[int] = DEFAULT_TOKEN_BUDGET
    allow_pii: Optional[bool] = False
    options: Optional[Dict[str, Any]] = {}


QUESTION_TYPE_WEIGHTS = {
    "conceptual": 0.40,
    "project_discussion": 0.30,
    "coding_challenge": 0.30,
}


def infer_type_from_question(q: str) -> str:
    q = q.lower()
    if any(x in q for x in ["write a function", "implement", "code", "algorithm"]):
        return "coding_challenge"
    if any(x in q for x in ["at ", "intern", "worked", "company"]):
        return "experience"
    if "project" in q:
        return "project_discussion"
    if any(x in q for x in ["ranked", "award", "competition", "finalist"]):
        return "achievement"
    return "conceptual"


class HintRequest(BaseModel):
    session_id: str
    question: str
    context_type: str = "conceptual"
    current_answer: Optional[str] = ""


class FeedbackRequest(BaseModel):
    request_id: str
    session_id: str
    user_id: str
    round_name: str
    question_history: List[Dict[str, Any]]
    token_budget: Optional[int] = DEFAULT_TOKEN_BUDGET
    type: str = "round_summary"


class FaceVerificationRequest(BaseModel):
    session_id: str
    current_image: str


class FaceRegisterRequest(BaseModel):
    sessionId: str
    image: str


class ScoreAnswerRequest(BaseModel):
    request_id: str
    session_id: str
    user_id: str
    question_text: str
    ideal_outline: str
    candidate_answer: str
    resume_summary: Optional[str] = ""
    retrieved_chunks: Optional[List[Dict[str, Any]]] = []
    question_history: Optional[List[Dict[str, Any]]] = []
    token_budget: Optional[int] = DEFAULT_TOKEN_BUDGET
    allow_pii: Optional[bool] = False
    options: Optional[Dict[str, Any]] = {}
    question_type: Optional[str] = "text"
    code_execution_result: Optional[Dict[str, Any]] = None
    hint_used: Optional[bool] = False
    whiteboard_elements: Optional[List[Dict[str, Any]]] = None
    whiteboard_snapshot: Optional[str] = None
    user_time_complexity: Optional[str] = None
    user_space_complexity: Optional[str] = None
    playback_history: Optional[List[Dict[str, Any]]] = []


class RoadmapRequest(BaseModel):
    session_id: str
    user_id: Optional[str] = "anonymous"
    question_history: Optional[List[Dict[str, Any]]] = None
    detected_weaknesses: Optional[List[str]] = []


class CodeSubmissionRequest(BaseModel):
    model_config = ConfigDict(extra="allow")

    language: str
    code: str
    stdin: Optional[Any] = ""
    expected_output: Optional[Any] = None
    test_cases: Optional[List[Dict[str, Any]]] = []


class ProbeRequest(BaseModel):
    request_id: str
    session_id: str
    user_id: str
    weakness_topic: str
    prev_question: str
    prev_answer: str
    resume_summary: Optional[str] = ""
    retrieved_chunks: Optional[List[Dict[str, Any]]] = []
    conversation: Optional[List[Dict[str, Any]]] = []
    token_budget: Optional[int] = DEFAULT_TOKEN_BUDGET
    allow_pii: Optional[bool] = False
    options: Optional[Dict[str, Any]] = {}


class DecisionRequest(BaseModel):
    request_id: str
    session_id: str
    user_id: str
    resume_summary: Optional[str] = ""
    conversation: Optional[List[Dict[str, Any]]] = []
    question_history: List[Dict[str, Any]]
    retrieved_chunks: Optional[List[Dict[str, Any]]] = []
    token_budget: Optional[int] = DEFAULT_TOKEN_BUDGET
    allow_pii: Optional[bool] = False
    accept_model_final: Optional[bool] = True
