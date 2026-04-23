import type { StockRow, SectorRow, SoldRow } from './market';

export interface NGXKPIs {
  equity: number;
  cost: number;
  gain: number;
  return_pct: number;
  realized_pl: number;
  total_cost: number;
  positions: number;
  cash_balance_ngn: number;
}

export interface USKPIs {
  equity: number;
  cost: number;
  gain: number;
  return_pct: number;
  positions: number;
}

export interface CombinedKPIs {
  ngx_usd: number;
  us_usd: number;
  total_usd: number;
  ngx_cost_usd?: number;
  ngx_usd_return_pct?: number;
  ngx_pct?: number;
  us_pct?: number;
}

export interface WaterfallData {
  total_cost: number;
  realized_pl: number;
  unrealized_pl: number;
  current_equity: number;
}

export interface Meta {
  usdngn: number;
  fx_source: string;
  hhi: number;
  hhi_label: string;
  ngx_price_source: string;
  us_price_source: string;
  ngx_prices_live: number;
  ngx_prices_total: number;
  us_prices_live: number;
  us_prices_total: number;
  ngx_price_age?: number;
  us_price_age?: number;
}

export interface PortfolioData {
  meta: Meta;
  ngx_kpis: NGXKPIs;
  us_kpis: USKPIs;
  combined_kpis: CombinedKPIs;
  ngx_stocks: StockRow[];
  ngx_sold: SoldRow[];
  ngx_sectors: SectorRow[];
  us_stocks: StockRow[];
  us_sectors: SectorRow[];
  waterfall: WaterfallData;
}

export interface NgxHomeMeta {
  usdngn: number;
  hhi: number;
  hhi_label: string;
  prices_live: number;
  prices_total: number;
  price_age?: number;
  last_updated?: string | null;
}

export interface NgxSparklinePoint {
  ts: string;
  price: number | null;
  change_pct: number | null;
}

export interface NgxHomeResponse {
  holdings: StockRow[];
  kpis: NGXKPIs;
  combined_kpis: CombinedKPIs;
  sectors: SectorRow[];
  meta: NgxHomeMeta;
  div_payout: number | null;
  price_histories: Record<string, NgxSparklinePoint[]>;
}

export interface NgxAdvancedCorrelation {
  tickers: string[];
  matrix: number[][];
  days: number;
}

export interface NgxAdvancedAnalytics {
  max_drawdown_pct: number | null;
  sharpe: number | null;
  data_points: number;
  days: number;
}

export interface NgxAdvancedRelativeStrengthItem {
  ticker: string;
  stock_return: number | null;
  index_return: number | null;
  rs_pct: number | null;
  outperform: boolean | null;
}

export interface NgxAdvancedRelativeStrength {
  days: number;
  index_ticker: string;
  has_index_data: boolean;
  items: NgxAdvancedRelativeStrengthItem[];
}

export interface NgxAdvancedResponse {
  holdings: StockRow[];
  waterfall: WaterfallData;
  sectors: SectorRow[];
  div_payout: number | null;
  last_updated: string | null;
  correlation: NgxAdvancedCorrelation | null;
  analytics: NgxAdvancedAnalytics | null;
  relative_strength: NgxAdvancedRelativeStrength | null;
}

// ── US home response ─────────────────────────────────────────────────────────

export interface UsHomeMeta {
  prices_live: number;
  prices_total: number;
  price_source: string;
  price_age?: number | null;
}

export interface UsHomeResponse {
  kpis: USKPIs;
  stocks: StockRow[];
  sectors: SectorRow[];
  meta: UsHomeMeta;
}

// ── Combined home response ────────────────────────────────────────────────────

export interface CombinedMeta {
  usdngn: number;
  fx_source: string;
  hhi: number;
  hhi_label: string;
}

export interface CombinedResponse {
  ngx_kpis: NGXKPIs;
  us_kpis: USKPIs;
  combined_kpis: CombinedKPIs;
  meta: CombinedMeta;
  ngx_stocks: StockRow[];
  us_stocks: StockRow[];
}

