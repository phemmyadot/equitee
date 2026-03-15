# Portfolio Analyzer — Frontend

Next.js 16 (App Router) frontend for the NGX + US equity portfolio dashboard.
Deployed on **Netlify**, proxies all `/api/*` requests to the Render backend.

---

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + CSS custom properties |
| Charts | Plotly.js |
| Auth | httpOnly cookie JWT — no localStorage |
| State | React Context (Auth + Portfolio) |

---

## Project layout

```
frontend/
├── app/
│   ├── layout.tsx              # Root layout — wraps everything in AuthProvider
│   ├── (app)/                  # Protected pages (require login)
│   │   ├── layout.tsx          # Wraps in PortfolioProvider + AppShell
│   │   ├── page.tsx            # Redirects to /ngx
│   │   ├── ngx/
│   │   │   ├── page.tsx        # NGX overview (KPIs, charts, holdings table)
│   │   │   ├── advanced/       # Advanced NGX analytics
│   │   │   └── [ticker]/       # Individual stock profile
│   │   ├── us/                 # US equities overview
│   │   ├── combined/           # NGX + US combined view
│   │   ├── dividends/          # Dividend calendar
│   │   ├── history/            # Portfolio value over time
│   │   └── settings/           # Holdings management + invite codes (admin)
│   └── (auth)/                 # Public pages (no AppShell)
│       ├── login/              # Login form
│       └── register/           # Registration form (requires invite code)
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx        # Page shell — Header + Nav + main content
│   │   ├── Header.tsx          # Top bar: logo, FX rate, refresh, user, logout
│   │   └── Nav.tsx             # Mobile bottom nav bar
│   ├── auth/
│   │   └── ProtectedRoute.tsx  # Redirects unauthenticated users to /login
│   ├── charts/
│   │   └── PlotlyChart.tsx     # Plotly wrapper
│   └── ui/
│       ├── KPICard.tsx         # Metric card with accent colours
│       ├── ChartCard.tsx       # Chart container with title/subtitle
│       ├── StockTable.tsx      # Sortable data table
│       ├── Sparkline.tsx       # 90-day mini price chart
│       ├── Badge.tsx           # Price source badge (Live / Yahoo)
│       └── Feedback.tsx        # Spinner, skeleton, error, price banner
├── lib/
│   ├── AuthContext.tsx          # Auth state: user, login, logout, register
│   ├── PortfolioContext.tsx     # Portfolio data, auto-refresh, loading state
│   ├── api.ts                  # Portfolio API calls with 401 → refresh retry
│   ├── settingsApi.ts          # Holdings CRUD API calls
│   ├── formatters.ts           # Currency, percent, volume formatters
│   └── theme.ts                # Plotly layout defaults + colour palette
└── next.config.ts              # /api/* → backend proxy rewrite
```

---

## Pages

| Route | Description |
|---|---|
| `/ngx` | NGX overview — KPIs, equity chart, sector donut, treemap, holdings table |
| `/ngx/advanced` | Advanced analytics — volatility, drawdown, correlation |
| `/ngx/[ticker]` | Individual stock — profile, financials, performance |
| `/us` | US equities overview |
| `/combined` | NGX + US combined portfolio view |
| `/dividends` | Dividend calendar |
| `/history` | Portfolio value snapshots over time |
| `/settings` | Add / edit / buy / sell / delete holdings; invite code management (admin) |
| `/login` | Login |
| `/register` | Register with invite code |

---

## Auth

- Auth state lives in `AuthContext` — fetches `/api/auth/me` on load
- `ProtectedRoute` wraps all `(app)` pages; unauthenticated users are redirected to `/login`
- All API calls in `api.ts` / `settingsApi.ts` automatically retry once after a 401 by calling `/api/auth/refresh`
- Cookies are httpOnly — no token is ever stored in JS memory or localStorage

---

## Environment variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `API_URL` | ✅ (prod) | `http://localhost:8000` | Backend URL used by the Next.js server-side proxy |

Set `API_URL` in Netlify's environment settings pointing to your Render backend URL.

---

## Running locally

```bash
cd frontend
npm install

# Create .env.local
echo "API_URL=http://localhost:8000" > .env.local

npm run dev
```

App available at `http://localhost:3000`.

The Next.js dev server proxies `/api/*` to the backend, so you need the backend running too.

---

## Deployment (Netlify)

Build command: `npm run build`
Publish directory: `.next`

Set `API_URL` to your Render backend URL in Netlify's environment variables.

The `/api/*` → backend proxy works at runtime via Next.js `rewrites()` in `next.config.ts` — no Netlify redirects file needed.
