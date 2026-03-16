"""
FX Router
=========
GET /api/fx   — live USD/NGN exchange rate
"""

import logging

from fastapi import APIRouter, HTTPException

log = logging.getLogger(__name__)

from app.services import fx as fx_service
from app.models import FXResponse

router = APIRouter(prefix="/api/fx", tags=["fx"])


@router.get("", response_model=FXResponse)
async def get_fx():
    try:
        return FXResponse(**fx_service.get_rate())
    except Exception:
        log.exception("Error fetching FX rate")
        raise HTTPException(status_code=500, detail="Failed to fetch exchange rate")