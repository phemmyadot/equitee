export interface AnalysisContext {
  date: string;
  ngx: AnalysisHolding[];
  us: AnalysisHolding[];
  watchlist: AnalysisWatchlistItem[];
  kpis: AnalysisKPIs;
}

export interface AnalysisHolding {
  ticker: string;
  name: string;
  sector: string;
  shares: number;
  avg_cost: number;
  current_price: number | null;
  equity_ngn?: number;
  equity_usd?: number;
}

export interface AnalysisWatchlistItem {
  ticker: string;
  market: string;
  added_price: number | null;
}

export interface AnalysisKPIs {
  ngx_total_equity_ngn: number;
  ngx_total_cost_ngn: number;
  ngx_gain_pct: number;
  us_total_equity_usd: number;
  us_total_cost_usd: number;
  us_gain_pct: number;
  ngx_positions: number;
  us_positions: number;
  watchlist_count: number;
}

export interface AnalysisSummary {
  id: number;
  created_at: string;
  scope: string;
  depth: string;
  model_used: string;
  summary: string | null;
  tokens_used: number | null;
}

export interface AnalysisDetail extends AnalysisSummary {
  full_response: string | null;
  context_hash: string | null;
}

export interface AnalysisContextResponse {
  hash: string;
  context: AnalysisContext;
}

export type AnalysisScope = 'portfolio' | 'watchlist' | 'combined';
export type AnalysisDepth = 'quick' | 'deep';
