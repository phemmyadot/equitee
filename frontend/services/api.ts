/**
 * API client — typed fetch wrappers for the portfolio backend.
 * All requests go through Next.js rewrites → FastAPI.
 */

const BASE = '/api';

export type { NGXPrice, USPrice, FXRate, StockRow, SectorRow, SoldRow } from '@/models/market';

export type {
  NGXKPIs,
  USKPIs,
  CombinedKPIs,
  WaterfallData,
  Meta,
  PortfolioData,
  PortfolioPoint,
  PortfolioHistory,
} from '@/models/portfolio';

export type {
  CompanyProfile,
  TickerPrice,
  TickerOverview,
  TickerPerformance,
  TickerData,
} from '@/models/ticker';

export type {
  PricePoint,
  PriceHistory,
  DBPriceHistory,
  EarningsHistory,
  BalanceSheet,
  DividendInfo,
  DividendHolding,
  DividendsResponse,
} from '@/models/dividends';

export type {
  CorrelationData,
  AnalyticsData,
  RelativeStrengthItem,
  RelativeStrengthData,
} from '@/models/analytics';

export type { WatchlistItem, WatchlistResponse } from '@/models/watchlist';

export type {
  AnalysisContext,
  AnalysisContextResponse,
  AnalysisSummary,
  AnalysisDetail,
  AnalysisScope,
  AnalysisDepth,
} from '@/models/analysis';

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

