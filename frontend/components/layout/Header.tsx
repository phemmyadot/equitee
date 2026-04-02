'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { fmtAge } from '@/utils/formatters';
import { usePortfolio, REFRESH_INTERVALS, type RefreshInterval } from '@/context/PortfolioContext';
import { useAuth } from '@/context/AuthContext';
import {
  IconChartLine,
  IconSearch,
  IconGlobe,
  IconClock,
  IconChartHistory,
  IconSettings,
  IconLogOut,
  IconBookmark,
} from '@/components/atoms/icons';

interface HeaderProps {
  usdngn?: number;
  fxSource?: string;
  lastUpdated?: Date;
  loading: boolean;
  onRefresh: () => void;
}

const NAV_ITEMS = [
  {
    href: '/ngx',
    label: 'NGX',
    exact: true,
    icon: <IconChartLine width={14} height={14} />,
  },
  {
    href: '/ngx/advanced',
    label: 'Advanced',
    icon: <IconSearch width={14} height={14} />,
  },
  {
    href: '/us',
    label: 'US',
    icon: <IconGlobe width={14} height={14} />,
  },
  {
    href: '/dividends',
    label: 'Dividends',
    icon: <IconClock width={14} height={14} />,
  },
  {
    href: '/history',
    label: 'History',
    icon: <IconChartHistory width={14} height={14} />,
  },
  {
    href: '/watchlist',
    label: 'Watchlist',
    icon: <IconBookmark width={14} height={14} />,
  },
] as const;

const SETTINGS_ICON = <IconSettings width={15} height={15} />;

const LOGOUT_ICON = <IconLogOut width={12} height={12} />;

export default function Header({ usdngn, fxSource, lastUpdated, loading, onRefresh }: HeaderProps) {
  const [now, setNow] = useState<Date | null>(null);
  const pathname = usePathname();
  const { autoRefreshInterval, setAutoRefreshInterval, nextRefreshIn } = usePortfolio();
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

  const r = 7;
  const circ = 2 * Math.PI * r;
  const dash =
    nextRefreshIn != null && autoRefreshInterval > 0
      ? circ * (nextRefreshIn / autoRefreshInterval)
      : 0;

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

        {/* FX live pill */}
        {usdngn && (
          <div className="hidden md:flex items-center gap-2 h-8 px-3 rounded-lg border border-[var(--border)] bg-[var(--canvas)] shrink-0">
            <span className="relative flex h-1.5 w-1.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--gain)] opacity-60" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--gain)]" />
            </span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--ink-4)] font-mono">
              USD/NGN
            </span>
            <span className="font-mono text-[12px] font-semibold text-[var(--ink)]">
              ₦
              {usdngn.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
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
          <IconClock
            width={11}
            height={11}
            className="shrink-0"
            style={{ stroke: 'var(--ink-4)' }}
          />
          <select
            value={autoRefreshInterval}
            onChange={(e) => setAutoRefreshInterval(Number(e.target.value) as RefreshInterval)}
            className="text-[10px] font-semibold text-[var(--ink-3)] bg-transparent border-none outline-none cursor-pointer appearance-none"
          >
            {REFRESH_INTERVALS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
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
              <circle cx="9" cy="9" r={r} fill="none" stroke="#E4E7EC" strokeWidth="2.5" />
              <circle
                cx="9"
                cy="9"
                r={r}
                fill="none"
                stroke="var(--accent)"
                strokeWidth="2.5"
                strokeDasharray={`${dash} ${circ}`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 1s linear' }}
                suppressHydrationWarning
              />
            </svg>
            <span
              className="font-mono text-[10px] font-medium text-[var(--ink-3)] w-7 tabular-nums"
              suppressHydrationWarning
            >
              {fmtCountdown(nextRefreshIn)}
            </span>
          </div>
        )}

        <div className="hidden sm:block w-px h-5 bg-[var(--border)] shrink-0" />

        {/* ── User + logout ──────────────────────────────────────────────── */}
        {user && (
          <>
            {/* Desktop (sm+): avatar, username, sign-out button */}
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
                {LOGOUT_ICON}
                <span className="hidden lg:inline">Sign out</span>
              </button>
            </div>

            {/* Mobile: avatar + compact sign-out */}
            <div className="flex sm:hidden items-center gap-1.5 shrink-0">
              <div className="w-7 h-7 rounded-full bg-[var(--accent-light)] flex items-center justify-center text-[11px] font-bold text-[var(--accent)] select-none">
                {userInitial}
              </div>
              <button
                onClick={logout}
                title="Sign out"
                className="flex items-center justify-center w-7 h-7 rounded-lg bg-[var(--loss-light)] text-[var(--loss)] hover:bg-red-100 transition-colors"
              >
                {LOGOUT_ICON}
              </button>
            </div>
          </>
        )}

        <div className="w-px h-5 bg-[var(--border)] shrink-0" />

        {/* ── Ghost refresh icon ─────────────────────────────────────── */}
        <button
          onClick={onRefresh}
          disabled={loading}
          title={loading ? 'Refreshing…' : 'Refresh data'}
          className="flex items-center justify-center w-7 h-7 rounded-md text-[var(--ink-4)] hover:text-[var(--ink-3)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-150 shrink-0"
        >
          <svg
            className={loading ? 'animate-spin' : ''}
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            {loading ? (
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            ) : (
              <>
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </>
            )}
          </svg>
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

        {/* Settings — right-aligned */}
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
            {SETTINGS_ICON}
          </span>
          <span className="hidden lg:inline">Settings</span>
        </Link>
      </div>
    </header>
  );
}
