'use client';

import { useState, useMemo } from 'react';
import Link                  from 'next/link';
import { fmtNGN, fmtNGNFull } from '@/lib/formatters';
import { sectorColor }        from '@/lib/theme';
import { usePortfolio }       from '@/context/PortfolioContext';
import type { DividendHolding } from '@/services/api';
import { IconTrendingUp, IconCheck } from '@/components/ui/icons';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function Skeleton({ w = 'w-24', h = 'h-3' }: { w?: string; h?: string }) {
  return <div className={`skeleton rounded ${w} ${h}`} />;
}

/** Days until a date string; negative = past */
function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  if (isNaN(target.getTime())) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / 86_400_000);
}

function DateCell({ label, value }: { label: string; value: string | null }) {
  const days = daysUntil(value);
  const urgent = days != null && days >= 0 && days <= 14;
  const past   = days != null && days < 0;

  return (
    <div className="flex flex-col gap-0.5 min-w-[90px]">
      <span className="text-[9px] font-semibold uppercase tracking-[0.07em] text-[var(--ink-4)]">{label}</span>
      {value
        ? <>
          <span className={`font-mono text-[11px] font-medium ${urgent ? 'text-[var(--warn)]' : past ? 'text-[var(--ink-4)] line-through' : 'text-[var(--ink-2)]'}`}>
            {value}
          </span>
          {days != null && !past && (
            <span className={`text-[9px] font-semibold ${urgent ? 'text-[var(--warn)]' : 'text-[var(--ink-4)]'}`}>
              {days === 0 ? 'Today' : `in ${days}d`}
            </span>
          )}
          {past && <span className="text-[9px] text-[var(--ink-4)]">Passed</span>}
        </>
        : <span className="font-mono text-[11px] text-[var(--ink-4)]">—</span>
      }
    </div>
  );
}

