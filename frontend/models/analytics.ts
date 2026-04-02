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
