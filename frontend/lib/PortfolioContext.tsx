'use client';

import {
  createContext, useContext, useState, useCallback, useEffect, useRef,
  type ReactNode,
} from 'react';
import { fetchPortfolioData, type PortfolioData } from '@/lib/api';

interface PortfolioContextValue {
  data:        PortfolioData | null;
  loading:     boolean;
  error:       string | null;
  lastUpdated: Date | null;
  refresh:     () => Promise<void>;
}

const PortfolioContext = createContext<PortfolioContextValue | null>(null);

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [data,        setData]        = useState<PortfolioData | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const fetchedRef = useRef(false);

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

  // Fetch once on mount
  useEffect(() => {
    if (!fetchedRef.current) {
      fetchedRef.current = true;
      refresh();
    }
  }, [refresh]);

  return (
    <PortfolioContext.Provider value={{ data, loading, error, lastUpdated, refresh }}>
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio(): PortfolioContextValue {
  const ctx = useContext(PortfolioContext);
  if (!ctx) throw new Error('usePortfolio must be used inside <PortfolioProvider>');
  return ctx;
}