/** Coloured urgency pill for the pay date countdown */
function CountdownPill({ payDate }: { payDate: string | null }) {
  const days = daysUntil(payDate);
  if (days == null) return null;

  if (days < 0) return (
    <span className="inline-flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-full bg-[var(--sidebar)] text-[var(--ink-4)]">
      Paid
    </span>
  );
  if (days === 0) return (
    <span className="inline-flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-full bg-[var(--gain-light)] text-[var(--gain)]">
      Pay day!
    </span>
  );
  if (days <= 7) return (
    <span className="inline-flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-full bg-[var(--warn-light)] text-[var(--warn)]">
      {days}d
    </span>
  );
  if (days <= 30) return (
    <span className="inline-flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-full bg-[var(--accent-light)] text-[var(--accent)]">
      {days}d
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-full bg-[var(--sidebar)] text-[var(--ink-3)]">
      {days}d
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Card — one row per holding
// ─────────────────────────────────────────────────────────────────────────────

function DividendCard({ h, sector }: { h: DividendHolding; sector?: string }) {
  const div        = h.dividend;
  const hasDividend = div != null;
  const sCol        = sectorColor(sector ?? '');

  return (
    <div className={`card px-5 py-4 transition-shadow duration-150 hover:shadow-[var(--shadow-hover)] ${!hasDividend ? 'opacity-60' : ''}`}>

      {/* ── Header row ── */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          {/* Sector dot */}
          <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center"
               style={{ background: `${sCol}15`, border: `1.5px solid ${sCol}35` }}>
            <IconTrendingUp width={13} height={13} style={{ stroke: sCol }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Link
                href={`/ngx/profile?ticker=${h.ticker}`}
                className="font-mono font-bold text-[13px] text-[var(--ink)] hover:text-[var(--accent)] transition-colors"
              >
                {h.ticker}
              </Link>
              {hasDividend && <CountdownPill payDate={div!.pay_date} />}
              {!hasDividend && (
                <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-[var(--sidebar)] text-[var(--ink-4)]">
                  No data
                </span>
              )}
            </div>
            <p className="text-[11px] text-[var(--ink-3)] mt-0.5 leading-none">{h.name}</p>
          </div>
        </div>

        {/* Projected payout — right side */}
        {h.projected_payout != null
          ? <div className="text-right shrink-0">
              <div className="font-mono font-bold text-[16px] text-[var(--gain)] leading-none">
                {fmtNGN(h.projected_payout)}
              </div>
              <div className="text-[9px] text-[var(--ink-4)] mt-0.5">projected payout</div>
            </div>
          : <div className="text-right shrink-0">
              <div className="font-mono text-[13px] text-[var(--ink-4)]">—</div>
              <div className="text-[9px] text-[var(--ink-4)] mt-0.5">no dividend</div>
            </div>
        }
      </div>

      {hasDividend
        ? <>
          {/* ── Date row ── */}
          <div className="flex flex-wrap gap-x-6 gap-y-3 mb-4">
            <DateCell label="Ex-Div Date" value={div!.ex_dividend_date} />
            <DateCell label="Record Date" value={div!.record_date} />
            <DateCell label="Pay Date"    value={div!.pay_date} />
          </div>

          {/* ── Metrics row ── */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 pt-3 border-t border-[var(--border)]">
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-semibold uppercase tracking-[0.07em] text-[var(--ink-4)]">Cash / Share</span>
              <span className="font-mono font-semibold text-[12px] text-[var(--ink)]">
                {div!.cash_amount != null ? fmtNGNFull(div!.cash_amount) : '—'}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-semibold uppercase tracking-[0.07em] text-[var(--ink-4)]">Shares Held</span>
              <span className="font-mono text-[12px] text-[var(--ink-2)]">
                {h.shares.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-semibold uppercase tracking-[0.07em] text-[var(--ink-4)]">Avg Cost</span>
              <span className="font-mono text-[12px] text-[var(--ink-2)]">{fmtNGNFull(h.avg_cost)}</span>
            </div>
            {h.yield_on_cost != null && (
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] font-semibold uppercase tracking-[0.07em] text-[var(--ink-4)]">Yield on Cost</span>
                <span className="font-mono font-semibold text-[12px] text-[var(--gain)]">
                  {h.yield_on_cost.toFixed(2)}%
                </span>
              </div>
            )}
          </div>
        </>
        : <p className="text-[11px] text-[var(--ink-4)] pt-2 border-t border-[var(--border)]">
            No upcoming dividend found for {h.ticker}.
            <Link href={`/ngx/profile?ticker=${h.ticker}`} className="ml-1.5 text-[var(--accent)] hover:underline">
              View profile →
            </Link>
          </p>
      }
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Timeline — minimal calendar-style view of upcoming pay dates
// ─────────────────────────────────────────────────────────────────────────────

function Timeline({ holdings }: { holdings: DividendHolding[] }) {
  const upcoming = holdings
    .filter(h => h.dividend?.pay_date && (daysUntil(h.dividend.pay_date) ?? -1) >= 0)
    .sort((a, b) => {
      const da = daysUntil(a.dividend!.pay_date);
      const db = daysUntil(b.dividend!.pay_date);
      return (da ?? 999) - (db ?? 999);
    });

  if (upcoming.length === 0) return null;

  return (
    <div className="card px-5 py-4">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--ink-4)]">Upcoming Pay Dates</span>
        <div className="flex-1 h-px bg-[var(--border)]" />
      </div>
      <div className="relative">
        {/* Vertical track */}
        <div className="absolute left-[11px] top-2 bottom-2 w-px bg-[var(--border)]" />

        <div className="space-y-0">
          {upcoming.map((h, i) => {
            const days = daysUntil(h.dividend!.pay_date)!;
            const isNext = i === 0;
            return (
              <div key={h.ticker} className="flex items-center gap-4 py-2.5">
                {/* Dot */}
                <div className={`w-[23px] h-[23px] rounded-full border-2 flex items-center justify-center shrink-0 z-10 ${
                  isNext
                    ? 'bg-[var(--gain)] border-[var(--gain)]'
                    : days <= 14
                    ? 'bg-white border-[var(--warn)]'
                    : 'bg-white border-[var(--border-strong)]'
                }`}>
                  {isNext && (
                    <IconCheck width={10} height={10} style={{ stroke: 'white' }} />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 flex items-center justify-between gap-3 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <Link
                      href={`/ngx/profile?ticker=${h.ticker}`}
                      className="font-mono font-bold text-[12px] text-[var(--ink)] hover:text-[var(--accent)] transition-colors shrink-0"
                    >
                      {h.ticker}
                    </Link>
                    <span className="text-[11px] text-[var(--ink-3)] truncate hidden sm:block">{h.name}</span>
                    <span className="font-mono text-[10px] text-[var(--ink-4)] shrink-0">{h.dividend!.pay_date}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <CountdownPill payDate={h.dividend!.pay_date} />
                    {h.projected_payout != null && (
                      <span className="font-mono font-semibold text-[12px] text-[var(--gain)]">
                        {fmtNGN(h.projected_payout)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

type Filter = 'all' | 'upcoming' | 'no-data';

export default function DividendsPage() {
  const [filter, setFilter] = useState<Filter>('all');

  const { data: portfolio, dividendsData: resp, dividendsLoading: loading, refresh } = usePortfolio();

  // Sector lookup from portfolio context
  const sectorMap = useMemo(() => {
    const m: Record<string, string> = {};
    portfolio?.ngx_stocks.forEach(s => { m[s.Ticker] = s.Sector; });
    return m;
  }, [portfolio]);

  const holdings = resp?.holdings ?? [];

  const filtered = useMemo(() => {
    if (filter === 'upcoming') return holdings.filter(h => h.dividend?.pay_date && (daysUntil(h.dividend.pay_date) ?? -1) >= 0);
    if (filter === 'no-data')  return holdings.filter(h => !h.dividend);
    return holdings;
  }, [holdings, filter]);

  const upcomingCount = holdings.filter(h => h.dividend?.pay_date && (daysUntil(h.dividend.pay_date) ?? -1) >= 0).length;
  const noDataCount   = holdings.filter(h => !h.dividend).length;

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[15px] font-semibold text-[var(--ink)]">Dividends</h1>
          <p className="text-[11px] text-[var(--ink-4)] mt-0.5">
            {loading ? 'Loading…'
              : `${holdings.length} NGX positions · ${upcomingCount} upcoming`
            }
            {resp?.cache_age_sec != null && (
              <span className="ml-2">· cached {Math.round(resp.cache_age_sec / 60)}m ago</span>
            )}
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="flex items-center gap-1.5 h-8 px-3 text-[11px] font-semibold bg-[var(--accent)] text-white rounded-lg hover:bg-[#17A06B] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <svg className={loading ? 'animate-spin' : ''} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            {loading
              ? <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              : <><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></>
            }
          </svg>
          Refresh
        </button>
      </div>

      {/* ── KPI strip ── */}
      {(loading || resp) && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {loading
            ? [...Array(4)].map((_, i) => <div key={i} className="skeleton rounded-lg h-20" />)
            : <>
              {/* Total projected payout */}
              <div className="kpi-animate card flex flex-col gap-1 px-4 py-3.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-[var(--gain)]" />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.07em] text-[var(--ink-4)]">Total Payout</span>
                </div>
                <span className="font-mono text-[18px] font-semibold leading-tight mt-0.5 text-[var(--gain)]">
                  {resp?.total_projected_payout ? fmtNGN(resp.total_projected_payout) : '—'}
                </span>
                <span className="text-[10px] text-[var(--ink-4)] font-mono mt-0.5">from upcoming divs</span>
              </div>

              {/* Positions paying */}
              <div className="kpi-animate card flex flex-col gap-1 px-4 py-3.5" style={{ animationDelay: '50ms' }}>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-[var(--accent)]" />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.07em] text-[var(--ink-4)]">Paying</span>
                </div>
                <span className="font-mono text-[18px] font-semibold leading-tight mt-0.5 text-[var(--accent)]">
                  {holdings.filter(h => h.dividend).length}
                  <span className="text-[13px] text-[var(--ink-4)] font-normal"> / {holdings.length}</span>
                </span>
                <span className="text-[10px] text-[var(--ink-4)] font-mono mt-0.5">positions with data</span>
              </div>

              {/* Next pay date */}
              {(() => {
                const next = holdings.find(h => h.dividend?.pay_date && (daysUntil(h.dividend.pay_date) ?? -1) >= 0);
                const days = next ? daysUntil(next.dividend!.pay_date) : null;
                return (
                  <div className="kpi-animate card flex flex-col gap-1 px-4 py-3.5" style={{ animationDelay: '100ms' }}>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-[var(--warn)]" />
                      <span className="text-[10px] font-semibold uppercase tracking-[0.07em] text-[var(--ink-4)]">Next Pay</span>
                    </div>
                    <span className="font-mono text-[18px] font-semibold leading-tight mt-0.5 text-[var(--warn)]">
                      {days != null ? `${days}d` : '—'}
                    </span>
                    <span className="text-[10px] text-[var(--ink-4)] font-mono mt-0.5 truncate">
                      {next ? next.ticker : 'none upcoming'}
                    </span>
                  </div>
                );
              })()}

              {/* Highest yield-on-cost */}
              {(() => {
                const top = [...holdings]
                  .filter(h => h.yield_on_cost != null)
                  .sort((a, b) => (b.yield_on_cost ?? 0) - (a.yield_on_cost ?? 0))[0];
                return (
                  <div className="kpi-animate card flex flex-col gap-1 px-4 py-3.5" style={{ animationDelay: '150ms' }}>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-[var(--teal)]" />
                      <span className="text-[10px] font-semibold uppercase tracking-[0.07em] text-[var(--ink-4)]">Best YoC</span>
                    </div>
                    <span className="font-mono text-[18px] font-semibold leading-tight mt-0.5 text-[var(--teal)]">
                      {top ? `${top.yield_on_cost!.toFixed(2)}%` : '—'}
                    </span>
                    <span className="text-[10px] text-[var(--ink-4)] font-mono mt-0.5">
                      {top ? top.ticker : 'no data'}
                    </span>
                  </div>
                );
              })()}
            </>
          }
        </div>
      )}

      {/* ── Timeline ── */}
      {!loading && <Timeline holdings={holdings} />}

      {/* ── Filter tabs ── */}
      <div className="flex items-center gap-1 border-b border-[var(--border)] pb-0">
        {([
          ['all',      `All (${holdings.length})`],
          ['upcoming', `Upcoming (${upcomingCount})`],
          ['no-data',  `No data (${noDataCount})`],
        ] as [Filter, string][]).map(([f, label]) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={[
              'px-4 py-2 text-[11px] font-semibold transition-all duration-150 border-b-2 -mb-px',
              filter === f
                ? 'text-[var(--accent)] border-[var(--accent)]'
                : 'text-[var(--ink-4)] border-transparent hover:text-[var(--ink-3)]',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Card grid ── */}
      {loading
        ? <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton rounded-lg h-48" />
            ))}
          </div>
        : filtered.length === 0
          ? <div className="card px-6 py-12 text-center">
              <p className="text-[13px] text-[var(--ink-3)]">No positions match this filter.</p>
            </div>
          : <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map(h => (
                <DividendCard
                  key={h.ticker}
                  h={h}
                  sector={sectorMap[h.ticker]}
                />
              ))}
            </div>
      }
    </div>
  );
}