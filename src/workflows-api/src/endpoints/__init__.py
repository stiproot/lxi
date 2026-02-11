from fastapi import APIRouter

from . import healthz

router = APIRouter()

router.include_router(healthz.router)

__all__ = ["router"]