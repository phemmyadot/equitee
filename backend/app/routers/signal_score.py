"""
Signal Score Router
===================
Routes:
  GET  /api/signal-score/{market}/{ticker}   — compute score for one ticker
  GET  /api/signal-score/batch               — scores for all active portfolio holdings
  POST /api/signal-score/{market}/{ticker}/invalidate — clear cache, force recompute
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.db.engine import get_db
from app.db.models import User
from app.db.crud import get_all_active_holdings
from app.services import signal_score as _score_svc

log = logging.getLogger(__name__)

router = APIRouter(prefix="/api/signal-score", tags=["signal-score"])


def _score_or_404(ticker: str, market: str) -> dict:
    result = _score_svc.compute_signal_score(ticker, market)
    if result is None:
        raise HTTPException(
            status_code=503,
            detail="Signal Score unavailable — check ANTHROPIC_API_KEY or try again.",
        )
    return result


@router.get("/{market}/{ticker}")
def get_signal_score(
    market: str,
    ticker: str,
    current_user: User = Depends(get_current_user),
):
    """Compute (or return cached) Signal Score for a single ticker."""
    market = market.lower()
    if market not in ("ngx", "us"):
        raise HTTPException(status_code=400, detail="market must be ngx or us")
    return _score_or_404(ticker.upper(), market)


@router.get("/batch")
def get_batch_scores(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return Signal Scores for all active portfolio holdings.
    Scores are computed concurrently where possible (cached results return instantly).
    Missing scores are omitted rather than failing the whole batch.
    """
    holdings = get_all_active_holdings(db, current_user.id)
    results = []
    for h in holdings:
        score = _score_svc.compute_signal_score(h.ticker, h.market)
        if score:
            results.append(score)
        else:
            log.warning("[SignalScore] batch: skipping %s/%s (compute failed)", h.market, h.ticker)
    return results


@router.post("/{market}/{ticker}/invalidate")
def invalidate_signal_score(
    market: str,
    ticker: str,
    current_user: User = Depends(get_current_user),
):
    """Clear the cached score for a ticker so the next GET recomputes it."""
    _score_svc.invalidate_cache(ticker.upper(), market.lower())
    return {"invalidated": f"{market.lower()}:{ticker.upper()}"}
