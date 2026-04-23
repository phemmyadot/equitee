"""
Trades Router
=============
Read-only log of all trade events (buys and sells).

GET /api/trades        — all sale events for the current user, newest first
GET /api/trades/buys   — all buy events for the current user, newest first
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
from app.db.crud import get_sale_events, get_buy_events

log = logging.getLogger(__name__)
router = APIRouter(prefix="/api/trades", tags=["trades"])


class SaleEventOut(BaseModel):
    id: int
    ticker: str
    name: str
    market: str
    shares_sold: float
    sale_price: float
    commission: float
    proceeds: float
    realized_pl: float
    fully_closed: bool
    sold_at: datetime

    class Config:
        from_attributes = True


class BuyEventOut(BaseModel):
    id: int
    ticker: str
    name: str
    market: str
    shares_bought: float
    buy_price: float
    commission: float
    total_cost: float
    bought_at: datetime

    class Config:
        from_attributes = True


class TradesAllResponse(BaseModel):
    sells: list[SaleEventOut]
    buys: list[BuyEventOut]


@router.get("/all", response_model=TradesAllResponse)
def list_all_trades(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return TradesAllResponse(
        sells=get_sale_events(db, current_user.id),
        buys=get_buy_events(db, current_user.id),
    )


@router.get("", response_model=list[SaleEventOut])
def list_sells(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_sale_events(db, current_user.id)


@router.get("/buys", response_model=list[BuyEventOut])
def list_buys(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_buy_events(db, current_user.id)