// ── NGX ticker all-in-one profile response ───────────────────────────────────

export interface NgxTickerPrice {
  price: number | null;
  change: number | null;
  change_pct: number | null;
  volume: number | null;
  high: number | null;
  low: number | null;
}

export interface NgxTickerProfile {
  name: string | null;
  sector: string | null;
  industry: string | null;
  description: string | null;
  website: string | null;
  headquarters: string | null;
  founded: string | null;
  employees: string | null;
}

export interface NgxTickerOverview {
  market_cap: number | null;
  pe_ratio: number | null;
  eps: number | null;
  book_value: number | null;
  dividend_yield: number | null;
  roe: number | null;
  roa: number | null;
  debt_to_equity: number | null;
  current_ratio: number | null;
  gross_margin: number | null;
  net_margin: number | null;
  revenue: number | null;
  net_income: number | null;
}

export interface NgxTickerPerformance {
  beta: number | null;
  week_52_high: number | null;
  week_52_low: number | null;
  week_52_change: number | null;
  return_1y: number | null;
  return_ytd: number | null;
  return_1m: number | null;
  return_3m: number | null;
  return_6m: number | null;
  volatility: number | null;
  sharpe_ratio: number | null;
  max_drawdown: number | null;
  rsi_14: number | null;
  ma_50: number | null;
  ma_200: number | null;
  golden_cross: boolean | null;
  piotroski_score: number | null;
  altman_zscore: number | null;
}

export interface NgxTickerPriceHistory {
  dates: string[];
  close: (number | null)[];
  change_pct: (number | null)[];
}

export interface NgxTickerEarnings {
  periods: string[];
  revenue: (number | null)[];
  eps: (number | null)[];
  net_income: (number | null)[];
}

export interface NgxTickerBalanceSheet {
  periods: string[];
  assets: (number | null)[];
  liabilities: (number | null)[];
  equity: (number | null)[];
}

export interface NgxTickerCashFlows {
  periods: string[];
  capex: (number | null)[];
  fcf: (number | null)[];
  net_debt: (number | null)[];
}

export interface NgxTickerDividend {
  symbol: string;
  ex_dividend_date: string | null;
  record_date: string | null;
  pay_date: string | null;
  cash_amount: number | null;
  currency: string;
  timestamp: string | null;
}

export interface NgxTickerResponse {
  ticker: string;
  price: NgxTickerPrice | null;
  profile: NgxTickerProfile | null;
  overview: NgxTickerOverview | null;
  performance: NgxTickerPerformance | null;
  dividend: NgxTickerDividend | null;
  price_history: NgxTickerPriceHistory | null;
  earnings: NgxTickerEarnings | null;
  balance_sheet: NgxTickerBalanceSheet | null;
  cash_flows: NgxTickerCashFlows | null;
  is_watching: boolean;
  last_updated: string | null;
}

// ── US ticker all-in-one profile response ───────────────────────────────────

export interface UsTickerPrice {
  price: number | null;
  change: number | null;
  change_pct: number | null;
  volume: number | null;
}

export interface UsTickerPriceHistory {
  dates: string[];
  close: (number | null)[];
  change_pct: (number | null)[];
}

export interface UsTickerResponse {
  ticker: string;
  price: UsTickerPrice | null;
  profile: Record<string, unknown> | null;
  overview: Record<string, unknown> | null;
  performance: Record<string, unknown> | null;
  price_history: UsTickerPriceHistory | null;
  is_watching: boolean;
}

export interface PortfolioPoint {
  ts: string;
  ngx_equity_ngn: number;
  ngx_cost_ngn: number;
  us_equity_usd: number;
  us_cost_usd: number;
  usdngn: number;
  total_usd: number;
  ngx_usd: number;
  ngx_gain_ngn: number;
  us_gain_usd: number;
}

export interface PortfolioHistory {
  days: number;
  count: number;
  points: PortfolioPoint[];
}
