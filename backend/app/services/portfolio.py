"""
Portfolio Service
=================
Loads holdings from portfolio.json, merges with live prices,
and computes all derived values (P&L, return %, sectors, KPIs, HHI).

portfolio.json schema:
    {
      "ngx":  [{ "ticker", "name", "shares", "avg_cost", "sector" }],
      "us":   [{ "ticker", "name", "shares", "avg_cost", "sector" }],
      "sold": [{ "ticker", "name", "market", "realized_pl" }]
    }
"""

import json
import math
import logging
from typing import Any, Optional

from app.config import settings
from app.models import (
    StockRow, SectorRow, SoldRow,
    NGXKPIs, USKPIs, CombinedKPIs, WaterfallData, Meta,
    PortfolioDataResponse,
)

log = logging.getLogger(__name__)


# ══════════════════════════════════════════════════════════════════════════════
# Helpers
# ══════════════════════════════════════════════════════════════════════════════

def _safe(v: Any) -> Optional[float]:
    """Coerce to float, returning None for NaN / Inf / None."""
    if v is None:
        return None
    try:
        f = float(v)
        return None if (math.isnan(f) or math.isinf(f)) else round(f, 4)
    except (TypeError, ValueError):
        return None


def _sum(rows: list[StockRow], key: str) -> float:
    return sum(getattr(r, key) or 0 for r in rows)


# ══════════════════════════════════════════════════════════════════════════════
# Data loader
# ══════════════════════════════════════════════════════════════════════════════

def load_holdings() -> dict:
    with open(settings.PORTFOLIO_FILE) as f:
        return json.load(f)


# ══════════════════════════════════════════════════════════════════════════════
# Stock row builder
# ══════════════════════════════════════════════════════════════════════════════

def build_stock_rows(holdings: list[dict], prices: dict,
                     price_source_label: str) -> list[StockRow]:
    rows = []
    for h in holdings:
        ticker     = h["ticker"]
        shares     = float(h["shares"])
        cost_ps    = float(h["avg_cost"])
        total_cost = shares * cost_ps

        p          = prices.get(ticker)
        price      = p.price if p else None
        equity     = _safe(price * shares)      if price is not None else None
        unreal     = _safe(equity - total_cost) if equity is not None else None
        ret_pct    = _safe(unreal / total_cost * 100) if (
                         unreal is not None and total_cost) else None

        rows.append(StockRow(
            Stock         = h["name"],
            Ticker        = ticker,
            Sector        = h.get("sector", ""),
            Shares        = shares,
            AvgCost       = _safe(cost_ps),
            RemainingCost = _safe(total_cost),
            CurrentEquity = equity,
            UnrealizedPL  = unreal,
            RealizedPL    = 0.0,
            TotalPL       = unreal,
            ReturnPct     = ret_pct,
            OriginalCost  = _safe(total_cost),
            LivePrice     = _safe(price),
            LiveChange    = _safe(p.change)      if p else None,
            LiveChangePct = _safe(p.change_pct)  if p else None,
            DayHigh       = _safe(p.high)        if p else None,
            DayLow        = _safe(p.low)         if p else None,
            Volume        = _safe(p.volume)      if p else None,
            PriceSource   = price_source_label   if price is not None else "no-data",
        ))
    return rows


# ══════════════════════════════════════════════════════════════════════════════
# Sector aggregator
# ══════════════════════════════════════════════════════════════════════════════

def build_sectors(stocks: list[StockRow]) -> list[SectorRow]:
    sectors: dict[str, dict] = {}
    for s in stocks:
        sec  = s.Sector or "Other"
        eq   = s.CurrentEquity or 0
        cost = s.RemainingCost or 0
        if sec not in sectors:
            sectors[sec] = {"equity": 0.0, "cost": 0.0, "count": 0}
        sectors[sec]["equity"] += eq
        sectors[sec]["cost"]   += cost
        sectors[sec]["count"]  += 1

    result = []
    for sec, v in sectors.items():
        gain_pct = (v["equity"] - v["cost"]) / v["cost"] * 100 if v["cost"] else 0
        result.append(SectorRow(
            Sector  = sec,
            Equity  = round(v["equity"], 2),
            GainPct = round(gain_pct, 4),
            Count   = v["count"],
        ))
    return sorted(result, key=lambda x: -x.Equity)


# ══════════════════════════════════════════════════════════════════════════════
# HHI (Herfindahl–Hirschman Index)
# ══════════════════════════════════════════════════════════════════════════════

