"""Aggregated interview router."""

from fastapi import APIRouter

from api.interview_evaluation_routes import router as evaluation_router
from api.interview_generation_routes import router as generation_router

router = APIRouter()
router.include_router(generation_router)
router.include_router(evaluation_router)
