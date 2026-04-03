"""
Analysis Router
===============
Claude AI portfolio analysis endpoints.

Routes:
  GET  /analysis/context        — assembled context payload + hash (debug/transparency)
  POST /analysis/run            — streams SSE Claude analysis
  GET  /analysis/history        — list of past analyses (newest-first, max 50)
  GET  /analysis/{id}           — full stored analysis by ID
  DELETE /analysis/history      — clear all history for current user
"""

from __future__ import annotations

import json
import logging

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.db.engine import get_db
from app.db.models import User
from app.db.crud import (
    count_deep_analyses_today,
    delete_analysis_history,
    get_analysis_by_id,
    get_analysis_history,
    get_latest_analysis,
)
from app.services.analysis import (
    build_context,
    compute_context_hash,
    stream_analysis_sse,
)
from app.config import settings

log = logging.getLogger(__name__)

router = APIRouter(prefix="/analysis", tags=["analysis"])


# ── Schemas ───────────────────────────────────────────────────────────────────


class RunAnalysisRequest(BaseModel):
    scope: str = "portfolio"  # portfolio | watchlist | combined
    depth: str = "quick"  # quick | deep


class AnalysisSummary(BaseModel):
    id: int
    created_at: str
    scope: str
    depth: str
    model_used: str
    summary: str | None
    tokens_used: int | None


class AnalysisDetail(AnalysisSummary):
    full_response: str | None
    context_hash: str | None


# ── Helpers ───────────────────────────────────────────────────────────────────


def _to_summary(row) -> AnalysisSummary:
    return AnalysisSummary(
        id=row.id,
        created_at=row.created_at.isoformat(),
        scope=row.scope,
        depth=row.depth,
        model_used=row.model_used,
        summary=row.summary,
        tokens_used=row.tokens_used,
    )


def _to_detail(row) -> AnalysisDetail:
    return AnalysisDetail(
        id=row.id,
        created_at=row.created_at.isoformat(),
        scope=row.scope,
        depth=row.depth,
        model_used=row.model_used,
        summary=row.summary,
        full_response=row.full_response,
        context_hash=row.context_hash,
        tokens_used=row.tokens_used,
    )


# ── Endpoints ─────────────────────────────────────────────────────────────────


@router.get("/context")
def get_context(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return the assembled portfolio context + hash without running an analysis."""
    ctx = build_context(db, current_user.id)
    ctx_hash = compute_context_hash(ctx)
    return {"hash": ctx_hash, "context": ctx}


@router.post("/run")
def run_analysis(
    body: RunAnalysisRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    scope = body.scope.lower()
    depth = body.depth.lower()

    if scope not in ("portfolio", "watchlist", "combined"):
        raise HTTPException(status_code=400, detail="scope must be portfolio, watchlist, or combined")
    if depth not in ("quick", "deep"):
        raise HTTPException(status_code=400, detail="depth must be quick or deep")

    # Rate-limit deep analyses
    if depth == "deep":
        count = count_deep_analyses_today(db, current_user.id)
        if count >= settings.ANALYSIS_DAILY_DEEP_LIMIT:
            raise HTTPException(
                status_code=429,
                detail=f"Daily limit of {settings.ANALYSIS_DAILY_DEEP_LIMIT} deep analyses reached. Try again tomorrow.",
            )

    ctx = build_context(db, current_user.id)
    ctx_hash = compute_context_hash(ctx)

    # Return cached result for quick analyses when context hasn't changed
    if depth == "quick":
        latest = get_latest_analysis(db, current_user.id, scope)
        if latest and latest.context_hash == ctx_hash and latest.full_response:
            log.info("Returning cached analysis for user %s scope=%s", current_user.id, scope)

            def _replay():
                # Stream cached text in chunks to match SSE format
                text = latest.full_response or ""
                chunk_size = 80
                for i in range(0, len(text), chunk_size):
                    yield f"data: {json.dumps({'text': text[i:i + chunk_size]})}\n\n"
                yield f"data: {json.dumps({'done': True, 'id': latest.id, 'tokens': 0, 'cached': True})}\n\n"

            return StreamingResponse(
                _replay(),
                media_type="text/event-stream",
                headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
            )

    return StreamingResponse(
        stream_analysis_sse(
            user_id=current_user.id,
            scope=scope,
            depth=depth,
            ctx=ctx,
        ),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.get("/history", response_model=list[AnalysisSummary])
def list_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rows = get_analysis_history(db, current_user.id)
    return [_to_summary(r) for r in rows]


@router.get("/{analysis_id}", response_model=AnalysisDetail)
def get_analysis(
    analysis_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    row = get_analysis_by_id(db, analysis_id, current_user.id)
    if not row:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return _to_detail(row)


@router.delete("/history")
def clear_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    deleted = delete_analysis_history(db, current_user.id)
    return {"deleted": deleted}
