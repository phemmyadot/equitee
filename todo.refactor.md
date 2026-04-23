# API Consolidation Plan

## Principle
One call per screen. Only fields the screen uses. No N-call fan-outs.
All NGX data comes from `ngx_ticker_cache` (DB). No live scraping in request paths.

---

## Current problems

| Screen | Calls today | Problem |
|--------|------------|---------|
| NGX Home | `/api/data` + `/api/dividends` + `/api/profile/ngx/{t}/full` × N | N extra calls for signal fundamentals |
| NGX Advanced | same as home + `/api/history/correlation` + `/api/history/analytics` + `/api/history/relative-strength` | same N-call problem |
| NGX Profile | `/api/profile/ngx/{t}/full` + `/api/profile/ngx/{t}/dividend` + `/api/profile/ngx/{t}/earnings` + `/api/profile/ngx/{t}/balance-sheet` + `/api/profile/ngx/{t}/price-history` + `/api/watchlist/check/{t}` | 6 separate calls |
| US Home | `/api/data` (receives all NGX data too — wasted) | overfetch |
| Combined | `/api/data` (receives all data, uses combined_kpis only) | overfetch |
| Watchlist | `/api/watchlist` + `/api/alerts` | ✓ fine |
| Screener | `/api/screener/ngx` | ✓ fine |
| Trades | `tradesApi` | ✓ fine |
| History | `/api/history/portfolio` + `/api/history/prices/{t}` | ✓ fine |
| Dividends | `/api/dividends` | ✓ fine |
| Settings | context refresh only | ✓ fine |

---

## New endpoints

### 1. `GET /api/ngx/home`
Replaces: `/api/data` + `/api/dividends` + N × `/api/profile/ngx/{t}/full`

**Response:**
```
{
  holdings: [{
    ticker, name, sector,
    shares, avg_cost, live_price, live_change_pct,
    current_equity, unrealized_pl, return_pct, real_return_pct,
    usd_equity, usd_return,
    // fundamentals for signal score:
    pe_ratio, roe, eps, book_value, beta,
    ma_50, ma_200, week_52_high, week_52_low,
    rsi_14, piotroski_score, altman_zscore, dividend_yield
  }],
  kpis: { equity, cost, gain, return_pct, realized_pl, cash_balance_ngn, positions },
  combined_kpis: { ngx_pct, us_pct, ngx_usd_return_pct },
  sectors: [{ sector, equity, gain_pct }],
  meta: { prices_live, prices_total, price_source, price_age },
  div_payout: float | null,
  last_updated: string | null
}
```

**BE:** New router `GET /api/ngx/home`.
- Load holdings from DB (same logic as current `/api/data` for NGX side).
- Join each holding's ticker against `ngx_ticker_cache` to embed fundamentals.
- `div_payout` = sum of projected payouts from `dividend_cache` for held tickers only (not the full dividends response).
- Drops: `waterfall`, `sold_positions` (not used on home page).

---

### 2. `GET /api/ngx/advanced`
Replaces: `/api/data` + `/api/dividends` + N × `/api/profile/ngx/{t}/full`
Still separate: `/api/history/correlation`, `/api/history/analytics`, `/api/history/relative-strength` (compute-heavy, acceptable as separate calls)

**UI change:** Remove KPI cards strip from the advanced page — user confirmed not needed.

**Response:**
```
{
  holdings: [{ ...same fundamentals shape as home }],
  waterfall: { ... },
  sectors: [{ sector, equity, gain_pct }],
  div_payout: float | null,
  last_updated: string | null
}
```

**BE:** New router `GET /api/ngx/advanced`. Same as home but without `kpis` / `combined_kpis`.

---

### 3. `GET /api/ngx/{ticker}` — profile all-in-one
Replaces 6 calls: full + dividend + earnings + balance-sheet + price-history + watchlist-check

