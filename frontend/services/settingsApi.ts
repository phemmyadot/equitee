/**
 * Settings API client — typed wrappers for all holdings CRUD + buy/sell.
 */

const BASE = '/api/settings';

export type { HoldingRecord, ClosedRecord, SellResult } from '@/models/holdings';
import type { HoldingRecord, ClosedRecord, SellResult } from '@/models/holdings';

// ── Helpers ───────────────────────────────────────────────────────────────────

async function request<T>(path: string, method: string, body?: unknown): Promise<T> {
  const opts = {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : ({} as Record<string, string>),
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store' as RequestCache,
  };

  let res = await fetch(`${BASE}${path}`, opts);

  if (res.status === 401) {
    const r = await fetch('/api/auth/refresh', { method: 'POST' });
    if (!r.ok) {
      window.location.href = '/login';
      throw new Error('Session expired');
    }
    res = await fetch(`${BASE}${path}`, opts);
  }

  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { detail?: string }).detail ?? res.statusText);
  return data as T;
}

// ── Holdings ──────────────────────────────────────────────────────────────────

export const getHoldings = () => request<HoldingRecord[]>('/holdings', 'GET');

export const createHolding = (body: {
  ticker: string;
  name: string;
  market: string;
  shares: number;
  avg_cost: number;
  sector: string;
  purchase_date?: string;
}) => request<HoldingRecord>('/holdings', 'POST', body);

export const updateHolding = (
  id: number,
  body: {
    name?: string;
    sector?: string;
    avg_cost?: number;
    shares?: number;
    purchase_date?: string;
  },
) => request<HoldingRecord>(`/holdings/${id}`, 'PUT', body);

export const deleteHolding = (id: number) => request<void>(`/holdings/${id}`, 'DELETE');

export const buyShares = (id: number, body: { shares: number; buy_price: number }) =>
  request<HoldingRecord>(`/holdings/${id}/buy`, 'POST', body);

export const sellShares = (id: number, body: { shares_sold: number; sale_price: number }) =>
  request<SellResult>(`/holdings/${id}/sell`, 'POST', body);

// ── Closed positions ──────────────────────────────────────────────────────────

export const getClosedPositions = () => request<ClosedRecord[]>('/closed', 'GET');
