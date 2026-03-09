'use client';

import { useEffect, useState } from 'react';
import { fmtAge } from '@/lib/formatters';

interface HeaderProps {
  usdngn?:   number;
  fxSource?: string;
  lastUpdated?: Date;
  loading:   boolean;
  onRefresh: () => void;
}

export default function Header({ usdngn, fxSource, lastUpdated, loading, onRefresh }: HeaderProps) {
  const [now, setNow] = useState<Date>(new Date());

  // Tick the clock every second so "X ago" stays fresh
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const ageSeconds = lastUpdated
    ? Math.round((now.getTime() - lastUpdated.getTime()) / 1000)
    : null;

  return (
    <header className="
      sticky top-0 z-50
      flex items-center justify-between
      px-4 md:px-8 h-14
      border-b border-[var(--border)]
      bg-[rgba(7,9,15,0.92)] backdrop-blur-md
    ">
      {/* Logo */}
      <div className="font-mono text-[11px] font-bold tracking-[0.18em] uppercase select-none">
        <span className="text-[var(--blue)]">PORT</span>
        <span className="text-[var(--gold)]">FOLIO</span>
        <span className="text-[var(--muted)] ml-2 hidden sm:inline">ANALYZER</span>
      </div>

      {/* Centre — FX rate */}
      {usdngn && (
        <div className="hidden md:flex items-center gap-3">
          <span className="font-mono text-[10px] text-[var(--muted)] tracking-wider">USD/NGN</span>
          <span className="font-mono text-[13px] font-bold text-[var(--gold)]">
            ₦{usdngn.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          {fxSource && (
            <span className="font-mono text-[9px] text-[var(--muted)] bg-[var(--dim)] px-2 py-0.5 rounded-sm">
              {fxSource}
            </span>
          )}
        </div>
      )}

      {/* Right — timestamp + refresh */}
      <div className="flex items-center gap-3">
        {lastUpdated && (
          <span className="hidden sm:block font-mono text-[9px] text-[var(--muted)]">
            {ageSeconds !== null ? fmtAge(ageSeconds) : '—'}
          </span>
        )}

        <button
          onClick={onRefresh}
          disabled={loading}
          className="
            font-mono text-[10px] tracking-wider
            border border-[var(--blue)] text-[var(--blue)]
            px-3 py-1.5 rounded
            hover:bg-[var(--blue)] hover:text-[var(--bg)]
            disabled:opacity-40 disabled:cursor-not-allowed
            transition-all duration-150
          "
        >
          {loading ? '···' : '⟳ REFRESH'}
        </button>
      </div>
    </header>
  );
}