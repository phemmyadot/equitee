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
const POLL_INTERVAL_MS = 30_000;

interface PortfolioContextValue {
  /** Seconds until the next data refresh. null = not yet known or job running. */
  nextRefreshIn: number | null;
  /** True during the 2-min post-job buffer ("Updating…") — kept for compat */
  isBuffering: boolean;
  /** True when the backend job is confirmed running (polled from API) */
  isJobRunning: boolean;
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
  const [isJobRunning, setIsJobRunning] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const jobTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearAll = useCallback(() => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (jobTimerRef.current) clearTimeout(jobTimerRef.current);
    if (pollRef.current) clearInterval(pollRef.current);
  }, []);

  // Ref so async callbacks can always call the latest version
  const startCycleRef = useRef<(nextJobAt: Date) => void>(() => {});
  const startPollingRef = useRef<() => void>(() => {});

  startPollingRef.current = () => {
    if (pollRef.current) return; // already polling
    pollRef.current = setInterval(async () => {
      try {
        const status = await fetchJobStatus();
        if (status.status !== 'running') {
          clearInterval(pollRef.current!);
          pollRef.current = null;
          setIsJobRunning(false);
          setIsBuffering(false);
          setRefreshKey((k) => k + 1);
          const interval = (status.job_interval_sec ?? 3600) * 1000;
          const nextAt = status.next_run_at
            ? new Date(status.next_run_at)
            : new Date(Date.now() + interval);
          const adjusted =
            nextAt.getTime() > Date.now() ? nextAt : new Date(Date.now() + interval);
          startCycleRef.current(adjusted);
        }
      } catch {}
    }, POLL_INTERVAL_MS);
  };

  startCycleRef.current = (nextJobAt: Date) => {
    clearAll();
    setIsBuffering(false);
    setIsJobRunning(false);

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

    // When job is expected to start: switch to in-progress mode and poll
    jobTimerRef.current = setTimeout(() => {
      setIsBuffering(true);
      setIsJobRunning(true);
      setNextRefreshIn(null);
      startPollingRef.current();
    }, msToJob);
  };

  const triggerRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  // Init once after authentication
  useEffect(() => {
    if (authLoading || !user) return;

    fetchJobStatus()
      .then((status) => {
        if (status.status === 'running') {
          // Job already running — show in-progress and poll for completion
          setIsJobRunning(true);
          setIsBuffering(true);
          setNextRefreshIn(null);
          startPollingRef.current();
        } else {
          const interval = (status.job_interval_sec ?? 3600) * 1000;
          let nextAt = status.next_run_at
            ? new Date(status.next_run_at)
            : new Date(Date.now() + interval);
          // If next_run_at is in the past, project forward one interval
          while (nextAt.getTime() < Date.now()) {
            nextAt = new Date(nextAt.getTime() + interval);
          }
          startCycleRef.current(nextAt);
        }
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
        isJobRunning,
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
