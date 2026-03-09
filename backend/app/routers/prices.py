"""
Prices Router
=============
GET /api/prices/ngx   — full NGX equity price table
GET /api/prices/us    — US stock prices for portfolio holdings
"""

import time
from fastapi import APIRouter, HTTPException

from app.services import ngx as ngx_service
from app.services import yahoo as yahoo_service
from app.services.portfolio import load_holdings
from app.models import NGXPricesResponse, USPricesResponse

router = APIRouter(prefix="/api/prices", tags=["prices"])


@router.get("/ngx", response_model=NGXPricesResponse)
async def get_ngx_prices():
    try:
        prices = ngx_service.get_prices()
        return NGXPricesResponse(
            count   = len(prices),
            age_sec = ngx_service.cache_age() or 0,
            source  = "doclib.ngxgroup.com",
            prices  = prices,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/us", response_model=USPricesResponse)
async def get_us_prices():
    try:
        holdings = load_holdings()
        tickers  = [h["ticker"] for h in holdings["us"]]
        prices   = yahoo_service.get_prices(tickers)
        return USPricesResponse(
            count   = len(prices),
            age_sec = yahoo_service.cache_age() or 0,
            source  = "Yahoo Finance",
            prices  = prices,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))