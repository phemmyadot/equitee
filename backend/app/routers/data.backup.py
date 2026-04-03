"""
Data Router (BACKUP - Original version)
========================================
GET /api/data   — full portfolio payload (prices + P&L + sectors + KPIs)

This is the primary endpoint consumed by the frontend.
It orchestrates all three services and returns a single typed response.
"""

from fastapi import APIRouter, HTTPException

from app.services import ngx as ngx_service
from app.services import yahoo as yahoo_service
from app.services import fx as fx_service
from app.services.portfolio import build_portfolio_response, load_holdings
from app.models import PortfolioDataResponse

router = APIRouter(prefix="/api", tags=["data"])


@router.get("/data", response_model=PortfolioDataResponse)
async def get_data():
    try:
        fx = fx_service.get_rate()
        ngx_prices = ngx_service.get_prices()

        holdings = load_holdings()
        us_tickers = [h["ticker"] for h in holdings["us"]]
        us_prices = yahoo_service.get_prices(us_tickers)

        return build_portfolio_response(
            ngx_prices=ngx_prices,
            us_prices=us_prices,
            fx=fx,
            ngx_price_age=ngx_service.cache_age(),
            us_price_age=yahoo_service.cache_age(),
        )

    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
