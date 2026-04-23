'use client';

import { useState, useEffect } from 'react';
import { fetchPortfolioHistory, fetchPriceHistory } from '@/services/api';
import type { PortfolioHistory, PriceHistory } from '@/models';

// ── Portfolio history ─────────────────────────────────────────────────────────

export function usePortfolioHistory(days = 90) {
  const [data, setData] = useState<PortfolioHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchPortfolioHistory(days)
      .then((d) => {
        if (!cancelled) {
          setData(d);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e.message);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [days]);

  return { data, loading, error };
}

// ── Single-ticker price history ───────────────────────────────────────────────

export function usePriceHistory(ticker: string, days = 90) {
  const [data, setData] = useState<PriceHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ticker) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchPriceHistory(ticker, days)
      .then((d) => {
        if (!cancelled) {
          setData(d);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e.message);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [ticker, days]);

  return { data, loading, error };
}
