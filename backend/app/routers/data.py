"""
Data Router
===========
GET /api/data  — full portfolio payload (prices + P&L + sectors + KPIs)
"""

import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.engine import get_db
from app.db.models import User
from app.auth.dependencies import get_current_user
from app.services import ngx_job
from app.services import yahoo as yahoo_service
from app.services import fx as fx_service
from app.services.portfolio import build_portfolio_response, load_holdings_from_db
from app.models import PortfolioDataResponse

log = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["data"])


@router.get("/data", response_model=PortfolioDataResponse)
async def get_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        fx = fx_service.get_rate()
        ngx_prices = ngx_job.get_prices_dict()

        holdings = load_holdings_from_db(db, current_user.id)
        us_tickers = [h["ticker"] for h in holdings["us"]]
        us_prices = yahoo_service.get_prices(us_tickers)

        return build_portfolio_response(
            ngx_prices=ngx_prices,
            us_prices=us_prices,
            fx=fx,
            ngx_price_age=ngx_job.cache_age(),
            us_price_age=yahoo_service.cache_age(),
            db=db,
            user_id=current_user.id,
        )

    except Exception:
        log.exception("Error building portfolio response")
        raise HTTPException(status_code=500, detail="Failed to load portfolio data")
