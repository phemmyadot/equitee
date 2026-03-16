"""
FX Router
=========
GET /api/fx   — live USD/NGN exchange rate
"""

import logging

from fastapi import APIRouter, Depends, HTTPException

from app.db.models import User
from app.auth.dependencies import get_current_user
from app.services import fx as fx_service
from app.models import FXResponse

log = logging.getLogger(__name__)
router = APIRouter(prefix="/api/fx", tags=["fx"])


@router.get("", response_model=FXResponse)
async def get_fx(_: User = Depends(get_current_user)):
    try:
        return FXResponse(**fx_service.get_rate())
    except Exception:
        log.exception("Error fetching FX rate")
        raise HTTPException(status_code=500, detail="Failed to fetch exchange rate")