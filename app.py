"""
NGX Portfolio Analyzer — FastAPI Backend
========================================
Run:
    uvicorn app:app --reload --port 8000
Then open:
    http://localhost:8000

Features:
  - Live NGX prices scraped from ngxgroup.com (30-min delayed, cached 15min)
  - Live USD/NGN FX rate from multiple sources (cached 10min)
  - Portfolio data from Google Sheets
  - /api/prices  — raw NGX price table
  - /api/fx      — live exchange rate
  - /api/data    — full portfolio payload (prices auto-injected)
"""

import os, json, re, time, logging
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.requests import Request
import pandas as pd
import urllib.request
import urllib.parse

from google.oauth2 import service_account
from googleapiclient.discovery import build

load_dotenv()
logging.basicConfig(level=logging.INFO)
log = logging.getLogger("portfolio")

SPREADSHEET_ID = os.getenv("SPREADSHEET_ID", "1kkZt2s-c1EmDXsoArth5IwwLRwxEEqW9XaoEcnPACpY")
SCOPES         = ["https://www.googleapis.com/auth/spreadsheets.readonly"]

SHEET_NGX      = "NGX_Portfolio"
SHEET_NGX_SEC  = "NGX Sector Allocation"
SHEET_US       = "US_Portfolio"
SHEET_US_SEC   = "US Sector Allocation"

NGX_PRICE_URL  = "https://ngxgroup.com/exchange/data/equities-price-list/"
NGX_PRICE_TTL  = 900   # cache 15 minutes (data is 30-min delayed anyway)
FX_TTL         = 600   # cache FX 10 minutes

_price_cache   = {"data": {}, "ts": 0}
_fx_cache      = {"rate": None, "source": None, "ts": 0}

app       = FastAPI(title="Portfolio Analyzer")
templates = Jinja2Templates(directory="templates")


# ══════════════════════════════════════════════════════════════════════════════
# Shared HTTP helper
# ══════════════════════════════════════════════════════════════════════════════
def _http_get(url, timeout=10):
    req = urllib.request.Request(url, headers={
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0 Safari/537.36"
        ),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
    })
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read().decode("utf-8", errors="ignore")


# ══════════════════════════════════════════════════════════════════════════════
# NGX Price Scraper
# ══════════════════════════════════════════════════════════════════════════════
def _parse_ngx_prices(html: str) -> dict:
    """
    Parse the NGX equities price list HTML.

    Each listed security appears as:
        ?symbol=TICKER&directory=companydirectory...
        N1234.56
        -1.23 %

    Returns { "TICKER": {"price": float, "change_pct": float} }
    """
    pattern = re.compile(
        r'\?symbol=([A-Z0-9]+)&directory=companydirectory[^\n]*\n'
        r'[^\n]*?([0-9][0-9,\.]+)\s*\n'
        r'\s*([-+]?[0-9]+\.?[0-9]*)\s*%'
    )
    prices = {}
    for m in pattern.finditer(html):
        ticker  = m.group(1)
        price   = float(m.group(2).replace(",", ""))
        chg_pct = float(m.group(3))
        # Keep first occurrence only (page has equities + bonds sections)
        if ticker not in prices:
            prices[ticker] = {"price": price, "change_pct": chg_pct}
    return prices


def get_ngx_prices() -> dict:
    """
    Fetch and cache the full NGX price table.
    Returns dict of { TICKER: {price, change_pct} }
    """
    global _price_cache
    now = time.time()

    if _price_cache["data"] and (now - _price_cache["ts"]) < NGX_PRICE_TTL:
        age = int(now - _price_cache["ts"])
        log.info(f"[NGX prices] cache hit — {len(_price_cache['data'])} tickers, {age}s old")
        return _price_cache["data"]

    log.info("[NGX prices] fetching from ngxgroup.com...")
    try:
        html   = _http_get(NGX_PRICE_URL, timeout=12)
        prices = _parse_ngx_prices(html)
        if not prices:
            raise ValueError("Parsed 0 prices — HTML structure may have changed")
        log.info(f"[NGX prices] scraped {len(prices)} tickers successfully")
        _price_cache = {"data": prices, "ts": now}
        return prices
    except Exception as e:
        log.error(f"[NGX prices] scrape failed: {e}")
        # Return stale cache if available, else empty
        if _price_cache["data"]:
            log.warning("[NGX prices] returning stale cache")
            return _price_cache["data"]
        return {}


