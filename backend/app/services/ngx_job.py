"""
NGX Background Job
==================
Hourly job that scrapes all NGX ticker data and stores it in the DB.
FE and all API endpoints read only from ngx_ticker_cache — no live scrapes.

Phases per run:
  A. Prices — list __data.json (fast, ~5s, all tickers)
  B. Enrich — per-ticker stats + quote + dividend pages (concurrent, skips tickers fresh on ALL fields)

A ticker is enriched when EITHER fundamentals_updated_at OR dividend_updated_at is stale/null.
This ensures dividends are always fetched for any ticker that has never had them, even if
fundamentals are fresh (e.g. on first prod deploy after this column was added).

Lock: a row in ngx_job_log with status='running' acts as the mutex.
Stale lock: any running row older than 30 min is treated as crashed and ignored.
"""

from __future__ import annotations

import logging
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone, timedelta
from typing import Optional

from app.db.engine import SessionLocal
from app.db.models import NgxTickerCache, NgxJobLog
from app.models import NGXPrice

log = logging.getLogger(__name__)

JOB_INTERVAL = 3600          # 1 hour between runs
STALE_JOB_TIMEOUT = 1800     # 30 min — treat running row as crashed after this
ENRICH_WORKERS = 3           # concurrent per-ticker scrape threads
ENRICH_SLEEP = 0.5           # seconds between submissions
ENRICH_MAX_AGE = 6 * 3600    # skip re-enriching tickers fresher than 6 h


# ── Lock helpers ──────────────────────────────────────────────────────────────

def _job_running(db) -> bool:
    """True if a non-stale job is already running."""
    cutoff = datetime.now(timezone.utc) - timedelta(seconds=STALE_JOB_TIMEOUT)
    return db.query(NgxJobLog).filter(
        NgxJobLog.status == "running",
        NgxJobLog.started_at > cutoff,
    ).first() is not None


def _start_job(db) -> NgxJobLog:
    job = NgxJobLog(status="running")
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


def _finish_job(db, job: NgxJobLog, status: str = "done") -> None:
    job.finished_at = datetime.now(timezone.utc)
    job.status = status
    db.commit()


def _update_progress(db, job: NgxJobLog, done: int, errors: int) -> None:
    job.tickers_done = done
    job.error_count = errors
    db.commit()


# ── Phase A — prices ──────────────────────────────────────────────────────────

def _scrape_prices(db, job: NgxJobLog) -> int:
    """Fetch all NGX prices from the list __data.json and upsert into cache."""
    from app.services.ngx import _fetch_all_data

    result = _fetch_all_data()
    if not result:
        log.warning("[NGXJob] Price scrape returned no data")
        return 0

    prices, _, profiles = result
    now = datetime.now(timezone.utc)
    job.tickers_total = len(prices)
    db.commit()

    for ticker, price_obj in prices.items():
        prof = profiles.get(ticker, {})
        row = db.get(NgxTickerCache, ticker)
        if row:
            row.price = price_obj.price
            row.change = price_obj.change
            row.change_pct = price_obj.change_pct
            # Don't overwrite richer name from profile scrape
            if prof.get("name") and not row.name:
                row.name = prof["name"]
            row.prices_updated_at = now
        else:
            db.add(NgxTickerCache(
                ticker=ticker,
                name=prof.get("name"),
                price=price_obj.price,
                change=price_obj.change,
                change_pct=price_obj.change_pct,
                prices_updated_at=now,
            ))

    db.commit()
    log.info("[NGXJob] Phase A done — %d tickers", len(prices))
    return len(prices)


# ── Phase B — per-ticker enrichment ──────────────────────────────────────────

