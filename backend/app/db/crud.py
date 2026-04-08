"""
CRUD helpers.
All database reads and writes live here — no raw SQL anywhere else in the app.
All functions accept a SQLAlchemy Session as their first argument.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone, timedelta
from typing import Optional

from sqlalchemy import select, desc
from sqlalchemy.orm import Session

from app.db.models import (
    Holding,
    ClosedPosition,
    SaleEvent,
    PortfolioSnapshot,
    PriceHistory,
    User,
    RefreshToken,
    InviteCode,
    DividendCache,
    FinancialsCache,
    DailyPriceHistory,
    Watchlist,
    AnalysisHistory,
)

log = logging.getLogger(__name__)


# ── Holdings ──────────────────────────────────────────────────────────────────


def get_active_holdings(db: Session, market: str, user_id: int) -> list[Holding]:
    """Return all active holdings for a given market ('ngx' or 'us') scoped to user."""
    stmt = (
        select(Holding)
        .where(
            Holding.user_id == user_id,
            Holding.market == market,
            Holding.is_active == True,
        )
        .order_by(Holding.ticker)
    )
    return list(db.scalars(stmt).all())


def get_all_active_holdings(db: Session, user_id: int) -> list[Holding]:
    stmt = (
        select(Holding)
        .where(Holding.user_id == user_id, Holding.is_active == True)
        .order_by(Holding.market, Holding.ticker)
    )
    return list(db.scalars(stmt).all())


def upsert_holding(
    db: Session, ticker: str, market: str, user_id: int, **kwargs
) -> Holding:
    """Update existing holding or insert a new one, scoped to user."""
    stmt = select(Holding).where(
        Holding.ticker == ticker, Holding.market == market, Holding.user_id == user_id
    )
    obj = db.scalars(stmt).first()
    if obj is None:
        obj = Holding(ticker=ticker, market=market, user_id=user_id, **kwargs)
        db.add(obj)
    else:
        for k, v in kwargs.items():
            setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj


# ── Holdings — settings CRUD ──────────────────────────────────────────────────


def get_holding_by_id(db: Session, holding_id: int, user_id: int) -> Optional[Holding]:
    obj = db.get(Holding, holding_id)
    if obj is None or obj.user_id != user_id:
        return None
    return obj


def create_holding(
    db: Session,
    ticker: str,
    name: str,
    market: str,
    shares: float,
    avg_cost: float,
    sector: str,
    user_id: int,
    purchase_date=None,
) -> Holding:
    obj = Holding(
        user_id=user_id,
        ticker=ticker.upper(),
        name=name,
        market=market.lower(),
        shares=shares,
        avg_cost=avg_cost,
        sector=sector,
        is_active=True,
        purchase_date=purchase_date,
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    log.info("Created holding %s (%s) for user_id=%d", obj.ticker, obj.market, user_id)
    return obj


def update_holding(
    db: Session,
    holding_id: int,
    user_id: int,
    name: Optional[str] = None,
    sector: Optional[str] = None,
    avg_cost: Optional[float] = None,
    shares: Optional[float] = None,
    purchase_date=None,
) -> Optional[Holding]:
    obj = get_holding_by_id(db, holding_id, user_id)
    if obj is None:
        return None
    if name is not None:
        obj.name = name
    if sector is not None:
        obj.sector = sector
    if avg_cost is not None:
        obj.avg_cost = avg_cost
    if shares is not None:
        obj.shares = shares
    if purchase_date is not None:
        obj.purchase_date = purchase_date
    db.commit()
    db.refresh(obj)
    return obj


def delete_holding(db: Session, holding_id: int, user_id: int) -> bool:
    """Hard delete — removes all DB rows for this holding, scoped to user."""
    obj = get_holding_by_id(db, holding_id, user_id)
    if obj is None:
        return False
    db.delete(obj)
    db.commit()
    log.info("Deleted holding id=%d (%s)", holding_id, obj.ticker)
    return True


def add_shares(
    db: Session,
    holding_id: int,
    user_id: int,
    new_shares: float,
    buy_price: float,
) -> Optional[Holding]:
    """Buy more of an existing position, scoped to user."""
    obj = get_holding_by_id(db, holding_id, user_id)
    if obj is None:
        return None
    old_cost_basis = obj.shares * obj.avg_cost
    new_cost_basis = new_shares * buy_price
    total_shares = obj.shares + new_shares
    obj.avg_cost = (old_cost_basis + new_cost_basis) / total_shares
    obj.shares = total_shares
    obj.is_active = True
    db.commit()
    db.refresh(obj)
    log.info(
        "Added %.4f shares to %s @ %.4f → new avg %.4f",
        new_shares,
        obj.ticker,
        buy_price,
        obj.avg_cost,
    )
    return obj


# ── Sale events ───────────────────────────────────────────────────────────────


def log_sale_event(
    db: Session,
    user_id: int,
    holding_id: int,
    ticker: str,
    name: str,
    market: str,
    shares_sold: float,
    sale_price: float,
    commission: float,
    proceeds: float,
    realized_pl: float,
    fully_closed: bool,
) -> SaleEvent:
    event = SaleEvent(
        user_id=user_id,
        holding_id=holding_id,
        ticker=ticker,
        name=name,
        market=market,
        shares_sold=round(shares_sold, 8),
        sale_price=round(sale_price, 4),
        commission=round(commission, 4),
        proceeds=round(proceeds, 4),
        realized_pl=round(realized_pl, 4),
        fully_closed=fully_closed,
    )
    db.add(event)
    # caller commits
    return event


def get_sale_events(db: Session, user_id: int) -> list[SaleEvent]:
    stmt = (
        select(SaleEvent)
        .where(SaleEvent.user_id == user_id)
        .order_by(desc(SaleEvent.sold_at))
    )
    return list(db.scalars(stmt).all())


# ── Cash balance ──────────────────────────────────────────────────────────────


def _adjust_cash(db: Session, user_id: int, market: str, delta: float) -> None:
    """Internal helper — add delta (can be negative) to the correct cash bucket."""
    user = get_user_by_id(db, user_id)
    if user is None:
        return
    if market == "ngx":
        user.cash_balance_ngn = round((user.cash_balance_ngn or 0.0) + delta, 4)
    else:
        user.cash_balance_usd = round((user.cash_balance_usd or 0.0) + delta, 4)
    # Caller is responsible for db.commit()


def get_cash_balance(db: Session, user_id: int) -> dict:
    user = get_user_by_id(db, user_id)
    if user is None:
        return {"ngn": 0.0, "usd": 0.0}
    return {
        "ngn": round(user.cash_balance_ngn or 0.0, 4),
        "usd": round(user.cash_balance_usd or 0.0, 4),
    }


def credit_cash(db: Session, user_id: int, market: str, amount: float) -> dict:
    """Manually credit cash (e.g. recording proceeds from an already-recorded sale)."""
    _adjust_cash(db, user_id, market, amount)
    db.commit()
    return get_cash_balance(db, user_id)


def debit_cash(db: Session, user_id: int, market: str, amount: float) -> bool:
    """
    Deduct amount from cash balance for a purchase funded from cash.
    Returns False (without committing) if balance is insufficient.
    """
    user = get_user_by_id(db, user_id)
    if user is None:
        return False
    bal = user.cash_balance_ngn if market == "ngx" else user.cash_balance_usd
    if (bal or 0.0) < amount:
        return False
    _adjust_cash(db, user_id, market, -amount)
    # Caller commits after the buy
    return True


def record_sale(
    db: Session,
    holding_id: int,
    user_id: int,
    shares_sold: float,
    sale_price: float,
    commission: float = 0.0,
) -> tuple[Optional[Holding], Optional[ClosedPosition]]:
    """
    Sell shares_sold units at sale_price, scoped to user.
    Commission is deducted from both proceeds and realized P&L.
    Automatically credits net proceeds to the user's cash balance.
    Returns (updated_holding, closed_position_or_None)
    """
    obj = get_holding_by_id(db, holding_id, user_id)
    if obj is None:
        return None, None

    shares_sold = min(shares_sold, obj.shares)
    gross_proceeds = shares_sold * sale_price
    realized_pl = (sale_price - obj.avg_cost) * shares_sold - commission
    proceeds = gross_proceeds - commission
    obj.shares = round(obj.shares - shares_sold, 8)
    obj.realized_pl = round((obj.realized_pl or 0.0) + realized_pl, 4)

    closed = None
    if obj.shares <= 1e-8:
        obj.shares = 0.0
        obj.is_active = False
        closed = ClosedPosition(
            user_id=user_id,
            ticker=obj.ticker,
            name=obj.name,
            market=obj.market,
            realized_pl=round(obj.realized_pl, 4),
        )
        db.add(closed)
        log.info("Full sale: %s → realized P/L %.4f", obj.ticker, obj.realized_pl)
    else:
        log.info(
            "Partial sale: %s sold %.4f shares → %.4f remaining, P/L %.4f",
            obj.ticker,
            shares_sold,
            obj.shares,
            realized_pl,
        )

    # Credit proceeds to cash balance
    _adjust_cash(db, user_id, obj.market, proceeds)

    # Audit log
    log_sale_event(
        db,
        user_id=user_id,
        holding_id=obj.id,
        ticker=obj.ticker,
        name=obj.name,
        market=obj.market,
        shares_sold=shares_sold,
        sale_price=sale_price,
        commission=commission,
        proceeds=proceeds,
        realized_pl=realized_pl,
        fully_closed=not obj.is_active,
    )

    db.commit()
    if closed:
        db.refresh(closed)
    db.refresh(obj)
    return obj, closed


# ── Closed positions — settings read ─────────────────────────────────────────


def get_all_holdings(db: Session, user_id: int) -> list[Holding]:
    """Return ALL holdings (active + inactive) for the settings page, scoped to user."""
    stmt = (
        select(Holding)
        .where(Holding.user_id == user_id)
        .order_by(Holding.market, Holding.ticker)
    )
    return list(db.scalars(stmt).all())


def get_closed_positions(db: Session, user_id: int) -> list[ClosedPosition]:
    stmt = (
        select(ClosedPosition)
        .where(ClosedPosition.user_id == user_id)
        .order_by(desc(ClosedPosition.closed_at))
    )
    return list(db.scalars(stmt).all())


def insert_closed_position(
    db: Session, ticker: str, name: str, market: str, realized_pl: float, user_id: int
) -> ClosedPosition:
    obj = ClosedPosition(
        user_id=user_id,
        ticker=ticker,
        name=name,
        market=market,
        realized_pl=realized_pl,
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


# ── Snapshots ─────────────────────────────────────────────────────────────────


def get_latest_snapshot_ts(db: Session, user_id: int) -> Optional[datetime]:
    """Return timestamp of the most recent snapshot for a user, or None."""
    stmt = (
        select(PortfolioSnapshot.ts)
        .where(PortfolioSnapshot.user_id == user_id)
        .order_by(desc(PortfolioSnapshot.ts))
        .limit(1)
    )
    return db.scalars(stmt).first()


def should_write_snapshot(db: Session, ttl_seconds: int, user_id: int) -> bool:
    """Return True if no snapshot exists for this user, or the most recent is older than ttl_seconds."""
    latest = get_latest_snapshot_ts(db, user_id)
    if latest is None:
        return True
    if latest.tzinfo is None:
        latest = latest.replace(tzinfo=timezone.utc)
    age = (datetime.now(timezone.utc) - latest).total_seconds()
    return age >= ttl_seconds


def write_snapshot(
    db: Session,
    user_id: int,
    ngx_equity: float,
    ngx_cost: float,
    us_equity: float,
    us_cost: float,
    usdngn: float,
    total_usd: float,
    price_rows: list[dict],
) -> PortfolioSnapshot:
    """Insert a new portfolio snapshot and all per-ticker price rows atomically."""
    snap = PortfolioSnapshot(
        user_id=user_id,
        ts=datetime.now(timezone.utc),
        ngx_equity_ngn=round(ngx_equity, 2),
        ngx_cost_ngn=round(ngx_cost, 2),
        us_equity_usd=round(us_equity, 4),
        us_cost_usd=round(us_cost, 4),
        usdngn=round(usdngn, 4),
        total_usd=round(total_usd, 4),
    )
    db.add(snap)
    db.flush()

    for row in price_rows:
        db.add(
            PriceHistory(
                snapshot_id=snap.id,
                ticker=row["ticker"],
                market=row["market"],
                price=row.get("price"),
                change_pct=row.get("change_pct"),
            )
        )

    db.commit()
    log.info(
        "Snapshot #%d written for user_id=%d (%d prices)",
        snap.id,
        user_id,
        len(price_rows),
    )
    return snap


# ── History queries ───────────────────────────────────────────────────────────


def get_portfolio_history(
    db: Session, days: int, user_id: int
) -> list[PortfolioSnapshot]:
    """Return snapshots for the last N days for a user, oldest first."""
    since = datetime.now(timezone.utc) - timedelta(days=days)
    stmt = (
        select(PortfolioSnapshot)
        .where(PortfolioSnapshot.user_id == user_id, PortfolioSnapshot.ts >= since)
        .order_by(PortfolioSnapshot.ts)
    )
    return list(db.scalars(stmt).all())


def get_price_history(db: Session, ticker: str, days: int, user_id: int) -> list[dict]:
    """Return price history for a single ticker for a user, oldest first."""
    since = datetime.now(timezone.utc) - timedelta(days=days)
    stmt = (
        select(PriceHistory, PortfolioSnapshot.ts)
        .join(PortfolioSnapshot, PriceHistory.snapshot_id == PortfolioSnapshot.id)
        .where(
            PortfolioSnapshot.user_id == user_id,
            PriceHistory.ticker == ticker.upper(),
            PortfolioSnapshot.ts >= since,
        )
        .order_by(PortfolioSnapshot.ts)
    )
    return [
        {
            "ts": row.ts.isoformat(),
            "price": row.PriceHistory.price,
            "change_pct": row.PriceHistory.change_pct,
        }
        for row in db.execute(stmt).all()
    ]


# ── Users ─────────────────────────────────────────────────────────────────────


def create_user(
    db: Session,
    email: str,
    username: str,
    hashed_pw: str,
    is_admin: bool = False,
) -> User:
    user = User(email=email, username=username, hashed_pw=hashed_pw, is_admin=is_admin)
    db.add(user)
    db.commit()
    db.refresh(user)
    log.info("Created user %r (admin=%s)", username, is_admin)
    return user


def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
    return db.get(User, user_id)


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.scalars(select(User).where(User.email == email)).first()


def get_user_by_username(db: Session, username: str) -> Optional[User]:
    return db.scalars(select(User).where(User.username == username)).first()


# ── Refresh tokens ────────────────────────────────────────────────────────────


def create_refresh_token(
    db: Session, user_id: int, token: str, expires_at: datetime
) -> RefreshToken:
    obj = RefreshToken(user_id=user_id, token=token, expires_at=expires_at)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def get_refresh_token(db: Session, token: str) -> Optional[RefreshToken]:
    return db.scalars(select(RefreshToken).where(RefreshToken.token == token)).first()


def delete_refresh_token(db: Session, token: str) -> bool:
    obj = db.scalars(select(RefreshToken).where(RefreshToken.token == token)).first()
    if obj is None:
        return False
    db.delete(obj)
    db.commit()
    return True


# ── Invite codes ──────────────────────────────────────────────────────────────


def create_invite_code(db: Session, code: str, created_by: int) -> InviteCode:
    obj = InviteCode(code=code, created_by=created_by)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def get_invite_code(db: Session, code: str) -> Optional[InviteCode]:
    return db.scalars(select(InviteCode).where(InviteCode.code == code)).first()


def use_invite_code(db: Session, code: str, user_id: int) -> Optional[InviteCode]:
    obj = get_invite_code(db, code)
    if obj is None or obj.used_by is not None:
        return None
    obj.used_by = user_id
    obj.used_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(obj)
    return obj


def list_invite_codes(db: Session, created_by: int) -> list[InviteCode]:
    stmt = (
        select(InviteCode)
        .where(InviteCode.created_by == created_by)
        .order_by(desc(InviteCode.created_at))
    )
    return list(db.scalars(stmt).all())


# ── Dividend cache ─────────────────────────────────────────────────────────────


def get_dividend_cache(db: Session, ticker: str) -> Optional[DividendCache]:
    return db.scalars(
        select(DividendCache).where(DividendCache.ticker == ticker.upper())
    ).first()


def upsert_dividend_cache(db: Session, ticker: str, info) -> DividendCache:
    """
    Insert or update the dividend cache row. Pass info=None to record absence.
    Dividend fields are only overwritten when the data has actually changed.
    fetched_at is always updated so the TTL is refreshed after every scrape.
    """
    obj = get_dividend_cache(db, ticker)
    now = datetime.now(timezone.utc)
    if obj is None:
        obj = DividendCache(
            ticker=ticker.upper(), symbol=ticker.upper(), currency="NGN"
        )
        db.add(obj)

    obj.fetched_at = now  # always refresh so we don't re-scrape next cycle

    if info is not None:
        changed = (
            obj.ex_dividend_date != info.ex_dividend_date
            or obj.cash_amount != info.cash_amount
            or obj.pay_date != info.pay_date
            or obj.record_date != info.record_date
        )
        if changed:
            obj.symbol = info.symbol
            obj.ex_dividend_date = info.ex_dividend_date
            obj.record_date = info.record_date
            obj.pay_date = info.pay_date
            obj.cash_amount = info.cash_amount
            obj.currency = info.currency
            obj.dividend_ts = info.timestamp
            log.info(
                "[DividendCache] %s updated: %.4f %s ex=%s",
                ticker.upper(),
                info.cash_amount,
                info.currency,
                info.ex_dividend_date,
            )
        else:
            log.debug(
                "[DividendCache] %s unchanged, refreshed fetched_at", ticker.upper()
            )
    else:
        obj.cash_amount = None  # sentinel: scraped but not found

    db.commit()
    db.refresh(obj)
    return obj


# ── Financials cache ───────────────────────────────────────────────────────────


def get_financials_cache(
    db: Session, ticker: str, cache_type: str
) -> Optional[FinancialsCache]:
    return db.scalars(
        select(FinancialsCache).where(
            FinancialsCache.ticker == ticker.upper(),
            FinancialsCache.cache_type == cache_type,
        )
    ).first()


def upsert_financials_cache(
    db: Session, ticker: str, cache_type: str, data: dict
) -> FinancialsCache:
    """
    Insert or update a financials cache row.
    Data columns are only overwritten when the content has actually changed.
    fetched_at is always updated so the TTL is refreshed after every scrape.
    """
    obj = get_financials_cache(db, ticker, cache_type)
    if obj is None:
        obj = FinancialsCache(ticker=ticker.upper(), cache_type=cache_type)
        db.add(obj)

    obj.fetched_at = datetime.now(timezone.utc)

    if cache_type == "earnings":
        new_a = data.get("revenue", [])
        new_b = data.get("eps", [])
        new_c = data.get("net_income", [])
        new_d = []
    elif cache_type == "cashflow":
        new_a = data.get("capex", [])
        new_b = data.get("fcf", [])
        new_c = data.get("net_debt", [])
        new_d = []
    elif cache_type == "dividends":
        new_a = data.get("amounts", [])
        new_b = []
        new_c = []
        new_d = []
    else:
        new_a = data.get("assets", [])
        new_b = data.get("liabilities", [])
        new_c = data.get("equity", [])
        new_d = data.get("net_cash", [])

    new_periods = data.get("periods", [])
    changed = (
        obj.periods != new_periods
        or obj.col_a != new_a
        or obj.col_b != new_b
        or obj.col_c != new_c
        or obj.col_d != new_d
    )
    if changed:
        obj.periods = new_periods
        obj.col_a = new_a
        obj.col_b = new_b
        obj.col_c = new_c
        obj.col_d = new_d
        log.info(
            "[FinancialsCache] %s %s updated (%d periods)",
            ticker.upper(),
            cache_type,
            len(new_periods),
        )
    else:
        log.debug(
            "[FinancialsCache] %s %s unchanged, refreshed fetched_at",
            ticker.upper(),
            cache_type,
        )

    db.commit()
    db.refresh(obj)
    return obj


def financials_row_to_dict(obj: FinancialsCache) -> dict:
    if obj.cache_type == "earnings":
        return {
            "periods": obj.periods,
            "revenue": obj.col_a,
            "eps": obj.col_b,
            "net_income": obj.col_c,
        }
    if obj.cache_type == "cashflow":
        return {
            "periods": obj.periods,
            "capex": obj.col_a,
            "fcf": obj.col_b,
            "net_debt": obj.col_c,
        }
    if obj.cache_type == "dividends":
        return {
            "periods": obj.periods,
            "amounts": obj.col_a,
        }
    return {
        "periods": obj.periods,
        "assets": obj.col_a,
        "liabilities": obj.col_b,
        "equity": obj.col_c,
        "net_cash": obj.col_d or [],
    }


# ── Daily price history ────────────────────────────────────────────────────────


def get_latest_daily_date(db: Session, ticker: str) -> Optional[str]:
    """Return the most recent date string stored for a ticker, or None."""
    stmt = (
        select(DailyPriceHistory.date)
        .where(DailyPriceHistory.ticker == ticker.upper())
        .order_by(desc(DailyPriceHistory.date))
        .limit(1)
    )
    return db.scalars(stmt).first()


def get_oldest_daily_date(db: Session, ticker: str) -> Optional[str]:
    """Return the oldest date string stored for a ticker, or None."""
    stmt = (
        select(DailyPriceHistory.date)
        .where(DailyPriceHistory.ticker == ticker.upper())
        .order_by(DailyPriceHistory.date)
        .limit(1)
    )
    return db.scalars(stmt).first()


def upsert_daily_price_rows(db: Session, ticker: str, rows: list[dict]) -> int:
    """
    Upsert a list of OHLCV dicts into daily_price_history.
    Each dict must have 'date' (YYYY-MM-DD) and at least 'close'.
    Returns the number of rows inserted/updated.
    """
    from sqlalchemy.dialects.postgresql import insert as pg_insert

    if not rows:
        return 0
    t = ticker.upper()
    count = 0
    for row in rows:
        stmt = (
            pg_insert(DailyPriceHistory)
            .values(
                ticker=t,
                date=row["date"],
                close=row.get("close"),
                open=row.get("open"),
                high=row.get("high"),
                low=row.get("low"),
                volume=row.get("volume"),
                change_pct=row.get("change_pct"),
                source=row.get("source", "history"),
            )
            .on_conflict_do_update(
                constraint="uq_daily_price_history_ticker_date",
                set_={
                    "close": row.get("close"),
                    "open": row.get("open"),
                    "high": row.get("high"),
                    "low": row.get("low"),
                    "volume": row.get("volume"),
                    "change_pct": row.get("change_pct"),
                    "source": row.get("source", "history"),
                },
            )
        )
        db.execute(stmt)
        count += 1
    db.commit()
    log.info("[DailyPriceHistory] Upserted %d rows for %s", count, t)
    return count


def get_daily_price_history(db: Session, ticker: str, days: int) -> list[dict]:
    """Return daily price rows for a ticker for the last N days, oldest first."""
    from datetime import date, timedelta

    since = (date.today() - timedelta(days=days)).isoformat()
    stmt = (
        select(DailyPriceHistory)
        .where(
            DailyPriceHistory.ticker == ticker.upper(),
            DailyPriceHistory.date >= since,
        )
        .order_by(DailyPriceHistory.date)
    )
    return [
        {
            "ts": r.date,
            "price": r.close,
            "change_pct": r.change_pct,
        }
        for r in db.scalars(stmt).all()
    ]


def get_correlation_matrix(db: Session, tickers: list[str], days: int) -> dict:
    """
    Compute pairwise Pearson correlation of daily returns for a list of tickers.
    Uses daily_price_history.change_pct over the last `days` calendar days.
    Returns { tickers: [...], matrix: [[...], ...] }.
    """
    from datetime import date, timedelta

    since = (date.today() - timedelta(days=days)).isoformat()
    upper = [t.upper() for t in tickers]

    stmt = (
        select(
            DailyPriceHistory.ticker,
            DailyPriceHistory.date,
            DailyPriceHistory.change_pct,
        )
        .where(
            DailyPriceHistory.ticker.in_(upper),
            DailyPriceHistory.date >= since,
            DailyPriceHistory.change_pct.isnot(None),
        )
        .order_by(DailyPriceHistory.date)
    )
    rows = db.execute(stmt).fetchall()

    # Build {ticker: {date: return}} mapping
    from collections import defaultdict

    series: dict[str, dict[str, float]] = defaultdict(dict)
    all_dates: set[str] = set()
    for ticker, date_str, chg in rows:
        series[ticker][date_str] = chg
        all_dates.add(date_str)

    sorted_dates = sorted(all_dates)
    present = [t for t in upper if t in series]
    if len(present) < 2 or not sorted_dates:
        return {"tickers": present, "matrix": []}

    # Build returns matrix — fill missing with 0
    import math

    mat = [[series[t].get(d, 0.0) for d in sorted_dates] for t in present]

    def pearson(a: list[float], b: list[float]) -> float:
        n = len(a)
        if n < 2:
            return 0.0
        ma = sum(a) / n
        mb = sum(b) / n
        num = sum((a[i] - ma) * (b[i] - mb) for i in range(n))
        dena = math.sqrt(sum((x - ma) ** 2 for x in a))
        denb = math.sqrt(sum((x - mb) ** 2 for x in b))
        if dena == 0 or denb == 0:
            return 0.0
        return round(num / (dena * denb), 4)

    n = len(present)
    matrix = [[pearson(mat[i], mat[j]) for j in range(n)] for i in range(n)]
    return {"tickers": present, "matrix": matrix}


def get_portfolio_analytics(db: Session, user_id: int, days: int) -> dict:
    """
    Compute max drawdown and annualised Sharpe ratio from portfolio_snapshots
    for the last `days` calendar days.
    Uses ngx_equity_ngn as the value series.
    Returns { max_drawdown_pct, sharpe, data_points }.
    """
    import math

    snaps = get_portfolio_history(db, days=days, user_id=user_id)
    values = [s.ngx_equity_ngn for s in snaps if s.ngx_equity_ngn > 0]

    if len(values) < 2:
        return {"max_drawdown_pct": None, "sharpe": None, "data_points": len(values)}

    # Max drawdown
    peak = values[0]
    max_dd = 0.0
    for v in values:
        peak = max(peak, v)
        dd = (peak - v) / peak if peak > 0 else 0
        max_dd = max(max_dd, dd)

    # Daily returns
    returns = [
        (values[i] - values[i - 1]) / values[i - 1] for i in range(1, len(values))
    ]
    mean_r = sum(returns) / len(returns)
    std_r = math.sqrt(sum((r - mean_r) ** 2 for r in returns) / len(returns))
    sharpe = round((mean_r / std_r) * math.sqrt(252), 3) if std_r > 0 else None

    return {
        "max_drawdown_pct": round(max_dd * 100, 2),
        "sharpe": sharpe,
        "data_points": len(values),
    }


# ── Watchlist ──────────────────────────────────────────────────────────────────


def get_watchlist(db: Session, user_id: int) -> list[Watchlist]:
    stmt = (
        select(Watchlist)
        .where(Watchlist.user_id == user_id)
        .order_by(Watchlist.added_at)
    )
    return list(db.scalars(stmt).all())


def set_watchlist_added_price(db: Session, watchlist_id: int, price: float) -> None:
    stmt = select(Watchlist).where(Watchlist.id == watchlist_id)
    row = db.scalar(stmt)
    if row:
        row.added_price = price
        db.commit()


def watchlist_has(db: Session, user_id: int, ticker: str) -> bool:
    stmt = select(Watchlist.id).where(
        Watchlist.user_id == user_id,
        Watchlist.ticker == ticker.upper(),
    )
    return db.scalar(stmt) is not None


def add_to_watchlist(
    db: Session,
    user_id: int,
    ticker: str,
    market: str = "NGX",
    added_price: float | None = None,
) -> Watchlist:
    row = Watchlist(
        user_id=user_id, ticker=ticker.upper(), market=market, added_price=added_price
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def remove_from_watchlist(db: Session, user_id: int, ticker: str) -> bool:
    stmt = select(Watchlist).where(
        Watchlist.user_id == user_id,
        Watchlist.ticker == ticker.upper(),
    )
    row = db.scalar(stmt)
    if not row:
        return False
    db.delete(row)
    db.commit()
    return True


# ── Analysis History ───────────────────────────────────────────────────────────


def save_analysis(
    db: Session,
    user_id: int,
    scope: str,
    depth: str,
    model_used: str,
    summary: str,
    full_response: str,
    context_hash: str,
    tokens_used: int,
) -> AnalysisHistory:
    row = AnalysisHistory(
        user_id=user_id,
        scope=scope,
        depth=depth,
        model_used=model_used,
        summary=summary,
        full_response=full_response,
        context_hash=context_hash,
        tokens_used=tokens_used,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def get_analysis_history(
    db: Session, user_id: int, limit: int = 50
) -> list[AnalysisHistory]:
    stmt = (
        select(AnalysisHistory)
        .where(AnalysisHistory.user_id == user_id)
        .order_by(desc(AnalysisHistory.created_at))
        .limit(limit)
    )
    return list(db.scalars(stmt).all())


def get_analysis_by_id(
    db: Session, analysis_id: int, user_id: int
) -> Optional[AnalysisHistory]:
    stmt = select(AnalysisHistory).where(
        AnalysisHistory.id == analysis_id,
        AnalysisHistory.user_id == user_id,
    )
    return db.scalar(stmt)


def get_latest_analysis(
    db: Session, user_id: int, scope: str
) -> Optional[AnalysisHistory]:
    stmt = (
        select(AnalysisHistory)
        .where(
            AnalysisHistory.user_id == user_id,
            AnalysisHistory.scope == scope,
        )
        .order_by(desc(AnalysisHistory.created_at))
        .limit(1)
    )
    return db.scalar(stmt)


def count_deep_analyses_today(db: Session, user_id: int) -> int:
    today_start = datetime.now(timezone.utc).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    stmt = select(AnalysisHistory).where(
        AnalysisHistory.user_id == user_id,
        AnalysisHistory.depth == "deep",
        AnalysisHistory.created_at >= today_start,
    )
    return len(list(db.scalars(stmt).all()))


def delete_analysis_history(db: Session, user_id: int) -> int:
    stmt = select(AnalysisHistory).where(AnalysisHistory.user_id == user_id)
    rows = list(db.scalars(stmt).all())
    for row in rows:
        db.delete(row)
    db.commit()
    return len(rows)
