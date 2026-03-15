"""
Data Router
===========
GET /api/data       — full portfolio payload (prices + P&L + sectors + KPIs)
GET /api/dividends  — dividend data for all NGX holdings, enriched with position info
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session

from app.db.engine import get_db
from app.db.models import User
from app.auth.dependencies import get_current_user
from app.services import ngx as ngx_service
from app.services import yahoo as yahoo_service
from app.services import fx as fx_service
from app.services import dividends as dividends_service
from app.services.portfolio import build_portfolio_response, load_holdings_from_db
from app.models import PortfolioDataResponse, DividendInfo

router = APIRouter(prefix="/api", tags=["data"])


@router.get("/data", response_model=PortfolioDataResponse)
async def get_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        fx         = fx_service.get_rate()
        ngx_prices = ngx_service.get_prices()

        holdings   = load_holdings_from_db(db, current_user.id)
        us_tickers = [h["ticker"] for h in holdings["us"]]
        us_prices  = yahoo_service.get_prices(us_tickers)

        return build_portfolio_response(
            ngx_prices    = ngx_prices,
            us_prices     = us_prices,
            fx            = fx,
            ngx_price_age = ngx_service.cache_age(),
            us_price_age  = yahoo_service.cache_age(),
            db            = db,
            user_id       = current_user.id,
        )

    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ── Dividend response models ──────────────────────────────────────────────────

class DividendHolding(BaseModel):
    """DividendInfo enriched with position data for projected payout calculation."""
    ticker:           str
    name:             str
    shares:           float
    avg_cost:         float
    dividend:         Optional[DividendInfo] = None
    projected_payout: Optional[float] = None
    yield_on_cost:    Optional[float] = None


class DividendsResponse(BaseModel):
    holdings:               list[DividendHolding]
    cache_age_sec:          Optional[int]   = None
    total_projected_payout: Optional[float] = None


@router.get("/dividends", response_model=DividendsResponse)
async def get_dividends(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        holdings = load_holdings_from_db(db, current_user.id)
        ngx      = holdings["ngx"]
        tickers  = [h["ticker"] for h in ngx]
        div_map  = dividends_service.get_dividends(tickers)

        result       : list[DividendHolding] = []
        total_payout : float                 = 0.0

        for h in ngx:
            ticker   = h["ticker"]
            shares   = float(h["shares"])
            avg_cost = float(h["avg_cost"])
            div      = div_map.get(ticker)

            projected = None
            yoc       = None
            if div and div.cash_amount:
                projected     = round(shares * div.cash_amount, 2)
                yoc           = round((div.cash_amount / avg_cost) * 100, 4) if avg_cost else None
                total_payout += projected

            result.append(DividendHolding(
                ticker           = ticker,
                name             = h.get("name", ticker),
                shares           = shares,
                avg_cost         = avg_cost,
                dividend         = div,
                projected_payout = projected,
                yield_on_cost    = yoc,
            ))

        result.sort(key=lambda d: (
            0 if (d.dividend and d.dividend.pay_date) else 1,
            d.dividend.pay_date if (d.dividend and d.dividend.pay_date) else d.ticker,
        ))

        return DividendsResponse(
            holdings               = result,
            cache_age_sec          = dividends_service.cache_age(),
            total_projected_payout = round(total_payout, 2) if total_payout else None,
        )

    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