# ══════════════════════════════════════════════════════════════════════════════
# FX Rate — USD/NGN
# ══════════════════════════════════════════════════════════════════════════════
def _try_exchangerate_api() -> float | None:
    try:
        data = json.loads(_http_get("https://open.er-api.com/v6/latest/USD", timeout=6))
        rate = float(data["rates"]["NGN"])
        log.info(f"[FX] exchangerate-api → {rate}")
        return rate
    except Exception as e:
        log.warning(f"[FX] exchangerate-api failed: {e}")
        return None

def _try_google_finance() -> float | None:
    try:
        q    = urllib.parse.quote("USD to NGN exchange rate")
        html = _http_get(f"https://www.google.com/search?q={q}&hl=en&gl=us", timeout=8)
        for pat in [
            r'(\d{1,4}[,.]?\d{2,3}[,.]?\d{0,3})\s*Nigerian Naira',
            r'1 US Dollar\s*=\s*([\d,]+\.?\d*)\s*Nigerian',
            r'([\d,]+\.\d+)\s*NGN',
        ]:
            m = re.search(pat, html, re.IGNORECASE)
            if m:
                rate = float(m.group(1).replace(",", ""))
                if 500 < rate < 5000:
                    log.info(f"[FX] google-finance → {rate}")
                    return rate
        return None
    except Exception as e:
        log.warning(f"[FX] google-finance failed: {e}")
        return None

def _try_wise() -> float | None:
    try:
        data = json.loads(_http_get("https://wise.com/rates/live?source=USD&target=NGN", timeout=6))
        rate = float(data["value"])
        if 500 < rate < 5000:
            log.info(f"[FX] wise → {rate}")
            return rate
        return None
    except Exception as e:
        log.warning(f"[FX] wise failed: {e}")
        return None

def get_usdngn() -> dict:
    global _fx_cache
    now = time.time()
    if _fx_cache["rate"] and (now - _fx_cache["ts"]) < FX_TTL:
        return _fx_cache
    for name, fn in [("exchangerate-api", _try_exchangerate_api),
                     ("google-finance",   _try_google_finance),
                     ("wise",             _try_wise)]:
        rate = fn()
        if rate:
            _fx_cache = {"rate": rate, "source": name, "ts": now}
            return _fx_cache
    fallback = float(os.getenv("USDNGN", "1580"))
    log.warning(f"[FX] all sources failed, using fallback {fallback}")
    _fx_cache = {"rate": fallback, "source": "fallback (.env)", "ts": now}
    return _fx_cache


# ══════════════════════════════════════════════════════════════════════════════
# Google Sheets helpers
# ══════════════════════════════════════════════════════════════════════════════
def get_service():
    json_str  = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON_STR")
    json_file = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON")
    if json_str:
        creds = service_account.Credentials.from_service_account_info(
            json.loads(json_str), scopes=SCOPES)
    elif json_file:
        creds = service_account.Credentials.from_service_account_file(
            json_file, scopes=SCOPES)
    else:
        raise RuntimeError("No Google credentials found in environment.")
    return build("sheets", "v4", credentials=creds)

def fetch_sheet(service, name):
    return (service.spreadsheets().values()
            .get(spreadsheetId=SPREADSHEET_ID, range=f"'{name}'")
            .execute().get("values", []))

def _clean(val):
    if val is None or str(val).strip() == "":
        return 0.0
    try:
        return float(re.sub(r"[^\d.\-]", "", str(val)))
    except:
        return 0.0

def to_df(values, header_row=0):
    headers = values[header_row]
    rows    = [r + [""] * (len(headers) - len(r)) for r in values[header_row + 1:]]
    return pd.DataFrame(rows, columns=headers)

def coerce(df, cols):
    for c in cols:
        if c in df.columns:
            df[c] = df[c].apply(_clean)
    return df

