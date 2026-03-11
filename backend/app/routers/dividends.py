"""
Dividends Router
================
GET /api/dividends/{ticker}   — upcoming dividend for single ticker
GET /api/dividends            — upcoming dividends for portfolio holdings
"""

from fastapi import APIRouter, HTTPException
from app.services import dividends as dividends_service
from app.services.portfolio import load_holdings
from app.models import DividendInfo, DividendsResponse

router = APIRouter(prefix="/api/dividends", tags=["dividends"])


@router.get("/{ticker}", response_model=DividendInfo)
async def get_dividend(ticker: str):
    """Get upcoming dividend information for a single ticker."""
    try:
        result = dividends_service.get_dividend(ticker.upper())
        if result is None:
            raise HTTPException(status_code=404, 
                              detail=f"No dividend data found for {ticker}")
        return result
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("", response_model=DividendsResponse)
async def get_all_dividends():
    """Get upcoming dividend information for all NGX portfolio holdings."""
    try:
        holdings = load_holdings()
        tickers = [h["ticker"] for h in holdings["ngx"]]
        
        dividends = dividends_service.get_dividends(tickers)
        
        return DividendsResponse(
            count=sum(1 for d in dividends.values() if d is not None),
            age_sec=dividends_service.cache_age() or 0,
            source="stockanalysis.com",
            dividends=dividends,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
