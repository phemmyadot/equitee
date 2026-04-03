export interface PricePoint {
  ts: string;
  price: number | null;
  change_pct: number | null;
}

export interface PriceHistory {
  ticker: string;
  days: number;
  count: number;
  points: PricePoint[];
}

export interface DBPriceHistory {
  ticker: string;
  days: number;
  count: number;
  dates: string[];
  close: (number | null)[];
  change_pct: (number | null)[];
}

export interface EarningsHistory {
  ticker: string;
  periods: string[];
  revenue: (number | null)[];
  eps: (number | null)[];
  net_income: (number | null)[];
}

export interface BalanceSheet {
  ticker: string;
  periods: string[];
  assets: (number | null)[];
  liabilities: (number | null)[];
  equity: (number | null)[];
}

export interface DividendInfo {
  symbol: string;
  ex_dividend_date: string | null;
  record_date: string | null;
  pay_date: string | null;
  cash_amount: number | null;
  currency: string;
  timestamp: string | null;
}

export interface DividendHolding {
  ticker: string;
  name: string;
  shares: number;
  avg_cost: number;
  dividend: DividendInfo | null;
  projected_payout: number | null;
  yield_on_cost: number | null;
  dividend_streak: number | null;
  years_with_dividend: number | null;
  dividend_growing: boolean | null;
}

export interface DividendsResponse {
  holdings: DividendHolding[];
  cache_age_sec: number | null;
  total_projected_payout: number | null;
}
