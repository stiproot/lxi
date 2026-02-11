from fastapi import APIRouter, Response, status
import logging


router = APIRouter()


@router.get("/healthz")
async def healthz():
    return Response(status_code=status.HTTP_200_OK)
