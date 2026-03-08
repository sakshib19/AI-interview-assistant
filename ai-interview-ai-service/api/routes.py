"""Aggregated API router."""

from fastapi import APIRouter

from api.code_routes import router as code_router
from api.interview_routes import router as interview_router
from api.proctoring_routes import router as proctoring_router
from api.resume_routes import router as resume_router

router = APIRouter()
router.include_router(interview_router)
router.include_router(code_router)
router.include_router(proctoring_router)
router.include_router(resume_router)
