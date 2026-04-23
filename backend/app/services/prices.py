"""
Prices Service
==============
Thin wrapper around ngx_job for NGX price access.
"""

from typing import Optional, Dict
from app.services import ngx_job
from app.models import NGXPrice


def get_all_prices() -> Dict[str, NGXPrice]:
    return ngx_job.get_prices_dict()


def get_price(ticker: str) -> Optional[NGXPrice]:
    return ngx_job.get_price(ticker.upper())


def get_prices_by_tickers(tickers: list) -> Dict[str, Optional[NGXPrice]]:
    prices = ngx_job.get_prices_dict()
    return {t.upper(): prices.get(t.upper()) for t in tickers}


def cache_age() -> Optional[int]:
    return ngx_job.cache_age()
