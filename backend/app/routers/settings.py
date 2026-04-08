"""
Settings Router
===============
Full CRUD for portfolio holdings, plus buy/sell operations.

GET    /api/settings/holdings              — all holdings (active + closed)
POST   /api/settings/holdings              — add new position
PUT    /api/settings/holdings/{id}         — edit name / sector / avg_cost / shares
DELETE /api/settings/holdings/{id}         — hard delete
POST   /api/settings/holdings/{id}/buy     — add shares (recalculates avg cost)
POST   /api/settings/holdings/{id}/sell    — record a sale (partial or full)
GET    /api/settings/closed                — all closed positions
"""

import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, date

from app.db.engine import get_db
from app.db.models import User
from app.auth.dependencies import get_current_user
from app.db.crud import (
    get_all_holdings,
    get_holding_by_id,
    create_holding,
    update_holding,
    delete_holding,
    add_shares,
    record_sale,
    get_closed_positions,
    get_cash_balance,
    credit_cash,
    debit_cash,
)

log = logging.getLogger(__name__)
router = APIRouter(prefix="/api/settings", tags=["settings"])


# ── Pydantic schemas ───────────────────────────────────────────────────────────


class HoldingOut(BaseModel):
    id: int
    ticker: str
    name: str
    market: str
    shares: float
    avg_cost: float
    sector: str
    is_active: bool
    created_at: datetime
    purchase_date: Optional[date] = None

    class Config:
        from_attributes = True


class ClosedOut(BaseModel):
    id: int
    ticker: str
    name: str
    market: str
    realized_pl: float
    closed_at: datetime

    class Config:
        from_attributes = True


class CreateHoldingBody(BaseModel):
    ticker: str = Field(..., min_length=1, max_length=20)
    name: str = Field(..., min_length=1, max_length=120)
    market: str = Field(..., pattern="^(ngx|us)$")
    shares: float = Field(..., gt=0)
    avg_cost: float = Field(..., gt=0)
    sector: str = Field(default="Other", max_length=60)
    purchase_date: Optional[date] = None


class UpdateHoldingBody(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=120)
    sector: Optional[str] = Field(None, max_length=60)
    avg_cost: Optional[float] = Field(None, gt=0)
    shares: Optional[float] = Field(None, ge=0)
    purchase_date: Optional[date] = None


class BuyBody(BaseModel):
    shares: float = Field(..., gt=0, description="Number of new shares to add")
    buy_price: float = Field(..., gt=0, description="Price per share paid")
    use_cash: bool = Field(False, description="Deduct purchase cost from cash balance")


class CashBalanceOut(BaseModel):
    ngn: float
    usd: float


class CreditCashBody(BaseModel):
    market: str = Field(..., pattern="^(ngx|us)$")
    amount: float = Field(..., gt=0, description="Amount to credit in local currency")


class SellBody(BaseModel):
    shares_sold: float = Field(..., gt=0, description="Number of shares to sell")
    sale_price: float = Field(..., gt=0, description="Price per share received")


class SellResponse(BaseModel):
    holding: HoldingOut
    realized_pl: float
    fully_closed: bool
    closed_position: Optional[ClosedOut] = None


# ── Endpoints ──────────────────────────────────────────────────────────────────


@router.get("/holdings", response_model=list[HoldingOut])
def list_holdings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_all_holdings(db, current_user.id)


@router.post("/holdings", response_model=HoldingOut, status_code=201)
def add_holding(
    body: CreateHoldingBody,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return create_holding(
            db,
            ticker=body.ticker,
            name=body.name,
            market=body.market,
            shares=body.shares,
            avg_cost=body.avg_cost,
            sector=body.sector,
            user_id=current_user.id,
            purchase_date=body.purchase_date,
        )
    except Exception:
        log.exception("Error creating holding")
        raise HTTPException(status_code=400, detail="Failed to create holding")


@router.put("/holdings/{holding_id}", response_model=HoldingOut)
def edit_holding(
    holding_id: int,
    body: UpdateHoldingBody,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    obj = update_holding(
        db,
        holding_id,
        current_user.id,
        name=body.name,
        sector=body.sector,
        avg_cost=body.avg_cost,
        shares=body.shares,
        purchase_date=body.purchase_date,
    )
    if obj is None:
        raise HTTPException(status_code=404, detail="Holding not found")
    return obj


@router.delete("/holdings/{holding_id}", status_code=204)
def remove_holding(
    holding_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not delete_holding(db, holding_id, current_user.id):
        raise HTTPException(status_code=404, detail="Holding not found")


@router.post("/holdings/{holding_id}/buy", response_model=HoldingOut)
def buy_more(
    holding_id: int,
    body: BuyBody,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    holding = get_holding_by_id(db, holding_id, current_user.id)
    if holding is None:
        raise HTTPException(status_code=404, detail="Holding not found")

    if body.use_cash:
        cost = body.shares * body.buy_price
        if not debit_cash(db, current_user.id, holding.market, cost):
            bal = get_cash_balance(db, current_user.id)
            avail = bal["ngn"] if holding.market == "ngx" else bal["usd"]
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient cash balance — available: {avail:.2f}",
            )

    obj = add_shares(
        db,
        holding_id,
        current_user.id,
        new_shares=body.shares,
        buy_price=body.buy_price,
    )
    if obj is None:
        raise HTTPException(status_code=404, detail="Holding not found")
    return obj


@router.post("/holdings/{holding_id}/sell", response_model=SellResponse)
def sell_shares(
    holding_id: int,
    body: SellBody,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    holding = get_holding_by_id(db, holding_id, current_user.id)
    if holding is None:
        raise HTTPException(status_code=404, detail="Holding not found")
    if body.shares_sold > holding.shares:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot sell {body.shares_sold} shares — only {holding.shares} held",
        )

    realized_pl = (body.sale_price - holding.avg_cost) * body.shares_sold
    obj, closed = record_sale(
        db, holding_id, current_user.id, body.shares_sold, body.sale_price
    )

    if obj is None:
        raise HTTPException(status_code=500, detail="Failed to process sale")

    return SellResponse(
        holding=HoldingOut.model_validate(obj),
        realized_pl=round(realized_pl, 4),
        fully_closed=not obj.is_active,
        closed_position=ClosedOut.model_validate(closed)
        if closed is not None
        else None,
    )


@router.get("/closed", response_model=list[ClosedOut])
def list_closed(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_closed_positions(db, current_user.id)


# ── Cash balance ───────────────────────────────────────────────────────────────


@router.get("/cash", response_model=CashBalanceOut)
def get_cash(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_cash_balance(db, current_user.id)


@router.post("/cash/credit", response_model=CashBalanceOut)
def credit_cash_manually(
    body: CreditCashBody,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Manually credit cash — use this to record proceeds from sales already booked."""
    return credit_cash(db, current_user.id, body.market, body.amount)
