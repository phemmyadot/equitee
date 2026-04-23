"""
Dividends Page Router
=====================
GET /api/dividends  — all dividend data for the dividends page (one call, all data)
"""

import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.engine import get_db
from app.db.models import User
from app.auth.dependencies import get_current_user
from app.services import dividends as dividends_service
from app.services import ngx_job as _ngx_job
from app.services.portfolio import load_holdings_from_db
from app.models import DividendInfo

log = logging.getLogger(__name__)

router = APIRouter(prefix="/api/dividends", tags=["dividends"])


class DripProjection(BaseModel):
    yr1: float
    yr3: float
    yr5: float


class DividendHolding(BaseModel):
    ticker: str
    name: str
    sector: Optional[str] = None
    shares: float
    avg_cost: float
    dividend: Optional[DividendInfo] = None
    projected_payout: Optional[float] = None
    yield_on_cost: Optional[float] = None
    annual_yield_pct: Optional[float] = None
    drip: Optional[DripProjection] = None
    dividend_streak: Optional[int] = None
    years_with_dividend: Optional[int] = None
    dividend_growing: Optional[bool] = None


class PortfolioDrip(BaseModel):
    annual_income: float
    yr1: float
    yr3: float
    yr5: float
    blended_yield_pct: float


class DividendsResponse(BaseModel):
    holdings: list[DividendHolding]
    cache_age_sec: Optional[int] = None
    total_projected_payout: Optional[float] = None
    portfolio_drip: Optional[PortfolioDrip] = None


@router.get("", response_model=DividendsResponse)
async def get_dividends(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        holdings = load_holdings_from_db(db, current_user.id)
        ngx = holdings["ngx"]

        # Read dividend data from the NGX job's DB cache (populated by background job)
        # and fall back to the dividend scraper cache for tickers not yet in the job cache.
        def _div_from_cache(ticker: str) -> Optional[DividendInfo]:
            row = _ngx_job.get_ticker(ticker)
            if row and row.get("dividend_amount"):
                return DividendInfo(
                    symbol=ticker,
                    ex_dividend_date=row.get("dividend_ex_date"),
                    record_date=None,
                    pay_date=row.get("dividend_pay_date"),
                    cash_amount=row["dividend_amount"],
                    currency="NGN",
                    timestamp=None,
                )
            return None

        result: list[DividendHolding] = []
        total_payout: float = 0.0

        for h in ngx:
            ticker = h["ticker"]
            shares = float(h["shares"])
            avg_cost = float(h["avg_cost"])
            cost_basis = shares * avg_cost
            div = _div_from_cache(ticker)

            projected = None
            yoc = None
            annual_yield = None
            drip = None

            if div and div.cash_amount:
                projected = round(shares * div.cash_amount, 2)
                yoc = round((div.cash_amount / avg_cost) * 100, 4) if avg_cost else None
                total_payout += projected

                if cost_basis > 0:
                    annual_yield = round((projected / cost_basis) * 100, 4)
                    y = annual_yield / 100
                    drip = DripProjection(
                        yr1=round(cost_basis * (1 + y) ** 1 - cost_basis, 2),
                        yr3=round(cost_basis * (1 + y) ** 3 - cost_basis, 2),
                        yr5=round(cost_basis * (1 + y) ** 5 - cost_basis, 2),
                    )

            hist = dividends_service.get_dividend_history(ticker)

            result.append(
                DividendHolding(
                    ticker=ticker,
                    name=h.get("name", ticker),
                    sector=h.get("sector"),
                    shares=shares,
                    avg_cost=avg_cost,
                    dividend=div,
                    projected_payout=projected,
                    yield_on_cost=yoc,
                    annual_yield_pct=annual_yield,
                    drip=drip,
                    dividend_streak=hist.get("streak") or None,
                    years_with_dividend=hist.get("years_paid") or None,
                    dividend_growing=hist.get("growing"),
                )
            )

        result.sort(
            key=lambda d: (
                0 if (d.dividend and d.dividend.pay_date) else 1,
                d.dividend.pay_date if (d.dividend and d.dividend.pay_date) else d.ticker,
            )
        )

        portfolio_drip = None
        total_cost = sum(float(h["shares"]) * float(h["avg_cost"]) for h in ngx)
        if total_payout > 0 and total_cost > 0:
            py = total_payout / total_cost
            blended_yield = round(py * 100, 4)
            portfolio_drip = PortfolioDrip(
                annual_income=round(total_payout, 2),
                yr1=round(total_cost * (1 + py) ** 1 - total_cost, 2),
                yr3=round(total_cost * (1 + py) ** 3 - total_cost, 2),
                yr5=round(total_cost * (1 + py) ** 5 - total_cost, 2),
                blended_yield_pct=blended_yield,
            )

        last_updated_ts = _ngx_job.last_updated()
        cache_age = int((datetime.now(timezone.utc) - last_updated_ts).total_seconds()) if last_updated_ts else None

        return DividendsResponse(
            holdings=result,
            cache_age_sec=cache_age,
            total_projected_payout=round(total_payout, 2) if total_payout else None,
            portfolio_drip=portfolio_drip,
        )

    except Exception:
        log.exception("Error building dividends response")
        raise HTTPException(status_code=500, detail="Failed to load dividend data")
