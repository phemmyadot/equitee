"""
Seed the database from portfolio.json.

Called once at startup if the holdings table is empty.
After seeding, portfolio.json is no longer read — the DB is the source of truth.
"""

import json
import logging
from pathlib import Path

from sqlalchemy.orm import Session
from sqlalchemy import select, func

from app.db.models import Holding, ClosedPosition
from app.config import settings

log = logging.getLogger(__name__)


def is_seeded(db: Session) -> bool:
    """Return True if holdings table already has rows."""
    count = db.scalar(select(func.count()).select_from(Holding))
    return (count or 0) > 0


def seed_from_json(db: Session) -> None:
    """
    Read portfolio.json and insert all holdings + closed positions.
    No-ops if the table is already populated.
    """
    if is_seeded(db):
        log.info("DB already seeded — skipping.")
        return

    path = settings.PORTFOLIO_FILE
    if not Path(path).exists():
        log.warning("portfolio.json not found at %s — DB will be empty.", path)
        return

    with open(path) as f:
        data = json.load(f)

    count = 0

    # Active NGX holdings
    for h in data.get("ngx", []):
        db.add(Holding(
            ticker    = h["ticker"],
            name      = h["name"],
            market    = "ngx",
            shares    = float(h["shares"]),
            avg_cost  = float(h["avg_cost"]),
            sector    = h.get("sector", ""),
            is_active = True,
        ))
        count += 1

    # Active US holdings
    for h in data.get("us", []):
        db.add(Holding(
            ticker    = h["ticker"],
            name      = h["name"],
            market    = "us",
            shares    = float(h["shares"]),
            avg_cost  = float(h["avg_cost"]),
            sector    = h.get("sector", ""),
            is_active = True,
        ))
        count += 1

    # Closed / sold positions
    for s in data.get("sold", []):
        db.add(ClosedPosition(
            ticker      = s["ticker"],
            name        = s["name"],
            market      = s["market"].lower(),
            realized_pl = float(s["realized_pl"]),
        ))

    db.commit()
    log.info("Seeded %d holdings + %d closed positions from portfolio.json.",
             count, len(data.get("sold", [])))