"""
Database engine, session factory and declarative Base.
All other db modules import from here — never recreate these objects.
"""

import re
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from app.config import settings


def _ensure_db_dir(url: str) -> None:
    """
    If the DATABASE_URL points to a local SQLite file, make sure the parent
    directory exists. Render (and other PaaS) mount persistent disks after the
    container starts — the directory may not exist on first boot.
    """
    # Match both sqlite:/// (relative) and sqlite://// (absolute) forms
    m = re.match(r"sqlite:/{3,4}(.+)", url)
    if not m:
        return
    db_path = Path(m.group(1))
    if not db_path.is_absolute():
        db_path = Path.cwd() / db_path
    db_path.parent.mkdir(parents=True, exist_ok=True)


_ensure_db_dir(settings.DATABASE_URL)

engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False},  # required for SQLite + FastAPI
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