"""
Signal Score Service
====================
Computes equitee's proprietary -10 to +10 Signal Score for a ticker.

Dimensions and weights:
  Quality    30%  — Piotroski F-Score, Altman Z, ROE, ROIC, earnings growth
  Momentum   25%  — Returns 1M/3M/6M/1Y, RSI, 52W range, MA crossover
  Valuation  25%  — P/E, P/B, FCF yield, EV/EBITDA (cheap = positive)
  Dividend   10%  — Yield, payout coverage, dividend growth
  Risk       10%  — Altman Z, D/E, max drawdown, volatility, Sharpe

Score labels:
  > +6   Strong Buy
  +3–+6  Buy
  +1–+3  Accumulate
  -1–+1  Hold
  -3–-1  Reduce
  < -3   Sell

Currently supports NGX tickers (rich fundamental data available).
US tickers fall back to momentum-only scoring.
"""

from __future__ import annotations

import json
import logging
import time
from typing import Optional

from app.config import settings

log = logging.getLogger(__name__)

_MODEL = "claude-haiku-4-5-20251001"

# In-memory cache — signal scores are stable over ~1 hour
_cache: dict[str, dict] = {}
_cache_ts: dict[str, float] = {}
_CACHE_TTL = 3600  # 1 hour

# ── Tool definition ────────────────────────────────────────────────────────────

_SCORE_TOOL = {
    "name": "submit_signal_score",
    "description": (
        "Submit the computed Signal Score. "
        "Score each dimension from -10 (worst) to +10 (best). "
        "Use 0 for any dimension with insufficient data and note it in rationale. "
        "Composite = Quality×0.30 + Momentum×0.25 + Valuation×0.25 + Dividend×0.10 + Risk×0.10."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "quality": {
                "type": "number",
                "description": (
                    "-10 to +10. Key inputs: Piotroski F-Score (>7 = strong), "
                    "Altman Z (>3 = safe), ROE (>15% = good), ROIC (>12% = good), "
                    "earnings/revenue growth YoY."
                ),
            },
            "momentum": {
                "type": "number",
                "description": (
                    "-10 to +10. Key inputs: return ladder 1M/3M/6M/1Y "
                    "(consistent positive trend = positive score), "
                    "RSI-14 (30–70 = neutral, >80 = overbought penalty), "
                    "52W range position (near high = positive), "
                    "MA50 > MA200 = positive (golden cross)."
                ),
            },
            "valuation": {
                "type": "number",
                "description": (
                    "-10 to +10. Cheap = positive. "
                    "NGX median P/E ~12×: below = cheap. P/B < 1 = very cheap. "
                    "FCF yield > 5% = good. EV/EBITDA < 8 = cheap. "
                    "If no valuation data, score 0."
                ),
            },
            "dividend": {
                "type": "number",
                "description": (
                    "-10 to +10. Yield > 5% = positive, payout ratio < 70% = sustainable, "
                    "dividend growth = positive. Score 0 if no dividends."
                ),
            },
            "risk": {
                "type": "number",
                "description": (
                    "-10 to +10. Safer = more positive. "
                    "Altman Z > 3 = safe (+), D/E < 0.5 = safe (+), "
                    "max drawdown < 20% = low risk (+), annualised volatility < 25% = low (+), "
                    "Sharpe > 0.5 = good (+). High debt, high drawdown, negative Sharpe = negative."
                ),
            },
            "composite": {
                "type": "number",
                "description": "Weighted composite: Quality×0.30 + Momentum×0.25 + Valuation×0.25 + Dividend×0.10 + Risk×0.10. Round to 1 decimal.",
            },
            "label": {
                "type": "string",
                "enum": ["Strong Buy", "Buy", "Accumulate", "Hold", "Reduce", "Sell"],
                "description": ">6=Strong Buy, 3–6=Buy, 1–3=Accumulate, -1 to 1=Hold, -3 to -1=Reduce, <-3=Sell",
            },
            "rationale": {
                "type": "string",
                "description": "2–3 sentences citing the key metric drivers. Be specific (include actual numbers).",
            },
            "data_quality": {
                "type": "string",
                "enum": ["full", "partial", "minimal"],
                "description": "full = most metrics present; partial = some missing; minimal = price/returns only.",
            },
        },
        "required": ["quality", "momentum", "valuation", "dividend", "risk", "composite", "label", "rationale", "data_quality"],
    },
}

_SYSTEM_PROMPT = (
    "You are a quantitative analyst computing Signal Scores for equity markets. "
    "You will receive raw financial metrics for a stock. "
    "Compute dimension scores strictly from the provided data — do not hallucinate metrics. "
    "If a metric is missing, treat it as neutral (0) for that dimension. "
    "Call submit_signal_score exactly once with your scores."
)


# ── Metric gathering ───────────────────────────────────────────────────────────


