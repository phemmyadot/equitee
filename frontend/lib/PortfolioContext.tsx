'use client';

import {
  createContext, useContext, useState, useCallback, useEffect, useRef,
  type ReactNode,
} from 'react';
import { fetchPortfolioData, type PortfolioData } from '@/lib/api';

// Interval options in seconds. 0 = manual only.
export const REFRESH_INTERVALS = [
  { label: 'Off',    value: 0    },
  { label: '1 min',  value: 60   },
  { label: '5 min',  value: 300  },
  { label: '15 min', value: 900  },
  { label: '30 min', value: 1800 },
] as const;

export type RefreshInterval = typeof REFRESH_INTERVALS[number]['value'];

interface PortfolioContextValue {
  data:                 PortfolioData | null;
  loading:              boolean;
  error:                string | null;
  lastUpdated:          Date | null;
  refresh:              () => Promise<void>;
  autoRefreshInterval:  RefreshInterval;
  setAutoRefreshInterval: (v: RefreshInterval) => void;
  nextRefreshIn:        number | null;   // seconds until next auto-refresh, null if off
}

const PortfolioContext = createContext<PortfolioContextValue | null>(null);

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [data,        setData]        = useState<PortfolioData | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<RefreshInterval>(300);
  const [nextRefreshIn, setNextRefreshIn] = useState<number | null>(null);

  const fetchedRef    = useRef(false);
  const intervalRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const remainingRef  = useRef<number>(0);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await fetchPortfolioData();
      setData(d);
      setLastUpdated(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Countdown tick (every second) ─────────────────────────────────────────
  const startCountdown = useCallback((seconds: number) => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    remainingRef.current = seconds;
    setNextRefreshIn(seconds);

    countdownRef.current = setInterval(() => {
      remainingRef.current -= 1;
      setNextRefreshIn(remainingRef.current);
      if (remainingRef.current <= 0) {
        if (countdownRef.current) clearInterval(countdownRef.current);
      }
    }, 1000);
  }, []);

  // ── Auto-refresh scheduler ─────────────────────────────────────────────────
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    if (autoRefreshInterval === 0) {
      setNextRefreshIn(null);
      return;
    }

    startCountdown(autoRefreshInterval);

    intervalRef.current = setInterval(() => {
      refresh();
      startCountdown(autoRefreshInterval);
    }, autoRefreshInterval * 1000);

    return () => {
      if (intervalRef.current)  clearInterval(intervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [autoRefreshInterval, refresh, startCountdown]);

  // ── Initial fetch ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!fetchedRef.current) {
      fetchedRef.current = true;
      refresh();
    }
  }, [refresh]);

  return (
    <PortfolioContext.Provider value={{
      data, loading, error, lastUpdated, refresh,
      autoRefreshInterval, setAutoRefreshInterval,
      nextRefreshIn,
    }}>
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio(): PortfolioContextValue {
  const ctx = useContext(PortfolioContext);
  if (!ctx) throw new Error('usePortfolio must be used inside <PortfolioProvider>');
  return ctx;
}