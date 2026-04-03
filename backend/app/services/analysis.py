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
from datetime import date
from typing import Generator, Optional

from sqlalchemy.orm import Session
from sqlalchemy import select, desc

from app.config import settings
from app.db.crud import (
    get_active_holdings,
    get_watchlist,
    get_latest_analysis,
)
from app.db.models import DailyPriceHistory

log = logging.getLogger(__name__)

MODEL_QUICK = "claude-haiku-4-5-20251001"
MODEL_DEEP = "claude-sonnet-4-6"

SYSTEM_PROMPT = (
    "You are a seasoned equity analyst with 20+ years specialising in frontier and "
    "emerging markets, Nigerian Exchange (NGX) equities, and US growth stocks. "
    "Be direct, specific, and actionable. "
    "Always structure your response with exactly these seven sections:\n"
    "1. **Portfolio Health Score** (0-100) with 2-line rationale\n"
    "2. **Top 3 Action Items** — specific buy/sell/hold with price levels and one-line reason\n"
    "3. **Risk Flags** — concentration, currency exposure (NGN vs USD), high-beta names\n"
    "4. **Watchlist Picks** — top 2 watchlist names worth buying now with entry rationale\n"
    "5. **Rebalancing Nudge** — which sectors are over/underweight vs a neutral 5-sector split\n"
    "6. **Income Outlook** — projected annual dividend income and yield improvement levers\n"
    "7. **One Contrarian Thought** — something the data suggests that goes against the obvious read\n"
    "Keep total response under 600 words. Use bullet points. No disclaimers."
)


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


def build_context(db: Session, user_id: int) -> dict:
    """
    Assemble a compact portfolio snapshot from the DB.
    Returns a dict that can be serialised to JSON and hashed.
    No external scraping — DB-only.
    """
    ngx_holdings = get_active_holdings(db, "ngx", user_id)
    us_holdings = get_active_holdings(db, "us", user_id)
    watchlist = get_watchlist(db, user_id)

    ngx_rows = []
    ngx_total_cost = 0.0
    ngx_total_equity = 0.0

    for h in ngx_holdings:
        price = _latest_price(db, h.ticker)
        cost = (h.shares or 0) * (h.avg_cost or 0)
        equity = (h.shares or 0) * price if price else cost
        ngx_total_cost += cost
        ngx_total_equity += equity
        ngx_rows.append(
            {
                "ticker": h.ticker,
                "name": h.name,
                "sector": h.sector or "Unknown",
                "shares": round(h.shares or 0, 2),
                "avg_cost": round(h.avg_cost or 0, 2),
                "current_price": round(price, 2) if price else None,
                "equity_ngn": round(equity, 2),
            }
        )

    us_rows = []
    us_total_cost = 0.0
    us_total_equity = 0.0

    for h in us_holdings:
        price = _latest_price(db, h.ticker)
        cost = (h.shares or 0) * (h.avg_cost or 0)
        equity = (h.shares or 0) * price if price else cost
        us_total_cost += cost
        us_total_equity += equity
        us_rows.append(
            {
                "ticker": h.ticker,
                "name": h.name,
                "sector": h.sector or "Unknown",
                "shares": round(h.shares or 0, 4),
                "avg_cost": round(h.avg_cost or 0, 2),
                "current_price": round(price, 2) if price else None,
                "equity_usd": round(equity, 2),
            }
        )

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

    wl_rows = [
        {
            "ticker": w.ticker,
            "market": w.market,
            "added_price": round(w.added_price, 2) if w.added_price else None,
        }
        for w in watchlist
    ]

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

    return {
        "date": date.today().isoformat(),
        "ngx": ngx_rows,
        "us": us_rows,
        "watchlist": wl_rows,
        "kpis": {
            "ngx_total_equity_ngn": round(ngx_total_equity, 2),
            "ngx_total_cost_ngn": round(ngx_total_cost, 2),
            "ngx_gain_pct": ngx_gain_pct,
            "us_total_equity_usd": round(us_total_equity, 2),
            "us_total_cost_usd": round(us_total_cost, 2),
            "us_gain_pct": us_gain_pct,
            "ngx_positions": len(ngx_holdings),
            "us_positions": len(us_holdings),
            "watchlist_count": len(wl_rows),
        },
    }


