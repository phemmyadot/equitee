# Portfolio Analyzer — Frontend

Next.js 14 (App Router) frontend for the NGX + US equity portfolio dashboard.

## Tech Stack

| Layer        | Tool                              |
|--------------|-----------------------------------|
| Framework    | Next.js 14 (App Router)           |
| Language     | TypeScript                        |
| Styling      | Tailwind CSS + CSS variables      |
| Charts       | Plotly.js (lazy-loaded, SSR-safe) |
| Fonts        | IBM Plex Mono + Syne (Google)     |
| State        | React Context + useState          |

---

## Project Structure

```
frontend/src/
├── app/
│   ├── layout.tsx              ← Root layout (providers, shell)
│   ├── page.tsx                ← Redirects to /ngx
│   ├── globals.css             ← Design system (tokens, utilities)
│   ├── ngx/
│   │   ├── page.tsx            ← NGX Overview tab
│   │   └── advanced/page.tsx  ← NGX Advanced Analytics tab
│   ├── us/page.tsx             ← US Portfolio tab
│   └── combined/page.tsx      ← Combined FX View tab
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx        ← Wraps header + nav + main
│   │   ├── Header.tsx          ← Logo, FX rate, refresh button
│   │   └── Nav.tsx             ← Desktop tabs + mobile bottom nav
│   ├── ui/
│   │   ├── KPICard.tsx         ← Animated metric card
│   │   ├── StockTable.tsx      ← Sortable responsive table
│   │   ├── Badge.tsx           ← Source pills (API / YHO / n/a)
│   │   └── Feedback.tsx        ← Spinner, skeleton, error, banner
│   └── charts/
│       └── PlotlyChart.tsx     ← SSR-safe Plotly wrapper
└── lib/
    ├── api.ts                  ← Typed fetch client
    ├── formatters.ts           ← fmtNGN, fmtUSD, fmtPct, etc.
    ├── theme.ts                ← Colors, sector colors, Plotly layout
    └── PortfolioContext.tsx    ← Global data context + refresh
```

---

## Quick Start

```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Create local env
cp .env.local.example .env.local
# Edit NEXT_PUBLIC_API_URL if your backend runs elsewhere

# 3. Start the dev server
npm run dev
# → http://localhost:3000
```

Make sure the **backend** is running on port 8000 before starting the frontend.

---

## Environment Variables

| Variable              | Default                    | Description                     |
|-----------------------|----------------------------|---------------------------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000`    | FastAPI backend URL             |

All `/api/*` requests are proxied to the backend via `next.config.js` rewrites — the frontend never exposes the backend URL directly.

---

## Pages

| Route            | Description                                          |
|------------------|------------------------------------------------------|
| `/ngx`           | NGX Overview: equity bars, sector donut, treemap, table |
| `/ngx/advanced`  | Cost basis, waterfall, HHI gauge, risk-return scatter |
| `/us`            | US Portfolio: charts + holdings table                |
| `/combined`      | FX-adjusted unified view across both portfolios     |

---

## Mobile

- Desktop: top tab navigation bar
- Mobile: fixed bottom navigation with icons
- All charts are responsive (Plotly `responsive: true`)
- Tables are horizontally scrollable on small screens
- KPI cards wrap into a responsive flex grid

---

## Design System

Fonts: **IBM Plex Mono** (data, labels, numbers) + **Syne** (headings, body)

| Token      | Value     | Usage                      |
|------------|-----------|----------------------------|
| `--bg`     | `#07090f` | Page background            |
| `--panel`  | `#121620` | Card background            |
| `--green`  | `#00e87a` | Positive / gain            |
| `--red`    | `#ff3d5a` | Negative / loss            |
| `--gold`   | `#f5c518` | Primary accent, US stocks  |
| `--blue`   | `#4d8eff` | NGX accent, interactive    |
| `--purple` | `#a78bfa` | Secondary accent           |