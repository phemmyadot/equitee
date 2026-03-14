"""
Profile Router
==============
GET /api/profile/ngx/{ticker}           — company profile
GET /api/profile/ngx/{ticker}/dividend  — latest dividend record
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.services.profile  import get_profile
from app.services.dividends import get_dividend
from app.models import DividendInfo

router = APIRouter(prefix="/api/profile", tags=["profile"])


class ProfileResponse(BaseModel):
    symbol:        str
    name:          Optional[str] = None
    sector:        Optional[str] = None
    industry:      Optional[str] = None
    website:       Optional[str] = None
    description:   Optional[str] = None
    headquarters:  Optional[str] = None
    founded:       Optional[str] = None
    employees:     Optional[str] = None


@router.get("/ngx/{ticker}", response_model=ProfileResponse)
def ngx_profile(ticker: str):
    data = get_profile(ticker.upper())
    if data is None:
        raise HTTPException(status_code=404, detail=f"Profile not found for {ticker.upper()}")
    return ProfileResponse(**data)


@router.get("/ngx/{ticker}/dividend", response_model=DividendInfo)
def ngx_dividend(ticker: str):
    """Latest dividend record for an NGX-listed stock."""
    data = get_dividend(ticker.upper())
    if data is None:
        raise HTTPException(status_code=404, detail=f"No dividend data found for {ticker.upper()}")
    return data