def _enrich_one(ticker: str) -> dict:
    """
    Fetch statistics + quote + company + dividend pages for one ticker.
    Returns a dict of fields to write. Never raises — returns partial data on failure.
    """
    from app.services.performance import get_overview      # stats blob → fundamentals
    from app.services.overview import get_performance      # stats blob + quote → performance
    from app.services.profile import get_profile           # company page → profile
    from app.services.ngx import _get_quote_intraday       # quote page → high/low/volume
    from app.services.dividends import get_dividend        # dividend page → snapshot

    result: dict = {}

    try:
        ov = get_overview(ticker, force_refresh=True)
        if ov:
            result.update({
                "market_cap": ov.get("market_cap"),
                "pe_ratio": ov.get("pe_ratio"),
                "eps": ov.get("eps"),
                "book_value": ov.get("book_value"),
                "dividend_yield": ov.get("dividend_yield"),
                "roe": ov.get("roe"),
                "roa": ov.get("roa"),
                "debt_to_equity": ov.get("debt_to_equity"),
                "current_ratio": ov.get("current_ratio"),
                "gross_margin": ov.get("gross_margin"),
                "net_margin": ov.get("net_margin"),
                "revenue": ov.get("revenue"),
                "net_income": ov.get("net_income"),
            })
    except Exception as exc:
        log.debug("[NGXJob] overview failed %s: %s", ticker, exc)

    # ROA fallback: net_income / latest total_assets from balance sheet
    if result.get("roa") is None and result.get("net_income"):
        try:
            from app.services.financials import get_balance_sheet
            bs = get_balance_sheet(ticker)
            if bs and bs.get("assets"):
                latest_assets = bs["assets"][-1]
                if latest_assets:
                    result["roa"] = round(result["net_income"] / latest_assets * 100, 3)
        except Exception as exc:
            log.debug("[NGXJob] roa fallback failed %s: %s", ticker, exc)

    try:
        perf = get_performance(ticker, force_refresh=True)
        if perf:
            result.update({
                "beta": perf.get("beta"),
                "week_52_high": perf.get("week_52_high"),
                "week_52_low": perf.get("week_52_low"),
                "week_52_change": perf.get("week_52_change"),
                "return_1y": perf.get("return_1y"),
                "return_ytd": perf.get("return_ytd"),
                "return_1m": perf.get("return_1m"),
                "return_3m": perf.get("return_3m"),
                "return_6m": perf.get("return_6m"),
                "volatility": perf.get("volatility"),
                "sharpe_ratio": perf.get("sharpe_ratio"),
                "max_drawdown": perf.get("max_drawdown"),
                "rsi_14": perf.get("rsi_14"),
                "ma_50": perf.get("ma_50"),
                "ma_200": perf.get("ma_200"),
                "golden_cross": perf.get("golden_cross"),
                "piotroski_score": perf.get("piotroski_score"),
                "altman_zscore": perf.get("altman_zscore"),
                "ebitda_margin": perf.get("ebitda_margin"),
                "operating_margin": perf.get("operating_margin"),
                "fcf_margin": perf.get("fcf_margin"),
                "roic": perf.get("roic"),
                "roce": perf.get("roce"),
                "operating_cash_flow": perf.get("operating_cash_flow"),
                "free_cash_flow": perf.get("free_cash_flow"),
                "capex_ttm": perf.get("capex"),
                "fcf_per_share": perf.get("fcf_per_share"),
                "fcf_yield": perf.get("fcf_yield"),
                "quick_ratio": perf.get("quick_ratio"),
                "net_debt": perf.get("net_debt"),
                "interest_coverage": perf.get("interest_coverage"),
                "debt_ebitda": perf.get("debt_ebitda"),
                "asset_turnover": perf.get("asset_turnover"),
                "revenue_growth_yoy": perf.get("revenue_growth_yoy"),
                "earnings_growth_yoy": perf.get("earnings_growth_yoy"),
                "fcf_growth_yoy": perf.get("fcf_growth_yoy"),
                "dividend_growth_yoy": perf.get("dividend_growth_yoy"),
                "price_to_book": perf.get("price_to_book"),
                "price_to_sales": perf.get("price_to_sales"),
                "ev_ebitda": perf.get("ev_ebitda"),
                "ev_fcf": perf.get("ev_fcf"),
            })
    except Exception as exc:
        log.debug("[NGXJob] performance failed %s: %s", ticker, exc)

    try:
        prof = get_profile(ticker, force_refresh=True)
        if prof:
            result.update({
                "name": prof.get("name"),
                "sector": prof.get("sector"),
                "industry": prof.get("industry"),
                "description": prof.get("description"),
                "website": prof.get("website"),
                "headquarters": prof.get("headquarters"),
                "founded": prof.get("founded"),
                "employees": prof.get("employees"),
            })
    except Exception as exc:
        log.debug("[NGXJob] profile failed %s: %s", ticker, exc)

    try:
        intraday = _get_quote_intraday(ticker)
        if intraday:
            if intraday.get("high") is not None:
                result["high"] = intraday["high"]
            if intraday.get("low") is not None:
                result["low"] = intraday["low"]
            if intraday.get("volume") is not None:
                result["volume"] = intraday["volume"]
    except Exception as exc:
        log.debug("[NGXJob] intraday failed %s: %s", ticker, exc)

    try:
        div = get_dividend(ticker, force=True)
        if div:
            result["dividend_amount"] = div.cash_amount
            result["dividend_ex_date"] = div.ex_dividend_date
            result["dividend_pay_date"] = div.pay_date
        result["_div_fetched"] = True  # sentinel so _write_enrichment stamps the timestamp
    except Exception as exc:
        log.debug("[NGXJob] dividend failed %s: %s", ticker, exc)

    # Cross-listing overlay: fill null fundamentals from Yahoo Finance
    try:
        from app.services.cross_listings import yahoo_ticker as _yt, overlay_yahoo_fundamentals
        from app.services.yahoo import get_fundamentals as _yf
        from app.services.fx import get_rate as _get_rate
        yt = _yt(ticker)
        if yt:
            ydata = _yf(yt)
            if ydata:
                fx_info = _get_rate()
                overlay_yahoo_fundamentals(result, ydata, usdngn=fx_info.get("rate"))
                log.info("[NGXJob] %s: overlaid Yahoo fundamentals from %s", ticker, yt)
    except Exception as exc:
        log.debug("[NGXJob] Yahoo overlay failed %s: %s", ticker, exc)

    return result


