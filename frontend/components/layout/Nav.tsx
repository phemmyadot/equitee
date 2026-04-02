'use client';

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
} from '@/components/atoms/icons';

const MOBILE_ITEMS = [
  {
    href: '/ngx',
    label: 'NGX',
    exact: true,
    icon: <IconChartLine width={18} height={18} />,
  },
  {
    href: '/ngx/advanced',
    label: 'Adv',
    icon: <IconSearch width={18} height={18} />,
  },
  {
    href: '/us',
    label: 'US',
    icon: <IconGlobe width={18} height={18} />,
  },
  {
    href: '/dividends',
    label: 'Divs',
    icon: <IconClock width={18} height={18} />,
  },
  {
    href: '/history',
    label: 'History',
    icon: <IconChartHistory width={18} height={18} />,
  },
  {
    href: '/watchlist',
    label: 'Watch',
    icon: <IconBookmark width={18} height={18} />,
  },
  {
    href: '/settings',
    label: 'Settings',
    icon: <IconSettings width={18} height={18} />,
  },
] as const;

export default function Nav() {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <nav className="sm:hidden fixed bottom-3 left-3 right-3 z-[100]">
      <div
        className="flex bg-white rounded-2xl border border-[var(--border)] px-1.5 py-1.5 gap-1"
        style={{ boxShadow: '0 8px 32px rgba(15,23,42,0.12), 0 2px 8px rgba(15,23,42,0.06)' }}
      >
        {MOBILE_ITEMS.map((item) => {
          const active = isActive(item.href, (item as any).exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 flex flex-col items-center justify-center py-1.5 rounded-xl transition-all duration-200 min-w-0"
              style={
                active
                  ? { background: 'var(--accent)', boxShadow: '0 2px 8px rgba(26,86,219,0.25)' }
                  : {}
              }
            >
              <span
                className={clsx(
                  'transition-colors duration-150',
                  active ? 'text-white' : 'text-[var(--ink-4)]',
                )}
              >
                {item.icon}
              </span>
              <span
                className={clsx(
                  'text-[9px] font-semibold tracking-wide leading-none mt-1 transition-colors duration-150',
                  active ? 'text-white' : 'text-[var(--ink-4)]',
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
