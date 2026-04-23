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
import { useAuth } from '@/context/AuthContext';
import { fetchJobStatus } from '@/services/api';

// How long after the job is expected to start before we pull fresh data.
// Phase A (prices) typically completes in < 2 min.
const BUFFER_SEC = 120;

interface PortfolioContextValue {
  /** Seconds until the next data refresh. null = not yet known. */
  nextRefreshIn: number | null;
  /** True during the 2-min post-job buffer ("Updating…") */
  isBuffering: boolean;
  /** Increments each time pages should reload their data */
  refreshKey: number;
  triggerRefresh: () => void;
  /** Set by pages after each successful fetch so the header shows correct cache age */
  lastUpdated: Date | null;
  setLastUpdated: (d: Date) => void;
}

const PortfolioContext = createContext<PortfolioContextValue | null>(null);

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();

  const [nextRefreshIn, setNextRefreshIn] = useState<number | null>(null);
  const [isBuffering, setIsBuffering] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const jobTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bufTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAll = useCallback(() => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (jobTimerRef.current) clearTimeout(jobTimerRef.current);
    if (bufTimerRef.current) clearTimeout(bufTimerRef.current);
  }, []);

  // Ref so the async callback inside setTimeout can always call the latest version
  const startCycleRef = useRef<(nextJobAt: Date) => void>(() => {});

  startCycleRef.current = (nextJobAt: Date) => {
    clearAll();
    setIsBuffering(false);

    const msToJob = Math.max(0, nextJobAt.getTime() - Date.now());
    let remaining = Math.round(msToJob / 1000);
    setNextRefreshIn(remaining);

    // Tick down every second
    countdownRef.current = setInterval(() => {
      remaining -= 1;
      setNextRefreshIn(remaining > 0 ? remaining : 0);
      if (remaining <= 0 && countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    }, 1000);

    // When job is expected to start: enter buffer, start buffer countdown
    jobTimerRef.current = setTimeout(() => {
      setIsBuffering(true);
      let buf = BUFFER_SEC;
      setNextRefreshIn(buf);
      countdownRef.current = setInterval(() => {
        buf -= 1;
        setNextRefreshIn(buf > 0 ? buf : 0);
        if (buf <= 0 && countdownRef.current) {
          clearInterval(countdownRef.current);
          countdownRef.current = null;
        }
      }, 1000);
    }, msToJob);

    // After buffer: trigger refresh, re-fetch job status, restart cycle
    bufTimerRef.current = setTimeout(
      async () => {
        setIsBuffering(false);
        setRefreshKey((k) => k + 1);
        try {
          const status = await fetchJobStatus();
          const nextAt = status.next_run_at
            ? new Date(status.next_run_at)
            : new Date(Date.now() + (status.job_interval_sec ?? 3600) * 1000);
          // If next_run_at is already in the past, project one interval ahead
          const now = Date.now();
          const adjusted =
            nextAt.getTime() > now
              ? nextAt
              : new Date(now + (status.job_interval_sec ?? 3600) * 1000);
          startCycleRef.current(adjusted);
        } catch {
          // Fallback: restart in 1 hour
          startCycleRef.current(new Date(Date.now() + 3600 * 1000));
        }
      },
      msToJob + BUFFER_SEC * 1000,
    );
  };

  const triggerRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  // Init once after authentication
  useEffect(() => {
    if (authLoading || !user) return;

    fetchJobStatus()
      .then((status) => {
        const interval = (status.job_interval_sec ?? 3600) * 1000;
        let nextAt = status.next_run_at
          ? new Date(status.next_run_at)
          : new Date(Date.now() + interval);
        // If next_run_at is in the past, project forward
        while (nextAt.getTime() < Date.now()) {
          nextAt = new Date(nextAt.getTime() + interval);
        }
        startCycleRef.current(nextAt);
      })
      .catch(() => {
        // No job data yet — check again in 5 min
        startCycleRef.current(new Date(Date.now() + 5 * 60 * 1000));
      });

    return clearAll;
  }, [authLoading, user, clearAll]);

  return (
    <PortfolioContext.Provider
      value={{
        nextRefreshIn,
        isBuffering,
        refreshKey,
        triggerRefresh,
        lastUpdated,
        setLastUpdated,
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
