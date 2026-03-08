"""Compatibility export layer for prompt modules."""

from services.prompt_feedback import build_assessment_prompt, build_feedback_prompt
from services.prompt_question import build_generate_question_prompt, should_verify_resume
from services.prompt_scoring import analyze_coding_behavior, build_score_prompt

__all__ = [
    "analyze_coding_behavior",
    "build_assessment_prompt",
    "build_feedback_prompt",
    "build_generate_question_prompt",
    "build_score_prompt",
    "should_verify_resume",
]
