'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { fmtAge } from '@/utils/formatters';
import { usePortfolio } from '@/context/PortfolioContext';
import { useAuth } from '@/context/AuthContext';
import {
  IconChartLine,
  IconSearch,
  IconGlobe,
  IconChartPie,
  IconClock,
  IconChartHistory,
  IconSettings,
  IconLogOut,
  IconBookmark,
  IconSparkles,
  IconTrendingUp,
  IconFilter,
} from '@/components/atoms/icons';

const NAV_ITEMS = [
  { href: '/ngx', label: 'NGX', exact: true, icon: <IconChartLine width={14} height={14} /> },
  { href: '/ngx/advanced', label: 'Advanced', icon: <IconSearch width={14} height={14} /> },
  { href: '/ngx/screener', label: 'Screener', icon: <IconFilter width={14} height={14} /> },
  { href: '/us', label: 'US', icon: <IconGlobe width={14} height={14} /> },
  { href: '/combined', label: 'Combined', icon: <IconChartPie width={14} height={14} /> },
  { href: '/dividends', label: 'Dividends', icon: <IconClock width={14} height={14} /> },
  { href: '/history', label: 'History', icon: <IconChartHistory width={14} height={14} /> },
  { href: '/trades', label: 'Trades', icon: <IconTrendingUp width={14} height={14} /> },
  { href: '/watchlist', label: 'Watchlist', icon: <IconBookmark width={14} height={14} /> },
  { href: '/analysis', label: 'AI Analyst', icon: <IconSparkles width={14} height={14} /> },
] as const;

const JOB_INTERVAL_SEC = 3600;
const BUFFER_SEC = 120;

