'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import { fetchPortfolioData, fetchDividends } from '@/services/api';
import type { PortfolioData, DividendsResponse } from '@/models';
import { useAuth } from '@/context/AuthContext';
import { REFRESH_INTERVALS, type RefreshInterval } from '@/constants/refresh';

export { REFRESH_INTERVALS, type RefreshInterval };

interface PortfolioContextValue {
  data: PortfolioData | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
  autoRefreshInterval: RefreshInterval;
  setAutoRefreshInterval: (v: RefreshInterval) => void;
  nextRefreshIn: number | null;
  dividendsData: DividendsResponse | null;
  dividendsLoading: boolean;
}

const PortfolioContext = createContext<PortfolioContextValue | null>(null);

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [dividendsData, setDividendsData] = useState<DividendsResponse | null>(null);
  const [dividendsLoading, setDividendsLoading] = useState(true);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<RefreshInterval>(300);
  const [nextRefreshIn, setNextRefreshIn] = useState<number | null>(null);

  const fetchedRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const remainingRef = useRef<number>(0);

  const refresh = useCallback(async () => {
    setLoading(true);
    setDividendsLoading(true);
    setError(null);
    try {
      const [portfolioResult, dividendsResult] = await Promise.allSettled([
        fetchPortfolioData(),
        fetchDividends(),
      ]);

      if (portfolioResult.status === 'fulfilled') {
        setData(portfolioResult.value);
        setLastUpdated(new Date());
      } else {
        setError(
          portfolioResult.reason instanceof Error
            ? portfolioResult.reason.message
            : 'Unknown error',
        );
      }

      if (dividendsResult.status === 'fulfilled') {
        setDividendsData(dividendsResult.value);
      }
    } finally {
      setLoading(false);
      setDividendsLoading(false);
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
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [autoRefreshInterval, refresh, startCountdown]);

  // ── Initial fetch (only when authenticated) ────────────────────────────────
  useEffect(() => {
    if (!authLoading && user && !fetchedRef.current) {
      fetchedRef.current = true;
      refresh();
    }
  }, [authLoading, user, refresh]);

  return (
    <PortfolioContext.Provider
      value={{
        data,
        loading,
        error,
        lastUpdated,
        refresh,
        autoRefreshInterval,
        setAutoRefreshInterval,
        nextRefreshIn,
        dividendsData,
        dividendsLoading,
      }}
    >
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio(): PortfolioContextValue {
  const ctx = useContext(PortfolioContext);
  if (!ctx) throw new Error('usePortfolio must be used inside <PortfolioProvider>');
  return ctx;
}