def _write_enrichment(ticker: str, fields: dict, now: datetime) -> None:
    """Write enrichment result for one ticker to DB."""
    with SessionLocal() as db:
        row = db.get(NgxTickerCache, ticker)
        if not row:
            return
        for k, v in fields.items():
            if k.startswith("_"):
                continue  # internal sentinels, not DB columns
            if v is not None and hasattr(row, k):
                setattr(row, k, v)
        row.fundamentals_updated_at = now
        if fields.get("sector") or fields.get("description"):
            row.profile_updated_at = now
        if fields.get("_div_fetched"):
            row.dividend_updated_at = now
        db.commit()


def _is_stale(ts: Optional[datetime], max_age: int) -> bool:
    if ts is None:
        return True
    if ts.tzinfo is None:
        ts = ts.replace(tzinfo=timezone.utc)
    return ts < datetime.now(timezone.utc) - timedelta(seconds=max_age)


def _enrich_all(db, job: NgxJobLog) -> None:
    """Enrich tickers whose fundamentals OR dividends are stale/missing."""
    rows = db.query(
        NgxTickerCache.ticker,
        NgxTickerCache.fundamentals_updated_at,
        NgxTickerCache.dividend_updated_at,
    ).all()
    to_enrich = [
        t for t, fund_ts, div_ts in rows
        if _is_stale(fund_ts, ENRICH_MAX_AGE) or _is_stale(div_ts, ENRICH_MAX_AGE)
    ]

    log.info("[NGXJob] Phase B — enriching %d / %d tickers", len(to_enrich), len(rows))
    now = datetime.now(timezone.utc)
    done, errors = 0, 0

    with ThreadPoolExecutor(max_workers=ENRICH_WORKERS) as ex:
        futures = {}
        for ticker in to_enrich:
            futures[ex.submit(_enrich_one, ticker)] = ticker
            time.sleep(ENRICH_SLEEP)

        for fut in as_completed(futures):
            ticker = futures[fut]
            try:
                fields = fut.result()
                _write_enrichment(ticker, fields, now)
                done += 1
            except Exception as exc:
                log.debug("[NGXJob] enrich write failed %s: %s", ticker, exc)
                errors += 1

            if (done + errors) % 20 == 0:
                log.info("[NGXJob] Phase B progress: %d done, %d errors", done, errors)
                with SessionLocal() as s:
                    j = s.get(NgxJobLog, job.id)
                    if j:
                        j.tickers_done = done
                        j.error_count = errors
                        s.commit()

    log.info("[NGXJob] Phase B done — %d enriched, %d errors", done, errors)


