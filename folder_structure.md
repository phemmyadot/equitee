portfolio/
├── backend/                  ← FastAPI
│   ├── app/
│   │   ├── main.py           ← app factory, CORS, route registration
│   │   ├── config.py         ← all env vars in one place
│   │   ├── routers/
│   │   │   ├── data.py       ← GET /api/data
│   │   │   ├── prices.py     ← GET /api/prices/ngx, /api/prices/us
│   │   │   └── fx.py         ← GET /api/fx
│   │   ├── services/
│   │   │   ├── ngx.py        ← NGX API fetch + parse + cache
│   │   │   ├── yahoo.py      ← Yahoo Finance fetch + cache
│   │   │   ├── fx.py         ← FX rate waterfall
│   │   │   └── portfolio.py  ← load portfolio.json, compute P&L, sectors
│   │   └── models.py         ← Pydantic response models
│   ├── portfolio.json
│   ├── .env
│   ├── requirements.txt
│   └── README.md
│
└── frontend/                 ← Next.js (App Router)
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx          ← redirects to /ngx
    │   ├── ngx/page.tsx      ← NGX Overview
    │   ├── ngx/advanced/page.tsx
    │   ├── us/page.tsx
    │   └── combined/page.tsx
    ├── components/
    │   ├── charts/           ← Plotly wrappers (lazy-loaded)
    │   ├── ui/               ← KPICard, Table, Badge, Spinner
    │   └── layout/           ← Header, Nav, MobileMenu
    ├── lib/
    │   ├── api.ts            ← typed fetch hooks
    │   └── formatters.ts     ← fmtN, fmtUSD, fmtPct
    ├── .env.local
    └── README.md