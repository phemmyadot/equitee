"""
Dividends Page Router
=====================
GET /api/dividends  — all dividend data for the dividends page (one call, all data)
"""

import logging
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone, date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.engine import get_db
from app.db.models import User
from app.auth.dependencies import get_current_user
from app.services import dividends as dividends_service
from app.services import ngx_job as _ngx_job
from app.services import yahoo as _yahoo
from app.services.portfolio import load_holdings_from_db
from app.models import DividendInfo

log = logging.getLogger(__name__)

router = APIRouter(prefix="/api/dividends", tags=["dividends"])

_DATE_FMTS = [
    "%Y-%m-%d",
    "%b %d, %Y",   # Apr 15, 2024
    "%B %d, %Y",   # April 15, 2024
    "%d/%m/%Y",
    "%m/%d/%Y",
    "%b %d %Y",    # Apr 15 2024 (no comma)
    "%d %b %Y",    # 15 Apr 2024
]

def _parse_date(s: Optional[str]) -> Optional[date]:
    if not s:
        return None
    s = " ".join(s.strip().split())  # normalise whitespace
    # fromisoformat handles "2024-01-15", "2024-01-15T10:30:00", "2024-01-15T10:30:00+00:00"
    try:
        return datetime.fromisoformat(s.replace("Z", "+00:00")).date()
    except ValueError:
        pass
    for fmt in _DATE_FMTS:
        try:
            return datetime.strptime(s, fmt).date()
        except ValueError:
            continue
    return None


def _is_qualified(
    purchase_date_str: Optional[str],
    ex_div_str: Optional[str],
    pay_date_str: Optional[str],
) -> Optional[bool]:
    """
    True  = bought before ex-date (eligible for upcoming dividend).
    False = bought on/after ex-date AND pay_date is still in the future (missed).
    None  = pay_date already passed (historical, not relevant) or dates unknown.
    """
    pay = _parse_date(pay_date_str)
    if pay is not None and pay < date.today():
        return None  # dividend already paid — past, not missed

    buy = _parse_date(purchase_date_str)
    ex = _parse_date(ex_div_str)
    if buy is None or ex is None:
        return None
    return buy < ex


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
    # True = bought before ex-date (qualifies), False = bought on/after (missed), None = unknown
    qualified: Optional[bool] = None
    currency: str = "NGN"


class PortfolioDrip(BaseModel):
    annual_income: float
    yr1: float
    yr3: float
    yr5: float
    blended_yield_pct: float


class DividendsResponse(BaseModel):
    holdings: list[DividendHolding]
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

            # Determine ex-date eligibility
            purchase_date_str = h.get("purchase_date") or h.get("created_at")
            qualified = _is_qualified(
                purchase_date_str,
                div.ex_dividend_date if div else None,
                div.pay_date if div else None,
            )

            projected = None
            yoc = None
            annual_yield = None
            drip = None

            # Only calculate payout if qualified (or qualification unknown)
            if div and div.cash_amount and qualified is not False:
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
                    qualified=qualified,
                )
            )

        # ── US holdings ────────────────────────────────────────────────────────
        us = holdings["us"]
        if us:
            us_tickers = [h["ticker"] for h in us]
            us_fund_futures: dict[str, object] = {}
            with ThreadPoolExecutor(max_workers=min(len(us_tickers), 10)) as ex:
                for t in us_tickers:
                    us_fund_futures[t] = ex.submit(_yahoo.get_fundamentals, t)
            us_fund_map: dict[str, dict] = {}
            for t, f in us_fund_futures.items():
                try:
                    us_fund_map[t] = f.result() or {}  # type: ignore[union-attr]
                except Exception:
                    us_fund_map[t] = {}

            for h in us:
                ticker = h["ticker"]
                shares = float(h["shares"])
                avg_cost = float(h["avg_cost"])
                f = us_fund_map.get(ticker) or {}
                ov = f.get("overview") or {}
                dividend_rate = ov.get("dividend_rate")
                ex_date = ov.get("ex_dividend_date")

                div: Optional[DividendInfo] = None
                if dividend_rate:
                    div = DividendInfo(
                        symbol=ticker,
                        ex_dividend_date=ex_date,
                        record_date=None,
                        pay_date=None,
                        cash_amount=float(dividend_rate),
                        currency="USD",
                        timestamp=None,
                    )

                purchase_date_str = h.get("purchase_date") or h.get("created_at")
                qualified = (
                    _is_qualified(purchase_date_str, ex_date, None)
                    if div else None
                )

                projected: Optional[float] = None
                yoc: Optional[float] = None
                if div and div.cash_amount and qualified is not False:
                    projected = round(shares * div.cash_amount, 2)
                    yoc = round((div.cash_amount / avg_cost) * 100, 4) if avg_cost else None

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
                        annual_yield_pct=None,
                        drip=None,
                        dividend_streak=None,
                        years_with_dividend=None,
                        dividend_growing=None,
                        qualified=qualified,
                        currency="USD",
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

        return DividendsResponse(
            holdings=result,
            total_projected_payout=round(total_payout, 2) if total_payout else None,
            portfolio_drip=portfolio_drip,
        )

    except Exception:
        log.exception("Error building dividends response")
        raise HTTPException(status_code=500, detail="Failed to load dividend data")
