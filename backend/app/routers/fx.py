"""
FX Router
=========
GET /api/fx   — live USD/NGN exchange rate
"""

from fastapi import APIRouter, HTTPException

from app.services import fx as fx_service
from app.models import FXResponse

router = APIRouter(prefix="/api/fx", tags=["fx"])


@router.get("", response_model=FXResponse)
async def get_fx():
    try:
        return FXResponse(**fx_service.get_rate())
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))