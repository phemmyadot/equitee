'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePortfolio } from '@/context/PortfolioContext';
import Link from 'next/link';
import {
  fetchWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  createAlert,
  deleteAlert,
} from '@/services/api';
import type { WatchlistItem, TriggeredAlert, PriceAlert } from '@/models';
import { computeSignal } from '@/components/molecules/Signalscore';
import { computeTargets } from '@/utils/targets';
import Sparkline from '@/components/atoms/Sparkline';
import { fmtNGNFull, fmtNGN, fmtUSD, fmtPct2, isPositive } from '@/utils/formatters';
import { sectorColor } from '@/utils/theme';
import { IconBookmark, IconX, IconBell } from '@/components/atoms/icons';

type Tab = 'NGX' | 'US';

function fmtAgo(iso: string | null): string {
  if (!iso) return '';
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m ago`;
}

// ── AlertRow ──────────────────────────────────────────────────────────────────

function AlertRow({ alert, onDelete }: { alert: PriceAlert; onDelete: (id: number) => void }) {
  return (
    <div className="flex items-center gap-2 text-[10px]">
      <span
        className={`px-1.5 py-0.5 rounded font-bold font-mono text-[9px] ${alert.direction === 'above' ? 'bg-[var(--gain-light)] text-[var(--gain)]' : 'bg-[var(--loss-light)] text-[var(--loss)]'}`}
      >
        {alert.direction === 'above' ? '↑' : '↓'}{' '}
        {alert.market === 'US'
          ? `$${alert.threshold_price.toFixed(2)}`
          : fmtNGNFull(alert.threshold_price)}
      </span>
      {alert.note && (
        <span className="text-[var(--ink-4)] truncate max-w-[100px]">{alert.note}</span>
      )}
      <button
        onClick={() => onDelete(alert.id)}
        className="flex items-center justify-center w-4 h-4 rounded text-[var(--ink-4)] hover:text-[var(--loss)] transition-colors"
      >
        <IconX width={9} height={9} />
      </button>
    </div>
  );
}

// ── AlertSetForm ──────────────────────────────────────────────────────────────

function AlertSetForm({
  ticker,
  market,
  currentPrice,
  onCreated,
  onClose,
}: {
  ticker: string;
  market: string;
  currentPrice: number | null;
  onCreated: () => void;
  onClose: () => void;
}) {
  const [price, setPrice] = useState(currentPrice?.toFixed(market === 'US' ? 2 : 0) ?? '');
  const [direction, setDirection] = useState<'above' | 'below'>('above');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseFloat(price);
    if (!p || isNaN(p)) return;
    setBusy(true);
    try {
      await createAlert(ticker, market as 'NGX' | 'US', p, direction);
      onCreated();
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex items-center gap-1.5 mt-1">
      <select
        value={direction}
        onChange={(e) => setDirection(e.target.value as 'above' | 'below')}
        className="h-6 px-1.5 rounded border border-[var(--border)] bg-[var(--canvas)] text-[10px] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
      >
        <option value="above">Above</option>
        <option value="below">Below</option>
      </select>
      <input
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        placeholder="Price"
        type="number"
        step="any"
        className="h-6 px-1.5 rounded border border-[var(--border)] bg-[var(--canvas)] text-[10px] font-mono text-[var(--ink)] focus:outline-none focus:border-[var(--accent)] w-20"
      />
      <button
        type="submit"
        disabled={busy || !price}
        className="h-6 px-2 rounded bg-[var(--accent)] text-white text-[10px] font-semibold disabled:opacity-40"
      >
        Set
      </button>
      <button
        type="button"
        onClick={onClose}
        className="h-6 px-1.5 rounded border border-[var(--border)] text-[10px] text-[var(--ink-4)] hover:text-[var(--ink)]"
      >
        ✕
      </button>
    </form>
  );
}

// ── helpers ───────────────────────────────────────────────────────────────────

function _n(v: string | number | null | undefined): number | null {
  if (v == null) return null;
  const f = parseFloat(String(v).replace(/[^0-9.-]/g, ''));
  return isNaN(f) ? null : f;
}

function SignalPill({ item }: { item: WatchlistItem }) {
  const sig = computeSignal(
    item.overview,
    item.performance,
    item.price?.price ?? null,
    null,
    null,
    item.profile?.sector ?? null,
  );
  if (!sig) return <span className="text-[var(--ink-4)] text-[10px]">—</span>;

  const price = item.price?.price ?? null;
  const eps = _n(item.overview?.eps);
  const bv = _n(item.overview?.book_value);
  const graham = eps && bv && eps > 0 && bv > 0 ? Math.sqrt(22.5 * eps * bv) : null;
  const tgt = computeTargets(
    price,
    graham,
    _n(item.performance?.ma_50),
    _n(item.performance?.ma_200),
    _n(item.performance?.week_52_high),
    _n(item.performance?.week_52_low),
    sig.total,
  );

  const zonePrice =
    sig.total > 1
      ? tgt?.buy_low && tgt?.buy_high
        ? `${fmtNGNFull(tgt.buy_low)}–${fmtNGNFull(tgt.buy_high)}`
        : null
      : sig.total < -1
        ? tgt?.sell_low && tgt?.sell_high
          ? `${fmtNGNFull(tgt.sell_low)}–${fmtNGNFull(tgt.sell_high)}`
          : null
        : null;

  return (
    <div className="flex flex-col gap-0.5">
      <span
        className="text-[10px] font-bold px-1.5 py-0.5 rounded-full inline-block w-fit"
        style={{ color: sig.color, background: sig.color + '22' }}
      >
        {sig.label}
      </span>
      {zonePrice && <span className="font-mono text-[9px] text-[var(--ink-4)]">{zonePrice}</span>}
    </div>
  );
}

function InBuyZone({ item }: { item: WatchlistItem }): boolean {
  const price = item.price?.price;
  if (!price) return false;
  const sig = computeSignal(
    item.overview,
    item.performance,
    price,
    null,
    null,
    item.profile?.sector ?? null,
  );
  if (!sig || sig.total <= 1) return false;
  const eps = _n(item.overview?.eps);
  const bv = _n(item.overview?.book_value);
  const graham = eps && bv && eps > 0 && bv > 0 ? Math.sqrt(22.5 * eps * bv) : null;
  const tgt = computeTargets(
    price,
    graham,
    _n(item.performance?.ma_50),
    _n(item.performance?.ma_200),
    _n(item.performance?.week_52_high),
    _n(item.performance?.week_52_low),
    sig.total,
  );
  if (!tgt?.buy_low || !tgt?.buy_high) return false;
  return price >= tgt.buy_low && price <= tgt.buy_high;
}

// ── WatchlistTable ────────────────────────────────────────────────────────────

function WatchlistTable({
  items,
  isUS,
  removing,
  onRemove,
  alerts,
  onAlertCreated,
  onAlertDeleted,
  priceHistories,
}: {
  items: WatchlistItem[];
  isUS: boolean;
  removing: string | null;
  onRemove: (ticker: string) => void;
  alerts: PriceAlert[];
  onAlertCreated: () => void;
  onAlertDeleted: (id: number) => void;
  priceHistories: Record<string, { ts: string; price: number | null; change_pct: number | null }[]>;
}) {
  const [alertFormTicker, setAlertFormTicker] = useState<string | null>(null);

  const ngxCols = [
    'Ticker',
    'Company',
    'Sector',
    'Price',
    'Day %',
    'Since Added',
    'P/E',
    'ROE',
    '52W Range',
    'Signal',
    '90d',
    'Alerts',
    '',
  ];
  const usCols = [
    'Ticker',
    'Company',
    'Sector',
    'Price',
    'Day %',
    'Since Added',
    'P/E',
    'ROE',
    '52W Range',
    'Signal',
    'Alerts',
    '',
  ];

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--canvas)]">
              {(isUS ? usCols : ngxCols).map((h) => (
                <th
                  key={h}
                  className="px-3 py-2.5 text-[9.5px] font-bold uppercase tracking-[0.07em] text-[var(--ink-4)] whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const inBuyZone = !isUS && InBuyZone({ item });
              const sector = item.profile?.sector || item.profile?.industry || '';
              const sCol = sectorColor(sector);
              const price = item.price?.price;
              const changePct = item.price?.change_pct;

              return (
                <tr
                  key={item.ticker}
                  className={`border-b border-[var(--border)] last:border-0 transition-colors hover:bg-[var(--canvas)] ${inBuyZone ? 'bg-[var(--gain-light)]' : ''}`}
                >
                  {/* Ticker */}
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1.5">
                      {inBuyZone && (
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-[var(--gain)] shrink-0"
                          title="In buy zone"
                        />
                      )}
                      <Link
                        href={
                          isUS
                            ? `/us/profile?ticker=${item.ticker}`
                            : `/ngx/profile?ticker=${item.ticker}`
                        }
                        className="font-mono font-bold text-[11px] text-[var(--accent)] hover:underline"
                      >
                        {item.ticker}
                      </Link>
                    </div>
                  </td>

                  {/* Company */}
                  <td className="px-3 py-3 max-w-[160px]">
                    <span className="text-[11px] text-[var(--ink-2)] truncate block">
                      {item.profile?.name ?? '—'}
                    </span>
                  </td>

                  {/* Sector */}
                  <td className="px-3 py-3">
                    {sector ? (
                      <span className="flex items-center gap-1 text-[10px] text-[var(--ink-3)] whitespace-nowrap">
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ background: sCol }}
                        />
                        {sector}
                      </span>
                    ) : (
                      <span className="text-[var(--ink-4)]">—</span>
                    )}
                  </td>

                  {/* Price */}
                  <td className="px-3 py-3 text-right">
                    {price != null ? (
                      <span className="font-mono font-semibold text-[11px] text-[var(--ink)]">
                        {isUS ? fmtUSD(price) : fmtNGNFull(price)}
                      </span>
                    ) : (
                      <span className="text-[var(--ink-4)]">—</span>
                    )}
                  </td>

                  {/* Day % */}
                  <td className="px-3 py-3 text-right">
                    {changePct != null ? (
                      <span
                        className={`font-mono text-[11px] font-medium ${isPositive(changePct) ? 'text-[var(--gain)]' : 'text-[var(--loss)]'}`}
                      >
                        {fmtPct2(changePct)}
                      </span>
                    ) : (
                      <span className="text-[var(--ink-4)]">—</span>
                    )}
                  </td>

                  {/* Since Added */}
                  <td className="px-3 py-3 text-right">
                    {item.since_added_pct != null ? (
                      <span
                        className={`font-mono text-[11px] font-medium ${isPositive(item.since_added_pct) ? 'text-[var(--gain)]' : 'text-[var(--loss)]'}`}
                      >
                        {fmtPct2(item.since_added_pct)}
                      </span>
                    ) : (
                      <span className="text-[var(--ink-4)]">—</span>
                    )}
                  </td>

                  {/* P/E — both markets */}
                  <td className="px-3 py-3 text-right">
                    <span className="font-mono text-[11px] text-[var(--ink-3)]">
                      {item.overview?.pe_ratio != null
                        ? Number(item.overview.pe_ratio).toFixed(1)
                        : '—'}
                    </span>
                  </td>

                  {/* ROE — both markets */}
                  <td className="px-3 py-3 text-right">
                    <span className="font-mono text-[11px] text-[var(--ink-3)]">
                      {item.overview?.roe != null
                        ? `${Number(item.overview.roe).toFixed(1)}%`
                        : '—'}
                    </span>
                  </td>

                  {/* 52W Range — both markets */}
                  <td className="px-3 py-3 min-w-[100px]">
                    {(() => {
                      const w52l = item.performance?.week_52_low;
                      const w52h = item.performance?.week_52_high;
                      const lo =
                        w52l == null
                          ? null
                          : typeof w52l === 'number'
                            ? w52l
                            : parseFloat(String(w52l).replace(/[^0-9.]/g, ''));
                      const hi =
                        w52h == null
                          ? null
                          : typeof w52h === 'number'
                            ? w52h
                            : parseFloat(String(w52h).replace(/[^0-9.]/g, ''));
                      const rangePct =
                        lo && hi && hi > lo && price
                          ? Math.max(0, Math.min(100, ((price - lo) / (hi - lo)) * 100))
                          : null;
                      return rangePct != null ? (
                        <div className="flex flex-col gap-0.5">
                          <div className="relative h-1.5 rounded-full overflow-hidden bg-[var(--border)] w-[80px]">
                            <div
                              className="absolute left-0 top-0 h-full rounded-full"
                              style={{
                                width: `${rangePct}%`,
                                background:
                                  rangePct > 70
                                    ? 'var(--gain)'
                                    : rangePct > 35
                                      ? 'var(--accent)'
                                      : 'var(--loss)',
                                opacity: 0.7,
                              }}
                            />
                          </div>
                          <span className="text-[8px] font-mono text-[var(--ink-4)]">
                            {isUS ? `$${lo!.toFixed(0)}` : fmtNGN(lo)} –{' '}
                            {isUS ? `$${hi!.toFixed(0)}` : fmtNGN(hi)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[var(--ink-4)]">—</span>
                      );
                    })()}
                  </td>

                  {/* Signal — both markets */}
                  <td className="px-3 py-3">
                    <SignalPill item={item} />
                  </td>

                  {/* Sparkline — NGX only */}
                  {!isUS && (
                    <td className="px-3 py-3">
                      <Sparkline ticker={item.ticker} points={priceHistories[item.ticker]} />
                    </td>
                  )}

                  {/* Alerts */}
                  <td className="px-3 py-3 min-w-[120px]">
                    <div className="flex flex-col gap-1">
                      {alerts
                        .filter((a) => a.ticker === item.ticker && a.is_active)
                        .map((a) => (
                          <AlertRow key={a.id} alert={a} onDelete={onAlertDeleted} />
                        ))}
                      {alertFormTicker === item.ticker ? (
                        <AlertSetForm
                          ticker={item.ticker}
                          market={item.market}
                          currentPrice={item.price?.price ?? null}
                          onCreated={onAlertCreated}
                          onClose={() => setAlertFormTicker(null)}
                        />
                      ) : (
                        <button
                          onClick={() => setAlertFormTicker(item.ticker)}
                          className="flex items-center gap-1 text-[9.5px] text-[var(--ink-4)] hover:text-[var(--accent)] transition-colors w-fit"
                        >
                          <IconBell width={10} height={10} />
                          Add alert
                        </button>
                      )}
                    </div>
                  </td>

                  {/* Remove */}
                  <td className="px-3 py-3">
                    <button
                      onClick={() => onRemove(item.ticker)}
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

      {items.some((i) => InBuyZone({ item: i })) && (
        <div className="px-4 py-2.5 border-t border-[var(--border)] bg-[var(--gain-light)]">
          <span className="text-[9.5px] font-semibold text-[var(--gain)] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--gain)]" />
            Green rows indicate the current price is within the computed buy zone.
          </span>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function WatchlistPage() {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('NGX');
  const [removing, setRemoving] = useState<string | null>(null);
  const [addInput, setAddInput] = useState('');
  const [addBusy, setAddBusy] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [triggeredAlerts, setTriggeredAlerts] = useState<TriggeredAlert[]>([]);
  const [dismissedAlertIds, setDismissedAlertIds] = useState<Set<number>>(new Set());
  const [priceHistories, setPriceHistories] = useState<
    Record<string, { ts: string; price: number | null; change_pct: number | null }[]>
  >({});
  const hasFetched = useRef(false);
  const { refreshKey } = usePortfolio();

  const load = useCallback(() => {
    setLoading(true);
    fetchWatchlist()
      .then((r) => {
        setItems(r.items);
        setTriggeredAlerts(r.triggered_alerts ?? []);
        setAlerts(r.alerts ?? []);
        setLastUpdated(r.last_updated ?? null);
        setPriceHistories(r.price_histories ?? {});
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    load();
  }, [load]);

  useEffect(() => {
    if (refreshKey === 0) return;
    load();
  }, [refreshKey, load]);

  // Clear input/error when switching tabs
  const switchTab = (t: Tab) => {
    setTab(t);
    setAddInput('');
    setAddError(null);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = addInput.trim().toUpperCase();
    if (!t) return;
    if (items.some((i) => i.ticker === t)) {
      setAddError(`${t} is already on your watchlist`);
      return;
    }
    setAddBusy(true);
    setAddError(null);
    try {
      await addToWatchlist(t, tab === 'US' ? 'US' : 'NGX');
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
      setItems((prev) => prev.filter((i) => i.ticker !== ticker));
    } finally {
      setRemoving(null);
    }
  };

  const handleAlertDeleted = async (id: number) => {
    await deleteAlert(id);
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const isUS = tab === 'US';
  const filtered = items.filter((i) => (isUS ? i.market === 'US' : i.market !== 'US'));

  const visibleTriggered = triggeredAlerts.filter((a) => !dismissedAlertIds.has(a.id));

  return (
    <div className="space-y-5">
      {/* Triggered alerts banner */}
      {visibleTriggered.length > 0 && (
        <div className="rounded-xl border border-[var(--accent)] bg-[var(--accent-light)] px-4 py-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[var(--accent)] flex items-center gap-1.5">
              <IconBell width={12} height={12} />
              {visibleTriggered.length} price alert{visibleTriggered.length > 1 ? 's' : ''}{' '}
              triggered
            </span>
            <button
              onClick={() => setDismissedAlertIds(new Set(visibleTriggered.map((a) => a.id)))}
              className="text-[9.5px] text-[var(--accent)] hover:underline"
            >
              Dismiss all
            </button>
          </div>
          {visibleTriggered.map((a) => (
            <div key={a.id} className="flex items-center justify-between gap-3">
              <span className="text-[11px] text-[var(--ink)]">
                <span className="font-mono font-bold">{a.ticker}</span> crossed{' '}
                <span className="font-mono font-semibold">
                  {a.market === 'US'
                    ? `$${a.threshold_price.toFixed(2)}`
                    : fmtNGNFull(a.threshold_price)}
                </span>{' '}
                ({a.direction}){a.note && <span className="text-[var(--ink-4)]"> · {a.note}</span>}
              </span>
              <button
                onClick={() => setDismissedAlertIds((prev) => new Set([...prev, a.id]))}
                className="flex items-center justify-center w-5 h-5 rounded text-[var(--ink-4)] hover:text-[var(--loss)] shrink-0"
              >
                <IconX width={10} height={10} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent-light)] flex items-center justify-center shrink-0">
            <IconBookmark width={15} height={15} style={{ stroke: 'var(--accent)' }} />
          </div>
          <div>
            <h1 className="text-[15px] font-bold text-[var(--ink)] leading-none">Watchlist</h1>
            <p className="text-[11px] text-[var(--ink-4)] mt-0.5">
              {loading
                ? 'Loading…'
                : `${filtered.length} ticker${filtered.length !== 1 ? 's' : ''} monitored`}
              {!loading && lastUpdated && (
                <span className="ml-2 text-[10px] text-[var(--ink-4)] opacity-70">
                  · updated {fmtAgo(lastUpdated)}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* NGX / USD tabs */}
          <div className="flex rounded-lg border border-[var(--border)] overflow-hidden">
            {(['NGX', 'US'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => switchTab(t)}
                className={[
                  'px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition-colors',
                  tab === t
                    ? 'bg-[var(--accent-light)] text-[var(--accent)]'
                    : 'text-[var(--ink-4)] hover:text-[var(--ink)]',
                ].join(' ')}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Add ticker form */}
          <form onSubmit={handleAdd} className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <input
                value={addInput}
                onChange={(e) => {
                  setAddInput(e.target.value.toUpperCase());
                  setAddError(null);
                }}
                placeholder={isUS ? 'e.g. AAPL' : 'e.g. GTCO'}
                maxLength={12}
                className="h-8 px-3 rounded-lg border border-[var(--border)] bg-[var(--canvas)] text-[11px] font-mono font-semibold text-[var(--ink)] placeholder:text-[var(--ink-4)] focus:outline-none focus:border-[var(--accent)] w-32 transition-colors"
              />
              <button
                type="submit"
                disabled={addBusy || !addInput.trim()}
                className="h-8 px-3 rounded-lg bg-[var(--accent)] text-white text-[11px] font-semibold hover:opacity-90 disabled:opacity-40 transition-opacity whitespace-nowrap"
              >
                {addBusy ? 'Adding…' : '+ Add'}
              </button>
            </div>
            {addError && <p className="text-[10px] text-[var(--loss)]">{addError}</p>}
          </form>
        </div>
      </div>

      {/* Loading skeletons */}
      {loading && (
        <div className="card overflow-hidden">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 px-4 py-3.5 border-b border-[var(--border)] last:border-0"
            >
              <div className="skeleton rounded w-16 h-4" />
              <div className="skeleton rounded flex-1 h-3" />
              <div className="skeleton rounded w-20 h-4" />
              <div className="skeleton rounded w-16 h-4" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="card px-6 py-16 text-center">
          <IconBookmark
            width={32}
            height={32}
            style={{ stroke: 'var(--ink-4)', strokeWidth: 1.5 }}
            className="mx-auto mb-3"
          />
          <p className="text-[13px] font-semibold text-[var(--ink-3)] mb-1">
            No {isUS ? 'US' : 'NGX'} tickers on your watchlist
          </p>
          <p className="text-[11px] text-[var(--ink-4)] max-w-[260px] mx-auto">
            {isUS
              ? 'Type a US ticker above (e.g. AAPL, MSFT) to start monitoring it.'
              : 'Type a ticker above to add one, or browse NGX to find stocks to monitor.'}
          </p>
          {!isUS && (
            <Link
              href="/ngx"
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-[11px] font-semibold hover:opacity-90 transition-opacity"
            >
              Browse NGX
            </Link>
          )}
        </div>
      )}

      {/* Table */}
      {!loading && filtered.length > 0 && (
        <WatchlistTable
          items={filtered}
          isUS={isUS}
          removing={removing}
          onRemove={handleRemove}
          alerts={alerts}
          onAlertCreated={load}
          onAlertDeleted={handleAlertDeleted}
          priceHistories={priceHistories}
        />
      )}
    </div>
  );
}
