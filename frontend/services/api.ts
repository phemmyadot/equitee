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

async function tryRefresh(): Promise<boolean> {
  const r = await fetch('/api/auth/refresh', { method: 'POST' });
  return r.ok;
}

async function get<T>(path: string): Promise<T> {
  let res = await fetch(`${BASE}${path}`, { cache: 'no-store' });

  if (res.status === 401) {
    const refreshed = await tryRefresh();
    if (!refreshed) {
      window.location.href = '/login';
      throw new Error('Session expired');
    }
    res = await fetch(`${BASE}${path}`, { cache: 'no-store' });
  }

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

export interface DBPriceHistory {
  ticker:     string;
  days:       number;
  count:      number;
  dates:      string[];
  close:      (number | null)[];
  change_pct: (number | null)[];
}

export interface EarningsHistory {
  ticker:     string;
  periods:    string[];
  revenue:    (number | null)[];
  eps:        (number | null)[];
  net_income: (number | null)[];
}

export interface BalanceSheet {
  ticker:      string;
  periods:     string[];
  assets:      (number | null)[];
  liabilities: (number | null)[];
  equity:      (number | null)[];
}

export interface DividendHolding {
  ticker:           string;
  name:             string;
  shares:           number;
  avg_cost:         number;
  dividend:         DividendInfo | null;
  projected_payout: number | null;
  yield_on_cost:    number | null;
}

export interface DividendsResponse {
  holdings:               DividendHolding[];
  cache_age_sec:          number | null;
  total_projected_payout: number | null;
}

export interface DividendInfo {
  symbol:           string;
  ex_dividend_date: string | null;
  record_date:      string | null;
  pay_date:         string | null;
  cash_amount:      number | null;
  currency:         string;
  timestamp:        string | null;
}

export interface CompanyProfile {
  symbol:        string;
  name:          string | null;
  sector:        string | null;
  industry:      string | null;
  website:       string | null;
  description:   string | null;
  headquarters:  string | null;
  founded:       string | null;
  employees:     string | null;
}

export interface TickerPrice {
  symbol:     string;
  price:      number | null;
  change:     number | null;
  change_pct: number | null;
  volume:     number | null;
}

export interface TickerOverview {
  market_cap:     string | number | null;
  pe_ratio:       string | number | null;
  eps:            string | number | null;
  dividend_yield: string | number | null;
  roe:            string | number | null;
  debt_to_equity: string | number | null;
  book_value:     string | number | null;
  current_ratio:  string | number | null;
  gross_margin:   string | number | null;
  net_margin:     string | number | null;
  revenue:        string | number | null;
  net_income:     string | number | null;
}

export interface TickerPerformance {
  beta:               string | number | null;
  return_1y:          string | number | null;
  return_ytd:         string | number | null;
  return_1m:          string | number | null;
  return_3m:          string | number | null;
  return_6m:          string | number | null;
  week_52_high:       string | number | null;
  week_52_low:        string | number | null;
  week_52_change:     string | number | null;
  operating_margin:   string | number | null;
  ebitda_margin:      string | number | null;
  fcf_margin:         string | number | null;
  pretax_margin:      string | number | null;
  roa:                string | number | null;
  roic:               string | number | null;
  roce:               string | number | null;
  free_cash_flow:     string | number | null;
  fcf_per_share:      string | number | null;
  operating_cash_flow: string | number | null;
  capex:              string | number | null;
  fcf_yield:          string | number | null;
  ev_ebitda:          string | number | null;
  ev_fcf:             string | number | null;
  price_to_book:      string | number | null;
  price_to_sales:     string | number | null;
  interest_coverage:  string | number | null;
  debt_ebitda:        string | number | null;
  quick_ratio:        string | number | null;
  net_debt:           string | number | null;
  asset_turnover:     string | number | null;
  revenue_growth_yoy: string | number | null;
  earnings_growth_yoy: string | number | null;
  fcf_growth_yoy:     string | number | null;
  dividend_growth_yoy: string | number | null;
  piotroski_score:    string | number | null;
  altman_zscore:      string | number | null;
  volatility:         string | number | null;
  sharpe_ratio:       string | number | null;
  max_drawdown:       string | number | null;
}

export interface TickerData {
  ticker:      string;
  price:       TickerPrice | null;
  profile:     Pick<CompanyProfile, 'symbol' | 'name' | 'industry' | 'website' | 'founded'> | null;
  overview:    TickerOverview | null;
  performance: TickerPerformance | null;
  cached_at:   number | null;
}

// ── Public API ────────────────────────────────────────────────────────────────

export const fetchPortfolioData    = () => get<PortfolioData>('/data');
export const fetchFX               = () => get<FXRate>('/fx');
export const fetchNGXPrices        = () => get<{ count: number; prices: Record<string, NGXPrice> }>('/prices/ngx');
export const fetchUSPrices         = () => get<{ count: number; prices: Record<string, USPrice>  }>('/prices/us');
export const fetchPortfolioHistory = (days = 90) => get<PortfolioHistory>(`/history/portfolio?days=${days}`);
export const fetchPriceHistory     = (ticker: string, days = 90) => get<PriceHistory>(`/history/prices/${ticker}?days=${days}`);
export const fetchNGXProfile       = (ticker: string) => get<CompanyProfile>(`/profile/ngx/${ticker}`);
export const fetchNGXTickerData    = (ticker: string) => get<TickerData>(`/profile/ngx/${ticker}/full`);
export const fetchNGXDividend      = (ticker: string) => get<DividendInfo>(`/profile/ngx/${ticker}/dividend`);
export const fetchDividends        = () => get<DividendsResponse>('/dividends');
export const fetchNGXEarnings      = (ticker: string) => get<EarningsHistory>(`/profile/ngx/${ticker}/earnings`);
export const fetchNGXBalanceSheet  = (ticker: string) => get<BalanceSheet>(`/profile/ngx/${ticker}/balance-sheet`);
export const fetchNGXPriceHistory  = (ticker: string, days = 90) => get<DBPriceHistory>(`/profile/ngx/${ticker}/price-history?days=${days}`);