"""
Seed the admin user's portfolio from portfolio.json.

Called once at startup if the admin user has no holdings yet.
If portfolio.json is absent (non-Render environments, fresh installs),
the function is a no-op — users start blank and add positions via Settings.
"""

import json
import logging
from pathlib import Path

from sqlalchemy.orm import Session
from sqlalchemy import select, func

from app.db.models import Holding, ClosedPosition
from app.config import settings

log = logging.getLogger(__name__)

_ADMIN_USER_ID = 1


def _admin_is_seeded(db: Session) -> bool:
    """Return True if the admin already has holdings."""
    count = db.scalar(
        select(func.count())
        .select_from(Holding)
        .where(Holding.user_id == _ADMIN_USER_ID)
    )
    return (count or 0) > 0


def seed_from_json(db: Session) -> None:
    """
    Read portfolio.json and insert all holdings + closed positions for the admin user.
    No-ops if:
      - the admin already has holdings, or
      - portfolio.json does not exist at the configured path.
    """
    if _admin_is_seeded(db):
        log.info("Admin portfolio already seeded — skipping.")
        return

    path = settings.PORTFOLIO_FILE
    if not Path(path).exists():
        log.info(
            "portfolio.json not found at %s — admin starts with no holdings.", path
        )
        return

    with open(path) as f:
        data = json.load(f)

    count = 0

    for h in data.get("ngx", []):
        db.add(
            Holding(
                user_id=_ADMIN_USER_ID,
                ticker=h["ticker"],
                name=h["name"],
                market="ngx",
                shares=float(h["shares"]),
                avg_cost=float(h["avg_cost"]),
                sector=h.get("sector", ""),
                is_active=True,
            )
        )
        count += 1

    for h in data.get("us", []):
        db.add(
            Holding(
                user_id=_ADMIN_USER_ID,
                ticker=h["ticker"],
                name=h["name"],
                market="us",
                shares=float(h["shares"]),
                avg_cost=float(h["avg_cost"]),
                sector=h.get("sector", ""),
                is_active=True,
            )
        )
        count += 1

    for s in data.get("sold", []):
        db.add(
            ClosedPosition(
                user_id=_ADMIN_USER_ID,
                ticker=s["ticker"],
                name=s["name"],
                market=s["market"].lower(),
                realized_pl=float(s["realized_pl"]),
            )
        )

    db.commit()
    log.info(
        "Seeded %d holdings + %d closed positions for admin from portfolio.json.",
        count,
        len(data.get("sold", [])),
    )