# ── Job runner ────────────────────────────────────────────────────────────────

def run_job() -> None:
    """Run one full scrape cycle. Returns immediately if another job is active."""
    with SessionLocal() as db:
        if _job_running(db):
            log.info("[NGXJob] Job already running — skipping")
            return
        job = _start_job(db)
        log.info("[NGXJob] Started job id=%d", job.id)

    try:
        with SessionLocal() as db:
            job_ref = db.get(NgxJobLog, job.id)
            if not job_ref:
                return
            count = _scrape_prices(db, job_ref)
            if count == 0:
                log.warning("[NGXJob] No prices scraped — aborting enrichment")
                _finish_job(db, job_ref, status="failed")
                return

        with SessionLocal() as db:
            job_ref = db.get(NgxJobLog, job.id)
            if not job_ref:
                return
            _enrich_all(db, job_ref)

        with SessionLocal() as db:
            job_ref = db.get(NgxJobLog, job.id)
            if not job_ref:
                return
            _finish_job(db, job_ref, status="done")
            log.info("[NGXJob] Job id=%d complete", job.id)

    except Exception:
        log.exception("[NGXJob] Job id=%d failed", job.id)
        with SessionLocal() as db:
            job_ref = db.get(NgxJobLog, job.id)
            if job_ref:
                _finish_job(db, job_ref, status="failed")


# ── Scheduler ─────────────────────────────────────────────────────────────────

def _next_top_of_hour(after: Optional[datetime] = None) -> datetime:
    """Return the next wall-clock top-of-hour (UTC) after `after` (defaults to now)."""
    base = after or datetime.now(timezone.utc)
    return (base + timedelta(hours=1)).replace(minute=0, second=0, microsecond=0)


def _scheduler_loop() -> None:
    while True:
        next_run = _next_top_of_hour()
        delay = (next_run - datetime.now(timezone.utc)).total_seconds()
        log.info("[NGXJob] Scheduler: next run at %s UTC (in %.0fs)", next_run.strftime("%H:%M"), delay)
        time.sleep(max(delay, 0))
        run_job()


def start_scheduler() -> None:
    """Start the background scheduler. Fires at the top of each clock hour (1:00, 2:00 …)."""
    t = threading.Thread(target=_scheduler_loop, daemon=True, name="ngx-job")
    t.start()


# ── Public read API (all DB, no scraping) ─────────────────────────────────────

def _row_to_dict(row: NgxTickerCache) -> dict:
    return {
        "ticker": row.ticker,
        "name": row.name,
        "sector": row.sector,
        "industry": row.industry,
        "description": row.description,
        "website": row.website,
        "headquarters": row.headquarters,
        "founded": row.founded,
        "employees": row.employees,
        "price": row.price,
        "change": row.change,
        "change_pct": row.change_pct,
        "volume": row.volume,
        "high": row.high,
        "low": row.low,
        "market_cap": row.market_cap,
        "pe_ratio": row.pe_ratio,
        "eps": row.eps,
        "book_value": row.book_value,
        "dividend_yield": row.dividend_yield,
        "roe": row.roe,
        "roa": row.roa,
        "debt_to_equity": row.debt_to_equity,
        "current_ratio": row.current_ratio,
        "gross_margin": row.gross_margin,
        "net_margin": row.net_margin,
        "revenue": row.revenue,
        "net_income": row.net_income,
        "beta": row.beta,
        "week_52_high": row.week_52_high,
        "week_52_low": row.week_52_low,
        "week_52_change": row.week_52_change,
        "return_1y": row.return_1y,
        "return_ytd": row.return_ytd,
        "return_1m": row.return_1m,
        "return_3m": row.return_3m,
        "return_6m": row.return_6m,
        "volatility": row.volatility,
        "sharpe_ratio": row.sharpe_ratio,
        "max_drawdown": row.max_drawdown,
        "rsi_14": row.rsi_14,
        "ma_50": row.ma_50,
        "ma_200": row.ma_200,
        "golden_cross": row.golden_cross,
        "piotroski_score": row.piotroski_score,
        "altman_zscore": row.altman_zscore,
        "dividend_amount": row.dividend_amount,
        "dividend_ex_date": row.dividend_ex_date,
        "dividend_pay_date": row.dividend_pay_date,
        "prices_updated_at": row.prices_updated_at,
        "fundamentals_updated_at": row.fundamentals_updated_at,
    }


