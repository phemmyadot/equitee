"""
Analysis Service
================
Builds token-efficient portfolio context from the DB and streams
Claude AI analysis via the Anthropic SDK.

No external HTTP calls are made — everything comes from the local DB.
"""

from __future__ import annotations

import hashlib
import json
import logging
import re
from datetime import date
from typing import Generator, Optional

from sqlalchemy.orm import Session
from sqlalchemy import select, desc

from app.config import settings
from app.db.crud import (
    get_active_holdings,
    get_closed_positions,
    get_sale_events,
    get_cash_balance,
    get_watchlist,
    get_latest_analysis,
)
from app.db.models import AnalysisHistory, DailyPriceHistory, PortfolioSnapshot
from app.services import dividends as _dividends_svc
from app.services import performance as _perf_svc
from app.services import overview as _overview_svc
from app.services import prices as _ngx_prices_svc
from app.services import yahoo as _yahoo_svc
from app.services import news as _news_svc

log = logging.getLogger(__name__)

MODEL_QUICK = "claude-haiku-4-5-20251001"
MODEL_DEEP = "claude-sonnet-4-6"

_BANK_SECTORS = {"banking", "insurance"}
_RSI_ERROR_THRESHOLD = 99.9
_ILLIQUID_DAYS = 5.0


def _compute_signal(sector: str, fund: dict) -> Optional[dict]:
    """
    Python port of the frontend computeSignal function.
    Returns {"score": float, "label": str, "flags": list[str], "is_bank": bool}
    or None if there's insufficient data (< 2 data points).
    """
    if not fund:
        return None

    def _clamp(x: float) -> float:
        return max(-1.0, min(1.0, x))

    is_bank = sector.strip().lower() in _BANK_SECTORS
    flags: list[str] = []

    # ── Momentum ──────────────────────────────────────────────────────────────
    mom_pts, mom_n = 0.0, 0
    rsi = fund.get("rsi_14")
    if rsi is not None:
        if rsi >= _RSI_ERROR_THRESHOLD:
            flags.append("RSI_DATA_ERROR")
        else:
            s = (-1 if rsi > 80 else -0.5 if rsi > 70 else 0 if rsi > 50 else 0.5 if rsi > 30 else 0.75)
            mom_pts += s; mom_n += 1

    valid_rets = [v for v in (fund.get(k) for k in ("return_1m", "return_3m", "return_6m", "return_1y")) if v is not None]
    if valid_rets:
        pos = sum(1 for r in valid_rets if r > 0)
        mom_pts += _clamp((pos / len(valid_rets) - 0.5) * 4)
        mom_n += 1

    mom_score = _clamp(mom_pts / mom_n) if mom_n else 0.0

    # ── Valuation ─────────────────────────────────────────────────────────────
    val_pts, val_n = 0.0, 0
    pe = fund.get("pe_ratio")
    if pe and pe > 0:
        val_pts += (1 if pe < 10 else 0.5 if pe < 15 else 0 if pe < 25 else -0.5 if pe < 35 else -1)
        val_n += 1
    pb = fund.get("price_to_book")
    if pb and pb > 0:
        val_pts += (1 if pb < 1 else 0.5 if pb < 2 else 0 if pb < 4 else -0.5)
        val_n += 1
    fcf_y = fund.get("fcf_yield")
    if fcf_y is not None:
        val_pts += (1 if fcf_y > 8 else 0.5 if fcf_y > 4 else 0 if fcf_y > 0 else -0.5)
        val_n += 1
    val_score = _clamp(val_pts / val_n) if val_n else 0.0

    # ── Quality (bank path vs non-financial) ─────────────────────────────────
    qual_pts, qual_n = 0.0, 0
    if not is_bank:
        pio = fund.get("piotroski_score")
        if pio is not None:
            qual_pts += (1 if pio >= 7 else 0 if pio >= 4 else -1); qual_n += 1
        z = fund.get("altman_zscore")
        if z is not None:
            qual_pts += (0.75 if z >= 3 else 0 if z >= 1.81 else -1); qual_n += 1
    else:
        bs = fund.get("bank_score")
        if bs is not None:
            qual_pts += (bs / 5) * 2 - 1; qual_n += 1
        npl = fund.get("npl_pct")
        if npl is not None:
            qual_pts += (1 if npl < 3 else 0 if npl < 5 else -0.5 if npl < 8 else -1); qual_n += 1
        car = fund.get("car_pct")
        if car is not None:
            qual_pts += (1 if car > 18 else 0.5 if car > 15 else 0 if car > 12 else -1); qual_n += 1
        nim = fund.get("nim_pct")
        if nim is not None:
            qual_pts += (1 if nim > 8 else 0.5 if nim > 6 else 0 if nim > 4 else -0.5); qual_n += 1

    roe = fund.get("roe")
    if roe is not None:
        qual_pts += (1 if roe > 25 else 0.5 if roe > 15 else 0 if roe > 5 else -0.5); qual_n += 1
    if not is_bank:
        roic = fund.get("roic")
        if roic is not None:
            qual_pts += (1 if roic > 20 else 0.5 if roic > 10 else 0 if roic > 0 else -0.5); qual_n += 1
    eg = fund.get("earnings_growth_yoy")
    if eg is not None:
        qual_pts += (1 if eg > 20 else 0.5 if eg > 0 else -0.25 if eg > -10 else -1); qual_n += 1
    qual_score = _clamp(qual_pts / qual_n) if qual_n else 0.0

    # ── Dividend ──────────────────────────────────────────────────────────────
    div_pts, div_n = 0.0, 0
    dy = fund.get("dividend_yield")
    if dy and dy > 0:
        div_pts += (1 if dy > 8 else 0.5 if dy > 4 else 0 if dy > 1 else -0.25); div_n += 1
    div_score = _clamp(div_pts / div_n) if div_n else 0.0

    # ── Risk ──────────────────────────────────────────────────────────────────
    risk_pts, risk_n = 0.0, 0
    if not is_bank:
        z = fund.get("altman_zscore")
        if z is not None:
            if z < 1.81: risk_pts -= 1; risk_n += 1
            else: risk_pts += 0.5; risk_n += 1
        de = fund.get("debt_to_equity")
        if de is not None and de >= 0:
            risk_pts += (0.5 if de < 0.5 else 0 if de < 1.5 else -0.5 if de < 2.5 else -1); risk_n += 1
    sharpe = fund.get("sharpe_ratio")
    if sharpe is not None:
        risk_pts += (0.75 if sharpe > 1 else 0.25 if sharpe > 0.5 else -0.25 if sharpe > 0 else -0.75); risk_n += 1
    risk_score = _clamp(risk_pts / risk_n) if risk_n else 0.0

    total = (mom_score * 0.25 + val_score * 0.25 + qual_score * 0.3 + div_score * 0.1 + risk_score * 0.1) * 10

    # Minimum data threshold
    data_pts = mom_n + val_n + qual_n + div_n + risk_n
    if data_pts < 2:
        return None

    # Illiquidity override
    liq_days = fund.get("position_liquidity_days")
    if liq_days is not None and liq_days > _ILLIQUID_DAYS:
        flags.append("ILLIQUID")
        label = "Signal Unreliable"
    elif total > 6: label = "Strong Buy"
    elif total > 3: label = "Buy"
    elif total > 1: label = "Accumulate"
    elif total > -1: label = "Hold"
    elif total > -3: label = "Reduce"
    elif total > -6: label = "Sell"
    else: label = "Strong Sell"

    return {"score": round(total, 2), "label": label, "flags": flags, "is_bank": is_bank}