NUM_COLS = [
    "Shares Bought", "Avg Cost", "Current Price",
    "Sold Units", "Sold Price", "Remaining Shares",
    "Remaining Cost", "Current Equity",
    "Realized P/L", "Unrealized P/L", "Total P/L",
    "% Return (Unrealized)", "Sale Comm",
    "Cash Received From Sale", "Original Total Cost",
]

def parse_portfolio(values):
    hi  = next(i for i, r in enumerate(values) if r and r[0] == "Stock Name")
    df  = to_df(values, header_row=hi)
    df  = df[df["Stock Name"].str.strip() != ""].copy()
    df  = coerce(df, NUM_COLS)
    df["Return Pct"] = df["% Return (Unrealized)"]
    df.rename(columns={
        "Stock Name":          "Stock",
        "Unrealized P/L":      "Unrealized PL",
        "Realized P/L":        "Realized PL",
        "Total P/L":           "Total PL",
        "Original Total Cost": "Original Cost",
    }, inplace=True)
    return df

def parse_sector(values):
    df = to_df(values, header_row=0)
    df = coerce(df, ["Equity", "% of Portfolio", "Gain (%)", "Count"])
    df = df[df["Equity"] > 0].copy()
    df["Gain Pct"] = df["Gain (%)"]
    return df

def df_records(df):
    return df.where(pd.notnull(df), None).to_dict(orient="records")


# ══════════════════════════════════════════════════════════════════════════════
# Inject live prices into portfolio DataFrame
# ══════════════════════════════════════════════════════════════════════════════
def inject_live_prices(df: pd.DataFrame, prices: dict) -> pd.DataFrame:
    """
    For each active holding, replace Current Equity / Unrealized PL / Return Pct
    with values computed from the live scraped price.
    Adds columns: Live Price, Live Change%, Price Source.
    """
    df = df.copy()
    df["Live Price"]   = None
    df["Live Change%"] = None
    df["Price Source"] = "spreadsheet"

    for idx, row in df.iterrows():
        ticker = str(row.get("Ticker", "")).strip()
        if ticker in prices:
            live     = prices[ticker]["price"]
            shares   = row["Remaining Shares"]
            cost     = row["Remaining Cost"]

            live_equity    = live * shares
            live_unreal    = live_equity - cost
            live_return    = (live_unreal / cost * 100) if cost else 0

            df.at[idx, "Current Price"]  = live
            df.at[idx, "Current Equity"] = live_equity
            df.at[idx, "Unrealized PL"]  = live_unreal
            df.at[idx, "Total PL"]       = live_unreal + row["Realized PL"]
            df.at[idx, "Return Pct"]     = live_return
            df.at[idx, "Live Price"]     = live
            df.at[idx, "Live Change%"]   = prices[ticker]["change_pct"]
            df.at[idx, "Price Source"]   = "ngx-live"

    return df


