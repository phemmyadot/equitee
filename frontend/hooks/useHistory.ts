'use client';

import { useState, useEffect, useRef } from 'react';
import { fetchPortfolioHistory, fetchPriceHistory } from '@/services/api';
import type { PortfolioHistory, PriceHistory } from '@/models';

// ── Portfolio history ─────────────────────────────────────────────────────────

export function usePortfolioHistory(days = 90) {
  const [data, setData] = useState<PortfolioHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchPortfolioHistory(days, controller.signal)
      .then((d) => {
        if (!cancelled) {
          setData(d);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          if (e instanceof Error && e.name === 'AbortError') {
            return;
          }
          setError(e.message || 'Failed to fetch portfolio history');
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [days]);

  return { data, loading, error };
}

// ── Single-ticker price history ───────────────────────────────────────────────

export function usePriceHistory(ticker: string, days = 90) {
  const [data, setData] = useState<PriceHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef<Record<string, boolean>>({});

  useEffect(() => {
    if (!ticker) return;
    if (hasFetched.current[ticker]) return;
    hasFetched.current[ticker] = true;

    const controller = new AbortController();
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchPriceHistory(ticker, days, controller.signal)
      .then((d) => {
        if (!cancelled) {
          setData(d);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          if (e instanceof Error && e.name === 'AbortError') {
            return;
          }
          setError(e.message || `Failed to fetch price history for ${ticker}`);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [ticker, days]);

  return { data, loading, error };
}