async function post<T>(path: string): Promise<T> {
  let res = await fetch(`${BASE}${path}`, { method: 'POST', cache: 'no-store' });
  if (res.status === 401) {
    const refreshed = await tryRefresh();
    if (!refreshed) {
      window.location.href = '/login';
      throw new Error('Session expired');
    }
    res = await fetch(`${BASE}${path}`, { method: 'POST', cache: 'no-store' });
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

async function del<T>(path: string): Promise<T> {
  let res = await fetch(`${BASE}${path}`, { method: 'DELETE', cache: 'no-store' });
  if (res.status === 401) {
    const refreshed = await tryRefresh();
    if (!refreshed) {
      window.location.href = '/login';
      throw new Error('Session expired');
    }
    res = await fetch(`${BASE}${path}`, { method: 'DELETE', cache: 'no-store' });
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

// ── Public API ────────────────────────────────────────────────────────────────

import type {
  FXRate,
  NGXPrice,
  USPrice,
  PortfolioData,
  PortfolioHistory,
  PriceHistory,
  CompanyProfile,
  TickerData,
  DividendInfo,
  DividendsResponse,
  EarningsHistory,
  BalanceSheet,
  DBPriceHistory,
  CorrelationData,
  AnalyticsData,
  RelativeStrengthData,
  WatchlistResponse,
  AnalysisContextResponse,
  AnalysisSummary,
  AnalysisDetail,
} from '@/models';

export const fetchPortfolioData = () => get<PortfolioData>('/data');
export const fetchFX = () => get<FXRate>('/fx');
export const fetchNGXPrices = () =>
  get<{ count: number; prices: Record<string, NGXPrice> }>('/prices/ngx');
export const fetchUSPrices = () =>
  get<{ count: number; prices: Record<string, USPrice> }>('/prices/us');
export const fetchPortfolioHistory = (days = 90) =>
  get<PortfolioHistory>(`/history/portfolio?days=${days}`);
export const fetchPriceHistory = (ticker: string, days = 90) =>
  get<PriceHistory>(`/history/prices/${ticker}?days=${days}`);
export const fetchNGXProfile = (ticker: string) => get<CompanyProfile>(`/profile/ngx/${ticker}`);
export const fetchNGXTickerData = (ticker: string) =>
  get<TickerData>(`/profile/ngx/${ticker}/full`);
export const fetchNGXDividend = (ticker: string) =>
  get<DividendInfo>(`/profile/ngx/${ticker}/dividend`);
export const fetchDividends = (force = false) =>
  get<DividendsResponse>(`/dividends${force ? '?force=true' : ''}`);
export const fetchNGXEarnings = (ticker: string) =>
  get<EarningsHistory>(`/profile/ngx/${ticker}/earnings`);
export const fetchNGXBalanceSheet = (ticker: string) =>
  get<BalanceSheet>(`/profile/ngx/${ticker}/balance-sheet`);
export const fetchNGXPriceHistory = (ticker: string, days = 90) =>
  get<DBPriceHistory>(`/profile/ngx/${ticker}/price-history?days=${days}`);
export const fetchCorrelation = (days = 90) =>
  get<CorrelationData>(`/history/correlation?days=${days}`);
export const fetchAnalytics = (days = 180) => get<AnalyticsData>(`/history/analytics?days=${days}`);
export const fetchRelativeStrength = (days = 90) =>
  get<RelativeStrengthData>(`/history/relative-strength?days=${days}`);
export const fetchWatchlist = () => get<WatchlistResponse>('/watchlist');
export const fetchWatchlistCheck = (ticker: string) =>
  get<{ ticker: string; watching: boolean }>(`/watchlist/check/${ticker}`);
export const addToWatchlist = (ticker: string) =>
  post<{ ticker: string; market: string; added_at: string }>(`/watchlist/${ticker}`);
export const removeFromWatchlist = (ticker: string) =>
  del<{ ticker: string; removed: boolean }>(`/watchlist/${ticker}`);

// ── Analysis ──────────────────────────────────────────────────────────────────

export const fetchAnalysisContext = () =>
  get<AnalysisContextResponse>('/analysis/context');

export const fetchAnalysisHistory = () =>
  get<AnalysisSummary[]>('/analysis/history');

export const fetchAnalysisById = (id: number) =>
  get<AnalysisDetail>(`/analysis/${id}`);

export const clearAnalysisHistory = () =>
  del<{ deleted: number }>('/analysis/history');

/**
 * Opens an SSE stream to POST /analysis/run.
 * Calls onChunk for each text token, onDone when complete, onError on failure.
 * Returns an AbortController — call controller.abort() to cancel.
 */
export function streamAnalysis(
  scope: string,
  depth: string,
  onChunk: (text: string) => void,
  onDone: (id: number, tokens: number, cached: boolean) => void,
  onError: (msg: string) => void,
  followUp?: string,
  followUpAnalysisId?: number,
): AbortController {
  const controller = new AbortController();
  const body = {
    scope,
    depth,
    ...(followUp ? { follow_up: followUp, follow_up_analysis_id: followUpAnalysisId } : {}),
  };

  (async () => {
    let res: Response;
    try {
      res = await fetch(`${BASE}/analysis/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        cache: 'no-store',
        signal: controller.signal,
      });

      if (res.status === 401) {
        const refreshed = await tryRefresh();
        if (!refreshed) {
          window.location.href = '/login';
          return;
        }
        res = await fetch(`${BASE}/analysis/run`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          cache: 'no-store',
          signal: controller.signal,
        });
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        onError((err as { detail?: string }).detail ?? res.statusText);
        return;
      }
    } catch (e: unknown) {
      if ((e as { name?: string }).name !== 'AbortError') {
        onError(String(e));
      }
      return;
    }

    if (!res.body) {
      onError('No response body');
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() ?? '';
        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6)) as {
              text?: string;
              done?: boolean;
              id?: number;
              tokens?: number;
              cached?: boolean;
              error?: string;
            };
            if (data.error) {
              onError(data.error);
              return;
            }
            if (data.text) onChunk(data.text);
            if (data.done) onDone(data.id ?? 0, data.tokens ?? 0, data.cached ?? false);
          } catch {
            // malformed chunk, skip
          }
        }
      }
    } catch (e: unknown) {
      if ((e as { name?: string }).name !== 'AbortError') {
        onError(String(e));
      }
    }
  })();

  return controller;
}