def _gather_ngx_metrics(ticker: str) -> dict:
    """Collect all available fundamental + technical metrics for an NGX ticker.

    performance.py  → get_overview()      : fundamentals (P/E, ROE, D/E, etc.)
    overview.py     → get_performance()   : technicals + returns (RSI, MA, Sharpe, etc.)
    """
    from app.services import overview as _overview_svc
    from app.services import performance as _fundamentals_svc
    from app.services import dividends as _div_svc

    metrics: dict = {"ticker": ticker.upper(), "market": "ngx"}

    # Technicals, returns, Piotroski, Altman Z, growth metrics
    perf = _overview_svc.get_performance(ticker)
    if perf:
        for key in (
            "pe_ratio", "price_to_book", "ev_ebitda", "fcf_yield",
            "roe", "roic", "roa", "net_margin", "operating_margin",
            "piotroski_score", "altman_zscore",
            "debt_to_equity", "current_ratio", "quick_ratio",
            "revenue_growth_yoy", "earnings_growth_yoy",
            "return_1m", "return_3m", "return_6m", "return_1y",
            "week_52_high", "week_52_low",
            "rsi_14", "ma_50", "ma_200", "golden_cross",
            "volatility", "sharpe_ratio", "max_drawdown",
            "beta", "week_52_change",
        ):
            val = perf.get(key)
            if val is not None:
                metrics[key] = val

    # Fundamentals fallback for any fields not populated above
    overview = _fundamentals_svc.get_overview(ticker)
    if overview:
        for key in ("pe_ratio", "price_to_book", "roe", "debt_to_equity", "dividend_yield"):
            if key not in metrics and overview.get(key) is not None:
                metrics[key] = overview[key]

    # Dividend data
    div_map = _div_svc.get_dividends([ticker])
    div = div_map.get(ticker.upper())
    if div and div.cash_amount:
        metrics["dividend_cash_amount"] = div.cash_amount
    if div and div.ex_dividend_date:
        metrics["dividend_ex_date"] = div.ex_dividend_date

    return metrics


def _gather_us_metrics(ticker: str) -> dict:
    """Collect available metrics for a US ticker (price + momentum only)."""
    from app.services import yahoo as _yahoo_svc

    metrics: dict = {"ticker": ticker.upper(), "market": "us"}
    price_map = _yahoo_svc.get_prices([ticker])
    yp = price_map.get(ticker.upper())
    if yp:
        metrics["current_price"] = yp.price
        if yp.change_pct is not None:
            metrics["change_pct_today"] = yp.change_pct

    return metrics


def _format_metrics(metrics: dict) -> str:
    """Serialise metrics dict into a compact prompt string."""
    ticker = metrics.pop("ticker", "?")
    market = metrics.pop("market", "?")
    lines = [f"Ticker: {ticker} [{market.upper()}]", "Available metrics:"]
    for k, v in sorted(metrics.items()):
        lines.append(f"  {k}: {v}")
    if len(metrics) == 0:
        lines.append("  (no fundamental data available — momentum only)")
    return "\n".join(lines)


# ── Core computation ───────────────────────────────────────────────────────────


def compute_signal_score(ticker: str, market: str) -> Optional[dict]:
    """
    Compute the Signal Score for a ticker.
    Returns a dict with all dimension scores, composite, label, rationale, data_quality.
    Returns None if the Anthropic API key is not configured.
    """
    if not settings.ANTHROPIC_API_KEY:
        log.warning("[SignalScore] ANTHROPIC_API_KEY not configured")
        return None

    cache_key = f"{market.lower()}:{ticker.upper()}"
    now = time.time()
    if cache_key in _cache and (now - _cache_ts.get(cache_key, 0)) < _CACHE_TTL:
        log.info("[SignalScore] cache hit for %s", cache_key)
        return _cache[cache_key]

    ticker = ticker.upper()
    market = market.lower()

    if market == "ngx":
        metrics = _gather_ngx_metrics(ticker)
    else:
        metrics = _gather_us_metrics(ticker)

    prompt = _format_metrics(metrics)

    from anthropic import Anthropic
    from anthropic.types import TextBlockParam

    client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)

    system_content: list[TextBlockParam] = [
        TextBlockParam(
            type="text",
            text=_SYSTEM_PROMPT,
            cache_control={"type": "ephemeral"},
        )
    ]

    try:
        response = client.messages.create(
            model=_MODEL,
            max_tokens=512,
            system=system_content,
            tools=[_SCORE_TOOL],  # type: ignore[list-item]
            tool_choice={"type": "any"},
            messages=[{"role": "user", "content": prompt}],
        )

        # Extract the tool call result
        for block in response.content:
            if block.type == "tool_use" and block.name == "submit_signal_score":
                result: dict = dict(block.input)
                result["ticker"] = ticker
                result["market"] = market
                result["tokens_used"] = response.usage.input_tokens + response.usage.output_tokens
                _cache[cache_key] = result
                _cache_ts[cache_key] = now
                log.info(
                    "[SignalScore] %s → %s (composite=%.1f)",
                    cache_key, result.get("label"), result.get("composite", 0),
                )
                return result

        log.warning("[SignalScore] no tool_use block in response for %s", cache_key)
        return None

    except Exception as exc:
        log.exception("[SignalScore] compute failed for %s: %s", cache_key, exc)
        return None


def invalidate_cache(ticker: str, market: str) -> None:
    """Force re-computation on the next call."""
    key = f"{market.lower()}:{ticker.upper()}"
    _cache.pop(key, None)
    _cache_ts.pop(key, None)
