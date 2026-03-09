"""
NGX Portfolio Analyzer — FastAPI Backend
=========================================
Data sources:
  - Portfolio holdings  : portfolio.json  (edit to update positions)
  - NGX live prices     : doclib.ngxgroup.com REST API  (30-min delayed)
  - US live prices      : Yahoo Finance query API       (real-time)
  - USD/NGN FX rate     : open.er-api.com → Google Finance → Wise (fallback chain)

Run:
    uvicorn app:app --reload --port 8000
"""

import os, json, re, time, logging, ssl, math
from pathlib import Path
from dotenv import load_dotenv

from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.requests import Request

import urllib.request, urllib.parse

load_dotenv()
logging.basicConfig(level=logging.INFO)
log = logging.getLogger("portfolio")

# ── Config ────────────────────────────────────────────────────────────────────
PORTFOLIO_FILE = Path(__file__).parent / "portfolio.json"
NGX_API_BASE   = "https://doclib.ngxgroup.com/REST/api/statistics/equities/"
YAHOO_API      = "https://query1.finance.yahoo.com/v8/finance/chart/{ticker}"
NGX_PRICE_TTL  = 900   # 15 min
US_PRICE_TTL   = 120   # 2 min  (real-time)
FX_TTL         = 600   # 10 min

# ── SSL: skip verification for NGX doclib (broken cert chain on many systems) ─
_SSL_UNVERIFIED = ssl.create_default_context()
_SSL_UNVERIFIED.check_hostname = False
_SSL_UNVERIFIED.verify_mode    = ssl.CERT_NONE

# ── Caches ────────────────────────────────────────────────────────────────────
_ngx_cache = {"data": {}, "ts": 0}
_us_cache  = {"data": {}, "ts": 0}
_fx_cache  = {"rate": None, "source": None, "ts": 0}

app       = FastAPI(title="Portfolio Analyzer")
templates = Jinja2Templates(directory="templates")