def compute_hhi(stocks: list[StockRow]) -> float:
    total = sum(s.CurrentEquity or 0 for s in stocks)
    if total == 0:
        return 0.0
    return sum(
        ((s.CurrentEquity or 0) / total) ** 2
        for s in stocks
    ) * 10000


# ══════════════════════════════════════════════════════════════════════════════
# Main assembler
# ══════════════════════════════════════════════════════════════════════════════

def build_portfolio_response(
    ngx_prices: dict,
    us_prices:  dict,
    fx:         dict,
    ngx_price_age: Optional[int],
    us_price_age:  Optional[int],
) -> PortfolioDataResponse:

    holdings   = load_holdings()
    usdngn     = fx["rate"]

    ngx_stocks = build_stock_rows(holdings["ngx"], ngx_prices, "ngx-api")
    us_stocks  = build_stock_rows(holdings["us"],  us_prices,  "yahoo")

    sold = [
        SoldRow(
            Stock      = s["name"],
            Ticker     = s["ticker"],
            Market     = s["market"].upper(),
            RealizedPL = float(s["realized_pl"]),
        )
        for s in holdings.get("sold", [])
    ]
    ngx_realized = sum(
        s.RealizedPL for s in sold
        if s.Market == "NGX"
    )

    # ── NGX KPIs ─────────────────────────────────────────────────────────────
    ngx_equity = _sum(ngx_stocks, "CurrentEquity")
    ngx_cost   = _sum(ngx_stocks, "RemainingCost")
    ngx_unreal = _sum(ngx_stocks, "UnrealizedPL")
    ngx_ret    = (ngx_unreal / ngx_cost * 100) if ngx_cost else 0

    # ── US KPIs ───────────────────────────────────────────────────────────────
    us_equity  = _sum(us_stocks, "CurrentEquity")
    us_cost    = _sum(us_stocks, "RemainingCost")
    us_unreal  = _sum(us_stocks, "UnrealizedPL")
    us_ret     = (us_unreal / us_cost * 100) if us_cost else 0

    # ── Combined ──────────────────────────────────────────────────────────────
    ngx_usd    = ngx_equity / usdngn if usdngn else 0
    total_usd  = ngx_usd + us_equity

    # ── HHI ──────────────────────────────────────────────────────────────────
    hhi = compute_hhi(ngx_stocks)
    hhi_label = "LOW" if hhi < 1000 else ("MODERATE" if hhi < 1800 else "HIGH")

    return PortfolioDataResponse(
        meta = Meta(
            usdngn           = round(usdngn, 2),
            fx_source        = fx["source"],
            hhi              = round(hhi, 1),
            hhi_label        = hhi_label,
            ngx_price_source = "NGX REST API (30-min delayed)",
            us_price_source  = "Yahoo Finance",
            ngx_prices_live  = sum(1 for s in ngx_stocks if s.PriceSource == "ngx-api"),
            ngx_prices_total = len(ngx_stocks),
            us_prices_live   = sum(1 for s in us_stocks  if s.PriceSource == "yahoo"),
            us_prices_total  = len(us_stocks),
            ngx_price_age    = ngx_price_age,
            us_price_age     = us_price_age,
        ),
        ngx_kpis = NGXKPIs(
            equity      = round(ngx_equity, 2),
            cost        = round(ngx_cost, 2),
            gain        = round(ngx_unreal, 2),
            return_pct  = round(ngx_ret, 2),
            realized_pl = round(ngx_realized, 2),
            total_cost  = round(ngx_cost, 2),
            positions   = len(ngx_stocks),
        ),
        us_kpis = USKPIs(
            equity     = round(us_equity, 4),
            cost       = round(us_cost, 4),
            gain       = round(us_unreal, 4),
            return_pct = round(us_ret, 2),
            positions  = len(us_stocks),
        ),
        combined_kpis = CombinedKPIs(
            ngx_usd   = round(ngx_usd, 2),
            us_usd    = round(us_equity, 2),
            total_usd = round(total_usd, 2),
        ),
        ngx_stocks  = ngx_stocks,
        ngx_sold    = sold,
        ngx_sectors = build_sectors(ngx_stocks),
        us_stocks   = us_stocks,
        us_sectors  = build_sectors(us_stocks),
        waterfall   = WaterfallData(
            total_cost     = round(ngx_cost, 2),
            realized_pl    = round(ngx_realized, 2),
            unrealized_pl  = round(ngx_unreal, 2),
            current_equity = round(ngx_equity, 2),
        ),
    )