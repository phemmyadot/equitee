'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  fetchWatchlist, addToWatchlist, removeFromWatchlist,
  type WatchlistItem,
} from '@/services/api';
import { computeSignal } from '@/components/ui/Signalscore';
import { computeTargets } from '@/lib/targets';
import Sparkline from '@/components/ui/Sparkline';
import {
  fmtNGNFull, fmtNGN, fmtPct, fmtPct2, isPositive,
} from '@/lib/formatters';
import { sectorColor } from '@/lib/theme';
import { IconBookmark, IconX } from '@/components/ui/icons';

// ── helpers ───────────────────────────────────────────────────────────────────

function _n(v: string | number | null | undefined): number | null {
  if (v == null) return null;
  const f = parseFloat(String(v).replace(/[^0-9.-]/g, ''));
  return isNaN(f) ? null : f;
}

function SignalPill({ item }: { item: WatchlistItem }) {
  const sig = computeSignal(item.overview, item.performance, item.price?.price ?? null, null, null);
  if (!sig) return <span className="text-[var(--ink-4)] text-[10px]">—</span>;

  const price = item.price?.price ?? null;
  const eps   = _n(item.overview?.eps);
  const bv    = _n(item.overview?.book_value);
  const graham = (eps && bv && eps > 0 && bv > 0) ? Math.sqrt(22.5 * eps * bv) : null;
  const tgt   = computeTargets(
    price, graham,
    _n(item.performance?.ma_50),
    _n(item.performance?.ma_200),
    _n(item.performance?.week_52_high),
    _n(item.performance?.week_52_low),
    sig.total,
  );

  const zonePrice = sig.total > 1
    ? (tgt?.buy_low && tgt?.buy_high ? `${fmtNGNFull(tgt.buy_low)}–${fmtNGNFull(tgt.buy_high)}` : null)
    : sig.total < -1
    ? (tgt?.sell_low && tgt?.sell_high ? `${fmtNGNFull(tgt.sell_low)}–${fmtNGNFull(tgt.sell_high)}` : null)
    : null;

  return (
    <div className="flex flex-col gap-0.5">
      <span
        className="text-[10px] font-bold px-1.5 py-0.5 rounded-full inline-block w-fit"
        style={{ color: sig.color, background: sig.color + '22' }}
      >
        {sig.label}
      </span>
      {zonePrice && (
        <span className="font-mono text-[9px] text-[var(--ink-4)]">{zonePrice}</span>
      )}
    </div>
  );
}