# ══════════════════════════════════════════════════════════════════════════════
# HTTP helper
# ══════════════════════════════════════════════════════════════════════════════
def _http_get(url, timeout=10, verify_ssl=True, extra_headers=None):
    headers = {
        "User-Agent":      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept":          "application/json, text/html, */*",
        "Accept-Language": "en-US,en;q=0.9",
    }
    if extra_headers:
        headers.update(extra_headers)
    req = urllib.request.Request(url, headers=headers)
    ctx = _SSL_UNVERIFIED if not verify_ssl else None
    with urllib.request.urlopen(req, timeout=timeout, context=ctx) as r:
        return r.read().decode("utf-8", errors="ignore")


# ══════════════════════════════════════════════════════════════════════════════
# Portfolio loader
# ══════════════════════════════════════════════════════════════════════════════
def load_portfolio():
    with open(PORTFOLIO_FILE) as f:
        return json.load(f)


# ══════════════════════════════════════════════════════════════════════════════
# NGX Price API
# ══════════════════════════════════════════════════════════════════════════════
def _normalise_ngx(rec):
    SYMBOL_KEYS = ("SYMBOL","Symbol","symbol","Ticker","TICKER")
    PRICE_KEYS  = ("PRICE","Price","price","LAST_PRICE","LastPrice","CLOSE_PRICE",
                   "ClosePrice","CurrentPrice","CURRENT_PRICE")
    CLOSE_KEYS  = ("CLOSE","Close","close","PREV_CLOSE","PrevClose","PREVIOUS_CLOSE",
                   "YesterdayPrice","YESTERDAY_PRICE")
    CHANGE_KEYS = ("CHANGE","Change","change","PRICE_CHANGE","PriceChange")
    PCT_KEYS    = ("PERCENT_CHANGE","PercentChange","percent_change","PCT_CHANGE",
                   "ChangePercent","CHANGE_PERCENT","PERC_CHANGE","%CHANGE")
    HIGH_KEYS   = ("HIGH","High","high","DAY_HIGH","DayHigh")
    LOW_KEYS    = ("LOW","Low","low","DAY_LOW","DayLow")
    VOL_KEYS    = ("VOLUME","Volume","volume","TOTAL_VOLUME","TotalVolume",
                   "QTY_TRADED","TradeVolume")
    VALUE_KEYS  = ("VALUE","Value","value","TOTAL_VALUE","TotalValue","TRADE_VALUE","ValueTraded")

    def pick(keys):
        for k in keys:
            v = rec.get(k)
            if v is not None and v != "":
                try: return float(str(v).replace(",",""))
                except: pass
        return None

    def pick_str(keys):
        for k in keys:
            v = rec.get(k)
            if v: return str(v).strip()
        return None

    symbol = pick_str(SYMBOL_KEYS)
    price  = pick(PRICE_KEYS)
    if not symbol or price is None:
        return None

    close  = pick(CLOSE_KEYS)
    change = pick(CHANGE_KEYS)
    pct    = pick(PCT_KEYS)

    if change is None and close is not None:
        change = round(price - close, 4)
    if pct is None and close and close != 0 and change is not None:
        pct = round(change / close * 100, 4)

    return {
        "symbol":     symbol,
        "price":      price,
        "close":      close,
        "change":     change,
        "change_pct": pct,
        "high":       pick(HIGH_KEYS),
        "low":        pick(LOW_KEYS),
        "volume":     pick(VOL_KEYS),
        "value":      pick(VALUE_KEYS),
    }


def get_ngx_prices():
    global _ngx_cache
    now = time.time()
    if _ngx_cache["data"] and (now - _ngx_cache["ts"]) < NGX_PRICE_TTL:
        log.info(f"[NGX] cache hit — {len(_ngx_cache['data'])} tickers, {int(now-_ngx_cache['ts'])}s old")
        return _ngx_cache["data"]

    log.info("[NGX] fetching from doclib.ngxgroup.com...")
    prices, page, page_size = {}, 0, 300
    try:
        while True:
            url  = f"{NGX_API_BASE}?market=&sector=&orderby=&pageSize={page_size}&pageNo={page}"
            raw  = _http_get(url, timeout=12, verify_ssl=False,
                             extra_headers={"Referer": "https://ngxgroup.com/",
                                            "Origin":  "https://ngxgroup.com"})
            data = json.loads(raw)

            # Handle multiple response shapes
            if isinstance(data, list):
                records = data
            else:
                records = next(
                    (data[k] for k in ("d","data","result","items","equities","Data")
                     if k in data and isinstance(data[k], list)),
                    next((v for v in data.values() if isinstance(v, list) and v), [])
                )

            if not records:
                break
            for rec in records:
                n = _normalise_ngx(rec)
                if n and n["symbol"] not in prices:
                    prices[n["symbol"]] = n

            log.info(f"[NGX] page {page}: {len(records)} records")
            if len(records) < page_size:
                break
            page += 1

        if not prices:
            raise ValueError("0 parseable records returned")

        log.info(f"[NGX] total: {len(prices)} tickers")
        _ngx_cache = {"data": prices, "ts": now}
        return prices

    except Exception as e:
        log.error(f"[NGX] fetch failed: {e}")
        if _ngx_cache["data"]:
            log.warning("[NGX] returning stale cache")
            return _ngx_cache["data"]
        return {}


# ══════════════════════════════════════════════════════════════════════════════
# US Prices — Yahoo Finance
# ══════════════════════════════════════════════════════════════════════════════
def _fetch_yahoo(ticker):
    try:
        url  = YAHOO_API.format(ticker=ticker)
        raw  = _http_get(url, timeout=8, extra_headers={"Accept": "application/json"})
        meta = json.loads(raw)["chart"]["result"][0]["meta"]

        price = meta.get("regularMarketPrice") or meta.get("currentPrice")
        close = meta.get("previousClose") or meta.get("chartPreviousClose")
        if price is None:
            return None

        change     = round(price - close, 4)  if close                            else None
        change_pct = round(change/close*100,4) if (close and close!=0 and change is not None) else None

        return {
            "symbol":     ticker,
            "price":      float(price),
            "close":      float(close) if close else None,
            "change":     change,
            "change_pct": change_pct,
            "high":       meta.get("regularMarketDayHigh"),
            "low":        meta.get("regularMarketDayLow"),
            "volume":     meta.get("regularMarketVolume"),
            "currency":   meta.get("currency", "USD"),
        }
    except Exception as e:
        log.warning(f"[Yahoo] {ticker} failed: {e}")
        return None


def get_us_prices(tickers):
    global _us_cache
    now   = time.time()
    stale = [t for t in tickers
             if t not in _us_cache["data"] or (now - _us_cache["ts"]) > US_PRICE_TTL]

    if stale:
        log.info(f"[Yahoo] fetching {len(stale)} tickers: {stale}")
        for t in stale:
            r = _fetch_yahoo(t)
            if r:
                _us_cache["data"][t] = r
                log.info(f"[Yahoo] {t} → ${r['price']}")
        _us_cache["ts"] = now

    return _us_cache["data"]


# ══════════════════════════════════════════════════════════════════════════════
# FX Rate — USD/NGN
# ══════════════════════════════════════════════════════════════════════════════
def _try_er_api():
    try:
        data = json.loads(_http_get("https://open.er-api.com/v6/latest/USD", timeout=6))
        rate = float(data["rates"]["NGN"])
        log.info(f"[FX] exchangerate-api → {rate}")
        return rate
    except Exception as e:
        log.warning(f"[FX] exchangerate-api failed: {e}")

def _try_google_finance():
    try:
        q    = urllib.parse.quote("USD to NGN exchange rate")
        html = _http_get(f"https://www.google.com/search?q={q}&hl=en&gl=us", timeout=8)
        for pat in [r'([\d,]+\.?\d*)\s*Nigerian Naira',
                    r'1 US Dollar\s*=\s*([\d,]+\.?\d*)\s*Nigerian']:
            m = re.search(pat, html, re.IGNORECASE)
            if m:
                rate = float(m.group(1).replace(",",""))
                if 500 < rate < 5000:
                    log.info(f"[FX] google → {rate}")
                    return rate
    except Exception as e:
        log.warning(f"[FX] google failed: {e}")

def _try_wise():
    try:
        data = json.loads(_http_get("https://wise.com/rates/live?source=USD&target=NGN", timeout=6))
        rate = float(data["value"])
        if 500 < rate < 5000:
            log.info(f"[FX] wise → {rate}")
            return rate
    except Exception as e:
        log.warning(f"[FX] wise failed: {e}")

def get_usdngn():
    global _fx_cache
    now = time.time()
    if _fx_cache["rate"] and (now - _fx_cache["ts"]) < FX_TTL:
        return _fx_cache
    for name, fn in [("exchangerate-api", _try_er_api),
                     ("google-finance",   _try_google_finance),
                     ("wise",             _try_wise)]:
        rate = fn()
        if rate:
            _fx_cache = {"rate": rate, "source": name, "ts": now}
            return _fx_cache
    fallback = float(os.getenv("USDNGN", "1580"))
    log.warning(f"[FX] all sources failed — fallback {fallback}")
    _fx_cache = {"rate": fallback, "source": "fallback (.env)", "ts": now}
    return _fx_cache


# ══════════════════════════════════════════════════════════════════════════════
# Portfolio computation
# ══════════════════════════════════════════════════════════════════════════════
def _safe(v):
    if v is None: return None
    try:
        return None if (math.isnan(v) or math.isinf(v)) else round(v, 4)
    except:
        return v

def build_stocks(holdings, prices, price_source_label):
    rows = []
    for h in holdings:
        ticker     = h["ticker"]
        shares     = h["shares"]
        cost_ps    = h["avg_cost"]
        total_cost = shares * cost_ps

        p          = prices.get(ticker, {})
        price      = p.get("price")
        equity     = price * shares      if price is not None else None
        unreal     = equity - total_cost if equity is not None else None
        ret_pct    = unreal / total_cost * 100 if (unreal is not None and total_cost) else None

        rows.append({
            "Stock":          h["name"],
            "Ticker":         ticker,
            "Sector":         h.get("sector", ""),
            "Shares":         shares,
            "Avg Cost":       _safe(cost_ps),
            "Remaining Cost": _safe(total_cost),
            "Current Equity": _safe(equity),
            "Unrealized PL":  _safe(unreal),
            "Realized PL":    0.0,
            "Total PL":       _safe(unreal),
            "Return Pct":     _safe(ret_pct),
            "Original Cost":  _safe(total_cost),
            "Live Price":     _safe(price),
            "Live Change":    _safe(p.get("change")),
            "Live Change%":   _safe(p.get("change_pct")),
            "Day High":       _safe(p.get("high")),
            "Day Low":        _safe(p.get("low")),
            "Volume":         _safe(p.get("volume")),
            "Price Source":   price_source_label if price is not None else "no-data",
        })
    return rows


def build_sectors(stocks):
    sectors = {}
    for s in stocks:
        sec  = s["Sector"] or "Other"
        eq   = s["Current Equity"] or 0
        cost = s["Remaining Cost"] or 0
        if sec not in sectors:
            sectors[sec] = {"Sector": sec, "Equity": 0, "Cost": 0, "Count": 0}
        sectors[sec]["Equity"] += eq
        sectors[sec]["Cost"]   += cost
        sectors[sec]["Count"]  += 1
    result = []
    for v in sectors.values():
        gain_pct = (v["Equity"] - v["Cost"]) / v["Cost"] * 100 if v["Cost"] else 0
        result.append({"Sector": v["Sector"], "Equity": round(v["Equity"],2),
                        "Gain Pct": round(gain_pct,4), "Count": v["Count"]})
    return sorted(result, key=lambda x: -x["Equity"])


# ══════════════════════════════════════════════════════════════════════════════
# Routes
# ══════════════════════════════════════════════════════════════════════════════
@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/.well-known/appspecific/com.chrome.devtools.json")
async def chrome_devtools():
    """Suppress Chrome DevTools 404 noise."""
    return {}


@app.get("/api/prices/ngx")
async def ngx_prices_endpoint():
    try:
        p = get_ngx_prices()
        return {"count": len(p), "age_sec": int(time.time()-_ngx_cache["ts"]),
                "source": NGX_API_BASE, "prices": p}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/prices/us")
async def us_prices_endpoint():
    try:
        portfolio = load_portfolio()
        tickers   = [h["ticker"] for h in portfolio["us"]]
        p         = get_us_prices(tickers)
        return {"count": len(p), "age_sec": int(time.time()-_us_cache["ts"]),
                "source": "Yahoo Finance", "prices": p}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/fx")
async def fx_endpoint():
    try:
        return get_usdngn()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/data")
async def get_data():
    try:
        portfolio  = load_portfolio()
        fx         = get_usdngn()
        ngx_prices = get_ngx_prices()
        us_tickers = [h["ticker"] for h in portfolio["us"]]
        us_prices  = get_us_prices(us_tickers)
        usdngn     = fx["rate"]

        ngx_stocks = build_stocks(portfolio["ngx"], ngx_prices, "ngx-api")
        us_stocks  = build_stocks(portfolio["us"],  us_prices,  "yahoo")

        sold = [{"Stock": s["name"], "Ticker": s["ticker"],
                 "Market": s["market"].upper(), "Realized PL": s["realized_pl"]}
                for s in portfolio.get("sold", [])]
        total_realized = sum(s["realized_pl"] for s in portfolio.get("sold", [])
                             if s.get("market","ngx") == "ngx")

        def ss(rows, key):
            return sum(r[key] for r in rows if r.get(key) is not None)

        ngx_equity = ss(ngx_stocks, "Current Equity")
        ngx_cost   = ss(ngx_stocks, "Remaining Cost")
        ngx_unreal = ss(ngx_stocks, "Unrealized PL")
        ngx_ret    = (ngx_unreal / ngx_cost * 100) if ngx_cost else 0

        us_equity  = ss(us_stocks, "Current Equity")
        us_cost    = ss(us_stocks, "Remaining Cost")
        us_unreal  = ss(us_stocks, "Unrealized PL")
        us_ret     = (us_unreal / us_cost * 100) if us_cost else 0

        ngx_usd    = ngx_equity / usdngn if usdngn else 0
        total_usd  = ngx_usd + us_equity

        hhi = (sum((s["Current Equity"]/ngx_equity)**2
                   for s in ngx_stocks if s.get("Current Equity")) * 10000
               if ngx_equity > 0 else 0)

        return {
            "meta": {
                "usdngn":           round(usdngn, 2),
                "fx_source":        fx["source"],
                "hhi":              round(hhi, 1),
                "hhi_label":        "LOW" if hhi<1000 else ("MODERATE" if hhi<1800 else "HIGH"),
                "ngx_price_source": "NGX REST API (30-min delayed)",
                "us_price_source":  "Yahoo Finance",
                "ngx_prices_live":  sum(1 for s in ngx_stocks if s["Price Source"]=="ngx-api"),
                "ngx_prices_total": len(ngx_stocks),
                "us_prices_live":   sum(1 for s in us_stocks  if s["Price Source"]=="yahoo"),
                "us_prices_total":  len(us_stocks),
                "ngx_price_age":    int(time.time()-_ngx_cache["ts"]) if _ngx_cache["ts"] else None,
                "us_price_age":     int(time.time()-_us_cache["ts"])  if _us_cache["ts"]  else None,
            },
            "ngx_kpis": {
                "equity":      round(ngx_equity, 2),
                "cost":        round(ngx_cost, 2),
                "gain":        round(ngx_unreal, 2),
                "return_pct":  round(ngx_ret, 2),
                "realized_pl": round(total_realized, 2),
                "total_cost":  round(ngx_cost, 2),
                "positions":   len(ngx_stocks),
            },
            "us_kpis": {
                "equity":     round(us_equity, 4),
                "cost":       round(us_cost, 4),
                "gain":       round(us_unreal, 4),
                "return_pct": round(us_ret, 2),
                "positions":  len(us_stocks),
            },
            "combined_kpis": {
                "ngx_usd":   round(ngx_usd, 2),
                "us_usd":    round(us_equity, 2),
                "total_usd": round(total_usd, 2),
            },
            "ngx_stocks":  ngx_stocks,
            "ngx_sold":    sold,
            "ngx_sectors": build_sectors(ngx_stocks),
            "us_stocks":   us_stocks,
            "us_sectors":  build_sectors(us_stocks),
            "waterfall": {
                "total_cost":     round(ngx_cost, 2),
                "realized_pl":    round(total_realized, 2),
                "unrealized_pl":  round(ngx_unreal, 2),
                "current_equity": round(ngx_equity, 2),
            },
        }

    except Exception as e:
        log.error(f"/api/data error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))