_ANALYST_PERSONA = (
    "You are a seasoned equity analyst with 20+ years specialising in frontier and "
    "emerging markets, Nigerian Exchange (NGX) equities, and US growth stocks. "
    "Be direct, specific, and actionable. "
    "Always respond in well-structured Markdown. Use ## for section headings, "
    "**bold** for tickers and key figures, bullet lists (- item) for action points. "
    "No disclaimers. No plain prose — Markdown only. Keep total response under 800 words.\n\n"
    "Terse style: no filler ('it appears', 'it is worth noting', 'based on the above', "
    "'in conclusion'). Fragments over full sentences. Lead with the finding, not the setup. "
    "Numbers over words — '₦65 (+30%)' not 'the price has increased by thirty percent to sixty-five naira'.\n\n"
    "You will receive: active holdings, closed positions, recent trade history (buys and sells "
    "with commission), cash balances (NGN and USD), realized P&L by position, "
    "watchlist, dividends, and prior analyses. "
    "Each holding may include a composite Signal score (-10 to +10) with label "
    "(Strong Buy → Strong Sell) computed from momentum, valuation, quality, dividend, and risk dimensions. "
    "Where a Signal is provided, reference it in your analysis — especially for action items. "
    "Flags such as RSI_DATA_ERROR or ILLIQUID indicate unreliable data; treat Signal Unreliable holdings with caution. "
    "Use ALL of this data — especially the trade history and realized P&L — to inform your analysis. "
    "Comment on trading behaviour (e.g. frequent partial sells, commission drag, holding period). "
    "Factor in available cash when recommending buys."
)

_PORTFOLIO_SECTIONS = (
    "Structure your response with exactly these nine sections:\n"
    "## 1. Previous Analysis Overview\n"
    "If prior analysis context is provided above, briefly recap the key recommendations "
    "from the most recent analysis and note what has changed since (prices, positions, outlook). "
    "If this is the first analysis, write: 'First analysis — establishing baseline.'\n"
    "## 2. Portfolio Health Score\n"
    "Score X/100 — then 2 bullet points of rationale. Factor in realized P&L trend and cash buffer.\n"
    "## 3. Trading Activity Review\n"
    "Comment on recent sales: were they well-timed? Commission drag? Any position fully closed "
    "at a gain or loss? How is the cash balance being deployed?\n"
    "## 4. Top 3 Action Items\n"
    "- **TICKER** — Buy/Sell/Hold at ₦X | one-line reason. Note if cash balance can fund a buy.\n"
    "## 5. Risk Flags\n"
    "Bullet list: concentration, currency exposure (NGN vs USD), realized losses, high-beta names.\n"
    "## 6. Watchlist Picks\n"
    "- **TICKER** | Entry: ₦X–Y | Rationale: ...\n"
    "## 7. Rebalancing Nudge\n"
    "Bullet list of over/underweight sectors vs neutral 5-sector split.\n"
    "## 8. Income Outlook\n"
    "Projected annual dividend income and yield levers.\n"
    "## 9. One Contrarian Thought\n"
    "> Contrarian insight here."
)

_WATCHLIST_SECTIONS = (
    "The user has provided their watchlist — tickers they are considering buying but do NOT yet own. "
    "Do NOT treat these as current holdings. Analyse each ticker as a prospective investment.\n"
    "Structure your response with exactly these six sections:\n"
    "## 1. Previous Analysis Overview\n"
    "If prior analysis context is provided above, briefly recap previous watchlist recommendations "
    "and note what has changed since. If this is the first analysis, write: 'First analysis — establishing baseline.'\n"
    "## 2. Watchlist Ranking\n"
    "Rank all tickers best-to-worst opportunity. One line per ticker with score /10 and key reason.\n"
    "## 3. Top Buy Now\n"
    "- **TICKER** | Entry: ₦X–Y | Target: ₦X | Stop-loss: ₦X | Rationale: ...\n"
    "Pick the single best entry for immediate action and explain why now.\n"
    "## 4. Wait / Avoid\n"
    "Bullet list of tickers to avoid or wait on, with a one-line reason each.\n"
    "## 5. Risk Snapshot\n"
    "Key risks across the watchlist: sector concentration, liquidity, macro exposure.\n"
    "## 6. One Contrarian Thought\n"
    "> Something the data suggests that goes against the obvious read on this watchlist."
)

_COMBINED_SECTIONS = (
    "The user has provided both their current holdings AND their watchlist. "
    "Analyse the full picture — how the watchlist complements or overlaps the portfolio.\n"
    "Structure your response with exactly these eight sections:\n"
    "## 1. Previous Analysis Overview\n"
    "If prior analysis context is provided above, briefly recap previous recommendations "
    "and note what has changed since. If this is the first analysis, write: 'First analysis — establishing baseline.'\n"
    "## 2. Portfolio Health Score\n"
    "Score X/100 — then 2 bullet points of rationale.\n"
    "## 3. Top 3 Action Items\n"
    "- **TICKER** — Buy/Sell/Hold at ₦X | one-line reason (can include watchlist names)\n"
    "## 4. Best Watchlist Additions\n"
    "Top 2 watchlist tickers that best complement the existing portfolio, with entry levels.\n"
    "## 5. Risk Flags\n"
    "Concentration, currency exposure, overlap between holdings and watchlist.\n"
    "## 6. Rebalancing Nudge\n"
    "Over/underweight sectors including what watchlist buys would change.\n"
    "## 7. Income Outlook\n"
    "Current dividend income + potential uplift if watchlist picks are added.\n"
    "## 8. One Contrarian Thought\n"
    "> Contrarian insight here."
)


