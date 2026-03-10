/**
 * API client — typed fetch wrappers for the portfolio backend.
 * All requests go through Next.js rewrites → FastAPI.
 */

const BASE = '/api';

// ── Types (mirror backend Pydantic models) ────────────────────────────────────

export interface NGXPrice {
  symbol:      string;
  price:       number;
  close?:      number;
  change?:     number;
  change_pct?: number;
  high?:       number;
  low?:        number;
  volume?:     number;
  value?:      number;
}

export interface USPrice {
  symbol:      string;
  price:       number;
  close?:      number;
  change?:     number;
  change_pct?: number;
  high?:       number;
  low?:        number;
  volume?:     number;
  currency:    string;
}

export interface FXRate {
  rate:   number;
  source: string;
  ts:     number;
}

export interface StockRow {
  Stock:          string;
  Ticker:         string;
  Sector:         string;
  Shares:         number;
  AvgCost?:       number;
  RemainingCost?: number;
  CurrentEquity?: number;
  UnrealizedPL?:  number;
  RealizedPL:     number;
  TotalPL?:       number;
  ReturnPct?:     number;
  OriginalCost?:  number;
  LivePrice?:     number;
  LiveChange?:    number;
  LiveChangePct?: number;
  DayHigh?:       number;
  DayLow?:        number;
  Volume?:        number;
  PriceSource:    string;
}

export interface SectorRow {
  Sector:  string;
  Equity:  number;
  GainPct: number;
  Count:   number;
}

export interface SoldRow {
  Stock:      string;
  Ticker:     string;
  Market:     string;
  RealizedPL: number;
}

export interface NGXKPIs {
  equity:      number;
  cost:        number;
  gain:        number;
  return_pct:  number;
  realized_pl: number;
  total_cost:  number;
  positions:   number;
}

export interface USKPIs {
  equity:     number;
  cost:       number;
  gain:       number;
  return_pct: number;
  positions:  number;
}

export interface CombinedKPIs {
  ngx_usd:   number;
  us_usd:    number;
  total_usd: number;
}

export interface WaterfallData {
  total_cost:     number;
  realized_pl:    number;
  unrealized_pl:  number;
  current_equity: number;
}

export interface Meta {
  usdngn:           number;
  fx_source:        string;
  hhi:              number;
  hhi_label:        string;
  ngx_price_source: string;
  us_price_source:  string;
  ngx_prices_live:  number;
  ngx_prices_total: number;
  us_prices_live:   number;
  us_prices_total:  number;
  ngx_price_age?:   number;
  us_price_age?:    number;
}

export interface PortfolioData {
  meta:          Meta;
  ngx_kpis:      NGXKPIs;
  us_kpis:       USKPIs;
  combined_kpis: CombinedKPIs;
  ngx_stocks:    StockRow[];
  ngx_sold:      SoldRow[];
  ngx_sectors:   SectorRow[];
  us_stocks:     StockRow[];
  us_sectors:    SectorRow[];
  waterfall:     WaterfallData;
}

// ── Fetch helpers ─────────────────────────────────────────────────────────────

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { cache: 'no-store' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

// ── History types ─────────────────────────────────────────────────────────────

export interface PortfolioPoint {
  ts:             string;   // ISO datetime
  ngx_equity_ngn: number;
  ngx_cost_ngn:   number;
  us_equity_usd:  number;
  us_cost_usd:    number;
  usdngn:         number;
  total_usd:      number;
  ngx_usd:        number;
  ngx_gain_ngn:   number;
  us_gain_usd:    number;
}

export interface PortfolioHistory {
  days:   number;
  count:  number;
  points: PortfolioPoint[];
}

export interface PricePoint {
  ts:          string;
  price:       number | null;
  change_pct:  number | null;
}

export interface PriceHistory {
  ticker: string;
  days:   number;
  count:  number;
  points: PricePoint[];
}

// ── Public API ────────────────────────────────────────────────────────────────

export const fetchPortfolioData    = () => get<PortfolioData>('/data');
export const fetchFX               = () => get<FXRate>('/fx');
export const fetchNGXPrices        = () => get<{ count: number; prices: Record<string, NGXPrice> }>('/prices/ngx');
export const fetchUSPrices         = () => get<{ count: number; prices: Record<string, USPrice>  }>('/prices/us');
export const fetchPortfolioHistory = (days = 90) => get<PortfolioHistory>(`/history/portfolio?days=${days}`);
export const fetchPriceHistory     = (ticker: string, days = 90) => get<PriceHistory>(`/history/prices/${ticker}?days=${days}`);