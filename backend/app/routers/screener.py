"""
Screener Router
===============
GET /api/screener/ngx — return all NGX tickers with prices + cached fundamentals.
No new scraping is triggered — only tickers already in the in-memory caches are enriched.
"""

import logging
from fastapi import APIRouter, Depends

from app.auth.dependencies import get_current_user
from app.db.models import User
from app.services import ngx as _ngx_service
from app.services.performance import _overview_cache   # fundamentals: P/E, ROE
from app.services.overview import _performance_cache   # returns: 52W high/low/change
from app.services.profile import _profile_cache        # name, sector

log = logging.getLogger(__name__)

router = APIRouter(prefix="/api/screener", tags=["screener"])


@router.get("/ngx")
def ngx_screener(
    current_user: User = Depends(get_current_user),
):
    """
    Return all NGX tickers from the price cache, enriched with any cached fundamentals.
    Tickers without cached fundamentals still appear — they just have null fields.
    """
    all_prices = _ngx_service.get_prices()

    rows = []
    for ticker, pd in all_prices.items():
        key = ticker.upper()
        ov = _overview_cache.get(key) or {}
        perf = _performance_cache.get(key) or {}
        prof = _profile_cache.get(key) or {}

        rows.append({
            "ticker": ticker,
            "name": prof.get("name"),
            "sector": prof.get("sector"),
            "price": pd.price,
            "change_pct": pd.change_pct,
            "volume": pd.volume,
            "market_cap": ov.get("market_cap"),
            "pe_ratio": ov.get("pe_ratio"),
            "roe": ov.get("roe"),
            "eps": ov.get("eps"),
            "dividend_yield": ov.get("dividend_yield"),
            "week_52_high": perf.get("week_52_high"),
            "week_52_low": perf.get("week_52_low"),
            "week_52_change": perf.get("week_52_change"),
            "return_1y": perf.get("return_1y"),
        })

    rows.sort(key=lambda r: r["ticker"])
    return {"count": len(rows), "tickers": rows}