def get_all() -> list[dict]:
    """Return all cached tickers. Empty list if job hasn't run yet."""
    with SessionLocal() as db:
        rows = db.query(NgxTickerCache).all()
        return [_row_to_dict(r) for r in rows]


def get_ticker(ticker: str) -> Optional[dict]:
    """Return one ticker's full cached data, or None."""
    with SessionLocal() as db:
        row = db.get(NgxTickerCache, ticker.upper())
        return _row_to_dict(row) if row else None


def get_prices_dict() -> dict[str, NGXPrice]:
    """Return {ticker: NGXPrice} for all tickers that have a price."""
    with SessionLocal() as db:
        rows = db.query(NgxTickerCache).filter(NgxTickerCache.price.isnot(None)).all()
        return {
            r.ticker: NGXPrice(
                symbol=r.ticker,
                price=r.price or 0.0,
                close=None,
                change=r.change,
                change_pct=r.change_pct,
                high=r.high,
                low=r.low,
                volume=r.volume,
                value=None,
            )
            for r in rows
        }


def get_price(ticker: str) -> Optional[NGXPrice]:
    """Return NGXPrice for a single ticker, or None."""
    with SessionLocal() as db:
        row = db.get(NgxTickerCache, ticker.upper())
        if not row or row.price is None:
            return None
        return NGXPrice(
            symbol=row.ticker,
            price=row.price or 0.0,
            close=None,
            change=row.change,
            change_pct=row.change_pct,
            high=row.high,
            low=row.low,
            volume=row.volume,
            value=None,
        )


def last_updated() -> Optional[datetime]:
    """Timestamp of the most recently completed job, or None."""
    with SessionLocal() as db:
        job = db.query(NgxJobLog).filter(
            NgxJobLog.status == "done"
        ).order_by(NgxJobLog.finished_at.desc()).first()
        return job.finished_at if job else None


def cache_age() -> Optional[int]:
    """Seconds since the last completed job, or None."""
    ts = last_updated()
    if not ts:
        return None
    if ts.tzinfo is None:
        ts = ts.replace(tzinfo=timezone.utc)
    return int((datetime.now(timezone.utc) - ts).total_seconds())


def job_status() -> dict:
    """Return current job state for the /api/screener/ngx/status endpoint."""
    with SessionLocal() as db:
        latest = db.query(NgxJobLog).order_by(NgxJobLog.started_at.desc()).first()
        last_done = db.query(NgxJobLog).filter(
            NgxJobLog.status == "done"
        ).order_by(NgxJobLog.finished_at.desc()).first()
        total = db.query(NgxTickerCache).count()

    if not latest:
        return {
            "status": "never_run",
            "last_updated": None,
            "next_run_at": _next_top_of_hour().isoformat(),
            "job_interval_sec": JOB_INTERVAL,
            "tickers_in_db": total,
        }

    ts = latest.finished_at or latest.started_at
    if ts and ts.tzinfo is None:
        ts = ts.replace(tzinfo=timezone.utc)

    # Always the next wall-clock top-of-hour; accurate regardless of when the job last ran
    next_run_at = _next_top_of_hour().isoformat()

    return {
        "status": latest.status,
        "last_updated": ts.isoformat() if ts else None,
        "next_run_at": next_run_at,
        "job_interval_sec": JOB_INTERVAL,
        "tickers_total": latest.tickers_total,
        "tickers_done": latest.tickers_done,
        "error_count": latest.error_count,
        "tickers_in_db": total,
    }