function InBuyZone({ item }: { item: WatchlistItem }): boolean {
  const price = item.price?.price;
  if (!price) return false;
  const sig = computeSignal(item.overview, item.performance, price, null, null);
  if (!sig || sig.total <= 1) return false;
  const eps   = _n(item.overview?.eps);
  const bv    = _n(item.overview?.book_value);
  const graham = (eps && bv && eps > 0 && bv > 0) ? Math.sqrt(22.5 * eps * bv) : null;
  const tgt = computeTargets(price, graham, _n(item.performance?.ma_50), _n(item.performance?.ma_200), _n(item.performance?.week_52_high), _n(item.performance?.week_52_low), sig.total);
  if (!tgt?.buy_low || !tgt?.buy_high) return false;
  return price >= tgt.buy_low && price <= tgt.buy_high;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function WatchlistPage() {
  const [items, setItems]     = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);
  const [addInput, setAddInput] = useState('');
  const [addBusy, setAddBusy]   = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetchWatchlist()
      .then(r => setItems(r.items))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = addInput.trim().toUpperCase();
    if (!t) return;
    if (items.some(i => i.ticker === t)) {
      setAddError(`${t} is already on your watchlist`);
      return;
    }
    setAddBusy(true);
    setAddError(null);
    try {
      await addToWatchlist(t);
      setAddInput('');
      load();
    } catch (err: unknown) {
      setAddError(err instanceof Error ? err.message : 'Failed to add ticker');
    } finally {
      setAddBusy(false);
    }
  };

  const handleRemove = async (ticker: string) => {
    setRemoving(ticker);
    try {
      await removeFromWatchlist(ticker);
      setItems(prev => prev.filter(i => i.ticker !== ticker));
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div className="space-y-5">

      {/* Header + Add form */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent-light)] flex items-center justify-center shrink-0">
            <IconBookmark width={15} height={15} style={{ stroke: 'var(--accent)' }} />
          </div>
          <div>
            <h1 className="text-[15px] font-bold text-[var(--ink)] leading-none">Watchlist</h1>
            <p className="text-[11px] text-[var(--ink-4)] mt-0.5">
              {loading ? 'Loading…' : `${items.length} ticker${items.length !== 1 ? 's' : ''} monitored`}
            </p>
          </div>
        </div>

        {/* Add ticker form */}
        <form onSubmit={handleAdd} className="flex items-center gap-2 shrink-0">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <input
                value={addInput}
                onChange={e => { setAddInput(e.target.value.toUpperCase()); setAddError(null); }}
                placeholder="Ticker e.g. GTCO"
                maxLength={12}
                className="h-8 px-3 rounded-lg border border-[var(--border)] bg-[var(--canvas)] text-[11px] font-mono font-semibold text-[var(--ink)] placeholder:text-[var(--ink-4)] focus:outline-none focus:border-[var(--accent)] w-36 transition-colors"
              />
              <button
                type="submit"
                disabled={addBusy || !addInput.trim()}
                className="h-8 px-3 rounded-lg bg-[var(--accent)] text-white text-[11px] font-semibold hover:opacity-90 disabled:opacity-40 transition-opacity whitespace-nowrap"
              >
                {addBusy ? 'Adding…' : '+ Add'}
              </button>
            </div>
            {addError && (
              <p className="text-[10px] text-[var(--loss)]">{addError}</p>
            )}
          </div>
        </form>
      </div>

      {/* Empty state */}
      {!loading && items.length === 0 && (
        <div className="card px-6 py-16 text-center">
          <IconBookmark width={32} height={32} style={{ stroke: 'var(--ink-4)', strokeWidth: 1.5 }} className="mx-auto mb-3" />
          <p className="text-[13px] font-semibold text-[var(--ink-3)] mb-1">No tickers on your watchlist</p>
          <p className="text-[11px] text-[var(--ink-4)] max-w-[260px] mx-auto">
            Type a ticker above to add one, or browse NGX to find stocks to monitor.
          </p>
          <Link
            href="/ngx"
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-[11px] font-semibold hover:opacity-90 transition-opacity"
          >
            Browse NGX
          </Link>
        </div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className="card overflow-hidden">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b border-[var(--border)] last:border-0">
              <div className="skeleton rounded w-16 h-4" />
              <div className="skeleton rounded flex-1 h-3" />
              <div className="skeleton rounded w-20 h-4" />
              <div className="skeleton rounded w-16 h-4" />
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      {!loading && items.length > 0 && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--canvas)]">
                  {['Ticker', 'Company', 'Sector', 'Price', 'Day %', 'P/E', 'ROE', '52W Range', 'Signal', '90d', ''].map(h => (
                    <th key={h} className="px-3 py-2.5 text-[9.5px] font-bold uppercase tracking-[0.07em] text-[var(--ink-4)] whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map(item => {
                  const inBuyZone = InBuyZone({ item });
                  const sector = item.profile?.sector ?? '';
                  const sCol   = sectorColor(sector);
                  const price  = item.price?.price;
                  const changePct = item.price?.change_pct;
                  const pe  = item.overview?.pe_ratio;
                  const roe = item.overview?.roe;
                  const w52l = item.performance?.week_52_low;
                  const w52h = item.performance?.week_52_high;

                  const lo = w52l == null ? null : typeof w52l === 'number' ? w52l : parseFloat(String(w52l).replace(/[^0-9.]/g, ''));
                  const hi = w52h == null ? null : typeof w52h === 'number' ? w52h : parseFloat(String(w52h).replace(/[^0-9.]/g, ''));
                  const rangePct = (lo && hi && hi > lo && price)
                    ? Math.max(0, Math.min(100, ((price - lo) / (hi - lo)) * 100))
                    : null;

                  return (
                    <tr
                      key={item.ticker}
                      className={`border-b border-[var(--border)] last:border-0 transition-colors hover:bg-[var(--canvas)] ${inBuyZone ? 'bg-[var(--gain-light)]' : ''}`}
                    >
                      {/* Ticker */}
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1.5">
                          {inBuyZone && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--gain)] shrink-0" title="In buy zone" />
                          )}
                          <Link
                            href={`/ngx/profile?ticker=${item.ticker}`}
                            className="font-mono font-bold text-[11px] text-[var(--accent)] hover:underline"
                          >
                            {item.ticker}
                          </Link>
                        </div>
                      </td>

                      {/* Company */}
                      <td className="px-3 py-3 max-w-[160px]">
                        <span className="text-[11px] text-[var(--ink-2)] truncate block">{item.profile?.name ?? '—'}</span>
                      </td>

                      {/* Sector */}
                      <td className="px-3 py-3">
                        {sector ? (
                          <span className="flex items-center gap-1 text-[10px] text-[var(--ink-3)] whitespace-nowrap">
                            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: sCol }} />
                            {sector}
                          </span>
                        ) : <span className="text-[var(--ink-4)]">—</span>}
                      </td>

                      {/* Price */}
                      <td className="px-3 py-3 text-right">
                        {price != null
                          ? <span className="font-mono font-semibold text-[11px] text-[var(--ink)]">{fmtNGNFull(price)}</span>
                          : <span className="text-[var(--ink-4)]">—</span>}
                      </td>

                      {/* Day % */}
                      <td className="px-3 py-3 text-right">
                        {changePct != null
                          ? <span className={`font-mono text-[11px] font-medium ${isPositive(changePct) ? 'text-[var(--gain)]' : 'text-[var(--loss)]'}`}>
                              {fmtPct2(changePct)}
                            </span>
                          : <span className="text-[var(--ink-4)]">—</span>}
                      </td>

                      {/* P/E */}
                      <td className="px-3 py-3 text-right">
                        <span className="font-mono text-[11px] text-[var(--ink-3)]">{pe ?? '—'}</span>
                      </td>

                      {/* ROE */}
                      <td className="px-3 py-3 text-right">
                        <span className="font-mono text-[11px] text-[var(--ink-3)]">{roe ?? '—'}</span>
                      </td>

                      {/* 52W Range bar */}
                      <td className="px-3 py-3 min-w-[100px]">
                        {rangePct != null ? (
                          <div className="flex flex-col gap-0.5">
                            <div className="relative h-1.5 rounded-full overflow-hidden bg-[var(--border)] w-[80px]">
                              <div
                                className="absolute left-0 top-0 h-full rounded-full"
                                style={{
                                  width: `${rangePct}%`,
                                  background: rangePct > 70 ? 'var(--gain)' : rangePct > 35 ? 'var(--accent)' : 'var(--loss)',
                                  opacity: 0.7,
                                }}
                              />
                            </div>
                            <span className="text-[8px] font-mono text-[var(--ink-4)]">
                              {fmtNGN(lo)} – {fmtNGN(hi)}
                            </span>
                          </div>
                        ) : <span className="text-[var(--ink-4)]">—</span>}
                      </td>

                      {/* Signal */}
                      <td className="px-3 py-3">
                        <SignalPill item={item} />
                      </td>

                      {/* Sparkline */}
                      <td className="px-3 py-3">
                        <Sparkline ticker={item.ticker} />
                      </td>

                      {/* Remove */}
                      <td className="px-3 py-3">
                        <button
                          onClick={() => handleRemove(item.ticker)}
                          disabled={removing === item.ticker}
                          title="Remove from watchlist"
                          className="flex items-center justify-center w-6 h-6 rounded-md text-[var(--ink-4)] hover:text-[var(--loss)] hover:bg-[var(--loss-light)] transition-colors disabled:opacity-40"
                        >
                          <IconX width={12} height={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {items.some(i => InBuyZone({ item: i })) && (
            <div className="px-4 py-2.5 border-t border-[var(--border)] bg-[var(--gain-light)]">
              <span className="text-[9.5px] font-semibold text-[var(--gain)] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--gain)]" />
                Green rows indicate the current price is within the computed buy zone.
              </span>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
