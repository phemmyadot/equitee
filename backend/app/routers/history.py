"""
History Router
==============
GET /api/history/portfolio          — portfolio value time series
GET /api/history/prices/{ticker}    — single-ticker price history
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.db.engine import get_db
from app.db.models import User
from app.auth.dependencies import get_current_user
from app.db.crud import get_portfolio_history, get_price_history

router = APIRouter(prefix="/api/history", tags=["history"])


# ── Response models ────────────────────────────────────────────────────────────

class PortfolioPoint(BaseModel):
    ts:             str
    ngx_equity_ngn: float
    ngx_cost_ngn:   float
    us_equity_usd:  float
    us_cost_usd:    float
    usdngn:         float
    total_usd:      float
    # Derived — computed here so the frontend doesn't have to
    ngx_usd:        float
    ngx_gain_ngn:   float
    us_gain_usd:    float


class PortfolioHistoryResponse(BaseModel):
    days:   int
    count:  int
    points: list[PortfolioPoint]


class PricePoint(BaseModel):
    ts:         str
    price:      Optional[float]
    change_pct: Optional[float]


class PriceHistoryResponse(BaseModel):
    ticker: str
    days:   int
    count:  int
    points: list[PricePoint]


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.get("/portfolio", response_model=PortfolioHistoryResponse)
def portfolio_history(
    days: int = Query(default=90, ge=1, le=365, description="Lookback window in days"),
    db:   Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns time-series of portfolio value snapshots.
    Used for the Portfolio Value Over Time line chart.
    """
    try:
        snaps = get_portfolio_history(db, days=days, user_id=current_user.id)
        points = [
            PortfolioPoint(
                ts             = s.ts.isoformat(),
                ngx_equity_ngn = s.ngx_equity_ngn,
                ngx_cost_ngn   = s.ngx_cost_ngn,
                us_equity_usd  = s.us_equity_usd,
                us_cost_usd    = s.us_cost_usd,
                usdngn         = s.usdngn,
                total_usd      = s.total_usd,
                # Derived
                ngx_usd        = round(s.ngx_equity_ngn / s.usdngn, 2) if s.usdngn else 0,
                ngx_gain_ngn   = round(s.ngx_equity_ngn - s.ngx_cost_ngn, 2),
                us_gain_usd    = round(s.us_equity_usd  - s.us_cost_usd,  4),
            )
            for s in snaps
        ]
        return PortfolioHistoryResponse(days=days, count=len(points), points=points)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/prices/{ticker}", response_model=PriceHistoryResponse)
def price_history(
    ticker: str,
    days:   int = Query(default=90, ge=1, le=365, description="Lookback window in days"),
    db:     Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns price history for a single ticker.
    Used for per-stock sparklines in the holdings tables.
    """
    try:
        rows = get_price_history(db, ticker=ticker.upper(), days=days, user_id=current_user.id)
        points = [
            PricePoint(
                ts         = r["ts"],
                price      = r["price"],
                change_pct = r["change_pct"],
            )
            for r in rows
        ]
        return PriceHistoryResponse(
            ticker = ticker.upper(),
            days   = days,
            count  = len(points),
            points = points,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))