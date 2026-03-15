# Portfolio Analyzer

A personal portfolio tracker for **NGX** (Nigerian Stock Exchange) and **US** equities.
Track holdings, monitor live prices, view dividends, analyse performance, and manage positions — all in one place.

---

## Architecture

```
PortfolioAnalyzer/
├── backend/    FastAPI + SQLite — data, auth, scraping
└── frontend/   Next.js 16 — dashboard UI
```

The frontend proxies all `/api/*` requests to the backend at runtime, so there is no CORS complexity and auth cookies work transparently across both.

---

## Features

- **NGX portfolio** — live prices scraped from stockanalysis.com, sector allocation, treemap, per-stock P&L
- **US portfolio** — prices via Yahoo Finance, USD/NGN FX conversion
- **Combined view** — NGX + US totals in a single dashboard
- **Dividends** — upcoming dividend calendar for NGX holdings
- **History** — portfolio value snapshots over time
- **Settings** — add, edit, buy, sell, or delete positions; full closed-position history
- **Multi-user** — invite-only registration, each user sees only their own data
- **Auth** — httpOnly JWT cookies, auto-refresh, no localStorage

---

## Quick start

**Backend**
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env   # fill in SECRET_KEY, FIRST_ADMIN_EMAIL, FIRST_ADMIN_PASSWORD
alembic upgrade head
uvicorn app.main:app --reload
```

**Frontend**
```bash
cd frontend
npm install
echo "API_URL=http://localhost:8000" > .env.local
npm run dev
```

Open `http://localhost:3000` and log in with the admin credentials you set.

---

## Deployment

| Step | Detail |
|---|---|
| Backend → Render | See [`backend/README.md`](backend/README.md) |
| Frontend → Netlify | See [`frontend/README.md`](frontend/README.md) |
| Required env vars | `SECRET_KEY`, `FIRST_ADMIN_EMAIL`, `FIRST_ADMIN_PASSWORD`, `API_URL` |

---

## Docs

- [Backend README](backend/README.md) — API reference, env vars, DB migrations, Render deployment
- [Frontend README](frontend/README.md) — pages, component structure, Netlify deployment