_FOLLOWUP_INSTRUCTIONS = (
    "The user is asking a follow-up question about the analysis above. "
    "Answer it directly and concisely — do NOT use the structured section format. "
    "Use Markdown freely (bold tickers, bullet lists where helpful), but respond "
    "conversationally and keep the answer focused on what was asked. "
    "Reference specific figures from the portfolio context or prior analysis where relevant."
)


_DAILY_BRIEFING_SYSTEM = (
    "You are a personal Nigerian stock market analyst delivering a structured daily briefing. "
    "Today's date and the user's portfolio/watchlist data are provided below.\n\n"
    "Respond using exactly these five sections:\n"
    "## 1. Global Cues\n"
    "— Brent crude price and direction (use latest knowledge; flag if uncertain)\n"
    "— USD/NGN exchange rate from the portfolio context and any notable CBN activity\n"
    "— Overnight US market performance (S&P 500, Dow) and what it signals for NGX today\n"
    "## 2. NGX Pre-Market Outlook\n"
    "— Expected market sentiment (Bullish / Bearish / Neutral) and why\n"
    "— Any corporate announcements, earnings, or dividend declarations worth noting\n"
    "— Sector(s) to watch and why\n"
    "## 3. Watchlist & Holdings Update\n"
    "For each ticker in the user's watchlist and top holdings: one-line update covering "
    "current price level, any recent news, and signal (use provided Signal scores where available). "
    "Flag any price levels or patterns worth acting on.\n"
    "## 4. ETF Check\n"
    "Brief update on VG 30 ETF and Vetiva Banking ETF performance relative to recent trend.\n"
    "## 5. Today's Trading Plan\n"
    "— One or two actionable ideas (entry levels, what to watch for)\n"
    "— Key risks to be aware of today\n\n"
    "Style: concise, factual, actionable. Lead with numbers. Flag anything requiring urgent attention. "
    "Use **bold** for tickers and key figures. No disclaimers. Under 700 words total."
)


def build_system_prompt(scope: str, is_follow_up: bool = False) -> str:
    if is_follow_up:
        return f"{_ANALYST_PERSONA}\n\n{_FOLLOWUP_INSTRUCTIONS}"
    if scope == "watchlist":
        sections = _WATCHLIST_SECTIONS
    elif scope == "combined":
        sections = _COMBINED_SECTIONS
    else:
        sections = _PORTFOLIO_SECTIONS
    return f"{_ANALYST_PERSONA}\n\n{sections}"


# ── Context builder ────────────────────────────────────────────────────────────


def _latest_price(db: Session, ticker: str) -> Optional[float]:
    """Return the most recent close price for a ticker from daily_price_history."""
    stmt = (
        select(DailyPriceHistory.close)
        .where(DailyPriceHistory.ticker == ticker.upper())
        .order_by(desc(DailyPriceHistory.date))
        .limit(1)
    )
    return db.scalar(stmt)


def _get_cached_fundamentals(ticker: str) -> dict:
    """
    Pull fundamental + momentum metrics from in-memory caches without triggering
    a scrape.  Returns an empty dict if the ticker hasn't been cached yet.
    """
    result: dict = {}

    # Valuation / quality from performance.py cache (confusingly named _overview_cache)
    ov = _perf_svc._overview_cache.get(ticker.upper())
    if ov:
        for k in ("pe_ratio", "roe", "debt_to_equity", "dividend_yield", "eps"):
            if ov.get(k) is not None:
                result[k] = ov[k]

    # Returns / technicals from overview.py cache (confusingly named _performance_cache)
    perf = _overview_svc._performance_cache.get(ticker.upper())
    if perf:
        for k in (
            "return_1m", "return_3m", "return_6m", "return_1y",
            "rsi_14", "piotroski_score", "altman_zscore",
            "price_to_book", "ev_ebitda", "fcf_yield", "roic",
            "sharpe_ratio", "volatility", "earnings_growth_yoy",
            # Bank-specific quality metrics
            "bank_score", "nim_pct", "npl_pct", "car_pct", "ldr_pct", "cir_pct",
            # Liquidity
            "adv_20_ngn", "position_liquidity_days",
        ):
            if perf.get(k) is not None:
                result[k] = perf[k]

    return result


def _get_cached_us_fundamentals(ticker: str) -> dict:
    """
    Pull US fundamentals from the Yahoo Finance in-memory cache (no new fetch).
    Returns an empty dict if not yet cached.
    """
    cached = _yahoo_svc._fund_cache.get(ticker.upper())
    if not cached:
        return {}

    data = cached.get("data") or {}
    result: dict = {}

    ov = data.get("overview") or {}
    for k in ("pe_ratio", "roe", "debt_to_equity", "dividend_yield", "eps",
              "gross_margin", "net_margin", "operating_margin", "revenue_growth",
              "earnings_growth", "roa", "price_to_book", "ev_ebitda", "forward_pe"):
        if ov.get(k) is not None:
            result[k] = ov[k]
    # Normalise Yahoo naming to match NGX convention
    if ov.get("earnings_growth") is not None:
        result["earnings_growth_yoy"] = ov["earnings_growth"]

    perf = data.get("performance") or {}
    for k in ("beta", "week_52_high", "week_52_low", "week_52_change",
              "return_1y", "ma_50", "ma_200"):
        if perf.get(k) is not None:
            result[k] = perf[k]

    return result


