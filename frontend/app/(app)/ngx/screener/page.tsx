'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { usePortfolio } from '@/context/PortfolioContext';
import Link from 'next/link';
import { fetchNGXScreener } from '@/services/api';
import type { ScreenerItem } from '@/models';
import { fmtNGNFull, fmtNGN, fmtPct2, isPositive } from '@/utils/formatters';
import { sectorColor } from '@/utils/theme';
import { IconFilter } from '@/components/atoms/icons';

type SortKey = keyof ScreenerItem;
type SortDir = 'asc' | 'desc';

function fmtAgo(iso: string | null): string {
  if (!iso) return '';
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m ago`;
}

function fmtMktCap(v: number | null): string {
  if (v == null) return '—';
  if (v >= 1e12) return `₦${(v / 1e12).toFixed(2)}T`;
  if (v >= 1e9) return `₦${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `₦${(v / 1e6).toFixed(0)}M`;
  return fmtNGNFull(v);
}

function Range52W({ item }: { item: ScreenerItem }) {
  const { price, week_52_low: lo, week_52_high: hi } = item;
  if (lo == null || hi == null || hi <= lo || price == null) {
    return <span className="text-[var(--ink-4)]">—</span>;
  }
  const pct = Math.max(0, Math.min(100, ((price - lo) / (hi - lo)) * 100));
  return (
    <div className="flex flex-col gap-0.5">
      <div className="relative h-1.5 rounded-full overflow-hidden bg-[var(--border)] w-[72px]">
        <div
          className="absolute left-0 top-0 h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: pct > 70 ? 'var(--gain)' : pct > 35 ? 'var(--accent)' : 'var(--loss)',
            opacity: 0.7,
          }}
        />
      </div>
      <span className="text-[8px] font-mono text-[var(--ink-4)]">
        {fmtNGN(lo)} – {fmtNGN(hi)}
      </span>
    </div>
  );
}