def compute_context_hash(ctx: dict) -> str:
    payload = json.dumps(ctx, sort_keys=True, default=str)
    return hashlib.sha256(payload.encode()).hexdigest()[:16]


# ── Prompt builder ────────────────────────────────────────────────────────────


def _format_holdings(rows: list[dict], currency: str, equity_key: str) -> str:
    if not rows:
        return "  (none)\n"
    lines = []
    for r in rows:
        ret = ""
        if r.get("current_price") and r.get("avg_cost"):
            pct = (r["current_price"] / r["avg_cost"] - 1) * 100
            ret = f" ({pct:+.1f}%)"
        lines.append(
            f"  {r['ticker']:<12} {r['sector']:<18} "
            f"{r['shares']} shares @ {currency}{r['avg_cost']:.2f}"
            f" → {currency}{r['current_price'] or 'N/A'}{ret}"
            f"  [{currency}{r[equity_key]:,.0f}]"
        )
    return "\n".join(lines) + "\n"


def build_user_prompt(ctx: dict, scope: str) -> str:
    k = ctx["kpis"]
    lines = [f"Portfolio snapshot: {ctx['date']}\n"]

    if scope in ("portfolio", "combined"):
        lines.append("NGX Holdings (Nigerian Exchange, NGN):")
        lines.append(_format_holdings(ctx["ngx"], "₦", "equity_ngn"))
        lines.append(
            f"  NGX Total: ₦{k['ngx_total_equity_ngn']:,.0f}  "
            f"(cost ₦{k['ngx_total_cost_ngn']:,.0f}, {k['ngx_gain_pct']:+.1f}%)\n"
        )
        lines.append("US Holdings (USD):")
        lines.append(_format_holdings(ctx["us"], "$", "equity_usd"))
        lines.append(
            f"  US Total: ${k['us_total_equity_usd']:,.0f}  "
            f"(cost ${k['us_total_cost_usd']:,.0f}, {k['us_gain_pct']:+.1f}%)\n"
        )

    if scope in ("watchlist", "combined") and ctx["watchlist"]:
        lines.append("Watchlist:")
        for w in ctx["watchlist"]:
            added = f" (added @ {w['market']} {w['added_price']})" if w["added_price"] else ""
            lines.append(f"  {w['ticker']} [{w['market']}]{added}")
        lines.append("")

    lines.append("Provide your analysis now.")
    return "\n".join(lines)


# ── Streaming ─────────────────────────────────────────────────────────────────


def stream_analysis_sse(
    user_id: int,
    scope: str,
    depth: str,
    ctx: dict,
) -> Generator[str, None, None]:
    """
    Generator that yields SSE-formatted strings.
    Saves the completed analysis to DB when done.
    Must be consumed in a thread (not async) — FastAPI's StreamingResponse handles this.
    """
    if not settings.ANTHROPIC_API_KEY:
        yield f"data: {json.dumps({'error': 'ANTHROPIC_API_KEY is not configured on the server.'})}\n\n"
        return

    from anthropic import Anthropic
    from app.db.engine import SessionLocal
    from app.db.crud import save_analysis

    model = MODEL_QUICK if depth == "quick" else MODEL_DEEP
    prompt = build_user_prompt(ctx, scope)
    ctx_hash = compute_context_hash(ctx)

    client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    full_chunks: list[str] = []
    tokens_used = 0

    try:
        with client.messages.stream(
            model=model,
            max_tokens=900,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": prompt}],
        ) as stream:
            for text in stream.text_stream:
                full_chunks.append(text)
                yield f"data: {json.dumps({'text': text})}\n\n"

            final = stream.get_final_message()
            tokens_used = (
                final.usage.input_tokens + final.usage.output_tokens
            )

        full_response = "".join(full_chunks)
        # Summary = first non-empty line, capped at 200 chars
        summary = next(
            (line.strip() for line in full_response.splitlines() if line.strip()),
            full_response[:200],
        )[:200]

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
            )
            record_id = record.id

        yield f"data: {json.dumps({'done': True, 'id': record_id, 'tokens': tokens_used})}\n\n"

    except Exception as exc:
        log.exception("Analysis stream error: %s", exc)
        yield f"data: {json.dumps({'error': str(exc)})}\n\n"
