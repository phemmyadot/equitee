# Portfolio Analyzer — Backend

FastAPI backend for the NGX + US equity portfolio dashboard.

## Tech Stack

| Layer       | Tool                        |
|-------------|-----------------------------|
| Framework   | FastAPI + Uvicorn            |
| Validation  | Pydantic v2                  |
| NGX Prices  | NGX doclib REST API          |
| US Prices   | Yahoo Finance (public)       |
| FX Rate     | er-api → Google → Wise       |
| Holdings    | `portfolio.json` (local file)|

---

## Project Structure

```
backend/
├── app/
│   ├── main.py          ← App factory, CORS, router registration
│   ├── config.py        ← All settings (reads from .env)
│   ├── models.py        ← Pydantic response models
│   ├── routers/
│   │   ├── data.py      ← GET /api/data
│   │   ├── prices.py    ← GET /api/prices/ngx  &  /api/prices/us
│   │   └── fx.py        ← GET /api/fx
│   └── services/
│       ├── ngx.py       ← NGX price fetch + cache
│       ├── yahoo.py     ← Yahoo Finance fetch + cache
│       ├── fx.py        ← FX rate waterfall
│       └── portfolio.py ← P&L computation, sectors, KPIs
├── portfolio.json        ← Your holdings (edit to update positions)
├── .env                  ← Local secrets (not committed)
├── .env.example          ← Template
├── requirements.txt
└── README.md
```

---

## Quick Start

```bash
cd backend

# 1. Install dependencies
pip install -r requirements.txt

# 2. Create your .env
cp .env.example .env
# Edit .env if needed (defaults work out of the box)

# 3. Start the server
uvicorn app.main:app --reload --port 8000
```

API docs available at: **http://localhost:8000/docs**

---

## API Endpoints

| Method | Path             | Description                              |
|--------|------------------|------------------------------------------|
| GET    | `/api/data`      | Full portfolio payload (main endpoint)   |
| GET    | `/api/prices/ngx`| Raw NGX equity price table              |
| GET    | `/api/prices/us` | US stock prices for portfolio holdings   |
| GET    | `/api/fx`        | Live USD/NGN exchange rate               |
| GET    | `/health`        | Health check                             |

---

## Configuration (`.env`)

| Variable           | Default                                        | Description                        |
|--------------------|------------------------------------------------|------------------------------------|
| `PORTFOLIO_FILE`   | `./portfolio.json`                             | Path to holdings file              |
| `NGX_PRICE_TTL`    | `900`                                          | NGX cache duration (seconds)       |
| `US_PRICE_TTL`     | `120`                                          | Yahoo cache duration (seconds)     |
| `FX_TTL`           | `600`                                          | FX rate cache duration (seconds)   |
| `USDNGN_FALLBACK`  | `1580`                                         | FX fallback if all sources fail    |
| `CORS_ORIGINS`     | `http://localhost:3000`                        | Comma-separated allowed origins    |
| `HOST`             | `0.0.0.0`                                      | Uvicorn bind host                  |
| `PORT`             | `8000`                                         | Uvicorn bind port                  |
| `RELOAD`           | `true`                                         | Auto-reload on code change         |

---

## Updating Your Portfolio

Edit `portfolio.json` directly — no restart needed (file is read on each `/api/data` request).

```json
{
  "ngx": [
    {
      "ticker": "GTCO",
      "name": "Guaranty Trust Holding Co",
      "shares": 8700,
      "avg_cost": 88.19,
      "sector": "Banking"
    }
  ],
  "us": [
    {
      "ticker": "NVDA",
      "name": "Nvidia",
      "shares": 1.068779,
      "avg_cost": 192.63,
      "sector": "Technology"
    }
  ],
  "sold": [
    {
      "ticker": "CAVERTON",
      "name": "Caverton Offshore",
      "market": "ngx",
      "realized_pl": 13322.82
    }
  ]
}
```

**Fields:**
- `ticker` — exchange symbol (must match NGX API or Yahoo Finance exactly)
- `shares` — number of units held (supports decimals for US fractional shares)
- `avg_cost` — average cost per share in local currency (NGN for NGX, USD for US)
- `sector` — used for sector allocation charts
- `realized_pl` — (sold only) net profit/loss in local currency

---

## Caching

All three data sources are cached in memory:

| Source      | TTL      | Reason                                      |
|-------------|----------|---------------------------------------------|
| NGX prices  | 15 min   | Data is already 30-min delayed on the exchange |
| US prices   | 2 min    | Real-time, refresh frequently               |
| FX rate     | 10 min   | Stable enough, avoids hammering free APIs   |

Stale cache is served as fallback if a source becomes unreachable.