def build_context(db: Session, user_id: int, scope: str = "portfolio", depth: str = "quick") -> dict:
    """
    Assemble a compact portfolio snapshot from the DB.
    Returns a dict that can be serialised to JSON and hashed.

    Prices: live NGX prices from the in-memory cache (falls back to DB history);
            live US prices from Yahoo Finance (TTL ~2 min).
    Fundamentals: pulled from in-memory caches only — no scraping triggered here.
    """
    ngx_holdings = get_active_holdings(db, "ngx", user_id)
    us_holdings = get_active_holdings(db, "us", user_id)
    watchlist = get_watchlist(db, user_id)

    # ── Live NGX prices (in-memory cache, TTL ~15 min) ────────────────────────
    ngx_tickers_list = [h.ticker for h in ngx_holdings]
    ngx_live_map = (
        _ngx_prices_svc.get_prices_by_tickers(ngx_tickers_list)
        if ngx_tickers_list else {}
    )

    ngx_rows = []
    ngx_total_cost = 0.0
    ngx_total_equity = 0.0

    for h in ngx_holdings:
        live = ngx_live_map.get(h.ticker)
        # Prefer live price; fall back to most-recent DB close
        price = (live.price if live else None) or _latest_price(db, h.ticker)
        cost = (h.shares or 0) * (h.avg_cost or 0)
        equity = (h.shares or 0) * price if price else cost
        ngx_total_cost += cost
        ngx_total_equity += equity

        row: dict = {
            "ticker": h.ticker,
            "name": h.name,
            "sector": h.sector or "Unknown",
            "shares": round(h.shares or 0, 2),
            "avg_cost": round(h.avg_cost or 0, 2),
            "current_price": round(price, 2) if price else None,
            "equity_ngn": round(equity, 2),
            "realized_pl_ngn": round(h.realized_pl or 0, 2),
        }
        if live and live.change_pct is not None:
            row["change_pct_today"] = round(live.change_pct, 2)
        if live and live.change is not None:
            row["change_today"] = round(live.change, 2)

        # Non-blocking fundamentals + signal from cache
        fundamentals = _get_cached_fundamentals(h.ticker)
        if fundamentals:
            row["fundamentals"] = fundamentals
            signal = _compute_signal(h.sector or "", fundamentals)
            if signal:
                row["signal"] = signal

        ngx_rows.append(row)

    us_rows = []
    us_total_cost = 0.0
    us_total_equity = 0.0

    # Batch-fetch live US prices from Yahoo (in-memory cache, TTL ~2 min)
    us_tickers = [h.ticker for h in us_holdings]
    us_price_map = _yahoo_svc.get_prices(us_tickers) if us_tickers else {}

    for h in us_holdings:
        yp = us_price_map.get(h.ticker)
        price = yp.price if yp else None
        cost = (h.shares or 0) * (h.avg_cost or 0)
        equity = (h.shares or 0) * price if price else cost
        us_total_cost += cost
        us_total_equity += equity

        row = {
            "ticker": h.ticker,
            "name": h.name,
            "sector": h.sector or "Unknown",
            "shares": round(h.shares or 0, 4),
            "avg_cost": round(h.avg_cost or 0, 2),
            "current_price": round(price, 2) if price else None,
            "equity_usd": round(equity, 2),
            "realized_pl_usd": round(h.realized_pl or 0, 2),
        }
        if yp and yp.change_pct is not None:
            row["change_pct_today"] = round(yp.change_pct, 2)
        if yp and yp.change is not None:
            row["change_today"] = round(yp.change, 2)

        us_fund = _get_cached_us_fundamentals(h.ticker)
        if us_fund:
            row["fundamentals"] = us_fund
            signal = _compute_signal(h.sector or "", us_fund)
            if signal:
                row["signal"] = signal

        us_rows.append(row)

    # Token-efficiency: if > 15 holdings, keep top 10 by equity + worst performer
    def _trim(rows: list[dict], equity_key: str) -> list[dict]:
        if len(rows) <= 15:
            return rows
        by_equity = sorted(rows, key=lambda r: r[equity_key] or 0, reverse=True)
        top10 = by_equity[:10]
        kept = {r["ticker"] for r in top10}
        # add worst performer (lowest return)
        rest = [r for r in rows if r["ticker"] not in kept]
        if rest:
            worst = min(
                rest,
                key=lambda r: (
                    (r["current_price"] or r["avg_cost"]) / r["avg_cost"] - 1
                    if r["avg_cost"]
                    else 0
                ),
            )
            top10.append(worst)
        return top10

    ngx_rows = _trim(ngx_rows, "equity_ngn")
    us_rows = _trim(us_rows, "equity_usd")

    # Watchlist — enrich with live price so Claude knows where each sits vs entry
    wl_ngx_tickers = [w.ticker for w in watchlist if w.market.lower() == "ngx"]
    wl_us_tickers  = [w.ticker for w in watchlist if w.market.lower() == "us"]
    wl_ngx_prices = _ngx_prices_svc.get_prices_by_tickers(wl_ngx_tickers) if wl_ngx_tickers else {}
    wl_us_prices  = _yahoo_svc.get_prices(wl_us_tickers) if wl_us_tickers else {}

    wl_rows = []
    for w in watchlist:
        wl_row: dict = {
            "ticker": w.ticker,
            "market": w.market,
            "added_price": round(w.added_price, 2) if w.added_price else None,
        }
        if w.market.lower() == "ngx":
            lp = wl_ngx_prices.get(w.ticker)
            if lp:
                wl_row["current_price"] = round(lp.price, 2)
                if lp.change_pct is not None:
                    wl_row["change_pct_today"] = round(lp.change_pct, 2)
                if w.added_price and lp.price:
                    wl_row["vs_entry_pct"] = round((lp.price / w.added_price - 1) * 100, 1)
        else:
            yp = wl_us_prices.get(w.ticker)
            if yp:
                wl_row["current_price"] = round(yp.price, 2)
                if yp.change_pct is not None:
                    wl_row["change_pct_today"] = round(yp.change_pct, 2)
                if w.added_price and yp.price:
                    wl_row["vs_entry_pct"] = round((yp.price / w.added_price - 1) * 100, 1)

        # Signal enrichment (cache-only, no scrape)
        if w.market.lower() == "ngx":
            wl_fund = _get_cached_fundamentals(w.ticker)
        else:
            wl_fund = _get_cached_us_fundamentals(w.ticker)
        if wl_fund:
            sector = getattr(w, "sector", None) or ""
            sig = _compute_signal(sector, wl_fund)
            if sig:
                wl_row["signal"] = sig

        wl_rows.append(wl_row)

    ngx_gain_pct = (
        round((ngx_total_equity / ngx_total_cost - 1) * 100, 2)
        if ngx_total_cost > 0
        else 0.0
    )
    us_gain_pct = (
        round((us_total_equity / us_total_cost - 1) * 100, 2)
        if us_total_cost > 0
        else 0.0
    )

    # Dividend income from cache (non-blocking — empty if not yet fetched)
    ngx_tickers = [h.ticker for h in ngx_holdings]
    div_map = _dividends_svc.get_dividends(ngx_tickers)
    annual_div_income = 0.0
    for h in ngx_holdings:
        div = div_map.get(h.ticker)
        if div and div.cash_amount:
            annual_div_income += (h.shares or 0) * div.cash_amount

    # Earnings watch: tickers with no P/E in cached overview (cache-only, no scrape)
    no_pe_tickers: list[str] = []
    for h in ngx_holdings:
        ov = _perf_svc._overview_cache.get(h.ticker.upper())
        if ov is not None and not ov.get("pe_ratio"):
            no_pe_tickers.append(h.ticker)

    # Market direction: NGX portfolio return over last 30 days from snapshots
    ngx_market_direction: Optional[str] = None
    try:
        from sqlalchemy import desc as _desc
        snaps = (
            db.execute(
                select(PortfolioSnapshot)
                .where(PortfolioSnapshot.user_id == user_id)
                .order_by(_desc(PortfolioSnapshot.ts))
                .limit(35)
            )
            .scalars()
            .all()
        )
        if len(snaps) >= 2:
            latest_eq = snaps[0].ngx_equity_ngn or 0
            oldest_eq = snaps[-1].ngx_equity_ngn or 0
            if oldest_eq > 0:
                chg = (latest_eq / oldest_eq - 1) * 100
                ngx_market_direction = f"{chg:+.1f}% over last ~30 days (portfolio NGX equity)"
    except Exception:
        pass

    # Cash balances
    cash = get_cash_balance(db, user_id)

    # Closed positions (fully exited) — last 10, newest first
    closed_positions = get_closed_positions(db, user_id)
    closed_rows = [
        {
            "ticker": c.ticker,
            "name": c.name,
            "market": c.market,
            "realized_pl": round(c.realized_pl, 2),
            "closed_at": c.closed_at.strftime("%Y-%m-%d"),
        }
        for c in closed_positions[:10]
    ]

    # Realized P&L totals
    ngx_realized_pl = sum(
        (h.realized_pl or 0) for h in ngx_holdings
    ) + sum(
        c["realized_pl"] for c in closed_rows if c["market"] == "ngx"
    )
    us_realized_pl = sum(
        (h.realized_pl or 0) for h in us_holdings
    ) + sum(
        c["realized_pl"] for c in closed_rows if c["market"] == "us"
    )

    # Recent sale events — last 15, newest first
    sale_events = get_sale_events(db, user_id)
    trade_rows = []
    for e in sale_events[:15]:
        row: dict = {
            "date": e.sold_at.strftime("%Y-%m-%d"),
            "ticker": e.ticker,
            "market": e.market,
            "type": "full_close" if e.fully_closed else "partial_sell",
            "shares_sold": round(e.shares_sold, 4),
            "sale_price": round(e.sale_price, 4),
            "realized_pl": round(e.realized_pl, 2),
        }
        if e.commission and e.commission > 0:
            row["commission"] = round(e.commission, 2)
        if e.proceeds and e.proceeds > 0:
            row["net_proceeds"] = round(e.proceeds, 2)
        trade_rows.append(row)

    # Prior analyses for conversation continuity (same scope, newest-first)
    prior_rows = (
        db.execute(
            select(AnalysisHistory)
            .where(
                AnalysisHistory.user_id == user_id,
                AnalysisHistory.scope == scope,
            )
            .order_by(desc(AnalysisHistory.created_at))
            .limit(2)
        )
        .scalars()
        .all()
    )
    prior_analyses: list[dict] = []
    for i, h in enumerate(prior_rows):
        entry: dict = {
            "date": h.created_at.strftime("%Y-%m-%d"),
            "depth": h.depth,
        }
        if i == 0:
            # Most recent: include truncated response for continuity
            entry["response"] = (h.full_response or "")[:600]
        else:
            entry["summary"] = h.summary or ""
        prior_analyses.append(entry)

    ctx = {
        "date": date.today().isoformat(),
        "ngx": ngx_rows,
        "us": us_rows,
        "watchlist": wl_rows,
        "closed_positions": closed_rows,
        "recent_trades": trade_rows,
        "kpis": {
            "ngx_total_equity_ngn": round(ngx_total_equity, 2),
            "ngx_total_cost_ngn": round(ngx_total_cost, 2),
            "ngx_gain_pct": ngx_gain_pct,
            "ngx_realized_pl_ngn": round(ngx_realized_pl, 2),
            "us_total_equity_usd": round(us_total_equity, 2),
            "us_total_cost_usd": round(us_total_cost, 2),
            "us_gain_pct": us_gain_pct,
            "us_realized_pl_usd": round(us_realized_pl, 2),
            "cash_balance_ngn": round(cash.get("ngn") or 0.0, 2),
            "cash_balance_usd": round(cash.get("usd") or 0.0, 2),
            "ngx_positions": len(ngx_holdings),
            "us_positions": len(us_holdings),
            "watchlist_count": len(wl_rows),
            "dividend_income_ngn": round(annual_div_income, 2),
            "no_pe_tickers": no_pe_tickers,
            "ngx_market_direction": ngx_market_direction,
        },
        "prior_analyses": prior_analyses,
    }

    # Fetch news for top holdings — deep (Detailed) and default (Daily Briefing) modes
    if depth in ("deep", "default"):
        news: dict = {}
        if scope in ("portfolio", "combined"):
            ngx_news = _news_svc.fetch_news_for_holdings(ctx["ngx"], "ngx", top_n=3)
            us_news  = _news_svc.fetch_news_for_holdings(ctx["us"],  "us",  top_n=2)
            news.update(ngx_news)
            news.update(us_news)
        # Also fetch news for watchlist items in default mode
        if depth == "default" and ctx.get("watchlist"):
            for w in ctx["watchlist"][:5]:
                ticker = w["ticker"]
                if ticker not in news:
                    market = w.get("market", "ngx")
                    items = _news_svc.fetch_news(ticker, w.get("name", ticker), market, n=2)
                    if items:
                        news[ticker] = items
        ctx["news"] = {t: h for t, h in news.items() if h}

    return ctx


