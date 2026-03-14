'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { fmtAge } from '@/lib/formatters';
import { usePortfolio, REFRESH_INTERVALS, type RefreshInterval } from '@/lib/PortfolioContext';

interface HeaderProps {
  usdngn?:      number;
  fxSource?:    string;
  lastUpdated?: Date;
  loading:      boolean;
  onRefresh:    () => void;
}

const NAV_ITEMS = [
  {
    href: '/ngx', label: 'NGX', exact: true,
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  },
  {
    href: '/ngx/advanced', label: 'Advanced',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  },
  {
    href: '/us', label: 'US',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  },
  {
    href: '/dividends', label: 'Dividends',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>,
  },
  {
    href: '/history', label: 'History',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>,
  },
] as const;

const SETTINGS_ICON = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);

export default function Header({ usdngn, fxSource, lastUpdated, loading, onRefresh }: HeaderProps) {
  const [now, setNow]  = useState<Date>(new Date());
  const pathname       = usePathname();
  const { autoRefreshInterval, setAutoRefreshInterval, nextRefreshIn } = usePortfolio();

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const ageSeconds = lastUpdated
    ? Math.round((now.getTime() - lastUpdated.getTime()) / 1000)
    : null;

  const fmtCountdown = (s: number) => {
    if (s <= 0) return '0:00';
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };

  const r    = 7;
  const circ = 2 * Math.PI * r;
  const dash = (nextRefreshIn != null && autoRefreshInterval > 0)
    ? circ * (nextRefreshIn / autoRefreshInterval) : 0;

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const settingsActive = pathname.startsWith('/settings');

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[var(--border)]" style={{ boxShadow: '0 1px 0 #E4E7EC' }}>

      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <div
        style={{ height: 'var(--header-h)' }}
        className="flex items-center gap-3 px-[var(--page-px)] md:px-[var(--page-px-md)] lg:px-[var(--page-px-lg)]"
      >
        {/* Logo */}
        <Link href="/ngx" className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-7 h-7 rounded-[8px] bg-[var(--accent)] flex items-center justify-center shrink-0"
               style={{ boxShadow: '0 2px 8px rgba(26,86,219,0.3)' }}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M2 10L5.5 6.5L8 9L12 4" stroke="white" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="font-bold text-[13px] text-[var(--ink)] tracking-tight">
            Portfolio<span className="hidden sm:inline font-normal text-[var(--ink-4)]"> Analyzer</span>
          </span>
        </Link>

        <div className="flex-1 min-w-0" />

        {/* FX live pill */}
        {usdngn && (
          <div className="hidden md:flex items-center gap-2 h-8 px-3 rounded-lg border border-[var(--border)] bg-[var(--canvas)] shrink-0">
            <span className="relative flex h-1.5 w-1.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--gain)] opacity-60" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--gain)]" />
            </span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--ink-4)] font-mono">USD/NGN</span>
            <span className="font-mono text-[12px] font-semibold text-[var(--ink)]">
              ₦{usdngn.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            {fxSource && (
              <span className="hidden lg:block text-[9px] uppercase tracking-wide text-[var(--ink-4)] bg-[var(--border)] px-1.5 py-0.5 rounded font-semibold">
                {fxSource}
              </span>
            )}
          </div>
        )}

        <div className="hidden sm:block w-px h-5 bg-[var(--border)] shrink-0" />

        {/* Age */}
        {ageSeconds !== null && (
          <span className="hidden lg:block font-mono text-[10px] text-[var(--ink-4)] shrink-0 tabular-nums">
            {fmtAge(ageSeconds)}
          </span>
        )}

        {/* Auto-refresh select */}
        <div className="hidden sm:flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-[var(--border)] bg-[var(--canvas)] shrink-0">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--ink-4)" strokeWidth="2.5" className="shrink-0">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          <select
            value={autoRefreshInterval}
            onChange={e => setAutoRefreshInterval(Number(e.target.value) as RefreshInterval)}
            className="text-[10px] font-semibold text-[var(--ink-3)] bg-transparent border-none outline-none cursor-pointer appearance-none"
          >
            {REFRESH_INTERVALS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Countdown ring */}
        {autoRefreshInterval > 0 && nextRefreshIn !== null && (
          <div
            className="hidden sm:flex items-center gap-1.5 h-8 px-2 rounded-lg border border-[var(--border)] bg-[var(--canvas)] shrink-0"
            title={`Refreshes in ${fmtCountdown(nextRefreshIn)}`}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="9" cy="9" r={r} fill="none" stroke="#E4E7EC" strokeWidth="2.5"/>
              <circle cx="9" cy="9" r={r} fill="none" stroke="var(--accent)" strokeWidth="2.5"
                strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 1s linear' }}
              />
            </svg>
            <span className="font-mono text-[10px] font-medium text-[var(--ink-3)] w-7 tabular-nums">
              {fmtCountdown(nextRefreshIn)}
            </span>
          </div>
        )}

        <div className="hidden sm:block w-px h-5 bg-[var(--border)] shrink-0" />

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-1.5 h-8 px-3 text-[11px] font-semibold bg-[var(--accent)] text-white rounded-lg hover:bg-[#1447C0] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 shrink-0"
          style={{ boxShadow: '0 1px 4px rgba(26,86,219,0.2)' }}
        >
          <svg
            className={loading ? 'animate-spin' : ''}
            width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          >
            {loading
              ? <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              : <><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></>
            }
          </svg>
          <span className="hidden sm:inline">{loading ? 'Refreshing…' : 'Refresh'}</span>
        </button>
      </div>

      {/* ── Nav bar ─────────────────────────────────────────────────── */}
      <div
        style={{ height: 'var(--nav-h)' }}
        className="hidden sm:flex items-center justify-between px-[var(--page-px)] md:px-[var(--page-px-md)] lg:px-[var(--page-px-lg)] border-t border-[var(--border)] bg-[#FAFBFC]"
      >
        {/* View tabs */}
        <div className="flex items-center gap-0.5 h-full">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href, (item as any).exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold whitespace-nowrap transition-all duration-150',
                  active
                    ? 'bg-[var(--accent-light)] text-[var(--accent)]'
                    : 'text-[var(--ink-3)] hover:text-[var(--ink)] hover:bg-[var(--canvas)]'
                )}
              >
                <span className={clsx('transition-colors duration-150', active ? 'text-[var(--accent)]' : 'text-[var(--ink-4)]')}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Settings — right-aligned */}
        <Link
          href="/settings"
          className={clsx(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all duration-150',
            settingsActive
              ? 'bg-[var(--accent-light)] text-[var(--accent)]'
              : 'text-[var(--ink-3)] hover:text-[var(--ink)] hover:bg-[var(--canvas)]'
          )}
        >
          <span className={clsx('transition-colors', settingsActive ? 'text-[var(--accent)]' : 'text-[var(--ink-4)]')}>
            {SETTINGS_ICON}
          </span>
          <span className="hidden lg:inline">Settings</span>
        </Link>
      </div>

    </header>
  );
}