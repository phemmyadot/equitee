'use client';

import { useEffect, useState } from 'react';
import { fmtAge } from '@/lib/formatters';
import { usePortfolio, REFRESH_INTERVALS, type RefreshInterval } from '@/lib/PortfolioContext';

interface HeaderProps {
  usdngn?:      number;
  fxSource?:    string;
  lastUpdated?: Date;
  loading:      boolean;
  onRefresh:    () => void;
}

export default function Header({ usdngn, fxSource, lastUpdated, loading, onRefresh }: HeaderProps) {
  const [now, setNow] = useState<Date>(new Date());
  const { autoRefreshInterval, setAutoRefreshInterval, nextRefreshIn } = usePortfolio();

  // Tick every second for "last updated" age
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const ageSeconds = lastUpdated
    ? Math.round((now.getTime() - lastUpdated.getTime()) / 1000)
    : null;

  // Format countdown as "4:32"
  const fmtCountdown = (s: number) => {
    if (s <= 0) return '0:00';
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  // Arc progress for countdown ring (0→1)
  const ringProgress = (nextRefreshIn != null && autoRefreshInterval > 0)
    ? nextRefreshIn / autoRefreshInterval
    : 0;
  const r = 8;
  const circ = 2 * Math.PI * r;
  const dash = circ * ringProgress;

  return (
    <header
      style={{ height: 'var(--header-h)' }}
      className="
        sticky top-0 z-50
        flex items-center justify-between gap-3
        bg-white border-b border-[var(--border)]
        shadow-[0_1px_0_#E4E7EC]
        px-[var(--page-px)] md:px-[var(--page-px-md)] lg:px-[var(--page-px-lg)]
      "
    >
      {/* ── Logo ── */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-7 h-7 rounded-md bg-[var(--accent)] flex items-center justify-center shrink-0">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 10L5.5 6.5L8 9L12 4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <span className="font-semibold text-[13px] text-[var(--ink)] tracking-tight">Portfolio</span>
        <span className="hidden sm:block text-[var(--ink-4)] text-[13px]">Analyzer</span>
      </div>

      {/* ── FX chip ── */}
      {usdngn && (
        <div className="hidden md:flex items-center gap-2 bg-[var(--canvas)] border border-[var(--border)] rounded-lg px-3 py-1.5 shrink-0">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-4)] font-mono">USD/NGN</span>
          <span className="font-mono text-[13px] font-semibold text-[var(--ink)]">
            ₦{usdngn.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          {fxSource && (
            <span className="text-[9px] font-medium uppercase tracking-wide text-[var(--ink-4)] bg-[var(--border)] px-1.5 py-0.5 rounded-sm">
              {fxSource}
            </span>
          )}
        </div>
      )}

      {/* ── Right controls ── */}
      <div className="flex items-center gap-2 shrink-0 ml-auto">

        {/* Last updated age */}
        {ageSeconds !== null && (
          <span className="hidden lg:block font-mono text-[10px] text-[var(--ink-4)]">
            {fmtAge(ageSeconds)}
          </span>
        )}

        {/* Auto-refresh interval selector */}
        <div className="hidden sm:flex items-center gap-1.5 bg-[var(--canvas)] border border-[var(--border)] rounded-md px-2 py-1">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--ink-4)" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          <select
            value={autoRefreshInterval}
            onChange={e => setAutoRefreshInterval(Number(e.target.value) as RefreshInterval)}
            className="
              text-[10px] font-medium text-[var(--ink-3)] bg-transparent
              border-none outline-none cursor-pointer
              pr-1 appearance-none
            "
          >
            {REFRESH_INTERVALS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Countdown ring + timer (visible when auto-refresh is on) */}
        {autoRefreshInterval > 0 && nextRefreshIn !== null && (
          <div className="hidden sm:flex items-center gap-1.5" title={`Next refresh in ${fmtCountdown(nextRefreshIn)}`}>
            {/* SVG ring */}
            <svg width="20" height="20" viewBox="0 0 20 20" style={{ transform: 'rotate(-90deg)' }}>
              {/* Track */}
              <circle cx="10" cy="10" r={r} fill="none" stroke="#E4E7EC" strokeWidth="2.5"/>
              {/* Progress */}
              <circle
                cx="10" cy="10" r={r}
                fill="none"
                stroke="var(--accent)"
                strokeWidth="2.5"
                strokeDasharray={`${dash} ${circ}`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 0.9s linear' }}
              />
            </svg>
            <span className="font-mono text-[10px] text-[var(--ink-3)] w-[28px]">
              {fmtCountdown(nextRefreshIn)}
            </span>
          </div>
        )}

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          disabled={loading}
          className="
            flex items-center gap-1.5
            text-[11px] font-semibold
            bg-[var(--accent)] text-white
            px-3 py-1.5 rounded-md
            hover:bg-[#1447C0]
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors duration-150
            whitespace-nowrap
          "
        >
          <svg
            className={loading ? 'animate-spin' : ''}
            width="12" height="12" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2.5"
          >
            {loading
              ? <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              : <><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></>
            }
          </svg>
          <span className="hidden sm:inline">{loading ? 'Refreshing' : 'Refresh'}</span>
        </button>
      </div>
    </header>
  );
}