"""
Database engine, session factory and declarative Base.
All other db modules import from here — never recreate these objects.
"""

import logging
import os
import re
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from app.config import settings

log = logging.getLogger(__name__)


def _ensure_db_dir(url: str) -> None:
    """
    For SQLite URLs, ensure the parent directory exists.
    Logs exactly what path it resolves to so we can debug Render disk issues.
    """
    m = re.match(r"sqlite:/{3,4}(.+)", url)
    if not m:
        log.info("[DB] Non-SQLite URL — skipping dir creation: %s", url[:40])
        return

    raw = m.group(1)
    db_path = Path(raw) if os.path.isabs(raw) else Path.cwd() / raw
    db_path = db_path.resolve()

    log.info("[DB] DATABASE_URL  : %s", url)
    log.info("[DB] Resolved path : %s", db_path)
    log.info("[DB] Parent dir    : %s", db_path.parent)
    log.info("[DB] Parent exists : %s", db_path.parent.exists())
    log.info("[DB] CWD           : %s", Path.cwd())

    try:
        db_path.parent.mkdir(parents=True, exist_ok=True)
        log.info("[DB] Directory ready: %s", db_path.parent)
    except OSError as exc:
        log.error("[DB] Could not create directory %s: %s", db_path.parent, exc)
        raise


_ensure_db_dir(settings.DATABASE_URL)


def _normalise_url(url: str) -> str:
    """
    Render (and most PaaS) provide DATABASE_URL as postgres:// or postgresql://.
    SQLAlchemy + psycopg3 requires postgresql+psycopg://.
    SQLite URLs are passed through unchanged.
    """
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+psycopg://", 1)
    elif url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+psycopg://", 1)
    return url


_db_url = _normalise_url(settings.DATABASE_URL)
_is_sqlite = _db_url.startswith("sqlite")
engine = create_engine(
    _db_url,
    connect_args={"check_same_thread": False} if _is_sqlite else {},
    echo=False,
)

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


class Base(DeclarativeBase):
    pass


def get_db():
    """FastAPI dependency — yields a DB session and guarantees close."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
