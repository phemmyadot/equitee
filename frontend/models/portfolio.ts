import type { StockRow, SectorRow, SoldRow } from './market';

export interface NGXKPIs {
  equity: number;
  cost: number;
  gain: number;
  return_pct: number;
  realized_pl: number;
  total_cost: number;
  positions: number;
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
