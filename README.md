# Portfolio Analyzer — Backend

FastAPI backend for the NGX + US equity portfolio dashboard.
Serves live prices, FX rates, P&L computations, and persists portfolio snapshots to a local SQLite database.

---

## Tech Stack

| Layer       | Tool                          |
|-------------|-------------------------------|
| Framework   | FastAPI + Uvicorn             |
| Validation  | Pydantic v2                   |
| Database    | SQLite + SQLAlchemy 2.0       |
| NGX Prices  | NGX doclib REST API           |
| US Prices   | Yahoo Finance (public)        |
| FX Rate     | er-api → Google → Wise        |
| Holdings    | SQLite DB (seeded from `portfolio.json` on first run) |

---

## Project Structure

```
backend/
├── app/
│   ├── main.py              ← App factory, CORS, lifespan (DB init + seed)
│   ├── config.py            ← All settings (reads from .env)
│   ├── models.py            ← Pydantic response models
│   ├── db/
│   │   ├── engine.py        ← SQLAlchemy engine, SessionLocal, Base
│   │   ├── models.py        ← ORM table definitions
│   │   ├── crud.py          ← All DB read/write helpers
│   │   └── seed.py          ← One-time migration from portfolio.json → DB
│   ├── routers/
│   │   ├── data.py          ← GET /api/data
│   │   ├── prices.py        ← GET /api/prices/ngx  &  /api/prices/us
│   │   └── fx.py            ← GET /api/fx
│   └── services/
│       ├── ngx.py           ← NGX price fetch + 15-min cache
│       ├── yahoo.py         ← Yahoo Finance fetch + 2-min cache
│       ├── fx.py            ← FX rate waterfall + 10-min cache
│       └── portfolio.py     ← P&L computation, sectors, KPIs, snapshot writer
├── portfolio.json            ← Seed source only — not read after first boot
├── portfolio.db              ← SQLite database (auto-created, git-ignored)
├── .env                      ← Local secrets (git-ignored)
├── .env.example              ← Template — safe to commit
├── requirements.txt
└── README.md
```

---

## Quick Start

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Create your .env from the template
cp .env.example .env
# Edit .env if needed — defaults work out of the box

# 3. Place your portfolio.json in the backend root (see format below)
#    Only needed for first boot — ignored afterwards

# 4. Start the server
uvicorn app.main:app --reload --port 8000
```

On first boot the server will:
1. Create `portfolio.db` with all four tables
2. Seed holdings and closed positions from `portfolio.json`
3. Log `"DB ready."` when complete

API docs: **http://localhost:8000/docs**

---

## API Endpoints

| Method | Path                         | Description                                        |
|--------|------------------------------|----------------------------------------------------|
| GET    | `/api/data`                  | Full portfolio payload — main frontend endpoint    |
| GET    | `/api/prices/ngx`            | Raw NGX equity price table                         |
| GET    | `/api/prices/us`             | US stock prices for portfolio tickers              |
| GET    | `/api/fx`                    | Live USD/NGN exchange rate                         |
| GET    | `/health`                    | Health check                                       |

> History endpoints (`/api/history/portfolio`, `/api/history/prices/{ticker}`) are coming in Feature 2 — the data is already being written to the DB on every `/api/data` call.

---

## Database

### Location
`portfolio.db` — created automatically at the backend root on first run.
Never committed (git-ignored). Back it up manually if you care about snapshot history.

### Tables

| Table                 | Purpose                                                      |
|-----------------------|--------------------------------------------------------------|
| `holdings`            | Active positions — source of truth for all tickers           |
| `closed_positions`    | Exited positions and their realised P&L                      |
| `portfolio_snapshots` | Portfolio value over time (written on each `/api/data` call) |
| `price_history`       | Per-ticker price at each snapshot — powers sparklines        |

### Snapshot cadence
A new snapshot is written at most once every `NGX_PRICE_TTL` seconds (default 15 min).
Multiple frontend refreshes within that window share the same snapshot row.

### Visualising the DB in VS Code
Install one of:
- **SQLite Viewer** (Florian Klampfer) — open `portfolio.db` directly, read-only spreadsheet view
- **SQLite** (alexcvzz) — right-click `portfolio.db` → Open Database, supports raw SQL queries

Useful query to verify snapshots are writing:
```sql
SELECT ts, total_usd, ngx_equity_ngn
FROM portfolio_snapshots
ORDER BY ts DESC
LIMIT 20;
```

---

## Configuration (`.env`)

| Variable          | Default                                     | Description                              |
|-------------------|---------------------------------------------|------------------------------------------|
| `DATABASE_URL`    | `sqlite:///./portfolio.db`                  | SQLAlchemy connection string             |
| `PORTFOLIO_FILE`  | `./portfolio.json`                          | Seed file path (first boot only)         |
| `NGX_API_BASE`    | `https://doclib.ngxgroup.com/REST/api/...`  | NGX price API URL                        |
| `NGX_PRICE_TTL`   | `900`                                       | NGX cache + snapshot interval (seconds)  |
| `US_PRICE_TTL`    | `120`                                       | Yahoo cache duration (seconds)           |
| `FX_TTL`          | `600`                                       | FX rate cache duration (seconds)         |
| `USDNGN_FALLBACK` | `1580`                                      | FX fallback if all sources fail          |
| `CORS_ORIGINS`    | `http://localhost:3000`                     | Comma-separated allowed origins          |
| `HOST`            | `0.0.0.0`                                   | Uvicorn bind host                        |
| `PORT`            | `8000`                                      | Uvicorn bind port                        |
| `RELOAD`          | `true`                                      | Auto-reload on code change (dev only)    |

---

## Portfolio Data Format

`portfolio.json` is only read **once** on first boot to seed the database.
After that, edit holdings directly in the DB (or wait for the holdings management UI in Feature 4).

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

| Field         | Type    | Notes                                                         |
|---------------|---------|---------------------------------------------------------------|
| `ticker`      | string  | Must match NGX API symbol or Yahoo Finance ticker exactly     |
| `name`        | string  | Display name                                                  |
| `shares`      | number  | Supports decimals (US fractional shares)                      |
| `avg_cost`    | number  | Per-share cost basis in local currency (NGN for NGX, USD for US) |
| `sector`      | string  | Used for sector allocation charts                             |
| `realized_pl` | number  | (sold only) Net profit/loss in local currency                 |

---

## Caching

All three external data sources are cached in memory:

| Source     | TTL    | Notes                                           |
|------------|--------|-------------------------------------------------|
| NGX prices | 15 min | Exchange data is already 30-min delayed         |
| US prices  | 2 min  | Yahoo Finance — refresh frequently              |
| FX rate    | 10 min | Stable enough, avoids hammering free-tier APIs  |

Stale cache is always served as a fallback if a source becomes unreachable.

---

## Roadmap

- [x] Feature 1 — Auto-refresh with configurable interval + countdown timer (frontend)
- [x] Feature 2 — SQLite database: holdings, snapshots, price history
- [x] Feature 2 (cont.) — History API endpoints + frontend charts
- [ ] Feature 3 — Price alerts
- [ ] Feature 4 — Transaction ledger (replace static avg_cost with real trade history)
- [ ] Feature 5 — CSV / PDF export
- [ ] Feature 6 — Settings Page