export default function Header() {
  const [now, setNow] = useState<Date | null>(null);
  const pathname = usePathname();
  const { nextRefreshIn, isBuffering, lastUpdated } = usePortfolio();
  const { user, logout } = useAuth();

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const ageSeconds =
    lastUpdated && now ? Math.round((now.getTime() - lastUpdated.getTime()) / 1000) : null;

  const fmtCountdown = (s: number) => {
    if (s <= 0) return '0:00';
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };

  // Ring drains over the full job interval; during buffer it drains over BUFFER_SEC
  const r = 7;
  const circ = 2 * Math.PI * r;
  const totalSec = isBuffering ? BUFFER_SEC : JOB_INTERVAL_SEC;
  const dash = nextRefreshIn != null ? circ * (nextRefreshIn / totalSec) : 0;

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const settingsActive = pathname.startsWith('/settings');
  const userInitial = user?.username?.[0]?.toUpperCase() ?? '?';

  return (
    <header
      className="sticky top-0 z-50 bg-white border-b border-[var(--border)]"
      style={{ boxShadow: '0 1px 0 #E4E7EC' }}
    >
      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <div
        style={{ height: 'var(--header-h)' }}
        className="flex items-center gap-2.5 px-[var(--page-px)] md:px-[var(--page-px-md)] lg:px-[var(--page-px-lg)]"
      >
        {/* Logo */}
        <Link href="/ngx" className="flex items-center gap-2.5 shrink-0 group">
          <img
            src="/equitee-icon-navy.svg"
            alt="equitee"
            width={28}
            height={28}
            className="rounded-[8px] shrink-0"
            style={{ boxShadow: '0 2px 8px rgba(29,184,122,0.25)' }}
          />
          <span className="font-bold text-[13px] tracking-tight text-[var(--ink)]">
            equite<span style={{ color: '#1DB87A' }}>e</span>
          </span>
        </Link>

        <div className="flex-1 min-w-0" />

        {/* Cache age */}
        {ageSeconds !== null && (
          <span className="hidden lg:block font-mono text-[10px] text-[var(--ink-4)] shrink-0 tabular-nums">
            {fmtAge(ageSeconds)}
          </span>
        )}

        {/* Job countdown ring */}
        {nextRefreshIn !== null && (
          <div
            className="hidden sm:flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-[var(--border)] bg-[var(--canvas)] shrink-0"
            title={
              isBuffering
                ? 'Fetching fresh data…'
                : `Next data update in ${fmtCountdown(nextRefreshIn)}`
            }
          >
            <IconClock
              width={11}
              height={11}
              className="shrink-0"
              style={{ stroke: isBuffering ? 'var(--gain)' : 'var(--ink-4)' }}
            />
            <svg width="18" height="18" viewBox="0 0 18 18" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="9" cy="9" r={r} fill="none" stroke="#E4E7EC" strokeWidth="2.5" />
              <circle
                cx="9"
                cy="9"
                r={r}
                fill="none"
                stroke={isBuffering ? 'var(--gain)' : 'var(--accent)'}
                strokeWidth="2.5"
                strokeDasharray={`${dash} ${circ}`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 1s linear' }}
                suppressHydrationWarning
              />
            </svg>
            <span
              className="font-mono text-[10px] font-medium tabular-nums"
              style={{ color: isBuffering ? 'var(--gain)' : 'var(--ink-3)' }}
              suppressHydrationWarning
            >
              {isBuffering ? fmtCountdown(nextRefreshIn) : fmtCountdown(nextRefreshIn)}
            </span>
          </div>
        )}

        <div className="hidden sm:block w-px h-5 bg-[var(--border)] shrink-0" />

        {/* ── User + logout ──────────────────────────────────────────────── */}
        {user && (
          <>
            <div className="hidden sm:flex items-center gap-2 shrink-0">
              <div className="w-6 h-6 rounded-full bg-[var(--accent-light)] flex items-center justify-center text-[10px] font-bold text-[var(--accent)] shrink-0 select-none">
                {userInitial}
              </div>
              <span className="hidden md:block text-[11px] font-semibold text-[var(--ink-3)] max-w-[90px] truncate">
                {user.username}
              </span>
              <button
                onClick={logout}
                className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[var(--loss-light)] text-[var(--loss)] text-[11px] font-semibold hover:bg-red-100 transition-colors shrink-0"
              >
                <IconLogOut width={12} height={12} />
                <span className="hidden lg:inline">Sign out</span>
              </button>
            </div>

            <div className="flex sm:hidden items-center gap-1.5 shrink-0">
              <div className="w-7 h-7 rounded-full bg-[var(--accent-light)] flex items-center justify-center text-[11px] font-bold text-[var(--accent)] select-none">
                {userInitial}
              </div>
              <button
                onClick={logout}
                title="Sign out"
                className="flex items-center justify-center w-7 h-7 rounded-lg bg-[var(--loss-light)] text-[var(--loss)] hover:bg-red-100 transition-colors"
              >
                <IconLogOut width={12} height={12} />
              </button>
            </div>
          </>
        )}

        <div className="w-px h-5 bg-[var(--border)] shrink-0" />
      </div>

      {/* ── Nav bar ─────────────────────────────────────────────────── */}
      <div
        style={{ height: 'var(--nav-h)' }}
        className="hidden sm:flex items-center justify-between px-[var(--page-px)] md:px-[var(--page-px-md)] lg:px-[var(--page-px-lg)] border-t border-[var(--border)] bg-[#FAFBFC]"
      >
        <div className="flex items-center gap-0.5 h-full">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href, (item as { href: string; exact?: boolean }).exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold whitespace-nowrap transition-all duration-150',
                  active
                    ? 'bg-[var(--accent-light)] text-[var(--accent)]'
                    : 'text-[var(--ink-3)] hover:text-[var(--ink)] hover:bg-[var(--canvas)]',
                )}
              >
                <span
                  className={clsx(
                    'transition-colors duration-150',
                    active ? 'text-[var(--accent)]' : 'text-[var(--ink-4)]',
                  )}
                >
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </div>

        <Link
          href="/settings"
          className={clsx(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all duration-150',
            settingsActive
              ? 'bg-[var(--accent-light)] text-[var(--accent)]'
              : 'text-[var(--ink-3)] hover:text-[var(--ink)] hover:bg-[var(--canvas)]',
          )}
        >
          <span
            className={clsx(
              'transition-colors',
              settingsActive ? 'text-[var(--accent)]' : 'text-[var(--ink-4)]',
            )}
          >
            <IconSettings width={15} height={15} />
          </span>
          <span className="hidden lg:inline">Settings</span>
        </Link>
      </div>
    </header>
  );
}
