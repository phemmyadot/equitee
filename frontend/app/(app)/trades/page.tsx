'use client';

import { useState, useEffect } from 'react';
import { getTrades } from '@/services/tradesApi';
import type { SaleEvent } from '@/models/trades';
import { fmtNGN, fmtUSD } from '@/utils/formatters';

export default function TradesPage() {
  const [trades, setTrades] = useState<SaleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'ngx' | 'us'>('all');

  useEffect(() => {
    getTrades()
      .then(setTrades)
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? trades : trades.filter((t) => t.market === filter);

  const fmtCurrency = (t: SaleEvent, v: number) =>
    t.market === 'ngx' ? fmtNGN(v) : fmtUSD(v);

  const totalProceeds = filtered.reduce((s, t) => s + (t.proceeds || 0), 0);
  const totalPL = filtered.reduce((s, t) => s + t.realized_pl, 0);
  const ngxProceeds = trades.filter((t) => t.market === 'ngx').reduce((s, t) => s + (t.proceeds || 0), 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[15px] font-semibold text-[var(--ink)]">Trade History</h1>
          <p className="text-[11px] text-[var(--ink-4)] mt-0.5">
            {trades.length} sale{trades.length !== 1 ? 's' : ''} recorded
          </p>
        </div>
        {/* Market filter */}
        <div className="flex gap-1">
          {(['all', 'ngx', 'us'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={[
                'px-3 py-1.5 rounded-md text-[10px] font-semibold uppercase tracking-wide transition-colors',
                filter === f
                  ? 'bg-[var(--accent-light)] text-[var(--accent)]'
                  : 'text-[var(--ink-4)] hover:text-[var(--ink)]',
              ].join(' ')}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="card px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.07em] text-[var(--ink-4)]">
            Total Proceeds {filter !== 'all' ? `(${filter.toUpperCase()})` : '(NGX)'}
          </p>
          <p className="font-mono text-[18px] font-semibold text-[var(--ink)] mt-1">
            {filter === 'us' ? fmtUSD(totalProceeds) : fmtNGN(filter === 'all' ? ngxProceeds : totalProceeds)}
          </p>
          {filter === 'all' && (
            <p className="text-[10px] text-[var(--ink-4)] mt-0.5 font-mono">NGX only · US proceeds in USD</p>
          )}
        </div>
        <div className="card px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.07em] text-[var(--ink-4)]">
            Realized P/L {filter !== 'all' ? `(${filter.toUpperCase()})` : ''}
          </p>
          <p
            className={[
              'font-mono text-[18px] font-semibold mt-1',
              totalPL >= 0 ? 'text-[var(--gain)]' : 'text-[var(--loss)]',
            ].join(' ')}
          >
            {totalPL >= 0 ? '+' : ''}{fmtNGN(totalPL)}
          </p>
        </div>
        <div className="card px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.07em] text-[var(--ink-4)]">Transactions</p>
          <p className="font-mono text-[18px] font-semibold text-[var(--accent)] mt-1">{filtered.length}</p>
          <p className="text-[10px] text-[var(--ink-4)] mt-0.5 font-mono">
            {filtered.filter((t) => t.fully_closed).length} full ·{' '}
            {filtered.filter((t) => !t.fully_closed).length} partial
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Ticker</th>
                <th>Name</th>
                <th>Market</th>
                <th>Type</th>
                <th className="right">Shares Sold</th>
                <th className="right">Sale Price</th>
                <th className="right">Proceeds</th>
                <th className="right">Realized P/L</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={9} className="text-center text-[var(--ink-4)] py-10 text-[12px]">
                    Loading…
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center text-[var(--ink-4)] py-10 text-[12px]">
                    No sales recorded yet.
                  </td>
                </tr>
              )}
              {filtered.map((t) => {
                const isBackfilled = t.shares_sold === 0 && t.sale_price === 0;
                return (
                  <tr key={t.id}>
                    <td className="text-[var(--ink-4)] font-mono text-[11px] whitespace-nowrap">
                      {new Date(t.sold_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td>
                      <span className="font-mono font-semibold text-[var(--ink)] text-[11px]">
                        {t.ticker}
                      </span>
                    </td>
                    <td className="text-[var(--ink-2)] max-w-[160px] truncate">{t.name}</td>
                    <td>
                      <span className={`badge ${t.market === 'ngx' ? 'badge-live' : 'badge-yahoo'}`}>
                        {t.market.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${t.fully_closed ? 'badge-nodata' : 'badge-live'}`}
                      >
                        {t.fully_closed ? 'Full' : 'Partial'}
                      </span>
                    </td>
                    <td className="right font-mono text-[var(--ink)]">
                      {isBackfilled ? '—' : t.shares_sold.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                    </td>
                    <td className="right font-mono text-[var(--ink-3)]">
                      {isBackfilled ? '—' : fmtCurrency(t, t.sale_price)}
                    </td>
                    <td className="right font-mono text-[var(--ink)]">
                      {isBackfilled ? '—' : fmtCurrency(t, t.proceeds)}
                    </td>
                    <td
                      className={`right font-mono font-semibold ${
                        t.realized_pl >= 0 ? 'text-[var(--gain)]' : 'text-[var(--loss)]'
                      }`}
                    >
                      {t.realized_pl >= 0 ? '+' : ''}
                      {fmtCurrency(t, t.realized_pl)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
