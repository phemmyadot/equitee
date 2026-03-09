'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

const TABS = [
  { href: '/ngx',          label: 'NGX Overview',  short: 'NGX'  },
  { href: '/ngx/advanced', label: 'NGX Advanced',  short: 'ADV'  },
  { href: '/us',           label: 'US Portfolio',  short: 'US'   },
  { href: '/combined',     label: 'Combined FX',   short: 'FX'   },
] as const;

export default function Nav() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === '/ngx'
      ? pathname === '/ngx'
      : pathname.startsWith(href);

  return (
    <>
      {/* ── Desktop tab bar ── */}
      <nav className="
        hidden md:flex
        border-b border-[var(--border)]
        bg-[var(--surface)]
        px-8
        relative z-10
      ">
        {TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={clsx(
              'px-6 py-3.5 font-mono text-[11px] tracking-[0.08em] uppercase',
              'border-b-2 transition-all duration-150 whitespace-nowrap',
              isActive(tab.href)
                ? 'text-[var(--blue)] border-[var(--blue)]'
                : 'text-[var(--muted)] border-transparent hover:text-[var(--snow)]'
            )}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      {/* ── Mobile bottom nav ── */}
      <nav className="bottom-nav md:hidden">
        {TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={clsx('bottom-nav-item', isActive(tab.href) && 'active')}
          >
            <span className="text-[14px]">
              {tab.href === '/ngx'          ? '📈' :
               tab.href === '/ngx/advanced' ? '🔬' :
               tab.href === '/us'           ? '🌐' : '💱'}
            </span>
            {tab.short}
          </Link>
        ))}
      </nav>
    </>
  );
}