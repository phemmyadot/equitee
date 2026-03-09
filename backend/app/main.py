"""
Portfolio Analyzer — FastAPI Application
=========================================
Entry point. Creates the app, configures CORS, registers all routers.

Run:
    uvicorn app.main:app --reload --port 8000
"""

import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import data, prices, fx

logging.basicConfig(
    level   = logging.INFO,
    format  = "%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
    datefmt = "%H:%M:%S",
)

app = FastAPI(
    title       = "Portfolio Analyzer API",
    description = "NGX + US equity portfolio with live prices and FX conversion.",
    version     = "2.0.0",
)

# ── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins     = settings.CORS_ORIGINS,
    allow_credentials = True,
    allow_methods     = ["GET"],
    allow_headers     = ["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(data.router)
app.include_router(prices.router)
app.include_router(fx.router)


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