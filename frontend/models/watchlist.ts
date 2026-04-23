import type { TickerPrice, CompanyProfile, TickerOverview, TickerPerformance } from './ticker';
import type { NgxSparklinePoint } from './portfolio';

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

export interface PriceAlert {
  id: number;
  ticker: string;
  market: string;
  threshold_price: number;
  direction: 'above' | 'below';
  is_active: boolean;
  triggered_at: string | null;
  note: string | null;
  created_at: string;
}

export interface TriggeredAlert {
  id: number;
  ticker: string;
  market: string;
  threshold_price: number;
  direction: 'above' | 'below';
  triggered_at: string | null;
  note: string | null;
}

export interface WatchlistResponse {
  items: WatchlistItem[];
  count: number;
  triggered_alerts: TriggeredAlert[];
  alerts: PriceAlert[];
  last_updated: string | null;
  price_histories: Record<string, NgxSparklinePoint[]>;
}

export interface ScreenerItem {
  ticker: string;
  name: string | null;
  sector: string | null;
  price: number | null;
  change_pct: number | null;
  volume: number | null;
  market_cap: number | null;
  pe_ratio: number | null;
  roe: number | null;
  eps: number | null;
  dividend_yield: number | null;
  week_52_high: number | null;
  week_52_low: number | null;
  week_52_change: number | null;
  return_1y: number | null;
}

export interface ScreenerResponse {
  count: number;
  tickers: ScreenerItem[];
  last_updated: string | null;
}
