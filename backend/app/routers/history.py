"""
History Router
==============
GET /api/history/portfolio              — portfolio value time series
GET /api/history/prices/{ticker}        — single-ticker price history
GET /api/history/correlation            — pairwise return correlation matrix
GET /api/history/analytics              — max drawdown + Sharpe ratio
"""

import logging

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.db.engine import get_db
from app.db.models import User
from app.auth.dependencies import get_current_user
from app.db.crud import (
    get_portfolio_history, get_price_history,
    get_correlation_matrix, get_portfolio_analytics,
    get_active_holdings, get_daily_price_history,
)

log = logging.getLogger(__name__)
router = APIRouter(prefix="/api/history", tags=["history"])

_INDEX_TICKER = "NGXASI"


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
    except Exception:
        log.exception("Error fetching portfolio history")
        raise HTTPException(status_code=500, detail="Failed to fetch portfolio history")


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
    except Exception:
        log.exception("Error fetching price history for %s", ticker)
        raise HTTPException(status_code=500, detail="Failed to fetch price history")


# ── Correlation ─────────────────────────────────────────────────────────────────

class CorrelationResponse(BaseModel):
    tickers: list[str]
    matrix:  list[list[float]]
    days:    int


@router.get("/correlation", response_model=CorrelationResponse)
def correlation(
    days: int = Query(default=90, ge=10, le=365),
    db:   Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns pairwise Pearson correlation of daily returns for all held NGX tickers.
    Uses daily_price_history.change_pct.
    """
    try:
        holdings = get_active_holdings(db, market="ngx", user_id=current_user.id)
        tickers  = [h.ticker for h in holdings if h.is_active]
        if len(tickers) < 2:
            return CorrelationResponse(tickers=tickers, matrix=[], days=days)
        result = get_correlation_matrix(db, tickers=tickers, days=days)
        return CorrelationResponse(tickers=result["tickers"], matrix=result["matrix"], days=days)
    except Exception:
        log.exception("Error computing correlation matrix")
        raise HTTPException(status_code=500, detail="Failed to compute correlation matrix")


# ── Analytics (drawdown + Sharpe) ──────────────────────────────────────────────

class AnalyticsResponse(BaseModel):
    max_drawdown_pct: Optional[float]
    sharpe:           Optional[float]
    data_points:      int
    days:             int


@router.get("/analytics", response_model=AnalyticsResponse)
def analytics(
    days: int = Query(default=180, ge=10, le=730),
    db:   Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns max drawdown (%) and annualised Sharpe ratio computed from
    portfolio_snapshots over the last `days` calendar days.
    """
    try:
        result = get_portfolio_analytics(db, user_id=current_user.id, days=days)
        return AnalyticsResponse(
            max_drawdown_pct = result["max_drawdown_pct"],
            sharpe           = result["sharpe"],
            data_points      = result["data_points"],
            days             = days,
        )
    except Exception:
        log.exception("Error computing portfolio analytics")
        raise HTTPException(status_code=500, detail="Failed to compute portfolio analytics")


# ── Relative Strength vs NGX All-Share Index ───────────────────────────────────

def _cumulative_return(rows: list[dict]) -> Optional[float]:
    if len(rows) < 2:
        return None
    first = rows[0].get("price")
    last  = rows[-1].get("price")
    if first and last and first > 0:
        return round((last / first - 1) * 100, 2)
    result = 1.0
    for r in rows:
        chg = r.get("change_pct")
        if chg is not None:
            result *= (1 + chg / 100)
    return round((result - 1) * 100, 2) if result != 1.0 else None


class RelativeStrengthItem(BaseModel):
    ticker:       str
    stock_return: Optional[float]
    index_return: Optional[float]
    rs_pct:       Optional[float]
    outperform:   Optional[bool]


class RelativeStrengthResponse(BaseModel):
    days:           int
    index_ticker:   str
    has_index_data: bool
    items:          list[RelativeStrengthItem]


@router.get("/relative-strength", response_model=RelativeStrengthResponse)
def relative_strength(
    days: int = Query(default=90, ge=10, le=365),
    db:   Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns each active NGX holding's cumulative return vs the NGX All-Share
    Index (NGXASI) over the last `days` calendar days.
    Index data is stored in daily_price_history with ticker='NGXASI'.
    """
    try:
        from app.services.history import refresh_ticker_history
        try:
            refresh_ticker_history(_INDEX_TICKER)
        except Exception:
            pass

        index_rows = get_daily_price_history(db, _INDEX_TICKER, days)
        index_ret  = _cumulative_return(index_rows)
        has_index  = index_ret is not None

        holdings = get_active_holdings(db, market="ngx", user_id=current_user.id)
        items: list[RelativeStrengthItem] = []

        for h in holdings:
            rows      = get_daily_price_history(db, h.ticker, days)
            stock_ret = _cumulative_return(rows)
            rs = round(stock_ret - index_ret, 2) if (stock_ret is not None and index_ret is not None) else None
            items.append(RelativeStrengthItem(
                ticker       = h.ticker,
                stock_return = stock_ret,
                index_return = index_ret,
                rs_pct       = rs,
                outperform   = (rs > 0) if rs is not None else None,
            ))

        items.sort(key=lambda x: (x.rs_pct is None, -(x.rs_pct or 0)))

        return RelativeStrengthResponse(
            days           = days,
            index_ticker   = _INDEX_TICKER,
            has_index_data = has_index,
            items          = items,
        )
    except Exception:
        log.exception("Error computing relative strength")
        raise HTTPException(status_code=500, detail="Failed to compute relative strength")