# ══════════════════════════════════════════════════════════════════════════════
# Routes
# ══════════════════════════════════════════════════════════════════════════════
@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/api/prices")
async def prices_endpoint():
    """Returns the full NGX price table scraped from ngxgroup.com."""
    try:
        prices = get_ngx_prices()
        age    = int(time.time() - _price_cache["ts"])
        return {
            "count":   len(prices),
            "age_sec": age,
            "source":  NGX_PRICE_URL,
            "prices":  prices,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/fx")
async def fx_endpoint():
    """Returns live USD/NGN rate and the source it came from."""
    try:
        return get_usdngn()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/data")
async def get_data():
    try:
        # ── Fetch everything in parallel-ish ──────────────────────────────
        fx     = get_usdngn()
        prices = get_ngx_prices()
        usdngn = fx["rate"]

        service       = get_service()
        df_ngx        = parse_portfolio(fetch_sheet(service, SHEET_NGX))
        df_ngx_active = inject_live_prices(
            df_ngx[df_ngx["Remaining Shares"] > 0].copy(), prices)
        df_ngx_sold   = df_ngx[(df_ngx["Sold Units"] > 0) &
                                (df_ngx["Remaining Shares"] == 0)].copy()

        df_ngx_sec    = parse_sector(fetch_sheet(service, SHEET_NGX_SEC))

        df_us         = parse_portfolio(fetch_sheet(service, SHEET_US))
        df_us_active  = df_us[df_us["Remaining Shares"] > 0].copy()
        df_us_sec     = parse_sector(fetch_sheet(service, SHEET_US_SEC))

        # ── KPIs ──────────────────────────────────────────────────────────
        ngx_equity   = df_ngx_active["Current Equity"].sum()
        ngx_cost     = df_ngx_active["Remaining Cost"].sum()
        ngx_gain     = df_ngx_active["Unrealized PL"].sum()
        ngx_ret      = (ngx_gain / ngx_cost * 100) if ngx_cost else 0
        realized_pl  = df_ngx["Realized PL"].sum()
        total_cost   = df_ngx["Original Cost"].sum()

        us_equity    = df_us_active["Current Equity"].sum()
        us_cost      = df_us_active["Remaining Cost"].sum()
        us_gain      = df_us_active["Unrealized PL"].sum()
        us_ret       = (us_gain / us_cost * 100) if us_cost else 0

        ngx_usd      = ngx_equity / usdngn
        total_usd    = ngx_usd + us_equity

        weights      = df_ngx_active["Current Equity"] / ngx_equity
        hhi          = float((weights ** 2).sum() * 10000)

        # ── Price coverage summary ────────────────────────────────────────
        live_count  = int((df_ngx_active["Price Source"] == "ngx-live").sum())
        total_pos   = len(df_ngx_active)

        return {
            "meta": {
                "usdngn":       round(usdngn, 2),
                "fx_source":    fx["source"],
                "hhi":          round(hhi, 1),
                "hhi_label":    "LOW" if hhi < 1000 else ("MODERATE" if hhi < 1800 else "HIGH"),
                "price_source": "ngxgroup.com (30-min delayed)",
                "prices_live":  live_count,
                "prices_total": total_pos,
                "price_age_sec": int(time.time() - _price_cache["ts"]) if _price_cache["ts"] else None,
            },
            "ngx_kpis": {
                "equity":      round(ngx_equity, 2),
                "cost":        round(ngx_cost, 2),
                "gain":        round(ngx_gain, 2),
                "return_pct":  round(ngx_ret, 2),
                "realized_pl": round(realized_pl, 2),
                "total_cost":  round(total_cost, 2),
                "positions":   total_pos,
            },
            "us_kpis": {
                "equity":     round(us_equity, 4),
                "cost":       round(us_cost, 4),
                "gain":       round(us_gain, 4),
                "return_pct": round(us_ret, 2),
                "positions":  len(df_us_active),
            },
            "combined_kpis": {
                "ngx_usd":   round(ngx_usd, 2),
                "us_usd":    round(us_equity, 2),
                "total_usd": round(total_usd, 2),
            },
            "ngx_stocks": df_records(df_ngx_active[[
                "Stock", "Ticker", "Sector",
                "Remaining Cost", "Current Equity",
                "Unrealized PL", "Realized PL", "Total PL",
                "Return Pct", "Original Cost",
                "Live Price", "Live Change%", "Price Source",
            ]]),
            "ngx_sold":    df_records(df_ngx_sold[[
                "Stock", "Ticker", "Sector", "Realized PL", "Original Cost"
            ]]),
            "ngx_sectors": df_records(df_ngx_sec[["Sector","Equity","Gain Pct","Count"]]),
            "us_stocks":   df_records(df_us_active[[
                "Stock", "Ticker", "Sector",
                "Remaining Cost", "Current Equity",
                "Unrealized PL", "Return Pct", "Original Cost",
            ]]),
            "us_sectors":  df_records(df_us_sec[["Sector","Equity","Gain Pct","Count"]]),
            "waterfall": {
                "total_cost":     round(total_cost, 2),
                "realized_pl":    round(realized_pl, 2),
                "unrealized_pl":  round(ngx_gain, 2),
                "current_equity": round(ngx_equity, 2),
            },
        }
    except Exception as e:
        log.error(f"/api/data error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))