def compute_context_hash(ctx: dict) -> str:
    payload = json.dumps(ctx, sort_keys=True, default=str)
    return hashlib.sha256(payload.encode()).hexdigest()[:16]


# ── Prompt builder ────────────────────────────────────────────────────────────


def _format_holdings(rows: list[dict], currency: str, equity_key: str, pl_key: str) -> str:
    if not rows:
        return "  (none)\n"
    lines = []
    for r in rows:
        ret = ""
        if r.get("current_price") and r.get("avg_cost"):
            pct = (r["current_price"] / r["avg_cost"] - 1) * 100
            ret = f" ({pct:+.1f}%)"
        realized_pl = r.get(pl_key, 0) or 0
        pl_str = f"  realized_pl={currency}{realized_pl:,.0f}" if realized_pl != 0 else ""

        # Today's price move
        today_str = ""
        if r.get("change_pct_today") is not None:
            chg = r["change_pct_today"]
            today_str = f"  today: {chg:+.2f}%"
            if r.get("change_today") is not None:
                today_str += f" ({currency}{r['change_today']:+.2f})"

        lines.append(
            f"  {r['ticker']:<12} {r['sector']:<18} "
            f"{r['shares']} shares @ {currency}{r['avg_cost']:.2f}"
            f" → {currency}{r['current_price'] or 'N/A'}{ret}"
            f"  [{currency}{r[equity_key]:,.0f}]{pl_str}{today_str}"
        )

        # Fundamentals line (only when cached data exists)
        fund = r.get("fundamentals")
        if fund:
            parts = []
            if fund.get("pe_ratio") is not None:
                parts.append(f"P/E {fund['pe_ratio']:.1f}×")
            if fund.get("price_to_book") is not None:
                parts.append(f"P/B {fund['price_to_book']:.2f}×")
            if fund.get("roe") is not None:
                parts.append(f"ROE {fund['roe']:.1f}%")
            if fund.get("roic") is not None:
                parts.append(f"ROIC {fund['roic']:.1f}%")
            if fund.get("piotroski_score") is not None:
                parts.append(f"F-Score {fund['piotroski_score']:.0f}/9")
            if fund.get("altman_zscore") is not None:
                parts.append(f"Z {fund['altman_zscore']:.1f}")
            if fund.get("return_1m") is not None:
                parts.append(f"1M {fund['return_1m']:+.1f}%")
            if fund.get("return_3m") is not None:
                parts.append(f"3M {fund['return_3m']:+.1f}%")
            if fund.get("return_1y") is not None:
                parts.append(f"1Y {fund['return_1y']:+.1f}%")
            if fund.get("rsi_14") is not None:
                parts.append(f"RSI {fund['rsi_14']:.0f}")
            if parts:
                lines.append(f"    {'  '.join(parts)}")

        sig = r.get("signal")
        if sig:
            _flag_labels = {
                "RSI_DATA_ERROR": "RSI data error — excluded from score",
                "ILLIQUID": "Low ADV — signal suppressed",
            }
            readable_flags: list[str] = [_flag_labels.get(f) or f for f in (sig.get("flags") or [])]
            flag_str = f"  ⚠ {', '.join(readable_flags)}" if readable_flags else ""
            lines.append(f"    Signal: {sig['label']} ({sig['score']:+.1f}){flag_str}")

    return "\n".join(lines) + "\n"


