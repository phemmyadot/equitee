"""
Data Router
===========
GET /api/data   — full portfolio payload (prices + P&L + sectors + KPIs)
GET /api/dividends — dividend data for portfolio holdings
GET /api/data/{ticker} — comprehensive data for a single ticker

Main endpoints consumed by the frontend.
Orchestrates all services and returns structured responses.
"""

from fastapi import APIRouter, HTTPException, Path

from app.services import ngx as ngx_service
from app.services import ngx_backup as ngx_service2
from app.services import yahoo as yahoo_service
from app.services import fx as fx_service
from app.services import dividends as dividends_service
from app.services import prices as prices_service
from app.services import profile as profile_service
from app.services import performance as overview_service  # performance.py exports get_overview()
from app.services import overview as performance_service  # overview.py exports get_performance()
from app.services.portfolio import build_portfolio_response, load_holdings
from app.models import PortfolioDataResponse

router = APIRouter(prefix="/api", tags=["data"])


@router.get("/data", response_model=PortfolioDataResponse)
async def get_data():
    """Return full portfolio data (prices + P&L + sectors + KPIs)"""
    try:
        fx         = fx_service.get_rate()
        
        holdings   = load_holdings()
        ngx_tickers = [h["ticker"] for h in holdings["ngx"]]
        us_tickers = [h["ticker"] for h in holdings["us"]]
        
        # Get NGX prices with volumes enriched from individual pages
        ngx_prices = ngx_service.enrich_with_volumes(ngx_tickers)
        us_prices  = yahoo_service.get_prices(us_tickers)

        return build_portfolio_response(
            ngx_prices    = ngx_prices,
            us_prices     = us_prices,
            fx            = fx,
            ngx_price_age = ngx_service.cache_age(),
            us_price_age  = yahoo_service.cache_age(),
        )

    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

@router.get("/dividends")
async def get_dividends():
    """Return dividend data for all portfolio holdings"""
    try:
        holdings = load_holdings()
        ngx_tickers = [h["ticker"] for h in holdings["ngx"]]

        return dividends_service.get_dividends(ngx_tickers)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/data/{ticker}")
async def get_ticker_data(
    ticker: str = Path(..., description="Stock ticker symbol (e.g., MTNN, GOOGL)")
):
    """
    Return comprehensive data for a single ticker including:
    - Price and market data
    - Company profile
    - Overview/fundamentals (PE, earnings, etc.)
    - Performance metrics (returns, volatility, etc.)
    """
    try:
        ticker = ticker.upper()
        
        # Fetch data from all services
        price_data = prices_service.get_price(ticker)
        
        # Enrich with volume from individual ticker page (like we do in portfolio)
        if price_data:
            volume = ngx_service._get_volume_for_ticker(ticker)
            if volume:
                price_data.volume = volume
        
        profile_data = profile_service.get_profile(ticker)
        overview_data = overview_service.get_overview(ticker)
        performance_data = performance_service.get_performance(ticker)
        
        # Build lean response with only relevant NGX fields
        response = {
            "ticker": ticker,
            "price": {
                "symbol": price_data.symbol,
                "price": price_data.price,
                "change": price_data.change,
                "change_pct": price_data.change_pct,
                "volume": price_data.volume,
            } if price_data else None,
            "profile": {
                "symbol": profile_data["symbol"],
                "name": profile_data["name"],
                "industry": profile_data["industry"],
                "website": profile_data["website"],
                "founded": profile_data["founded"],
            } if profile_data else None,
            "overview": {
                "market_cap": overview_data["market_cap"],
                "pe_ratio": overview_data["pe_ratio"],
                "eps": overview_data["eps"],
                "dividend_yield": overview_data["dividend_yield"],
                "roe": overview_data["roe"],
                "debt_to_equity": overview_data["debt_to_equity"],
                "book_value": overview_data["book_value"],
            } if overview_data else None,
            "performance": {
                "beta": performance_data["beta"],
                "return_1y": performance_data["return_1y"],
            } if performance_data else None,
            "cached_at": ngx_service.cache_age(),
        }
        
        return response
        
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))