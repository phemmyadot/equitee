"""
Trades Router
=============
Read-only log of all sale events (partial and full).

GET /api/trades   — all sale events for the current user, newest first
"""

import logging
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.engine import get_db
from app.db.models import User
from app.auth.dependencies import get_current_user
from app.db.crud import get_sale_events

log = logging.getLogger(__name__)
router = APIRouter(prefix="/api/trades", tags=["trades"])


class SaleEventOut(BaseModel):
    id: int
    ticker: str
    name: str
    market: str
    shares_sold: float
    sale_price: float
    proceeds: float
    realized_pl: float
    fully_closed: bool
    sold_at: datetime

    class Config:
        from_attributes = True


@router.get("", response_model=list[SaleEventOut])
def list_trades(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_sale_events(db, current_user.id)
