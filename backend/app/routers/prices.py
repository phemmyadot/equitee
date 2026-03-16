"""
Prices Router
=============
GET /api/prices/ngx   — full NGX equity price table
GET /api/prices/us    — US stock prices for portfolio holdings
"""

import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.engine import get_db
from app.db.models import User
from app.auth.dependencies import get_current_user
from app.services import ngx as ngx_service
from app.services import yahoo as yahoo_service
from app.services.portfolio import load_holdings_from_db
from app.models import NGXPricesResponse, USPricesResponse

log = logging.getLogger(__name__)
router = APIRouter(prefix="/api/prices", tags=["prices"])


@router.get("/ngx", response_model=NGXPricesResponse)
async def get_ngx_prices(current_user: User = Depends(get_current_user)):
    try:
        prices = ngx_service.get_prices()
        return NGXPricesResponse(
            count   = len(prices),
            age_sec = ngx_service.cache_age() or 0,
            source  = "doclib.ngxgroup.com",
            prices  = prices,
        )
    except Exception:
        log.exception("Error fetching NGX prices")
        raise HTTPException(status_code=500, detail="Failed to fetch NGX prices")


@router.get("/us", response_model=USPricesResponse)
async def get_us_prices(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        holdings = load_holdings_from_db(db, current_user.id)
        tickers  = [h["ticker"] for h in holdings["us"]]
        prices   = yahoo_service.get_prices(tickers)
        return USPricesResponse(
            count   = len(prices),
            age_sec = yahoo_service.cache_age() or 0,
            source  = "Yahoo Finance",
            prices  = prices,
        )
    except Exception:
        log.exception("Error fetching US prices")
        raise HTTPException(status_code=500, detail="Failed to fetch US prices")
