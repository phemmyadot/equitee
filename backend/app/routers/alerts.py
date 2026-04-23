"""
Alerts Router
=============
POST   /api/alerts           — create a price alert
DELETE /api/alerts/{id}      — delete an alert
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session

from app.db.engine import get_db
from app.db.models import User
from app.db.crud import create_alert, delete_alert
from app.auth.dependencies import get_current_user

log = logging.getLogger(__name__)

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


class AlertOut(BaseModel):
    id: int
    ticker: str
    market: str
    threshold_price: float
    direction: str
    is_active: bool
    triggered_at: Optional[str] = None
    note: Optional[str] = None
    created_at: str


def _fmt(alert) -> AlertOut:
    return AlertOut(
        id=alert.id,
        ticker=alert.ticker,
        market=alert.market,
        threshold_price=alert.threshold_price,
        direction=alert.direction,
        is_active=alert.is_active,
        triggered_at=alert.triggered_at.isoformat() if alert.triggered_at else None,
        note=alert.note,
        created_at=alert.created_at.isoformat(),
    )


@router.get("", response_model=AlertsResponse)
def list_alerts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rows = get_alerts(db, current_user.id)
    return AlertsResponse(alerts=[_fmt(r) for r in rows])


@router.post("", status_code=201, response_model=AlertOut)
def add_alert(
    ticker: str = Query(...),
    market: str = Query("NGX", pattern="^(NGX|US)$"),
    threshold_price: float = Query(...),
    direction: str = Query(..., pattern="^(above|below)$"),
    note: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    alert = create_alert(
        db,
        current_user.id,
        ticker,
        market,
        threshold_price,
        direction,
        note,
    )
    return _fmt(alert)


@router.delete("/{alert_id}", status_code=200)
def remove_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    removed = delete_alert(db, current_user.id, alert_id)
    if not removed:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"id": alert_id, "removed": True}