def build_user_prompt(ctx: dict, scope: str) -> str:
    k = ctx["kpis"]
    lines = []

    # Inject prior analyses for conversation continuity
    prior = ctx.get("prior_analyses", [])
    if prior:
        lines.append("## Prior Analysis Context\n")
        for i, p in enumerate(prior):
            label = "Most recent" if i == 0 else f"{i + 1} analyses ago"
            lines.append(f"**{label} ({p['date']} · {p['depth']}):**")
            if "response" in p:
                lines.append(p["response"])
            else:
                lines.append(f"Summary: {p.get('summary', '')}")
            lines.append("")
        lines.append("---\n")

    lines.append(f"Portfolio snapshot: {ctx['date']}\n")

    if scope in ("portfolio", "combined"):
        lines.append("NGX Holdings (Nigerian Exchange, NGN):")
        lines.append(_format_holdings(ctx["ngx"], "₦", "equity_ngn", "realized_pl_ngn"))
        lines.append(
            f"  NGX Total: ₦{k['ngx_total_equity_ngn']:,.0f}  "
            f"(cost ₦{k['ngx_total_cost_ngn']:,.0f}, {k['ngx_gain_pct']:+.1f}%)\n"
        )
        lines.append("US Holdings (USD):")
        lines.append(_format_holdings(ctx["us"], "$", "equity_usd", "realized_pl_usd"))
        lines.append(
            f"  US Total: ${k['us_total_equity_usd']:,.0f}  "
            f"(cost ${k['us_total_cost_usd']:,.0f}, {k['us_gain_pct']:+.1f}%)\n"
        )

    if scope in ("watchlist", "combined") and ctx["watchlist"]:
        lines.append("Watchlist:")
        for w in ctx["watchlist"]:
            parts = [f"  {w['ticker']} [{w['market']}]"]
            if w.get("current_price"):
                cur = w["current_price"]
                parts.append(f"@ {cur}")
                if w.get("change_pct_today") is not None:
                    parts.append(f"({w['change_pct_today']:+.2f}% today)")
            if w.get("added_price"):
                parts.append(f"added @ {w['added_price']}")
                if w.get("vs_entry_pct") is not None:
                    parts.append(f"[{w['vs_entry_pct']:+.1f}% vs entry]")
            lines.append("  ".join(parts))
            sig = w.get("signal")
            if sig:
                _flag_labels = {
                    "RSI_DATA_ERROR": "RSI data error — excluded from score",
                    "ILLIQUID": "Low ADV — signal suppressed",
                }
                readable_flags: list[str] = [_flag_labels.get(f) or f for f in (sig.get("flags") or [])]
                flag_str = f"  ⚠ {', '.join(readable_flags)}" if readable_flags else ""
                lines.append(f"    Signal: {sig['label']} ({sig['score']:+.1f}){flag_str}")
        lines.append("")

    div_income = k.get("dividend_income_ngn", 0)
    if div_income and div_income > 0 and scope in ("portfolio", "combined"):
        lines.append(f"Projected annual dividend income: ₦{div_income:,.0f}")
        lines.append("")

    no_pe = k.get("no_pe_tickers", [])
    if no_pe and scope in ("portfolio", "combined"):
        lines.append(f"⚠ Earnings not filed (no P/E available): {', '.join(no_pe)}")
        lines.append("")

    mkt = k.get("ngx_market_direction")
    if mkt:
        lines.append(f"NGX portfolio direction: {mkt}")
        lines.append("")

    # Cash balances
    cash_ngn = k.get("cash_balance_ngn", 0) or 0
    cash_usd = k.get("cash_balance_usd", 0) or 0
    lines.append(f"Cash available: ₦{cash_ngn:,.2f} NGN | ${cash_usd:,.2f} USD")
    lines.append("")

    # Realized P&L totals
    ngx_rpl = k.get("ngx_realized_pl_ngn", 0) or 0
    us_rpl = k.get("us_realized_pl_usd", 0) or 0
    lines.append(f"Total realized P&L: NGX ₦{ngx_rpl:,.2f} | US ${us_rpl:,.2f}")
    lines.append("")

    # Recent trades
    trades = ctx.get("recent_trades", [])
    if trades:
        lines.append("Recent sales (newest first):")
        for t in trades:
            if t.get("shares_sold", 0) == 0 and t.get("sale_price", 0) == 0:
                # Backfilled row — skip unknowns
                lines.append(
                    f"  {t['date']}  {t['ticker']:<8} [{t['market']}]  {t['type']}  "
                    f"P&L: ₦{t['realized_pl']:,.2f}"
                )
            else:
                commission_str = f"  commission={t['commission']:,.2f}" if t.get("commission") else ""
                proceeds_str = f"  proceeds={t['net_proceeds']:,.2f}" if t.get("net_proceeds") else ""
                lines.append(
                    f"  {t['date']}  {t['ticker']:<8} [{t['market']}]  {t['type']}  "
                    f"{t['shares_sold']} shares @ {t['sale_price']:.4f}"
                    f"{commission_str}{proceeds_str}  P&L: {t['realized_pl']:+,.2f}"
                )
        lines.append("")

    # Closed positions
    closed = ctx.get("closed_positions", [])
    if closed:
        lines.append("Fully closed positions (last 10):")
        for c in closed:
            lines.append(
                f"  {c['closed_at']}  {c['ticker']:<8} [{c['market']}]  "
                f"realized P&L: {c['realized_pl']:+,.2f}"
            )
        lines.append("")

    # News headlines (deep analyses only)
    news = ctx.get("news", {})
    if news:
        lines.append("## Recent News Headlines\n")
        for ticker, headlines in news.items():
            if not headlines:
                continue
            lines.append(f"**{ticker}:**")
            for h in headlines:
                age = f" ({h['age']})" if h.get("age") else ""
                src = f" — {h['publisher']}" if h.get("publisher") else ""
                lines.append(f"  • {h['title']}{src}{age}")
        lines.append("")

    lines.append("Provide your analysis now.")
    return "\n".join(lines)