**Response:**
```
{
  ticker,
  price: { price, change, change_pct, volume, high, low },
  profile: { name, sector, industry, description, website, headquarters, founded, employees },
  overview: { market_cap, pe_ratio, eps, book_value, dividend_yield, roe, roa,
               debt_to_equity, current_ratio, gross_margin, net_margin, revenue, net_income },
  performance: { beta, week_52_high, week_52_low, week_52_change, return_1y, return_ytd,
                  return_1m, return_3m, return_6m, volatility, sharpe_ratio, max_drawdown,
                  rsi_14, ma_50, ma_200, golden_cross, piotroski_score, altman_zscore },
  dividend: { amount, ex_date, pay_date, yield } | null,
  price_history: { dates, close, change_pct },
  earnings: { periods, revenue, eps, net_income } | null,
  balance_sheet: { periods, assets, liabilities, equity } | null,
  cash_flows: { periods, capex, fcf, net_debt } | null,
  is_watching: bool,
  last_updated: string | null
}
```

**BE:** New router `GET /api/ngx/{ticker}`.
- All static fields from `ngx_ticker_cache`.
- `price_history` from `daily_price_history` (refresh if stale, same as today).
- `earnings`, `balance_sheet`, `cash_flows` from `financials_cache` (DB-backed, scraped by job).
- `dividend` from `dividend_cache`.
- `is_watching` from single DB query on `watchlist` table.
- Run concurrently where independent (price_history + financials can be parallel).

---

### 4. `GET /api/us/home`
Replaces: `/api/data` (which returns NGX data the US page doesn't need)

**Response:**
```
{
  holdings: [{ ticker, name, sector, shares, avg_cost, live_price, live_change_pct,
                current_equity, unrealized_pl, return_pct, usd_equity, usd_return }],
  kpis: { equity, cost, gain, return_pct, realized_pl, positions },
  sectors: [{ sector, equity, gain_pct }],
  meta: { prices_live, prices_total, price_age }
}
```

**BE:** New router `GET /api/us/home`. Subset of current `/api/data` US path.

---

### 5. `GET /api/combined`
Replaces: `/api/data` (which the combined page only uses for `combined_kpis`)

**Response:**
```
{
  combined_kpis: { ngx_equity, us_equity, total_equity, total_cost, total_gain,
                   total_return_pct, ngx_pct, us_pct, ngx_usd_return_pct },
  ngx_holdings: [{ ticker, current_equity, return_pct }],
  us_holdings:  [{ ticker, current_equity, return_pct }]
}
```

---

## Screens with no endpoint changes needed

| Screen | Action |
|--------|--------|
| Watchlist | ✓ already 1 call |
| Screener | ✓ already 1 call |
| Dividends | ✓ already 1 call |
| Trades | ✓ tradesApi, no change |
| History | ✓ 2 calls max, fine |
| Settings | ✓ context refresh only |

---

## Implementation order

1. **`GET /api/ngx/home`** — BE + FE (biggest win, removes N-call problem from home + advanced)
2. **`GET /api/ngx/advanced`** + remove KPI cards from advanced UI
3. **`GET /api/ngx/{ticker}`** — BE + FE (removes 6-call profile page)
4. **`GET /api/us/home`** — BE + FE
5. **`GET /api/combined`** — BE + FE
6. **Cleanup** — delete old endpoints once all screens migrated: `/api/data`, `/api/profile/ngx/{t}/full`, `/api/profile/ngx/{t}/dividend`, `/api/profile/ngx/{t}/earnings`, `/api/profile/ngx/{t}/balance-sheet`

---

## FE impact per screen

| Screen | Old calls | New calls |
|--------|-----------|-----------|
| NGX Home | 3 + N | 1 |
| NGX Advanced | 4 + N | 4 (1 + 3 history) |
| NGX Profile | 6 | 1 |
| US Home | 1 (overfetched) | 1 (exact) |
| Combined | 1 (overfetched) | 1 (exact) |
