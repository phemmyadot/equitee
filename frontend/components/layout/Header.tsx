'use client';

import { useEffect, useState } from 'react';
import { fmtAge } from '@/lib/formatters';

interface HeaderProps {
  usdngn?:     number;
  fxSource?:   string;
  lastUpdated?: Date;
  loading:     boolean;
  onRefresh:   () => void;
}

export default function Header({ usdngn, fxSource, lastUpdated, loading, onRefresh }: HeaderProps) {
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const ageSeconds = lastUpdated
    ? Math.round((now.getTime() - lastUpdated.getTime()) / 1000)
    : null;

  return (
    <header style={{ height: 'var(--header-h)' }} className="
      sticky top-0 z-50
      flex items-center justify-between
      bg-white border-b border-[var(--border)]
      shadow-[0_1px_0_#E4E7EC]
      px-[var(--page-px)] md:px-[var(--page-px-md)] lg:px-[var(--page-px-lg)]
    ">

      {/* Left — logo */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Icon mark */}
        <div className="
          w-7 h-7 rounded-md bg-[var(--accent)]
          flex items-center justify-center shrink-0
        ">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 10L5.5 6.5L8 9L12 4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <span className="font-semibold text-[13px] text-[var(--ink)] tracking-tight">
          Portfolio
        </span>
        <span className="hidden sm:block text-[var(--ink-4)] text-[13px]">Analyzer</span>
      </div>

      {/* Centre — FX rate chip */}
      {usdngn && (
        <div className="
          hidden md:flex items-center gap-2
          bg-[var(--canvas)] border border-[var(--border)]
          rounded-lg px-3 py-1.5
        ">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-4)] font-mono">
            USD/NGN
          </span>
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

      {/* Right — last updated + refresh */}
      <div className="flex items-center gap-3 shrink-0">
        {ageSeconds !== null && (
          <span className="hidden sm:block font-mono text-[10px] text-[var(--ink-4)]">
            {fmtAge(ageSeconds)}
          </span>
        )}

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
          {loading ? (
            <>
              <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
              <span className="hidden sm:inline">Refreshing</span>
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                <path d="M3 3v5h5"/>
              </svg>
              <span className="hidden sm:inline">Refresh</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}