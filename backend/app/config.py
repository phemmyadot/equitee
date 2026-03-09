"""
Central configuration — all env vars loaded once here.
Never import os.getenv() anywhere else in the app.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from backend root (one level above app/)
load_dotenv(Path(__file__).parent.parent / ".env")


class Settings:
    # ── Portfolio data ──────────────────────────────────────────────────────
    PORTFOLIO_FILE: Path = Path(
        os.getenv("PORTFOLIO_FILE",
                  str(Path(__file__).parent.parent / "portfolio.json"))
    )

    # ── NGX API ─────────────────────────────────────────────────────────────
    NGX_API_BASE: str = os.getenv(
        "NGX_API_BASE",
        "https://doclib.ngxgroup.com/REST/api/statistics/equities/"
    )
    NGX_PAGE_SIZE: int = int(os.getenv("NGX_PAGE_SIZE", "300"))
    NGX_PRICE_TTL: int = int(os.getenv("NGX_PRICE_TTL", "900"))   # seconds

    # ── Yahoo Finance ────────────────────────────────────────────────────────
    YAHOO_API: str = os.getenv(
        "YAHOO_API",
        "https://query1.finance.yahoo.com/v8/finance/chart/{ticker}"
    )
    US_PRICE_TTL: int = int(os.getenv("US_PRICE_TTL", "120"))     # seconds

    # ── FX ───────────────────────────────────────────────────────────────────
    FX_TTL: int          = int(os.getenv("FX_TTL", "600"))        # seconds
    USDNGN_FALLBACK: float = float(os.getenv("USDNGN_FALLBACK", "1580"))

    # ── CORS ─────────────────────────────────────────────────────────────────
    # Comma-separated list of allowed origins, e.g.:
    #   CORS_ORIGINS=http://localhost:3000,https://myapp.com
    CORS_ORIGINS: list[str] = [
        o.strip()
        for o in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
        if o.strip()
    ]

    # ── Server ───────────────────────────────────────────────────────────────
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    RELOAD: bool = os.getenv("RELOAD", "true").lower() == "true"


settings = Settings()