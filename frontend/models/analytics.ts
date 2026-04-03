export interface CorrelationData {
  tickers: string[];
  matrix: number[][];
  days: number;
}

export interface AnalyticsData {
  max_drawdown_pct: number | null;
  sharpe: number | null;
  data_points: number;
  days: number;
}

export interface RelativeStrengthItem {
  ticker: string;
  stock_return: number | null;
  index_return: number | null;
  rs_pct: number | null;
  outperform: boolean | null;
}

export interface RelativeStrengthData {
  days: number;
  index_ticker: string;
  has_index_data: boolean;
  items: RelativeStrengthItem[];
}
