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
    get_watchlist,
    get_latest_analysis,
)
from app.db.models import AnalysisHistory, DailyPriceHistory, PortfolioSnapshot
from app.services import dividends as _dividends_svc
from app.services import performance as _perf_svc

log = logging.getLogger(__name__)

MODEL_QUICK = "claude-haiku-4-5-20251001"
MODEL_DEEP = "claude-sonnet-4-6"

_ANALYST_PERSONA = (
    "You are a seasoned equity analyst with 20+ years specialising in frontier and "
    "emerging markets, Nigerian Exchange (NGX) equities, and US growth stocks. "
    "Be direct, specific, and actionable. "
    "Always respond in well-structured Markdown. Use ## for section headings, "
    "**bold** for tickers and key figures, bullet lists (- item) for action points. "
    "No disclaimers. No plain prose — Markdown only. Keep total response under 1000 words."
)

_PORTFOLIO_SECTIONS = (
    "Structure your response with exactly these eight sections:\n"
    "## 1. Previous Analysis Overview\n"
    "If prior analysis context is provided above, briefly recap the key recommendations "
    "from the most recent analysis and note what has changed since (prices, positions, outlook). "
    "If this is the first analysis, write: 'First analysis — establishing baseline.'\n"
    "## 2. Portfolio Health Score\n"
    "Score X/100 — then 2 bullet points of rationale.\n"
    "## 3. Top 3 Action Items\n"
    "- **TICKER** — Buy/Sell/Hold at ₦X | one-line reason\n"
    "## 4. Risk Flags\n"
    "Bullet list: concentration, currency exposure (NGN vs USD), high-beta names.\n"
    "## 5. Watchlist Picks\n"
    "- **TICKER** | Entry: ₦X–Y | Rationale: ...\n"
    "## 6. Rebalancing Nudge\n"
    "Bullet list of over/underweight sectors vs neutral 5-sector split.\n"
    "## 7. Income Outlook\n"
    "Projected annual dividend income and yield levers.\n"
    "## 8. One Contrarian Thought\n"
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


def build_system_prompt(scope: str) -> str:
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


def build_context(db: Session, user_id: int, scope: str = "portfolio") -> dict:
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

    # Prior analyses for conversation continuity (same scope, newest-first)
    prior_rows = (
        db.execute(
            select(AnalysisHistory)
            .where(
                AnalysisHistory.user_id == user_id,
                AnalysisHistory.scope == scope,
            )
            .order_by(desc(AnalysisHistory.created_at))
            .limit(3)
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
            # Most recent: include full response (truncated to keep tokens manageable)
            entry["response"] = (h.full_response or "")[:1800]
        else:
            # Older entries: summary only
            entry["summary"] = h.summary or ""
        prior_analyses.append(entry)

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
            "dividend_income_ngn": round(annual_div_income, 2),
            "no_pe_tickers": no_pe_tickers,
            "ngx_market_direction": ngx_market_direction,
        },
        "prior_analyses": prior_analyses,
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
            max_tokens=2048,
            system=build_system_prompt(scope),
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
            )
            record_id = record.id

        yield f"data: {json.dumps({'done': True, 'id': record_id, 'tokens': tokens_used})}\n\n"

    except Exception as exc:
        log.exception("Analysis stream error: %s", exc)
        yield f"data: {json.dumps({'error': str(exc)})}\n\n"
