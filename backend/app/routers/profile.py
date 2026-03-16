"""
Profile Router
==============
GET /api/profile/ngx/{ticker}                  — company profile
GET /api/profile/ngx/{ticker}/dividend         — latest dividend record
GET /api/profile/ngx/{ticker}/price-history    — OHLCV price history (scraped)
GET /api/profile/ngx/{ticker}/earnings         — quarterly earnings history (8 quarters)
GET /api/profile/ngx/{ticker}/balance-sheet    — annual balance sheet trend (4 years)
GET /api/profile/ngx/{ticker}/full             — all data combined
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session

from app.services.profile    import get_profile
from app.services.dividends  import get_dividend
from app.services.financials import get_earnings_history, get_balance_sheet
from app.db.engine  import get_db
from app.db.crud    import get_price_history as db_get_price_history
from app.db.models  import User
from app.auth.dependencies import get_current_user
from app.models import DividendInfo

router = APIRouter(prefix="/api/profile", tags=["profile"])


class ProfileResponse(BaseModel):
    symbol:        str
    name:          Optional[str] = None
    sector:        Optional[str] = None
    industry:      Optional[str] = None
    website:       Optional[str] = None
    description:   Optional[str] = None
    headquarters:  Optional[str] = None
    founded:       Optional[str] = None
    employees:     Optional[str] = None


@router.get("/ngx/{ticker}", response_model=ProfileResponse)
def ngx_profile(ticker: str, _: User = Depends(get_current_user)):
    data = get_profile(ticker.upper())
    if data is None:
        raise HTTPException(status_code=404, detail=f"Profile not found for {ticker.upper()}")
    return ProfileResponse(**data)


@router.get("/ngx/{ticker}/dividend", response_model=DividendInfo)
def ngx_dividend(ticker: str, _: User = Depends(get_current_user)):
    """Latest dividend record for an NGX-listed stock."""
    data = get_dividend(ticker.upper())
    if data is None:
        raise HTTPException(status_code=404, detail=f"No dividend data found for {ticker.upper()}")
    return data


# ── Financials response models ────────────────────────────────────────────────


class PriceHistoryResponse(BaseModel):
    ticker:     str
    days:       int
    count:      int
    dates:      list[str]
    close:      list[Optional[float]]
    change_pct: list[Optional[float]]


@router.get("/ngx/{ticker}/price-history", response_model=PriceHistoryResponse)
def ngx_price_history(
    ticker: str,
    days:   int = 90,
    db:     Session = Depends(get_db),
    _:      User = Depends(get_current_user),
):
    """
    Price history for a single NGX ticker from our local DB snapshots.
    Written every NGX_PRICE_TTL seconds by /api/data calls.
    """
    rows = db_get_price_history(db, ticker=ticker.upper(), days=days)
    if not rows:
        raise HTTPException(
            status_code=404,
            detail=f"No price history in DB for {ticker.upper()} — call /api/data a few times first to build history.",
        )
    return PriceHistoryResponse(
        ticker     = ticker.upper(),
        days       = days,
        count      = len(rows),
        dates      = [r["ts"][:10] for r in rows],   # YYYY-MM-DD
        close      = [r["price"]      for r in rows],
        change_pct = [r["change_pct"] for r in rows],
    )


class EarningsHistoryResponse(BaseModel):
    ticker:     str
    periods:    list[str]
    revenue:    list[Optional[float]]
    eps:        list[Optional[float]]
    net_income: list[Optional[float]]


class BalanceSheetResponse(BaseModel):
    ticker:      str
    periods:     list[str]
    assets:      list[Optional[float]]
    liabilities: list[Optional[float]]
    equity:      list[Optional[float]]


@router.get("/ngx/{ticker}/earnings", response_model=EarningsHistoryResponse)
def ngx_earnings(ticker: str, _: User = Depends(get_current_user)):
    """Quarterly earnings history — up to 8 quarters, oldest first."""
    data = get_earnings_history(ticker.upper())
    if not data or not data.get("periods"):
        raise HTTPException(status_code=404, detail=f"No earnings data for {ticker.upper()}")
    return EarningsHistoryResponse(ticker=ticker.upper(), **data)


@router.get("/ngx/{ticker}/balance-sheet", response_model=BalanceSheetResponse)
def ngx_balance_sheet(ticker: str, _: User = Depends(get_current_user)):
    """Annual balance sheet trend — up to 4 years, oldest first."""
    data = get_balance_sheet(ticker.upper())
    if not data or not data.get("periods"):
        raise HTTPException(status_code=404, detail=f"No balance sheet data for {ticker.upper()}")
    return BalanceSheetResponse(ticker=ticker.upper(), **data)


# ── Full ticker data endpoint ─────────────────────────────────────────────────
# Replaces the /api/data/{ticker} route from the attached data.py.
# Lives here (prefix /api/profile) to avoid colliding with /api/data (GET, no path param).

from app.services.profile import get_profile as _get_profile
from app.services import ngx as _ngx_service
from app.services import prices as _prices_service
from app.services import performance as _overview_service
from app.services import overview as _performance_service
from typing import Any


class TickerPriceOut(BaseModel):
    symbol:     str
    price:      Optional[float] = None
    change:     Optional[float] = None
    change_pct: Optional[float] = None
    volume:     Optional[float] = None


class TickerFullResponse(BaseModel):
    ticker:      str
    price:       Optional[TickerPriceOut]       = None
    profile:     Optional[dict[str, Any]]       = None
    overview:    Optional[dict[str, Any]]       = None
    performance: Optional[dict[str, Any]]       = None
    cached_at:   Optional[float]                = None


def _safe(fn, *args, **kwargs):
    """Call fn, return None on any exception."""
    try:
        return fn(*args, **kwargs)
    except Exception as exc:
        import logging
        logging.getLogger(__name__).warning("_safe call failed: %s", exc)
        return None


@router.get("/ngx/{ticker}/full", response_model=TickerFullResponse)
def ngx_full(ticker: str, _: User = Depends(get_current_user)):
    """
    Comprehensive single-ticker endpoint combining price, profile,
    overview (fundamentals), and performance (returns, risk, quality).
    All sub-fetches are fault-tolerant — a failed service returns null
    rather than failing the whole request.
    """
    t = ticker.upper()

    # ── Price ─────────────────────────────────────────────────────────────
    price_out = None
    try:
        pd = _prices_service.get_price(t)
        if pd:
            # Optionally enrich volume from the individual page scrape
            try:
                vol = _ngx_service._get_volume_for_ticker(t)
                if vol:
                    pd.volume = vol
            except Exception:
                pass
            price_out = TickerPriceOut(
                symbol     = pd.symbol,
                price      = pd.price,
                change     = pd.change,
                change_pct = pd.change_pct,
                volume     = pd.volume,
            )
    except Exception:
        pass

    # ── Profile ───────────────────────────────────────────────────────────
    profile_raw = _safe(_get_profile, t)
    profile_out = None
    if profile_raw:
        profile_out = {
            "symbol":   profile_raw.get("symbol"),
            "name":     profile_raw.get("name"),
            "industry": profile_raw.get("industry"),
            "website":  profile_raw.get("website"),
            "founded":  profile_raw.get("founded"),
        }

    # ── Overview (fundamentals) ───────────────────────────────────────────
    ov_raw   = _safe(_overview_service.get_overview, t)
    ov_out   = None
    if ov_raw:
        ov_out = {k: ov_raw.get(k) for k in [
            "market_cap", "pe_ratio", "eps", "dividend_yield",
            "roe", "debt_to_equity", "book_value", "current_ratio",
            "gross_margin", "net_margin", "revenue", "net_income",
        ]}

    # ── Performance (returns, margins, quality) ───────────────────────────
    perf_raw = _safe(_performance_service.get_performance, t)
    perf_out = None
    if perf_raw:
        perf_out = {k: perf_raw.get(k) for k in [
            "beta", "return_1y", "return_ytd", "return_1d", "return_1w",
            "return_1m", "return_3m", "return_6m",
            "week_52_high", "week_52_low", "week_52_change",
            "operating_margin", "ebitda_margin", "fcf_margin", "pretax_margin",
            "roa", "roic", "roce",
            "free_cash_flow", "fcf_per_share", "operating_cash_flow", "capex", "fcf_yield",
            "ev_ebitda", "ev_fcf", "price_to_book", "price_to_sales",
            "interest_coverage", "debt_ebitda", "quick_ratio", "net_debt", "asset_turnover",
            "revenue_growth_yoy", "earnings_growth_yoy", "fcf_growth_yoy", "dividend_growth_yoy",
            "piotroski_score", "altman_zscore",
            "volatility", "sharpe_ratio", "max_drawdown",
        ]}

    return TickerFullResponse(
        ticker      = t,
        price       = price_out,
        profile     = profile_out,
        overview    = ov_out,
        performance = perf_out,
        cached_at   = _ngx_service.cache_age(),
    )