# Portfolio Analyzer — Backend

FastAPI backend serving portfolio data for NGX (Nigerian Stock Exchange) and US equities.
Deployed on **Render** with a persistent SQLite database.

---

## Stack

| Layer | Tech |
|---|---|
| Framework | FastAPI + Uvicorn |
| Database | SQLite via SQLAlchemy 2.0 |
| Migrations | Alembic |
| Auth | JWT access tokens + UUID refresh tokens, httpOnly cookies |
| Password hashing | passlib sha256_crypt |
| NGX prices | Web scraper (stockanalysis.com) |
| US prices | Yahoo Finance chart API |
| FX rate | Live USD/NGN with fallback |

---

## Project layout

```
backend/
├── app/
│   ├── main.py             # Entry point, lifespan, admin bootstrap
│   ├── config.py           # All env vars in one place (never import os.getenv elsewhere)
│   ├── models.py           # Pydantic response models
│   ├── auth/
│   │   ├── security.py     # JWT creation/decode, password hashing
│   │   └── dependencies.py # get_current_user / get_current_admin FastAPI deps
│   ├── db/
│   │   ├── models.py       # SQLAlchemy ORM models (User, Holding, RefreshToken, …)
│   │   ├── crud.py         # All DB query functions
│   │   ├── database.py     # Session factory
│   │   └── seed.py         # Admin portfolio seeder (reads portfolio.json)
│   ├── routers/
│   │   ├── auth.py         # /api/auth/*
│   │   ├── data.py         # /api/data/portfolio
│   │   ├── settings.py     # /api/settings/* — holdings CRUD
│   │   ├── prices.py       # /api/prices/*
│   │   ├── history.py      # /api/history/*
│   │   ├── fx.py           # /api/fx
│   │   └── profile.py      # /api/profile/*
│   └── services/
│       ├── portfolio.py    # Assembles the full portfolio response
│       ├── ngx.py          # NGX scraper + in-memory cache
│       ├── yahoo.py        # US price fetcher
│       ├── dividends.py    # Dividend scraper
│       ├── financials.py   # Earnings / balance sheet scraper
│       ├── overview.py     # Fundamentals scraper
│       ├── performance.py  # Performance metrics scraper
│       ├── profile.py      # Company profile scraper
│       ├── fx.py           # USD/NGN rate fetcher
│       └── prices.py       # Price cache coordinator
├── alembic/                # DB migration scripts
├── requirements.txt
└── render.yaml             # Render deployment config
```

---

## Auth flow

- **Invite-only** registration by default — admin generates codes, users register with them
- Login sets two httpOnly cookies: a 30-min JWT **access token** + a 30-day **refresh token**
- The refresh token is a UUID stored in the DB and rotated on every `/api/auth/refresh` call
- All protected routes use `Depends(get_current_user)`; admin routes use `Depends(get_current_admin)`

---

## API reference

### Auth — `/api/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/register` | — | Register with an invite code |
| POST | `/login` | — | Login, sets auth cookies |
| POST | `/logout` | User | Clears cookies, deletes refresh token |
| POST | `/refresh` | Cookie | Rotate refresh token, reissue access token |
| GET | `/me` | User | Returns current user info |
| POST | `/invite` | Admin | Generate an invite code |
| GET | `/invites` | Admin | List all invite codes |

### Portfolio — `/api`

| Method | Path | Description |
|---|---|---|
| GET | `/data/portfolio` | Full portfolio response (prices, KPIs, sectors, snapshots) |
| GET | `/prices/ngx` | Latest NGX prices |
| GET | `/fx` | Current USD/NGN rate |
| GET | `/history/snapshots` | Portfolio value over time |
| GET | `/profile/{ticker}` | Company profile + financials |

### Settings — `/api/settings`

| Method | Path | Description |
|---|---|---|
| GET | `/holdings` | List all holdings |
| POST | `/holdings` | Add a holding |
| PUT | `/holdings/{id}` | Edit a holding |
| DELETE | `/holdings/{id}` | Delete a holding |
| POST | `/holdings/{id}/buy` | Record a buy (recalculates avg cost) |
| POST | `/holdings/{id}/sell` | Record a sell (creates a closed position) |
| GET | `/closed` | List closed positions |

---

## Environment variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `SECRET_KEY` | ✅ | — | JWT signing secret — generate a random 32+ char string |
| `FIRST_ADMIN_EMAIL` | ✅ | — | Admin account email, used once at first boot |
| `FIRST_ADMIN_PASSWORD` | ✅ | — | Admin account password, used once at first boot |
| `DATABASE_URL` | — | SQLite file | SQLite or Postgres URL |
| `PORTFOLIO_FILE` | — | `portfolio.json` | Path to admin seed file (Render secret file) |
| `NGX_SOURCE_BASE_URL` | — | `https://stockanalysis.com` | Base URL for the NGX scraper |
| `NGX_PRICE_TTL` | — | `900` | NGX price cache TTL in seconds |
| `REGISTRATION_MODE` | — | `invite` | `invite` or `open` |
| `CORS_ORIGINS` | — | `http://localhost:3000` | Comma-separated list of allowed origins |

---

## Running locally

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create a .env file (see variables above)
# Run migrations
alembic upgrade head

# Start the dev server
uvicorn app.main:app --reload
```

- API: `http://localhost:8000`
- Swagger docs: `http://localhost:8000/docs`

---

## Deployment (Render)

`render.yaml` sets up a web service with a 1 GB persistent disk at `/data`.

**Start command:**
```
alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

**First boot:** if `PORTFOLIO_FILE` exists (set as a Render secret file), holdings are seeded for the admin user. All other users start with an empty portfolio and add positions via Settings.

**Admin bootstrap:** if the `users` table is empty on startup, an admin account is created from `FIRST_ADMIN_EMAIL` / `FIRST_ADMIN_PASSWORD`. Runs once and is idempotent.
