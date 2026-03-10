# Portfolio Analyzer — Roadmap

## Feature 1 — Auto-refresh / Live Polling ✅
- [x] Configurable interval selector in header (Off / 1m / 5m / 15m / 30m)
- [x] Countdown ring with live timer showing seconds until next refresh
- [x] Scheduler wired to `PortfolioContext` — triggers full data refresh
- [x] Countdown resets after each refresh (manual or auto)
- [x] Interval persists across tab navigation

---

## Feature 2 — Historical P&L Database
Track portfolio value over time. Unlocks the most valuable charts.

- [ ] Add SQLite + SQLAlchemy to backend (`backend/app/db/`)
- [ ] `snapshots` table — timestamp, total_ngx_ngn, total_us_usd, usdngn, total_usd
- [ ] `price_history` table — date, ticker, market, price, change_pct
- [ ] Background task: write snapshot on every `/api/data` call (once per TTL)
- [x] `GET /api/history/portfolio` — returns time series for portfolio value chart
- [x] `GET /api/history/prices/{ticker}` — returns price history for a single stock
- [x] Frontend: Portfolio Value Over Time line chart (History tab)
- [x] Frontend: NGX equity vs cost · US equity vs cost · G/L bars · FX rate charts
- [x] Frontend: Per-stock price sparklines in NGX + US holdings tables
- [x] Frontend: History tab added to nav with 7d/30d/90d/1y day selector

---

## Feature 3 — Price Alerts
- [ ] `alerts.json` config — ticker, condition (above/below), target price
- [ ] Backend evaluates alerts on every `/api/data` call
- [ ] `GET /api/alerts` — returns triggered alerts
- [ ] Frontend: alert strip below header when triggers fire
- [ ] Frontend: alert management UI (add/remove/toggle)
- [ ] Browser Notification API for tab-inactive alerts

---

## Feature 4 — Transaction Ledger
Replace static `avg_cost` in `portfolio.json` with real trade history.

- [ ] `transactions` table — date, ticker, market, action (buy/sell), shares, price, fees
- [ ] `GET /api/transactions` — full ledger
- [ ] `POST /api/transactions` — add a trade
- [ ] Compute avg_cost and realized P&L dynamically from ledger
- [ ] Frontend: Transactions page with full trade history table
- [ ] Frontend: Add Trade modal form

---

## Feature 5 — Export
- [ ] CSV export of holdings table (NGX + US)
- [ ] CSV export of P&L summary
- [ ] PDF report generation (one-page snapshot)