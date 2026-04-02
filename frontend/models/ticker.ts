export interface CompanyProfile {
  symbol: string;
  name: string | null;
  sector: string | null;
  industry: string | null;
  website: string | null;
  description: string | null;
  headquarters: string | null;
  founded: string | null;
  employees: string | null;
}

export interface TickerPrice {
  symbol: string;
  price: number | null;
  change: number | null;
  change_pct: number | null;
  volume: number | null;
}

export interface TickerOverview {
  market_cap: string | number | null;
  pe_ratio: string | number | null;
  eps: string | number | null;
  dividend_yield: string | number | null;
  roe: string | number | null;
  debt_to_equity: string | number | null;
  book_value: string | number | null;
  current_ratio: string | number | null;
  gross_margin: string | number | null;
  net_margin: string | number | null;
  revenue: string | number | null;
  net_income: string | number | null;
}

export interface TickerPerformance {
  beta: string | number | null;
  return_1y: string | number | null;
  return_ytd: string | number | null;
  return_1m: string | number | null;
  return_3m: string | number | null;
  return_6m: string | number | null;
  week_52_high: string | number | null;
  week_52_low: string | number | null;
  week_52_change: string | number | null;
  operating_margin: string | number | null;
  ebitda_margin: string | number | null;
  fcf_margin: string | number | null;
  pretax_margin: string | number | null;
  roa: string | number | null;
  roic: string | number | null;
  roce: string | number | null;
  free_cash_flow: string | number | null;
  fcf_per_share: string | number | null;
  operating_cash_flow: string | number | null;
  capex: string | number | null;
  fcf_yield: string | number | null;
  ev_ebitda: string | number | null;
  ev_fcf: string | number | null;
  price_to_book: string | number | null;
  price_to_sales: string | number | null;
  interest_coverage: string | number | null;
  debt_ebitda: string | number | null;
  quick_ratio: string | number | null;
  net_debt: string | number | null;
  asset_turnover: string | number | null;
  revenue_growth_yoy: string | number | null;
  earnings_growth_yoy: string | number | null;
  fcf_growth_yoy: string | number | null;
  dividend_growth_yoy: string | number | null;
  piotroski_score: string | number | null;
  altman_zscore: string | number | null;
  volatility: string | number | null;
  sharpe_ratio: string | number | null;
  max_drawdown: string | number | null;
  rsi_14: number | null;
  ma_50: number | null;
  ma_200: number | null;
  golden_cross: boolean | null;
}

export interface TickerData {
  ticker: string;
  price: TickerPrice | null;
  profile: Pick<
    CompanyProfile,
    'symbol' | 'name' | 'sector' | 'industry' | 'website' | 'founded'
  > | null;
  overview: TickerOverview | null;
  performance: TickerPerformance | null;
  cached_at: number | null;
}
