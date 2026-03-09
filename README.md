# Portfolio Analyzer

Full-stack equity portfolio dashboard for NGX (Nigerian Exchange) and US stocks.

Live prices from the NGX REST API and Yahoo Finance. FX-adjusted cross-portfolio view with USD/NGN rate sourced automatically.

```
portfolio/
├── backend/    ← FastAPI  (Python)
└── frontend/   ← Next.js  (TypeScript + Tailwind)
```

---

## Architecture

```
Browser (port 3000)
    │  fetch('/api/data')
    ▼
Next.js (port 3000)          ← next.config.js rewrite rule
    │  proxy → API_URL/api/data
    ▼
FastAPI (port 8000)
    ├── GET /api/data          ← full portfolio payload
    ├── GET /api/prices/ngx   ← NGX equity prices
    ├── GET /api/prices/us    ← US stock prices
    └── GET /api/fx           ← USD/NGN rate
```

The frontend never exposes the backend URL to the browser — all `/api/*` requests are proxied by Next.js at the server layer.

---

## Prerequisites

- **Python** 3.11+
- **Node.js** 18+
- **npm** 9+

---

## Quick Start

### 1. Clone / download

```bash
# Place both folders side by side:
portfolio/
├── backend/
└── frontend/
```

### 2. Backend

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env if needed — defaults work out of the box

# Start the API server
uvicorn app.main:app --reload --port 8000
```

Backend running at: **http://localhost:8000**
Interactive API docs: **http://localhost:8000/docs**

### 3. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local
# NEXT_PUBLIC_API_URL and API_URL default to http://localhost:8000

# Start the dev server
npm run dev
```

Dashboard running at: **http://localhost:3000**

---

## Configuration

### Backend (`backend/.env`)

| Variable           | Default                              | Description                        |
|--------------------|--------------------------------------|------------------------------------|
| `PORTFOLIO_FILE`   | `./portfolio.json`                   | Path to holdings file              |
| `NGX_API_BASE`     | `https://doclib.ngxgroup.com/...`    | NGX price API endpoint             |
| `NGX_PRICE_TTL`    | `900`                                | NGX price cache (seconds)          |
| `US_PRICE_TTL`     | `120`                                | Yahoo price cache (seconds)        |
| `FX_TTL`           | `600`                                | FX rate cache (seconds)            |
| `USDNGN_FALLBACK`  | `1580`                               | FX fallback if all sources fail    |
| `CORS_ORIGINS`     | `http://localhost:3000`              | Comma-separated allowed origins    |
| `HOST`             | `0.0.0.0`                            | Server bind host                   |
| `PORT`             | `8000`                               | Server bind port                   |

### Frontend (`frontend/.env.local`)

| Variable              | Default                   | Description                         |
|-----------------------|---------------------------|-------------------------------------|
| `API_URL`             | `http://localhost:8000`   | Backend URL for Next.js proxy       |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000`   | Backend URL for browser (if needed) |

---

## Updating Your Portfolio

Edit `backend/portfolio.json` directly. No restart needed — the file is read on every `/api/data` request.

```json
{
  "ngx": [
    {
      "ticker":   "GTCO",
      "name":     "Guaranty Trust Holding Co",
      "shares":   8700,
      "avg_cost": 88.19,
      "sector":   "Banking"
    }
  ],
  "us": [
    {
      "ticker":   "NVDA",
      "name":     "Nvidia",
      "shares":   1.068779,
      "avg_cost": 192.63,
      "sector":   "Technology"
    }
  ],
  "sold": [
    {
      "ticker":      "CAVERTON",
      "name":        "Caverton Offshore",
      "market":      "ngx",
      "realized_pl": 13322.82
    }
  ]
}
```

**Fields:**
| Field         | Type   | Notes                                               |
|---------------|--------|-----------------------------------------------------|
| `ticker`      | string | Must match NGX API symbol or Yahoo Finance ticker   |
| `name`        | string | Display name                                        |
| `shares`      | number | Units held (decimals supported for US fractional)   |
| `avg_cost`    | number | Average cost per share (NGN for NGX, USD for US)    |
| `sector`      | string | Used for sector allocation charts                   |
| `market`      | string | `"ngx"` or `"us"` (sold entries only)               |
| `realized_pl` | number | Net profit/loss in local currency (sold only)       |

---

## Pages

| Route           | Content                                                    |
|-----------------|------------------------------------------------------------|
| `/ngx`          | Equity bars, sector donut, return bars, treemap, table     |
| `/ngx/advanced` | Cost basis stack, P&L waterfall, HHI gauge, risk scatter   |
| `/us`           | US holdings with Yahoo live prices, sector breakdown       |
| `/combined`     | FX-unified view, split donut, cross-portfolio comparison   |

---

## Data Sources

| Data          | Source                       | Cache  | Notes                        |
|---------------|------------------------------|--------|------------------------------|
| NGX prices    | `doclib.ngxgroup.com` API    | 15 min | 30-min delayed by exchange   |
| US prices     | Yahoo Finance (public)       | 2 min  | Real-time                    |
| USD/NGN rate  | er-api → Google → Wise       | 10 min | Waterfall of 3 free sources  |
| Holdings      | `portfolio.json` (local)     | —      | Read on every request        |

---

## Production Deployment

### Backend (e.g. Railway, Render, Fly.io)
```bash
# Set these env vars in your deployment:
CORS_ORIGINS=https://your-frontend.vercel.app
PORT=8000
RELOAD=false
USDNGN_FALLBACK=1580

# Start command:
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Frontend (e.g. Vercel)
```bash
# Set these env vars in Vercel dashboard:
API_URL=https://your-backend.railway.app
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
```

```bash
# Build command:
npm run build

# Output directory:
.next
```

---

## Development Notes

- The backend `portfolio.json` is read on **every** `/api/data` request — no restart needed to update positions
- NGX certificate verification is disabled (`ssl.CERT_NONE`) specifically for `doclib.ngxgroup.com` which has an incomplete cert chain
- Stale cache is served as fallback if any external price source is temporarily unreachable
- The `RELOAD=true` default in `.env` enables uvicorn hot-reload for backend development