export default function ScreenerPage() {
  const [data, setData] = useState<ScreenerItem[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);
  const { refreshKey } = usePortfolio();

  // Filters
  const [search, setSearch] = useState('');
  const [sector, setSector] = useState('');
  const [minPE, setMinPE] = useState('');
  const [maxPE, setMaxPE] = useState('');
  const [minROE, setMinROE] = useState('');
  const [min52WPos, setMin52WPos] = useState('');
  const [max52WPos, setMax52WPos] = useState('');

  // Sort
  const [sortKey, setSortKey] = useState<SortKey>('ticker');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const load = useCallback(() => {
    setLoading(true);
    fetchNGXScreener()
      .then((r) => { setData(r.tickers); setLastUpdated(r.last_updated ?? null); })
      .catch(() => setData([]))
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

  const sectors = useMemo(() => {
    const s = new Set<string>();
    data.forEach((d) => { if (d.sector) s.add(d.sector); });
    return Array.from(s).sort();
  }, [data]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const peMin = minPE !== '' ? parseFloat(minPE) : null;
    const peMax = maxPE !== '' ? parseFloat(maxPE) : null;
    const roeMin = minROE !== '' ? parseFloat(minROE) : null;
    const posMin = min52WPos !== '' ? parseFloat(min52WPos) : null;
    const posMax = max52WPos !== '' ? parseFloat(max52WPos) : null;

    return data
      .filter((d) => {
        if (q && !d.ticker.toLowerCase().includes(q) && !(d.name ?? '').toLowerCase().includes(q)) return false;
        if (sector && d.sector !== sector) return false;
        if (peMin != null && (d.pe_ratio == null || d.pe_ratio < peMin)) return false;
        if (peMax != null && (d.pe_ratio == null || d.pe_ratio > peMax)) return false;
        if (roeMin != null && (d.roe == null || d.roe < roeMin)) return false;

        const lo = d.week_52_low;
        const hi = d.week_52_high;
        const price = d.price;
        if ((posMin != null || posMax != null) && (lo == null || hi == null || hi <= lo || price == null)) return false;
        if (posMin != null || posMax != null) {
          const pos = ((price! - lo!) / (hi! - lo!)) * 100;
          if (posMin != null && pos < posMin) return false;
          if (posMax != null && pos > posMax) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const av = a[sortKey];
        const bv = b[sortKey];
        if (av == null && bv == null) return 0;
        if (av == null) return 1;
        if (bv == null) return -1;
        const cmp = av < bv ? -1 : av > bv ? 1 : 0;
        return sortDir === 'asc' ? cmp : -cmp;
      });
  }, [data, search, sector, minPE, maxPE, minROE, min52WPos, max52WPos, sortKey, sortDir]);

  const enriched = data.filter((d) => d.pe_ratio != null || d.roe != null).length;

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('desc'); }
  }

  function SortIndicator({ k }: { k: SortKey }) {
    if (sortKey !== k) return <span className="ml-0.5 opacity-20">↕</span>;
    return <span className="ml-0.5">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  }

  const TH = ({ label, k, right }: { label: string; k: SortKey; right?: boolean }) => (
    <th
      className={`px-3 py-2.5 text-[9.5px] font-bold uppercase tracking-[0.07em] text-[var(--ink-4)] whitespace-nowrap cursor-pointer select-none hover:text-[var(--ink-2)] ${right ? 'text-right' : ''}`}
      onClick={() => toggleSort(k)}
    >
      {label}<SortIndicator k={k} />
    </th>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-[var(--accent-light)] flex items-center justify-center shrink-0">
          <IconFilter width={15} height={15} style={{ stroke: 'var(--accent)' }} />
        </div>
        <div>
          <h1 className="text-[15px] font-bold text-[var(--ink)] leading-none">NGX Screener</h1>
          <p className="text-[11px] text-[var(--ink-4)] mt-0.5">
            {loading
              ? 'Loading…'
              : `${filtered.length} of ${data.length} tickers · ${enriched} with fundamentals`}
            {!loading && lastUpdated && (
              <span className="ml-2 text-[10px] text-[var(--ink-4)] opacity-70">· updated {fmtAgo(lastUpdated)}</span>
            )}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card px-4 py-3 flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-bold uppercase tracking-wide text-[var(--ink-4)]">Search</label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ticker or company"
            className="h-8 px-2.5 rounded-lg border border-[var(--border)] bg-[var(--canvas)] text-[11px] font-mono text-[var(--ink)] placeholder:text-[var(--ink-4)] focus:outline-none focus:border-[var(--accent)] w-36"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-bold uppercase tracking-wide text-[var(--ink-4)]">Sector</label>
          <select
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            className="h-8 px-2.5 rounded-lg border border-[var(--border)] bg-[var(--canvas)] text-[11px] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)] w-40"
          >
            <option value="">All sectors</option>
            {sectors.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-bold uppercase tracking-wide text-[var(--ink-4)]">P/E range</label>
          <div className="flex items-center gap-1.5">
            <input
              value={minPE}
              onChange={(e) => setMinPE(e.target.value)}
              placeholder="Min"
              type="number"
              className="h-8 px-2.5 rounded-lg border border-[var(--border)] bg-[var(--canvas)] text-[11px] font-mono text-[var(--ink)] placeholder:text-[var(--ink-4)] focus:outline-none focus:border-[var(--accent)] w-16"
            />
            <span className="text-[var(--ink-4)] text-[10px]">–</span>
            <input
              value={maxPE}
              onChange={(e) => setMaxPE(e.target.value)}
              placeholder="Max"
              type="number"
              className="h-8 px-2.5 rounded-lg border border-[var(--border)] bg-[var(--canvas)] text-[11px] font-mono text-[var(--ink)] placeholder:text-[var(--ink-4)] focus:outline-none focus:border-[var(--accent)] w-16"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-bold uppercase tracking-wide text-[var(--ink-4)]">Min ROE %</label>
          <input
            value={minROE}
            onChange={(e) => setMinROE(e.target.value)}
            placeholder="e.g. 15"
            type="number"
            className="h-8 px-2.5 rounded-lg border border-[var(--border)] bg-[var(--canvas)] text-[11px] font-mono text-[var(--ink)] placeholder:text-[var(--ink-4)] focus:outline-none focus:border-[var(--accent)] w-20"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-bold uppercase tracking-wide text-[var(--ink-4)]">52W Position %</label>
          <div className="flex items-center gap-1.5">
            <input
              value={min52WPos}
              onChange={(e) => setMin52WPos(e.target.value)}
              placeholder="Min"
              type="number"
              min={0} max={100}
              className="h-8 px-2.5 rounded-lg border border-[var(--border)] bg-[var(--canvas)] text-[11px] font-mono text-[var(--ink)] placeholder:text-[var(--ink-4)] focus:outline-none focus:border-[var(--accent)] w-16"
            />
            <span className="text-[var(--ink-4)] text-[10px]">–</span>
            <input
              value={max52WPos}
              onChange={(e) => setMax52WPos(e.target.value)}
              placeholder="Max"
              type="number"
              min={0} max={100}
              className="h-8 px-2.5 rounded-lg border border-[var(--border)] bg-[var(--canvas)] text-[11px] font-mono text-[var(--ink)] placeholder:text-[var(--ink-4)] focus:outline-none focus:border-[var(--accent)] w-16"
            />
          </div>
        </div>

        {(search || sector || minPE || maxPE || minROE || min52WPos || max52WPos) && (
          <button
            onClick={() => { setSearch(''); setSector(''); setMinPE(''); setMaxPE(''); setMinROE(''); setMin52WPos(''); setMax52WPos(''); }}
            className="h-8 px-3 rounded-lg border border-[var(--border)] text-[11px] text-[var(--ink-4)] hover:text-[var(--loss)] hover:border-[var(--loss)] transition-colors self-end"
          >
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="card overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-[var(--border)] last:border-0">
              <div className="skeleton rounded w-16 h-4" />
              <div className="skeleton rounded flex-1 h-3" />
              <div className="skeleton rounded w-20 h-4" />
              <div className="skeleton rounded w-16 h-4" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card px-6 py-12 text-center">
          <IconFilter width={28} height={28} style={{ stroke: 'var(--ink-4)', strokeWidth: 1.5 }} className="mx-auto mb-3" />
          <p className="text-[13px] font-semibold text-[var(--ink-3)]">No tickers match your filters</p>
          <p className="text-[11px] text-[var(--ink-4)] mt-1">Try relaxing the criteria above.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--canvas)]">
                  <TH label="Ticker" k="ticker" />
                  <TH label="Company" k="name" />
                  <TH label="Sector" k="sector" />
                  <TH label="Price" k="price" right />
                  <TH label="Day %" k="change_pct" right />
                  <TH label="Mkt Cap" k="market_cap" right />
                  <TH label="P/E" k="pe_ratio" right />
                  <TH label="ROE %" k="roe" right />
                  <TH label="Div Yield" k="dividend_yield" right />
                  <TH label="52W Range" k="week_52_high" />
                  <TH label="52W Chg %" k="week_52_change" right />
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const sCol = sectorColor(item.sector ?? '');
                  return (
                    <tr
                      key={item.ticker}
                      className="border-b border-[var(--border)] last:border-0 transition-colors hover:bg-[var(--canvas)]"
                    >
                      <td className="px-3 py-2.5">
                        <Link
                          href={`/ngx/profile?ticker=${item.ticker}`}
                          className="font-mono font-bold text-[11px] text-[var(--accent)] hover:underline"
                        >
                          {item.ticker}
                        </Link>
                      </td>

                      <td className="px-3 py-2.5 max-w-[160px]">
                        <span className="text-[11px] text-[var(--ink-2)] truncate block">
                          {item.name ?? '—'}
                        </span>
                      </td>

                      <td className="px-3 py-2.5">
                        {item.sector ? (
                          <span className="flex items-center gap-1 text-[10px] text-[var(--ink-3)] whitespace-nowrap">
                            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: sCol }} />
                            {item.sector}
                          </span>
                        ) : <span className="text-[var(--ink-4)]">—</span>}
                      </td>

                      <td className="px-3 py-2.5 text-right">
                        <span className="font-mono font-semibold text-[11px] text-[var(--ink)]">
                          {item.price != null ? fmtNGNFull(item.price) : '—'}
                        </span>
                      </td>

                      <td className="px-3 py-2.5 text-right">
                        {item.change_pct != null ? (
                          <span className={`font-mono text-[11px] font-medium ${isPositive(item.change_pct) ? 'text-[var(--gain)]' : 'text-[var(--loss)]'}`}>
                            {fmtPct2(item.change_pct)}
                          </span>
                        ) : <span className="text-[var(--ink-4)]">—</span>}
                      </td>

                      <td className="px-3 py-2.5 text-right">
                        <span className="font-mono text-[11px] text-[var(--ink-3)]">
                          {fmtMktCap(item.market_cap)}
                        </span>
                      </td>

                      <td className="px-3 py-2.5 text-right">
                        <span className="font-mono text-[11px] text-[var(--ink-3)]">
                          {item.pe_ratio != null ? Number(item.pe_ratio).toFixed(1) : '—'}
                        </span>
                      </td>

                      <td className="px-3 py-2.5 text-right">
                        <span className="font-mono text-[11px] text-[var(--ink-3)]">
                          {item.roe != null ? `${Number(item.roe).toFixed(1)}%` : '—'}
                        </span>
                      </td>

                      <td className="px-3 py-2.5 text-right">
                        <span className="font-mono text-[11px] text-[var(--ink-3)]">
                          {item.dividend_yield != null ? `${Number(item.dividend_yield).toFixed(2)}%` : '—'}
                        </span>
                      </td>

                      <td className="px-3 py-2.5 min-w-[100px]">
                        <Range52W item={item} />
                      </td>

                      <td className="px-3 py-2.5 text-right">
                        {item.week_52_change != null ? (
                          <span className={`font-mono text-[11px] font-medium ${isPositive(item.week_52_change) ? 'text-[var(--gain)]' : 'text-[var(--loss)]'}`}>
                            {fmtPct2(item.week_52_change)}
                          </span>
                        ) : <span className="text-[var(--ink-4)]">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-2.5 border-t border-[var(--border)] bg-[var(--canvas)]">
            <span className="text-[9.5px] text-[var(--ink-4)]">
              Fundamentals (P/E, ROE) only available for tickers that have been viewed in your portfolio or watchlist.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
