"""
Screener Router
===============
GET /api/screener/ngx        — all NGX tickers with prices + fundamentals (from DB)
POST /api/screener/ngx/warm  — (admin) trigger a job run now
"""

import logging
from fastapi import APIRouter, Depends

from app.auth.dependencies import get_current_user, get_current_admin
from app.db.models import User
from app.services import ngx_job

log = logging.getLogger(__name__)
router = APIRouter(prefix="/api/screener", tags=["screener"])


@router.get("/ngx/status")
def ngx_job_status(_: User = Depends(get_current_user)):
    """Current NGX job state — used by FE to show last_updated."""
    return ngx_job.job_status()


@router.get("/ngx")
def ngx_screener(current_user: User = Depends(get_current_user)):
    rows = ngx_job.get_all()
    rows.sort(key=lambda r: r["ticker"])
    return {
        "count": len(rows),
        "tickers": rows,
        "last_updated": ngx_job.last_updated(),
    }


@router.post("/ngx/warm")
def warm_screener_cache(_admin: User = Depends(get_current_admin)):
    """Trigger a full NGX job run immediately (admin only)."""
    import threading
    threading.Thread(target=ngx_job.run_job, daemon=True).start()
    return {"status": "job started"}
