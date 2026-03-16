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

    # ── NGX ─────────────────────────────────────────────────────────────
    NGX_PAGE_SIZE: int = int(os.getenv("NGX_PAGE_SIZE", "300"))
    NGX_PRICE_TTL: int = int(os.getenv("NGX_PRICE_TTL", "900"))   # seconds
    NGX_SOURCE_BASE_URL: str = os.getenv("NGX_SOURCE_BASE_URL", "https://stockanalysis.com")

    # ── Yahoo Finance ────────────────────────────────────────────────────────
    YAHOO_API: str = os.getenv(
        "YAHOO_API",
        "https://query1.finance.yahoo.com/v8/finance/chart/{ticker}"
    )
    US_PRICE_TTL: int = int(os.getenv("US_PRICE_TTL", "120"))     # seconds

    # ── Dividends ────────────────────────────────────────────────────────────
    DIVIDEND_TTL: int = int(os.getenv("DIVIDEND_TTL", "3600"))    # seconds

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

    # ── Database ─────────────────────────────────────────────────────────────
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        f"sqlite:///{Path(__file__).parent.parent / 'portfolio.db'}"
    )

    # ── Server ───────────────────────────────────────────────────────────────
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    RELOAD: bool = os.getenv("RELOAD", "true").lower() == "true"

    # ── Environment ──────────────────────────────────────────────────────────
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

    # ── Auth ─────────────────────────────────────────────────────────────────
    SECRET_KEY: str = os.getenv("SECRET_KEY", "")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    REFRESH_TOKEN_EXPIRE_DAYS: int   = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "30"))
    # 'open' = anyone can register; 'invite' = requires invite code from admin
    REGISTRATION_MODE: str = os.getenv("REGISTRATION_MODE", "invite")
    FIRST_ADMIN_EMAIL: str    = os.getenv("FIRST_ADMIN_EMAIL", "")
    FIRST_ADMIN_PASSWORD: str = os.getenv("FIRST_ADMIN_PASSWORD", "")


settings = Settings()