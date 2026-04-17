'use client';

import { useState, useEffect } from 'react';
import { getTrades, getBuys } from '@/services/tradesApi';
import type { SaleEvent, BuyEvent } from '@/models/trades';
import { fmtNGN, fmtUSD } from '@/utils/formatters';
import { exportTrades } from '@/utils/csv';

type Tab = 'sells' | 'buys';
type Market = 'ngx' | 'us';

function fmtAmt(market: string, v: number) {
  return market === 'ngx' ? fmtNGN(v) : fmtUSD(v);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

// ─── Sells tab ───────────────────────────────────────────────────────────────

function SellsTab({ sells, market }: { sells: SaleEvent[]; market: Market }) {
  const filtered = sells.filter((t) => t.market === market);
  const totalProceeds = filtered.reduce((s, t) => s + (t.proceeds || 0), 0);
  const totalPL = filtered.reduce((s, t) => s + t.realized_pl, 0);

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="card px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.07em] text-[var(--ink-4)]">
            Proceeds ({market.toUpperCase()})
          </p>
          <p className="font-mono text-[18px] font-semibold text-[var(--ink)] mt-1">
            {fmtAmt(market, totalProceeds)}
          </p>
        </div>
        <div className="card px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.07em] text-[var(--ink-4)]">
            Realized P/L ({market.toUpperCase()})
          </p>
          <p className={`font-mono text-[18px] font-semibold mt-1 ${totalPL >= 0 ? 'text-[var(--gain)]' : 'text-[var(--loss)]'}`}>
            {totalPL >= 0 ? '+' : ''}{fmtAmt(market, totalPL)}
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

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Ticker</th>
                <th>Name</th>
                <th>Type</th>
                <th className="right">Shares</th>
                <th className="right">Price</th>
                <th className="right">Commission</th>
                <th className="right">Proceeds</th>
                <th className="right">Realized P/L</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center text-[var(--ink-4)] py-10 text-[12px]">
                    No {market.toUpperCase()} sales recorded yet.
                  </td>
                </tr>
              )}
              {filtered.map((t) => {
                const isBackfilled = t.shares_sold === 0 && t.sale_price === 0;
                return (
                  <tr key={t.id}>
                    <td className="text-[var(--ink-4)] font-mono text-[11px] whitespace-nowrap">{fmtDate(t.sold_at)}</td>
                    <td><span className="font-mono font-semibold text-[var(--ink)] text-[11px]">{t.ticker}</span></td>
                    <td className="text-[var(--ink-2)] max-w-[140px] truncate">{t.name}</td>
                    <td><span className={`badge ${t.fully_closed ? 'badge-nodata' : 'badge-live'}`}>{t.fully_closed ? 'Full' : 'Partial'}</span></td>
                    <td className="right font-mono text-[var(--ink)]">
                      {isBackfilled ? '—' : t.shares_sold.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                    </td>
                    <td className="right font-mono text-[var(--ink-3)]">{isBackfilled ? '—' : fmtAmt(t.market, t.sale_price)}</td>
                    <td className="right font-mono text-[var(--ink-3)]">
                      {t.commission > 0 ? fmtAmt(t.market, t.commission) : '—'}
                    </td>
                    <td className="right font-mono text-[var(--ink)]">{isBackfilled ? '—' : fmtAmt(t.market, t.proceeds)}</td>
                    <td className={`right font-mono font-semibold ${t.realized_pl >= 0 ? 'text-[var(--gain)]' : 'text-[var(--loss)]'}`}>
                      {t.realized_pl >= 0 ? '+' : ''}{fmtAmt(t.market, t.realized_pl)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// ─── Buys tab ────────────────────────────────────────────────────────────────

function BuysTab({ buys, market }: { buys: BuyEvent[]; market: Market }) {
  const filtered = buys.filter((t) => t.market === market);
  const totalInvested = filtered.reduce((s, t) => s + t.total_cost, 0);
  const totalShares = filtered.reduce((s, t) => s + t.shares_bought, 0);

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="card px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.07em] text-[var(--ink-4)]">
            Total Invested ({market.toUpperCase()})
          </p>
          <p className="font-mono text-[18px] font-semibold text-[var(--ink)] mt-1">
            {fmtAmt(market, totalInvested)}
          </p>
        </div>
        <div className="card px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.07em] text-[var(--ink-4)]">Shares Bought</p>
          <p className="font-mono text-[18px] font-semibold text-[var(--accent)] mt-1">
            {totalShares.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-[var(--ink-4)] mt-0.5 font-mono">across {filtered.length} transaction{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="card px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.07em] text-[var(--ink-4)]">Transactions</p>
          <p className="font-mono text-[18px] font-semibold text-[var(--ink)] mt-1">{filtered.length}</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Ticker</th>
                <th>Name</th>
                <th className="right">Shares</th>
                <th className="right">Buy Price</th>
                <th className="right">Commission</th>
                <th className="right">Total Cost</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-[var(--ink-4)] py-10 text-[12px]">
                    No {market.toUpperCase()} buys recorded yet.
                  </td>
                </tr>
              )}
              {filtered.map((t) => (
                <tr key={t.id}>
                  <td className="text-[var(--ink-4)] font-mono text-[11px] whitespace-nowrap">{fmtDate(t.bought_at)}</td>
                  <td><span className="font-mono font-semibold text-[var(--ink)] text-[11px]">{t.ticker}</span></td>
                  <td className="text-[var(--ink-2)] max-w-[140px] truncate">{t.name}</td>
                  <td className="right font-mono text-[var(--ink)]">
                    {t.shares_bought.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                  </td>
                  <td className="right font-mono text-[var(--ink-3)]">{fmtAmt(t.market, t.buy_price)}</td>
                  <td className="right font-mono text-[var(--ink-3)]">
                    {t.commission > 0 ? fmtAmt(t.market, t.commission) : '—'}
                  </td>
                  <td className="right font-mono font-semibold text-[var(--ink)]">{fmtAmt(t.market, t.total_cost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TradesPage() {
  const [sells, setSells] = useState<SaleEvent[]>([]);
  const [buys, setBuys] = useState<BuyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('sells');
  const [market, setMarket] = useState<Market>('ngx');

  useEffect(() => {
    Promise.allSettled([getTrades(), getBuys()]).then(([s, b]) => {
      if (s.status === 'fulfilled') setSells(s.value);
      if (b.status === 'fulfilled') setBuys(b.value);
      setLoading(false);
    });
  }, []);

  const filtered = tab === 'sells'
    ? sells.filter((t) => t.market === market)
    : buys.filter((t) => t.market === market);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[15px] font-semibold text-[var(--ink)]">Trade History</h1>
          <p className="text-[11px] text-[var(--ink-4)] mt-0.5">
            {loading ? 'Loading…' : `${filtered.length} ${tab === 'sells' ? 'sale' : 'buy'}${filtered.length !== 1 ? 's' : ''} recorded`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => exportTrades(sells, buys)}
            disabled={loading}
            className="text-[10px] font-semibold text-[var(--ink-3)] hover:text-[var(--accent)] px-2 py-1.5 rounded border border-[var(--border)] hover:border-[var(--accent)] transition-colors disabled:opacity-40"
          >
            Export CSV
          </button>

          {/* Sells / Buys tabs */}
          <div className="flex rounded-lg border border-[var(--border)] overflow-hidden">
            {(['sells', 'buys'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={[
                  'px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition-colors',
                  tab === t
                    ? t === 'buys'
                      ? 'bg-[var(--accent-light)] text-[var(--accent)]'
                      : 'bg-[var(--loss-light)] text-[var(--loss)]'
                    : 'text-[var(--ink-4)] hover:text-[var(--ink)]',
                ].join(' ')}
              >
                {t}
              </button>
            ))}
          </div>

          {/* NGX / US market tabs */}
          <div className="flex rounded-lg border border-[var(--border)] overflow-hidden">
            {(['ngx', 'us'] as Market[]).map((m) => (
              <button
                key={m}
                onClick={() => setMarket(m)}
                className={[
                  'px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition-colors',
                  market === m
                    ? 'bg-[var(--accent-light)] text-[var(--accent)]'
                    : 'text-[var(--ink-4)] hover:text-[var(--ink)]',
                ].join(' ')}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="card px-4 py-10 text-center text-[12px] text-[var(--ink-4)]">Loading…</div>
      ) : tab === 'sells' ? (
        <SellsTab sells={sells} market={market} />
      ) : (
        <BuysTab buys={buys} market={market} />
      )}
    </div>
  );
}