# ── Streaming ─────────────────────────────────────────────────────────────────


def stream_analysis_sse(
    user_id: int,
    scope: str,
    depth: str,
    ctx: dict,
    initial_message: str | None = None,
    follow_up: str | None = None,
    prior_response: str | None = None,
    parent_id: int | None = None,
) -> Generator[str, None, None]:
    """
    Generator that yields SSE-formatted strings.
    Saves the completed analysis to DB when done.
    Must be consumed in a thread (not async) — FastAPI's StreamingResponse handles this.

    When follow_up + prior_response are provided, builds a multi-turn conversation:
      user: original portfolio prompt
      assistant: prior analysis response
      user: follow-up question

    Prompt caching: system prompt and portfolio context are marked ephemeral so
    repeated calls within the 5-minute cache window pay only output tokens.

    Extended thinking: deep analyses use a thinking budget so the model reasons
    through valuation and risk trade-offs before writing the response.
    """
    if not settings.ANTHROPIC_API_KEY:
        yield f"data: {json.dumps({'error': 'ANTHROPIC_API_KEY is not configured on the server.'})}\n\n"
        return

    from anthropic import Anthropic
    from anthropic.types import MessageParam, TextBlockParam
    from app.db.engine import SessionLocal
    from app.db.crud import save_analysis

    model = MODEL_QUICK if depth == "quick" else MODEL_DEEP  # default + deep both use Sonnet
    is_deep = depth == "deep"
    is_default = depth == "default"
    prompt = build_user_prompt(ctx, scope)
    if is_default:
        prompt += "\n\nGive me today's NGX Daily Market Analysis briefing now."
    elif initial_message:
        prompt += f"\n\n---\nSpecific focus for this analysis: {initial_message}"
    ctx_hash = compute_context_hash(ctx)

    # ── Prompt caching ────────────────────────────────────────────────────────
    # System and portfolio context are the largest, most-repeated inputs.
    # cache_control: ephemeral pins them in the 5-min cache window so each
    # follow-up or re-run only charges for the new tokens.
    system_text = _DAILY_BRIEFING_SYSTEM if is_default else build_system_prompt(scope, is_follow_up=bool(follow_up))
    system_content: list[TextBlockParam] = [
        TextBlockParam(
            type="text",
            text=system_text,
            cache_control={"type": "ephemeral"},
        )
    ]
    portfolio_block = TextBlockParam(
        type="text",
        text=prompt,
        cache_control={"type": "ephemeral"},
    )

    if follow_up and prior_response:
        messages: list[MessageParam] = [
            {"role": "user", "content": [portfolio_block]},
            # Truncate prior response so multi-turn threads don't balloon input tokens
            {"role": "assistant", "content": prior_response[:2000]},
            {"role": "user", "content": follow_up},
        ]
    else:
        messages = [{"role": "user", "content": [portfolio_block]}]

    client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    full_chunks: list[str] = []
    tokens_used = 0

    # ── Token budgets ─────────────────────────────────────────────────────────
    # deep:    thinking budget 4k + output 2k = 6048 max_tokens
    # default: Sonnet, no thinking, 1500 output
    # quick:   Haiku, 1000 output
    max_tokens = 6048 if is_deep else (1500 if is_default else 1000)
    stream_kwargs: dict = {
        "model": model,
        "max_tokens": max_tokens,
        "system": system_content,
        "messages": messages,
    }
    if is_deep:
        stream_kwargs["thinking"] = {"type": "enabled", "budget_tokens": 4000}

    # Immediate feedback — client shows thinking animation before first token
    yield f"data: {json.dumps({'status': 'thinking'})}\n\n"

    try:
        with client.messages.stream(**stream_kwargs) as stream:
            # text_stream automatically skips thinking blocks — only text deltas
            for text in stream.text_stream:
                full_chunks.append(text)
                yield f"data: {json.dumps({'text': text})}\n\n"

            final = stream.get_final_message()
            tokens_used = (
                final.usage.input_tokens + final.usage.output_tokens
            )

        full_response = "".join(full_chunks)
        # Summary = first substantive line (skip headings), markdown stripped
        _md_strip = re.compile(r"^#+\s*|^\s*[-*>]\s*|\*{1,2}|_{1,2}|`")
        summary = ""
        for _line in full_response.splitlines():
            _line = _line.strip()
            if not _line:
                continue
            # Skip pure heading lines (## 1. Portfolio Health Score etc.)
            if re.match(r"^#+\s", _line):
                continue
            summary = _md_strip.sub("", _line).strip()[:200]
            if summary:
                break
        if not summary:
            summary = _md_strip.sub("", full_response[:200]).strip()

        with SessionLocal() as db:
            record = save_analysis(
                db,
                user_id=user_id,
                scope=scope,
                depth=depth,
                model_used=model,
                summary=summary,
                full_response=full_response,
                context_hash=ctx_hash,
                tokens_used=tokens_used,
                parent_id=parent_id,
                follow_up_question=follow_up,
            )
            record_id = record.id

        yield f"data: {json.dumps({'done': True, 'id': record_id, 'tokens': tokens_used})}\n\n"

    except Exception as exc:
        log.exception("Analysis stream error: %s", exc)
        yield f"data: {json.dumps({'error': str(exc)})}\n\n"


