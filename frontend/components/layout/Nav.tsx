'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import {
  IconChartLine,
  IconSearch,
  IconGlobe,
  IconClock,
  IconChartHistory,
  IconSettings,
  IconBookmark,
  IconSparkles,
} from '@/components/atoms/icons';

const NAV_ITEMS = [
  { href: '/ngx', label: 'NGX', exact: true, icon: <IconChartLine width={20} height={20} /> },
  { href: '/ngx/advanced', label: 'Advanced', icon: <IconSearch width={20} height={20} /> },
  { href: '/us', label: 'US Market', icon: <IconGlobe width={20} height={20} /> },
  { href: '/dividends', label: 'Dividends', icon: <IconClock width={20} height={20} /> },
  { href: '/history', label: 'History', icon: <IconChartHistory width={20} height={20} /> },
  { href: '/watchlist', label: 'Watchlist', icon: <IconBookmark width={20} height={20} /> },
  { href: '/analysis', label: 'AI Analyst', icon: <IconSparkles width={20} height={20} /> },
  { href: '/settings', label: 'Settings', icon: <IconSettings width={20} height={20} /> },
] as const;

function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      {open ? (
        <>
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </>
      ) : (
        <>
          <line x1="3" y1="7" x2="21" y2="7" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="17" x2="21" y2="17" />
        </>
      )}
    </svg>
  );
}

export default function Nav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close drawer on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <>
      {/* ── Hamburger FAB ──────────────────────────────────────────── */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="sm:hidden fixed bottom-5 right-4 z-[110] w-12 h-12 rounded-2xl bg-[var(--accent)] text-white flex items-center justify-center transition-transform duration-200 active:scale-95"
        style={{ boxShadow: '0 4px 20px rgba(26,86,219,0.35)' }}
        aria-label={open ? 'Close menu' : 'Open menu'}
      >
        <HamburgerIcon open={open} />
      </button>

      {/* ── Backdrop ───────────────────────────────────────────────── */}
      {open && (
        <div
          className="sm:hidden fixed inset-0 z-[105] bg-black/40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Slide-up drawer ────────────────────────────────────────── */}
      <div
        className={clsx(
          'sm:hidden fixed left-3 right-3 z-[108] rounded-2xl bg-white border border-[var(--border)] overflow-hidden transition-all duration-300 ease-out',
          open
            ? 'bottom-[76px] opacity-100 translate-y-0'
            : 'bottom-[76px] opacity-0 translate-y-4 pointer-events-none',
        )}
        style={{ boxShadow: '0 8px 40px rgba(15,23,42,0.18)' }}
      >
        <div className="grid grid-cols-2 gap-px bg-[var(--border)] p-px">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href, (item as { href: string; exact?: boolean }).exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'flex items-center gap-3 px-4 py-3.5 transition-colors duration-150',
                  active
                    ? 'bg-[var(--accent-light)] text-[var(--accent)]'
                    : 'bg-white text-[var(--ink-2)] hover:bg-[var(--canvas)]',
                )}
              >
                <span className={active ? 'text-[var(--accent)]' : 'text-[var(--ink-4)]'}>
                  {item.icon}
                </span>
                <span className="text-[13px] font-semibold">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
