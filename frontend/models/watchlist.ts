import type { TickerPrice, CompanyProfile, TickerOverview, TickerPerformance } from './ticker';

export interface WatchlistItem {
  ticker: string;
  market: string;
  added_at: string;
  added_price: number | null;
  since_added_pct: number | null;
  price: TickerPrice | null;
  profile: CompanyProfile | null;
  overview: TickerOverview | null;
  performance: TickerPerformance | null;
}

export interface WatchlistResponse {
  items: WatchlistItem[];
  count: number;
}
