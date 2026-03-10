'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

const TABS = [
  {
    href: '/ngx',
    label: 'NGX Overview',
    short: 'NGX',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
  },
  {
    href: '/ngx/advanced',
    label: 'NGX Advanced',
    short: 'Advanced',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    ),
  },
  {
    href: '/us',
    label: 'US Portfolio',
    short: 'US',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
    ),
  },
  {
    href: '/combined',
    label: 'Combined FX',
    short: 'FX',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
      </svg>
    ),
  },
  {
    href: '/history',
    label: 'History',
    short: 'History',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>
      </svg>
    ),
  },
] as const;

export default function Nav() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === '/ngx' ? pathname === '/ngx' : pathname.startsWith(href);

  return (
    <>
      {/* ── Desktop / tablet tab bar ── */}
      <nav
        style={{ height: 'var(--nav-h)' }}
        className="
          hidden sm:flex items-end
          bg-white border-b border-[var(--border)]
          px-[var(--page-px)] md:px-[var(--page-px-md)] lg:px-[var(--page-px-lg)]
          gap-0
        "
      >
        {TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={clsx(
              'flex items-center gap-2 px-4 h-full',
              'text-[12px] font-medium whitespace-nowrap',
              'border-b-2 -mb-px transition-all duration-150',
              isActive(tab.href)
                ? 'text-[var(--accent)] border-[var(--accent)]'
                : 'text-[var(--ink-3)] border-transparent hover:text-[var(--ink)] hover:border-[var(--border-strong)]'
            )}
          >
            <span className={clsx(
              'transition-colors duration-150',
              isActive(tab.href) ? 'text-[var(--accent)]' : 'text-[var(--ink-4)]'
            )}>
              {tab.icon}
            </span>
            <span className="hidden md:inline">{tab.label}</span>
            <span className="md:hidden">{tab.short}</span>
          </Link>
        ))}
      </nav>

      {/* ── Mobile bottom nav ── */}
      <nav className="bottom-nav sm:hidden">
        {TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={clsx('bottom-nav-item', isActive(tab.href) && 'active')}
          >
            {tab.icon}
            {tab.short}
          </Link>
        ))}
      </nav>
    </>
  );
}