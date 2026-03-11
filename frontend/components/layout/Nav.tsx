'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

// Mobile nav shows 5 primary destinations.
// Settings is included as the last item with a gear icon.
const MOBILE_ITEMS = [
  {
    href: '/ngx', label: 'NGX', exact: true,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
  },
  {
    href: '/us', label: 'US',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
    ),
  },
  {
    href: '/dividends', label: 'Dividends',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>
      </svg>
    ),
  },
  {
    href: '/history', label: 'History',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>
      </svg>
    ),
  },
  {
    href: '/settings', label: 'Settings',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    ),
  },
] as const;

export default function Nav() {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    // Mobile-only — desktop nav lives inside Header
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-[100]" style={{ height: 'var(--mobile-nav)' }}>
      {/* Frosted glass surface */}
      <div className="absolute inset-0 bg-white/95 border-t border-[var(--border)]"
           style={{ boxShadow: '0 -4px 24px rgba(15,23,42,0.07)', backdropFilter: 'blur(12px)' }} />

      {/* Items */}
      <div className="relative flex h-full">
        {MOBILE_ITEMS.map((item) => {
          const active = isActive(item.href, (item as any).exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 flex flex-col items-center justify-center gap-1 transition-colors duration-150"
            >
              {/* Icon container — pill highlight on active */}
              <div className={clsx(
                'flex items-center justify-center w-10 h-6 rounded-full transition-all duration-200',
                active ? 'bg-[var(--accent-light)]' : ''
              )}>
                <span className={clsx(
                  'transition-colors duration-150',
                  active ? 'text-[var(--accent)]' : 'text-[var(--ink-4)]'
                )}>
                  {item.icon}
                </span>
              </div>
              {/* Label — visible always, accent colour when active */}
              <span className={clsx(
                'text-[9px] font-semibold tracking-wide leading-none transition-colors duration-150',
                active ? 'text-[var(--accent)]' : 'text-[var(--ink-4)]'
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}