"""
equitee — FastAPI Application
=========================================
Entry point. Creates the app, configures CORS, registers all routers.

Run:
    uvicorn app.main:app --reload --port 8000
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.limiter import limiter

from app.config import settings
from app.routers import data, prices, fx, history, profile, settings as settings_router
from app.routers import auth as auth_router
from app.db.engine import engine, SessionLocal
from app.db import models as db_models          # registers all ORM tables
from app.db.seed import seed_from_json
from app.auth.security import hash_password

logging.basicConfig(
    level   = logging.INFO,
    format  = "%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
    datefmt = "%H:%M:%S",
)

if not settings.SECRET_KEY and settings.ENVIRONMENT == "production":
    raise RuntimeError("SECRET_KEY must be set in production")

log = logging.getLogger(__name__)


def ensure_first_admin(db) -> None:
    """Create the first admin user from env vars if the users table is empty."""
    from sqlalchemy import select, func
    from app.db.models import User
    count = db.scalar(select(func.count()).select_from(User))
    if count == 0 and settings.FIRST_ADMIN_EMAIL and settings.FIRST_ADMIN_PASSWORD:
        admin = User(
            email     = settings.FIRST_ADMIN_EMAIL,
            username  = "admin",
            hashed_pw = hash_password(settings.FIRST_ADMIN_PASSWORD),
            is_admin  = True,
            is_active = True,
        )
        db.add(admin)
        db.commit()
        log.info("Created first admin user: %s", settings.FIRST_ADMIN_EMAIL)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ───────────────────────────────────────────────────────────────
    log.info("Creating DB tables if not present…")
    db_models.Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        seed_from_json(db)
        ensure_first_admin(db)
    finally:
        db.close()

    log.info("DB ready.")
    yield
    # ── Shutdown (nothing to do) ──────────────────────────────────────────────

app = FastAPI(
    title       = "equitee API",
    description = "NGX + US equity portfolio with live prices and FX conversion.",
    version     = "2.0.0",
    lifespan    = lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins     = settings.CORS_ORIGINS,
    allow_credentials = True,
    allow_methods     = ["GET", "POST", "PUT", "DELETE"],
    allow_headers     = ["Content-Type", "Accept", "Authorization"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth_router.router)
app.include_router(data.router)
app.include_router(prices.router)
app.include_router(fx.router)
app.include_router(history.router)
app.include_router(settings_router.router)
app.include_router(profile.router)

# ── Health check ─────────────────────────────────────────────────────────────
@app.get("/health", tags=["meta"])
async def health():
    return {"status": "ok"}


# ── Silence Chrome DevTools probe ─────────────────────────────────────────────
@app.get("/.well-known/appspecific/com.chrome.devtools.json", include_in_schema=False)
async def chrome_devtools():
    return {}


# ── Dev runner ────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST,
                port=settings.PORT, reload=settings.RELOAD)