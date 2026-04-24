"""
Cross-Listings
==============
NGX tickers whose primary financial data lives on a foreign exchange.

For these stocks the NGX statistics page is absent or sparse. We overlay
fundamentals from Yahoo Finance (using the foreign-exchange ticker) while
keeping all price-derived fields (52W range, RSI, MAs, market cap) from
the NGX source — those are always denominated in NGN and computed from
the NGX trading price.

Absolute financial values (revenue, net income, EPS, book value) are
returned in the company's reporting currency (usually USD). The job
converts them to NGN using the live FX rate before writing to DB.
"""

from __future__ import annotations

import logging
from typing import Optional

log = logging.getLogger(__name__)

# ── Mapping ────────────────────────────────────────────────────────────────────

# NGX ticker → (Yahoo Finance ticker, reporting currency)
# Reporting currency is what Yahoo returns for revenue/EPS/book value.
CROSS_LISTINGS: dict[str, tuple[str, str]] = {
    "SEPLAT": ("SEPL.L", "USD"),
}


def yahoo_ticker(ngx_ticker: str) -> Optional[str]:
    """Return Yahoo Finance ticker for a cross-listed NGX stock, or None."""
    entry = CROSS_LISTINGS.get(ngx_ticker.upper())
    return entry[0] if entry else None


def reporting_currency(ngx_ticker: str) -> Optional[str]:
    """Return the reporting currency for a cross-listed NGX stock, or None."""
    entry = CROSS_LISTINGS.get(ngx_ticker.upper())
    return entry[1] if entry else None


# ── Fields that must always come from NGX (NGN-denominated or NGX-computed) ───

_NGX_ONLY = frozenset({
    "week_52_high", "week_52_low", "week_52_change",
    "return_1m", "return_3m", "return_6m", "return_ytd", "return_1y",
    "rsi_14", "ma_50", "ma_200", "golden_cross",
    "market_cap",       # NGX price × shares outstanding
    "price_to_book",    # NGX price / book — recalculated in router
    "price_to_sales",   # NGX price / sales — recalculated in router
    "fcf_yield",        # FCF / NGX market cap — recalculated in router
    "ev_fcf",           # EV uses NGX market cap
    "dividend_yield",   # Dividend / NGX price — sourced from NGX dividend page
    "volatility", "sharpe_ratio", "max_drawdown",
    "piotroski_score", "altman_zscore",
})


def overlay_yahoo_fundamentals(
    result: dict,
    yahoo_data: dict,
    usdngn: Optional[float] = None,
) -> dict:
    """
    Merge Yahoo fundamental data into an NGX enrichment result dict.

    Rules:
    - Only fills fields that are null/missing in result.
    - Never touches _NGX_ONLY fields (price-specific or NGX-computed).
    - Absolute monetary values (revenue, EPS, etc.) are multiplied by
      usdngn when the reporting currency is USD, so they land in NGN.
      If usdngn is None those fields are skipped.
    """
    ov = yahoo_data.get("overview") or {}
    perf = yahoo_data.get("performance") or {}
    prof = yahoo_data.get("profile") or {}
    fin_currency = yahoo_data.get("financial_currency") or "USD"

    # Determine multiplier for absolute monetary fields
    if fin_currency == "USD" and usdngn:
        fx = usdngn
    else:
        fx = None  # skip absolute values if we can't convert

    def _set(key: str, val, convert: bool = False):
        """Write val into result only if the key is missing/null."""
        if key in _NGX_ONLY:
            return
        if val is None:
            return
        if result.get(key) is not None:
            return
        result[key] = round(val * fx, 2) if (convert and fx) else val

    # ── Profile (currency-agnostic) ────────────────────────────────────────
    _set("sector",       prof.get("sector"))
    _set("industry",     prof.get("industry"))
    _set("description",  prof.get("description"))
    _set("website",      prof.get("website"))
    _set("headquarters", prof.get("headquarters"))
    _set("employees",    prof.get("employees"))

    # ── Ratio / percentage fields (currency-agnostic) ──────────────────────
    _set("roe",               ov.get("roe"))
    _set("roa",               ov.get("roa"))
    _set("gross_margin",      ov.get("gross_margin"))
    _set("net_margin",        ov.get("net_margin"))
    _set("operating_margin",  ov.get("operating_margin"))
    _set("ebitda_margin",     ov.get("ebitda_margin"))
    _set("current_ratio",     ov.get("current_ratio"))
    _set("quick_ratio",       ov.get("quick_ratio"))
    _set("debt_to_equity",    ov.get("debt_to_equity"))
    _set("pe_ratio",          ov.get("pe_ratio"))
    _set("ev_ebitda",         ov.get("ev_ebitda"))
    _set("beta",              perf.get("beta"))
    _set("revenue_growth_yoy",   ov.get("revenue_growth"))
    _set("earnings_growth_yoy",  ov.get("earnings_growth"))

    # ── Absolute monetary fields (require FX conversion) ──────────────────
    _set("revenue",               ov.get("revenue"),               convert=True)
    _set("net_income",            ov.get("net_income"),            convert=True)
    _set("free_cash_flow",        ov.get("free_cash_flow"),        convert=True)
    _set("operating_cash_flow",   ov.get("operating_cash_flow"),   convert=True)
    _set("eps",                   ov.get("eps"),                   convert=True)
    _set("book_value",            ov.get("book_value"),            convert=True)

    return result
