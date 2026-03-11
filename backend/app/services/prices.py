"""
Prices Service
==============
Extracts and normalizes price data for NGX stocks.

Returns current price, high, low, volume, market cap, and related metrics.
"""

import logging
from typing import Optional, Dict
from app.services import ngx as ngx_service
from app.models import NGXPrice

log = logging.getLogger(__name__)


def get_all_prices() -> Dict[str, NGXPrice]:
    """Get prices for all NGX stocks."""
    return ngx_service.get_prices()


def get_price(ticker: str) -> Optional[NGXPrice]:
    """Get price data for a single ticker."""
    return ngx_service.get_price(ticker.upper())


def get_prices_by_tickers(tickers: list) -> Dict[str, Optional[NGXPrice]]:
    """Get prices for multiple tickers."""
    prices = ngx_service.get_prices()
    return {ticker.upper(): prices.get(ticker.upper()) for ticker in tickers}


def cache_age() -> Optional[int]:
    """Return cache age in seconds."""
    return ngx_service.cache_age()
