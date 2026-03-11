'use client';

import { useEffect, useState } from 'react';
import { fetchDividends, fetchPortfolioData } from '@/lib/api';
import { fmtNGN, fmtPct, isPositive } from '@/lib/formatters';
import KPICard from '@/components/ui/KPICard';
import StockTable, { type ColDef } from '@/components/ui/StockTable';
import { ChartSkeleton, PriceBanner } from '@/components/ui/Feedback';
import type { DividendInfo, StockRow } from '@/lib/api';

interface DividendRow extends StockRow {
  ExDividendDate?: string | null;
  CashAmount?: number | null;
  TotalDividend?: number;
  PayDate?: string | null;
  HasDividend?: boolean;
}

interface Summary {
  total: number;
  count: number;
  averageYield: number;
}

const isPastDividend = (dateStr: string | null | undefined): boolean => {
  if (!dateStr) return false;
  const divDate = new Date(dateStr);
  const today = new Date(2026, 2, 11); // March 11, 2026
  return divDate < today;
};

export default function DividendsPage() {
  const [rows, setRows] = useState<DividendRow[]>([]);
  const [summary, setSummary] = useState<Summary>({ total: 0, count: 0, averageYield: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isFirstLoad = loading && !rows.length;

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [divData, portData] = await Promise.all([
          fetchDividends(),
          fetchPortfolioData(),
        ]);

        // Build dividend rows
        const holdings = portData.ngx_stocks;
        const mapped: DividendRow[] = holdings
          .map((h) => {
            const div = divData[h.Ticker];
            const totalDiv = div?.cash_amount ? div.cash_amount * h.Shares : 0;
            return {
              ...h,
              ExDividendDate: div?.ex_dividend_date ?? null,
              CashAmount: div?.cash_amount ?? null,
              TotalDividend: totalDiv || 0,
              PayDate: div?.pay_date ?? null,
              HasDividend: !!div?.cash_amount,
            };
          })
          .sort((a, b) => {
            const dateA = a.ExDividendDate ? new Date(a.ExDividendDate).getTime() : 0;
            const dateB = b.ExDividendDate ? new Date(b.ExDividendDate).getTime() : 0;
            return dateB - dateA; // Most recent first
          });

        const totalDiv = mapped.reduce((sum, r) => sum + (r.TotalDividend ?? 0), 0);
        const countDiv = mapped.filter(r => r.HasDividend).length;
        const avgYield = countDiv > 0 ? totalDiv / mapped.reduce((sum, r) => sum + (r.CurrentEquity ?? 0), 0) * 100 : 0;

        setRows(mapped);
        setSummary({
          total: totalDiv,
          count: countDiv,
          averageYield: avgYield,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dividends');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const cols: ColDef<DividendRow>[] = [
    {
      key: 'Ticker',
      label: 'Ticker',
      render: (v: string) => <span className="font-mono font-semibold text-[var(--ink)] text-[11px]">{v}</span>,
    },
    {
      key: 'Stock',
      label: 'Company',
      render: (v: string) => <span className="text-[var(--ink-2)]">{v}</span>,
    },
    {
      key: 'Shares',
      label: 'Shares',
      right: true,
      render: (v: number) => <span className="font-mono text-[var(--ink-3)]">{v.toLocaleString()}</span>,
      sortValue: (r: DividendRow) => r.Shares ?? 0,
    },
    {
      key: 'CashAmount',
      label: 'Per Share (₦)',
      right: true,
      render: (v: number | null) => (
        <span className="font-mono text-[var(--ink)] font-medium">
          {v ? fmtNGN(v) : '—'}
        </span>
      ),
      sortValue: (r: DividendRow) => r.CashAmount ?? 0,
    },
    {
      key: 'TotalDividend',
      label: 'Total (₦)',
      right: true,
      render: (v: number) => (
        <span className={`font-mono font-semibold text-[11px] ${v > 0 ? 'text-[var(--gain)]' : 'text-[var(--ink-4)]'}`}>
          {v ? fmtNGN(v) : '—'}
        </span>
      ),
      sortValue: (r: DividendRow) => r.TotalDividend ?? 0,
    },
    {
      key: 'ExDividendDate',
      label: 'Ex-Dividend Date',
      render: (v: string | null) => (
        <span className="text-[var(--ink-3)] font-mono">
          {v ? new Date(v).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
        </span>
      ),
      sortValue: (r: DividendRow) => r.ExDividendDate ? new Date(r.ExDividendDate).getTime() : 0,
    },
    {
      key: 'PayDate',
      label: 'Pay Date',
      render: (v: string | null) => (
        <span className="text-[var(--ink-3)] font-mono">
          {v ? new Date(v).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
        </span>
      ),
    },
  ];

  if (error) {
    return (
      <div className="p-6 text-center">
        <span className="text-[var(--loss)]">{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--ink)]">Dividends</h1>
        <p className="text-sm text-[var(--ink-3)]">Upcoming dividend payments for NGX holdings</p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {isFirstLoad ? (
          [...Array(3)].map((_, i) => <ChartSkeleton key={i} height={88} />)
        ) : (
          <>
            <KPICard
              label="Expected Dividends"
              value={fmtNGN(summary.total)}
              accent="gain"
              delay={0}
            />
            <KPICard
              label="Paying Stocks"
              value={`${summary.count}/${rows.length}`}
              accent="accent"
              delay={50}
            />
            <KPICard
              label="Avg Yield"
              value={fmtPct(summary.averageYield)}
              accent={isPositive(summary.averageYield) ? 'gain' : 'neutral'}
              delay={100}
            />
          </>
        )}
      </div>

      {/* Dividends Tables */}
      {isFirstLoad ? (
        <div className="rounded-lg border border-[var(--border)] h-[420px] flex items-center justify-center">
          <span className="text-[var(--ink-4)]">Loading dividends...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Upcoming Dividends */}
          {(() => {
            const upcoming = rows.filter(r => r.ExDividendDate && !isPastDividend(r.ExDividendDate))
              .sort((a, b) => {
                const dateA = a.ExDividendDate ? new Date(a.ExDividendDate).getTime() : 0;
                const dateB = b.ExDividendDate ? new Date(b.ExDividendDate).getTime() : 0;
                return dateA - dateB; // Earliest first
              });
            
            return upcoming.length > 0 ? (
              <div>
                <h3 className="text-lg font-semibold text-[var(--ink)] mb-3">Upcoming</h3>
                <div className="bg-white rounded-lg shadow">
                  <StockTable rows={upcoming} cols={cols} />
                </div>
              </div>
            ) : null;
          })()}

          {/* Past Dividends */}
          {(() => {
            const past = rows.filter(r => r.ExDividendDate && isPastDividend(r.ExDividendDate))
              .sort((a, b) => {
                const dateA = a.ExDividendDate ? new Date(a.ExDividendDate).getTime() : 0;
                const dateB = b.ExDividendDate ? new Date(b.ExDividendDate).getTime() : 0;
                return dateB - dateA; // Most recent first
              });
            
            return past.length > 0 ? (
              <div>
                <h3 className="text-lg font-semibold text-[var(--ink)] mb-3 flex items-center gap-2">
                  Past
                  <span className="text-xs px-2 py-1 bg-[var(--ink-5)] text-[var(--ink-3)] rounded">Historical</span>
                </h3>
                <div className="bg-white rounded-lg shadow">
                  <StockTable rows={past} cols={cols} />
                </div>
              </div>
            ) : null;
          })()}
        </div>
      )}
    </div>
  );
}
