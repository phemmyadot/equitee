"""
Dividends Router
================
GET /api/dividends   — dividend summary with totals (sorted by upcoming)
"""

from fastapi import APIRouter, HTTPException
from app.services import dividends as dividends_service
from app.services.portfolio import load_holdings
from app.models import DividendSummary

router = APIRouter(prefix="/api/dividends", tags=["dividends"])

@router.get("", response_model=DividendSummary)
async def get_dividends():
    """Get dividend summary for portfolio holdings with totals (sorted by upcoming)."""
    try:
        holdings = load_holdings()
        ngx_holdings = holdings["ngx"]
        
        summary = dividends_service.get_dividends(ngx_holdings)
        
        return DividendSummary(**summary)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