# ── Trade Journal ─────────────────────────────────────────────────────────────

_TRADE_JOURNAL_SYSTEM = (
    "You are a trading coach and behavioural finance analyst. "
    "Your job is to analyse a trader's transaction history and surface honest, "
    "actionable insights about their trading behaviour — not their portfolio positions. "
    "Be direct and specific. Use Markdown: ## for sections, **bold** for tickers and figures, "
    "bullet lists for observations. No disclaimers. Under 500 words.\n\n"
    "Terse style: no filler ('it appears', 'it is worth noting', 'overall'). "
    "Fragments ok. Lead with the number, then the meaning.\n\n"
    "Focus exclusively on:\n"
    "- Win/loss rate and average gain vs average loss (reward-to-risk)\n"
    "- Holding period patterns (are they trading too frequently?)\n"
    "- Commission drag (total commissions as % of gross proceeds)\n"
    "- Behavioural biases: selling winners early, averaging down, panic selling\n"
    "- Position sizing consistency\n"
    "- Best and worst individual trades\n"
    "- One concrete rule the trader should adopt to improve results\n\n"
    "Structure with exactly these sections:\n"
    "## Trade Journal Summary\n"
    "## Win Rate & Reward-to-Risk\n"
    "## Behavioural Patterns\n"
    "## Commission Drag\n"
    "## Best & Worst Trades\n"
    "## One Rule to Adopt\n"
    "> Stated as a concrete, measurable rule."
)


def _build_trade_journal_prompt(db, user_id: int) -> str:
    """Build a compact trade history prompt for behavioural analysis."""
    from app.db.crud import get_sale_events, get_cash_balance

    sale_events = get_sale_events(db, user_id)
    cash = get_cash_balance(db, user_id)

    if not sale_events:
        return "No trade history found for this account."

    lines = [f"Trade history as of {date.today().isoformat()}:\n"]
    total_commission = 0.0
    total_proceeds = 0.0

    for e in sale_events:
        row = (
            f"  {e.sold_at.strftime('%Y-%m-%d')}  {e.ticker:<8} [{e.market}]  "
            f"{'CLOSE' if e.fully_closed else 'PARTIAL'}  "
            f"{round(e.shares_sold or 0, 4)} shares @ {round(e.sale_price or 0, 4)}"
        )
        if e.commission and e.commission > 0:
            row += f"  commission={round(e.commission, 2)}"
            total_commission += e.commission
        if e.proceeds and e.proceeds > 0:
            row += f"  net_proceeds={round(e.proceeds, 2)}"
            total_proceeds += e.proceeds
        row += f"  P&L={round(e.realized_pl or 0, 2):+,.2f}"
        lines.append(row)

    lines.append(
        f"\nSummary: {len(sale_events)} sale events | "
        f"total commissions={total_commission:,.2f} | "
        f"total proceeds={total_proceeds:,.2f}"
    )
    cash_ngn = (cash.get("ngn") or 0.0)
    cash_usd = (cash.get("usd") or 0.0)
    lines.append(f"Current cash: ₦{cash_ngn:,.2f} NGN | ${cash_usd:,.2f} USD")
    lines.append("\nProvide your trade journal analysis now.")
    return "\n".join(lines)


def stream_trade_journal_sse(user_id: int) -> Generator[str, None, None]:
    """
    Stream a behavioural trade journal analysis.
    Uses Haiku for speed — this is pattern recognition, not deep reasoning.
    Caches the system prompt; trade history is user-specific so not cached.
    """
    if not settings.ANTHROPIC_API_KEY:
        yield f"data: {json.dumps({'error': 'ANTHROPIC_API_KEY is not configured on the server.'})}\n\n"
        return

    from anthropic import Anthropic
    from anthropic.types import TextBlockParam
    from app.db.engine import SessionLocal

    system_content: list[TextBlockParam] = [
        TextBlockParam(
            type="text",
            text=_TRADE_JOURNAL_SYSTEM,
            cache_control={"type": "ephemeral"},
        )
    ]

    with SessionLocal() as db:
        prompt = _build_trade_journal_prompt(db, user_id)

    if prompt == "No trade history found for this account.":
        yield f"data: {json.dumps({'text': 'No trade history found — make some trades first.'})}\n\n"
        yield f"data: {json.dumps({'done': True})}\n\n"
        return

    client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    full_chunks: list[str] = []

    try:
        with client.messages.stream(
            model=MODEL_QUICK,
            max_tokens=1500,
            system=system_content,
            messages=[{"role": "user", "content": prompt}],
        ) as stream:
            for text in stream.text_stream:
                full_chunks.append(text)
                yield f"data: {json.dumps({'text': text})}\n\n"

            final = stream.get_final_message()
            tokens_used = final.usage.input_tokens + final.usage.output_tokens

        full_response = "".join(full_chunks)
        summary = full_response[:200].strip()

        from app.db.crud import save_analysis
        with SessionLocal() as db:
            record = save_analysis(
                db,
                user_id=user_id,
                scope="journal",
                depth="quick",
                model_used=MODEL_QUICK,
                summary=summary,
                full_response=full_response,
                context_hash="",
                tokens_used=tokens_used,
            )
            record_id = record.id

        yield f"data: {json.dumps({'done': True, 'id': record_id, 'tokens': tokens_used})}\n\n"

    except Exception as exc:
        log.exception("Trade journal stream error: %s", exc)
        yield f"data: {json.dumps({'error': str(exc)})}\n\n"
