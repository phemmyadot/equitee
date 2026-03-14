'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  fetchNGXTickerData, fetchNGXDividend,
  fetchNGXEarnings, fetchNGXBalanceSheet, fetchNGXPriceHistory,
} from '@/lib/api';
import { usePortfolio } from '@/lib/PortfolioContext';
import ChartCard from '@/components/ui/ChartCard';
import { ErrorMessage } from '@/components/ui/Feedback';
import SignalScore from '@/components/ui/Signalscore';
import PlotlyChart from '@/components/charts/PlotlyChart';
import { plotlyLayout, COLORS, sectorColor } from '@/lib/theme';
import { fmtNGNFull, fmtNGN, fmtPct, fmtPct2, fmtVol, isPositive } from '@/lib/formatters';
import type {
  TickerData, DividendInfo, EarningsHistory, BalanceSheet, DBPriceHistory, StockRow,
} from '@/lib/api';

// ─────────────────────────────────────────────────────────────────────────────
// Primitives
// ─────────────────────────────────────────────────────────────────────────────

function Sk({ w = 'w-24', h = 'h-3' }: { w?: string; h?: string }) {
  return <div className={`skeleton rounded ${w} ${h}`} />;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--ink-4)]">{children}</span>
      <div className="flex-1 h-px bg-[var(--border)]" />
    </div>
  );
}

function Stat({ label, value, mono = false, accent }: {
  label: string; value?: string | number | null; mono?: boolean;
  accent?: 'gain' | 'loss' | 'warn' | 'accent';
}) {
  const c = accent === 'gain' ? 'text-[var(--gain)]'
    : accent === 'loss' ? 'text-[var(--loss)]'
      : accent === 'warn' ? 'text-[var(--warn)]'
        : accent === 'accent' ? 'text-[var(--accent)]'
          : 'text-[var(--ink-2)]';
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[9.5px] font-semibold uppercase tracking-[0.07em] text-[var(--ink-4)]">{label}</span>
      {value != null && value !== ''
        ? <span className={`text-[12px] leading-snug ${mono ? 'font-mono' : ''} ${c}`}>{value}</span>
        : <span className="text-[11px] text-[var(--ink-4)]">—</span>}
    </div>
  );
}

function KpiCard({ label, value, sub, accent = 'neutral', delay = 0 }: {
  label: string; value: string; sub?: string;
  accent?: 'gain' | 'loss' | 'accent' | 'teal' | 'warn' | 'neutral'; delay?: number;
}) {
  const cfg = {
    gain: { val: 'text-[var(--gain)]', dot: 'bg-[var(--gain)]' },
    loss: { val: 'text-[var(--loss)]', dot: 'bg-[var(--loss)]' },
    accent: { val: 'text-[var(--accent)]', dot: 'bg-[var(--accent)]' },
    teal: { val: 'text-[var(--teal)]', dot: 'bg-[var(--teal)]' },
    warn: { val: 'text-[var(--warn)]', dot: 'bg-[var(--warn)]' },
    neutral: { val: 'text-[var(--ink)]', dot: 'bg-[var(--ink-4)]' },
  }[accent];
  return (
    <div className="kpi-animate card flex flex-col gap-1 px-4 py-3.5" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
        <span className="text-[10px] font-semibold uppercase tracking-[0.07em] text-[var(--ink-4)]">{label}</span>
      </div>
      <span className={`font-mono text-[18px] font-semibold leading-tight mt-0.5 ${cfg.val}`}>{value}</span>
      {sub && <span className="text-[10px] text-[var(--ink-4)] font-mono mt-0.5">{sub}</span>}
    </div>
  );
}

// ── 52-Week range bar ─────────────────────────────────────────────────────────

function RangeBar({ low, high, current }: { low: string | number | null; high: string | number | null; current?: number | null }) {
  const lo = low == null ? null : typeof low === 'number' ? low : parseFloat(low.replace(/[^0-9.]/g, ''));
  const hi = high == null ? null : typeof high === 'number' ? high : parseFloat(high.replace(/[^0-9.]/g, ''));
  if (!lo || !hi || hi <= lo) return null;

  const pct = current ? Math.max(0, Math.min(100, ((current - lo) / (hi - lo)) * 100)) : null;

  return (
    <div className="mt-4 pt-4 border-t border-[var(--border)]">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[9px] font-semibold uppercase tracking-[0.07em] text-[var(--ink-4)]">52-Week Range</span>
        {pct != null && (
          <span className="text-[9px] font-mono text-[var(--ink-4)]">
            {pct.toFixed(0)}% of range
          </span>
        )}
      </div>
      <div className="relative h-2 bg-[var(--canvas)] border border-[var(--border)] rounded-full overflow-visible">
        {/* Filled portion */}
        {pct != null && (
          <div
            className="absolute left-0 top-0 h-full rounded-full"
            style={{
              width: `${pct}%`,
              background: pct > 70
                ? 'var(--gain)'
                : pct > 35
                  ? 'var(--accent)'
                  : 'var(--loss)',
              opacity: 0.4,
            }}
          />
        )}
        {/* Current price marker */}
        {pct != null && (
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 border-white shadow-sm"
            style={{
              left: `${pct}%`,
              background: pct > 70 ? 'var(--gain)' : pct > 35 ? 'var(--accent)' : 'var(--loss)',
            }}
          />
        )}
      </div>
      <div className="flex justify-between mt-1.5">
        <span className="font-mono text-[10px] text-[var(--loss)]">₦{lo.toLocaleString()}</span>
        {current && <span className="font-mono text-[10px] font-semibold text-[var(--ink-2)]">₦{current.toLocaleString()}</span>}
        <span className="font-mono text-[10px] text-[var(--gain)]">₦{hi.toLocaleString()}</span>
      </div>
    </div>
  );
}

// ── Return momentum ladder ────────────────────────────────────────────────────

function MomentumLadder({ perf }: { perf: NonNullable<TickerData['performance']> }) {
  const PERIODS = [
    { label: '1D', val: perf.return_1d as string | number | null },
    { label: '1W', val: perf.return_1w },
    { label: '1M', val: perf.return_1m },
    { label: '3M', val: perf.return_3m },
    { label: '6M', val: perf.return_6m },
    { label: 'YTD', val: perf.return_ytd },
    { label: '1Y', val: perf.return_1y },
  ];

  const nums = PERIODS.map(p => {
    if (!p.val) return null;
    const n = p.val == null ? null : typeof p.val === 'number' ? p.val : parseFloat(p.val.replace(/[^0-9.-]/g, ''));
    return n;
  });

  const hasAny = nums.some(n => n !== null);
  if (!hasAny) return (
    <div className="flex items-center justify-center h-24 text-[11px] text-[var(--ink-4)]">
      No return data available
    </div>
  );

  const absMax = Math.max(...nums.map(n => Math.abs(n ?? 0)), 0.01);

  return (
    <div className="space-y-2">
      {PERIODS.map((p, i) => {
        const n = nums[i];
        if (n === null) return (
          <div key={p.label} className="flex items-center gap-3 h-7">
            <span className="text-[10px] font-semibold font-mono text-[var(--ink-4)] w-8 text-right shrink-0">{p.label}</span>
            <span className="text-[10px] text-[var(--ink-4)]">—</span>
          </div>
        );
        const pct = (Math.abs(n) / absMax) * 100;
        const pos = n >= 0;
        const col = pos ? 'var(--gain)' : 'var(--loss)';
        const bg = pos ? 'var(--gain-light)' : 'var(--loss-light)';
        return (
          <div key={p.label} className="flex items-center gap-3 h-7">
            <span className="text-[10px] font-semibold font-mono text-[var(--ink-4)] w-8 text-right shrink-0">{p.label}</span>
            <div className="flex-1 relative h-5 flex items-center">
              {/* Bar */}
              <div
                className="h-4 rounded-sm transition-all duration-500"
                style={{ width: `${Math.max(pct, 2)}%`, background: col, opacity: 0.75 }}
              />
            </div>
            <span className={`font-mono text-[11px] font-semibold w-16 text-right shrink-0`}
              style={{ color: col }}>
              {pos ? '+' : ''}{n.toFixed(2)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Piotroski badge ───────────────────────────────────────────────────────────

function PiotroskiBadge({ score }: { score: string | number | null }) {
  if (score == null) return <span className="text-[var(--ink-4)] text-[11px]">—</span>;
  const n = typeof score === 'number' ? score : parseInt(score, 10);
  if (isNaN(n)) return <span className="font-mono text-[12px] text-[var(--ink-2)]">{String(score)}</span>;

  const { label, col, bg } =
    n >= 7 ? { label: 'Strong', col: 'var(--gain)', bg: 'var(--gain-light)' } :
      n >= 4 ? { label: 'Neutral', col: 'var(--warn)', bg: 'var(--warn-light)' } :
        { label: 'Weak', col: 'var(--loss)', bg: 'var(--loss-light)' };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <span className="font-mono font-bold text-[16px]" style={{ color: col }}>{n}</span>
        <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-sm"
          style={{ background: bg, color: col }}>{label}</span>
      </div>
      {/* 9-pip bar */}
      <div className="flex gap-0.5">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i}
            className="w-4 h-1.5 rounded-sm"
            style={{ background: i < n ? col : 'var(--border)' }}
          />
        ))}
      </div>
      <span className="text-[9px] text-[var(--ink-4)]">out of 9 · Piotroski F-Score</span>
    </div>
  );
}

// ── Altman Z badge ────────────────────────────────────────────────────────────

function AltmanBadge({ score }: { score: string | number | null }) {
  if (score == null) return <span className="text-[var(--ink-4)] text-[11px]">—</span>;
  const n = typeof score === 'number' ? score : parseFloat(score.replace(/[^0-9.-]/g, ''));
  if (isNaN(n)) return <span className="font-mono text-[12px] text-[var(--ink-2)]">{String(score)}</span>;

  const { label, col, bg, desc } =
    n >= 3.0 ? { label: 'Safe', col: 'var(--gain)', bg: 'var(--gain-light)', desc: 'Low bankruptcy risk' } :
      n >= 1.81 ? { label: 'Grey Zone', col: 'var(--warn)', bg: 'var(--warn-light)', desc: 'Monitor closely' } :
        { label: 'Distress', col: 'var(--loss)', bg: 'var(--loss-light)', desc: 'High bankruptcy risk' };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <span className="font-mono font-bold text-[16px]" style={{ color: col }}>{n.toFixed(2)}</span>
        <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-sm"
          style={{ background: bg, color: col }}>{label}</span>
      </div>
      {/* Visual scale: 0 → 4+ */}
      <div className="relative h-1.5 rounded-full overflow-hidden bg-[var(--border)]">
        <div className="absolute left-0 top-0 h-full rounded-full"
          style={{ width: `${Math.min(100, (n / 4) * 100)}%`, background: col }} />
      </div>
      <span className="text-[9px] text-[var(--ink-4)]">{desc} · Altman Z-Score</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

export default function NGXProfilePage() {
  const params = useSearchParams();
  const ticker = (params.get('ticker') ?? '').toUpperCase();

  const [data, setData] = useState<TickerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dividend, setDividend] = useState<DividendInfo | null>(null);
  const [divLoading, setDivLoading] = useState(true);
  const [earnings, setEarnings] = useState<EarningsHistory | null>(null);
  const [earnLoad, setEarnLoad] = useState(true);
  const [balance, setBalance] = useState<BalanceSheet | null>(null);
  const [bsLoad, setBsLoad] = useState(true);
  const [ohlcv, setOhlcv] = useState<DBPriceHistory | null>(null);
  const [ohlcvLoad, setOhlcvLoad] = useState(true);
  const [priceDays, setPriceDays] = useState(90);

  const { data: portfolio } = usePortfolio();
  const posRow: StockRow | undefined = portfolio?.ngx_stocks.find(s => s.Ticker === ticker);

  // Fetch ticker data
  useEffect(() => {
    if (!ticker) return;
    let c = false;
    setLoading(true); setError(null);
    fetchNGXTickerData(ticker)
      .then(d => { if (!c) { setData(d); setLoading(false); } })
      .catch(e => { if (!c) { setError(e.message); setLoading(false); } });
    return () => { c = true; };
  }, [ticker]);

  // Fetch dividend (404 = no data, not an error)
  useEffect(() => {
    if (!ticker) return;
    let c = false;
    setDivLoading(true);
    fetchNGXDividend(ticker)
      .then(d => { if (!c) { setDividend(d); setDivLoading(false); } })
      .catch(() => { if (!c) setDivLoading(false); });
    return () => { c = true; };
  }, [ticker]);

  // Fetch earnings history
  useEffect(() => {
    if (!ticker) return;
    let c = false;
    setEarnLoad(true);
    fetchNGXEarnings(ticker)
      .then(d => { if (!c) { setEarnings(d); setEarnLoad(false); } })
      .catch(() => { if (!c) setEarnLoad(false); });
    return () => { c = true; };
  }, [ticker]);

  // Fetch balance sheet
  useEffect(() => {
    if (!ticker) return;
    let c = false;
    setBsLoad(true);
    fetchNGXBalanceSheet(ticker)
      .then(d => { if (!c) { setBalance(d); setBsLoad(false); } })
      .catch(() => { if (!c) setBsLoad(false); });
    return () => { c = true; };
  }, [ticker]);

  // Fetch price history from DB
  useEffect(() => {
    if (!ticker) return;
    let c = false;
    setOhlcvLoad(true);
    setOhlcv(null);
    fetchNGXPriceHistory(ticker, priceDays)
      .then(d => { if (!c) { setOhlcv(d); setOhlcvLoad(false); } })
      .catch(() => { if (!c) setOhlcvLoad(false); });
    return () => { c = true; };
  }, [ticker, priceDays]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const price = data?.price;
  const prof = data?.profile;
  const ov = data?.overview;
  const perf = data?.performance;
  const livePrice = price?.price ?? posRow?.LivePrice;
  const dayChange = price?.change_pct ?? posRow?.LiveChangePct;
  const sectorName = posRow?.Sector ?? '';
  const sectorCol = sectorColor(sectorName);

  // Price chart built inline from ohlcv state

  // Earnings chart
  const fmtB = (n: number | null) => n == null ? null : n / 1e9;
  const revenueBar = {
    type: 'bar', name: 'Revenue',
    x: earnings?.periods ?? [],
    y: (earnings?.revenue ?? []).map(fmtB),
    marker: { color: COLORS.accent, opacity: 0.8 },
    hovertemplate: '<b>%{x}</b><br>₦%{y:.2f}B<extra>Revenue</extra>',
  };
  const epsLine = {
    type: 'scatter', mode: 'lines+markers', name: 'EPS',
    x: earnings?.periods ?? [],
    y: earnings?.eps ?? [],
    line: { color: COLORS.teal, width: 2 },
    marker: { size: 5 },
    yaxis: 'y2',
    hovertemplate: '<b>%{x}</b><br>₦%{y:.2f}<extra>EPS</extra>',
  };

  // Balance sheet chart
  const bsArea = (label: string, vals: (number | null)[], color: string, fill: string) => ({
    type: 'scatter', mode: 'lines', name: label,
    x: balance?.periods ?? [],
    y: (vals ?? []).map(fmtB),
    line: { color, width: 2 },
    fill: fill as 'tonexty' | 'tozeroy',
    fillcolor: color + '18',
    hovertemplate: `<b>%{x}</b><br>₦%{y:.2f}B<extra>${label}</extra>`,
  });

  if (!ticker) {
    return (
      <div className="card px-6 py-12 text-center">
        <p className="text-[13px] text-[var(--ink-3)]">No ticker specified.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* ── Breadcrumb ─────────────────────────────────────────────────── */}
      <nav className="flex items-center gap-1.5 text-[11px] text-[var(--ink-4)]">
        <Link href="/ngx" className="hover:text-[var(--ink)] transition-colors">NGX Overview</Link>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
        <span className="text-[var(--ink-3)] font-semibold">{ticker}</span>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <div className="card px-5 py-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">

          {/* Identity */}
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center"
              style={{ background: `${sectorCol}18`, border: `1.5px solid ${sectorCol}40` }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={sectorCol} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <div>
              {loading
                ? <><Sk w="w-48" h="h-5" /><Sk w="w-32" h="h-3" /></>
                : <>
                  <h1 className="text-[16px] font-bold text-[var(--ink)] leading-tight">
                    {prof?.name ?? ticker}
                  </h1>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="font-mono text-[11px] font-semibold text-[var(--ink-4)] bg-[var(--canvas)] border border-[var(--border)] px-2 py-0.5 rounded">
                      {ticker} · NGX
                    </span>
                    {sectorName && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded"
                        style={{ background: `${sectorCol}15`, color: sectorCol }}>{sectorName}</span>
                    )}
                    {prof?.industry && (
                      <span className="text-[10px] text-[var(--ink-4)]">{prof.industry}</span>
                    )}
                  </div>
                </>
              }
            </div>
          </div>

          {/* Live price */}
          <div className="flex flex-col items-start sm:items-end gap-0.5 shrink-0">
            {loading
              ? <><Sk w="w-28" h="h-7" /><Sk w="w-16" h="h-3" /></>
              : livePrice != null
                ? <>
                  <span className="font-mono text-[26px] font-bold text-[var(--ink)] leading-none">
                    {fmtNGNFull(livePrice)}
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    {dayChange != null && (
                      <span className={`font-mono text-[12px] font-semibold ${isPositive(dayChange) ? 'text-[var(--gain)]' : 'text-[var(--loss)]'}`}>
                        {isPositive(dayChange) ? '+' : ''}{fmtPct2(dayChange)} today
                      </span>
                    )}
                    {posRow?.DayHigh != null && (
                      <span className="text-[10px] font-mono text-[var(--ink-4)]">
                        H {fmtNGNFull(posRow.DayHigh)} · L {fmtNGNFull(posRow.DayLow)}
                      </span>
                    )}
                  </div>
                </>
                : <span className="text-[13px] text-[var(--ink-4)]">Price unavailable</span>
            }
          </div>
        </div>

        {/* Profile meta row */}
        {!loading && (prof?.website || prof?.founded || ov?.market_cap || posRow?.Volume != null) && (
          <div className="mt-4 pt-4 border-t border-[var(--border)] flex flex-wrap gap-x-6 gap-y-2">
            {ov?.market_cap && (
              <div className="flex items-center gap-1.5 text-[11px]">
                <span className="text-[var(--ink-4)]">Mkt Cap</span>
                <span className="font-mono font-medium text-[var(--ink-2)]">{ov.market_cap}</span>
              </div>
            )}
            {posRow?.Volume != null && (
              <div className="flex items-center gap-1.5 text-[11px]">
                <span className="text-[var(--ink-4)]">Volume</span>
                <span className="font-mono font-medium text-[var(--ink-2)]">{fmtVol(posRow.Volume)}</span>
              </div>
            )}
            {prof?.founded && (
              <div className="flex items-center gap-1.5 text-[11px]">
                <span className="text-[var(--ink-4)]">Founded</span>
                <span className="font-mono font-medium text-[var(--ink-2)]">{prof.founded}</span>
              </div>
            )}
            {prof?.website && (
              <a href={prof.website.startsWith('http') ? prof.website : `https://${prof.website}`}
                target="_blank" rel="noreferrer"
                className="flex items-center gap-1 text-[11px] text-[var(--accent)] hover:underline">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                </svg>
                {prof.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
              </a>
            )}
          </div>
        )}

        {/* 52-Week Range bar — NEW */}
        {!loading && (perf?.week_52_low || perf?.week_52_high) && (
          <RangeBar low={perf.week_52_low} high={perf.week_52_high} current={livePrice} />
        )}
      </div>

      {error && <ErrorMessage message={error} />}

      {/* ── Signal Score ────────────────────────────────────────────────── */}
      <SignalScore
        ov={ov}
        perf={perf}
        livePrice={livePrice}
        posRow={posRow}
        dividend={dividend}
        loading={loading}
      />

      {/* ── Dividend card ──────────────────────────────────────────────── */}
      {(divLoading || dividend) && (
        <div className="card px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-[var(--gain-light)] flex items-center justify-center">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--gain)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--ink-3)]">Dividend</span>
            </div>
            {dividend?.timestamp && (
              <span className="text-[10px] font-mono text-[var(--ink-4)]">
                cached {new Date(dividend.timestamp).toLocaleDateString()}
              </span>
            )}
          </div>
          {divLoading
            ? <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex flex-col gap-1.5"><Sk w="w-16" h="h-2.5" /><Sk w="w-24" h="h-4" /></div>
              ))}
            </div>
            : dividend
              ? <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9.5px] font-semibold uppercase tracking-[0.07em] text-[var(--ink-4)]">Cash Amount</span>
                  <span className="font-mono text-[20px] font-bold text-[var(--gain)] leading-none mt-0.5">
                    {dividend.cash_amount != null ? `₦${dividend.cash_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 3 })}` : '—'}
                  </span>
                  <span className="text-[9px] text-[var(--ink-4)] font-mono mt-0.5">{dividend.currency} per share</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9.5px] font-semibold uppercase tracking-[0.07em] text-[var(--ink-4)]">Ex-Div Date</span>
                  <span className="font-mono text-[13px] font-semibold text-[var(--ink-2)]">{dividend.ex_dividend_date ?? '—'}</span>
                  <span className="text-[9px] text-[var(--ink-4)] mt-0.5">Must hold before this</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9.5px] font-semibold uppercase tracking-[0.07em] text-[var(--ink-4)]">Record Date</span>
                  <span className="font-mono text-[13px] font-semibold text-[var(--ink-2)]">{dividend.record_date ?? '—'}</span>
                  <span className="text-[9px] text-[var(--ink-4)] mt-0.5">Eligibility confirmed</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9.5px] font-semibold uppercase tracking-[0.07em] text-[var(--ink-4)]">Pay Date</span>
                  <span className="font-mono text-[13px] font-semibold text-[var(--ink-2)]">{dividend.pay_date ?? '—'}</span>
                  <span className="text-[9px] text-[var(--ink-4)] mt-0.5">Payment sent</span>
                </div>
                {posRow && dividend.cash_amount != null && (
                  <div className="sm:col-span-4 mt-1 pt-3 border-t border-[var(--border)] flex items-center gap-3">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--ink-4)" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                    <span className="text-[11px] text-[var(--ink-3)]">
                      My projected payout
                      <span className="font-mono font-bold text-[var(--gain)] ml-2 text-[12px]">
                        ₦{(posRow.Shares * dividend.cash_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span className="text-[var(--ink-4)] ml-1.5 text-[10px]">
                        ({posRow.Shares.toLocaleString()} shares × ₦{dividend.cash_amount.toFixed(3)})
                      </span>
                    </span>
                  </div>
                )}
              </div>
              : <p className="text-[12px] text-[var(--ink-4)]">No upcoming dividend data available for {ticker}.</p>
          }
        </div>
      )}

      {/* ── Portfolio position strip ────────────────────────────────────── */}
      {posRow && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          <KpiCard label="My Equity" value={fmtNGN(posRow.CurrentEquity)} accent="neutral" delay={0} />
          <KpiCard label="My Cost" value={fmtNGN(posRow.RemainingCost)} accent="neutral" delay={50} />
          <KpiCard label="Unrealized" value={fmtNGN(posRow.UnrealizedPL)}
            accent={isPositive(posRow.UnrealizedPL) ? 'gain' : 'loss'} delay={100} />
          <KpiCard label="Return" value={fmtPct(posRow.ReturnPct)}
            accent={isPositive(posRow.ReturnPct) ? 'gain' : 'loss'} delay={150} />
          <KpiCard label="Shares" value={String(posRow.Shares)} accent="accent" delay={200}
            sub={`avg ₦${posRow.AvgCost?.toFixed(2) ?? '—'}`} />
        </div>
      )}

      {/* ── Price History (from DB snapshots) ────────────────────────── */}
      <div className="chart-card">
        {/* Header with range buttons */}
        <div className="chart-title flex items-center justify-between mb-4">
          <div className="flex items-baseline gap-1.5">
            Price History
            <span className="text-[11px] font-normal text-[var(--ink-4)]">
              {ohlcv ? `· ${ohlcv.count} snapshots` : '· from local snapshots'}
            </span>
          </div>
          <div className="flex gap-1">
            {([7, 30, 90] as const).map(d => (
              <button
                key={d}
                onClick={() => setPriceDays(d)}
                className={[
                  'px-2.5 py-1 rounded-md text-[10px] font-semibold transition-colors duration-150',
                  priceDays === d
                    ? 'bg-[var(--accent)] text-white'
                    : 'bg-[var(--canvas)] border border-[var(--border)] text-[var(--ink-4)] hover:text-[var(--ink)] hover:border-[var(--border-strong)]',
                ].join(' ')}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>

        {ohlcvLoad
          ? <div className="skeleton rounded-lg" style={{ height: 300 }} />
          : !ohlcv || !ohlcv.dates.length
            ? <div className="flex flex-col items-center justify-center h-[300px] gap-2 text-center px-6">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--ink-4)" strokeWidth="1.5">
                <path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" />
              </svg>
              <p className="text-[12px] text-[var(--ink-4)]">No snapshots yet for {ticker}.</p>
              <p className="text-[11px] text-[var(--ink-4)] max-w-[280px]">
                Snapshots are written each time the main dashboard refreshes.
                Visit the dashboard a few times and come back.
              </p>
            </div>
            : (() => {
              const closes = ohlcv.close.filter((v): v is number => v != null);
              const priceUp = closes.length >= 2 && closes[closes.length - 1] >= closes[0];
              const lineColor = priceUp ? COLORS.gain : COLORS.loss;

              // Baseline trace at the opening price — fills area between it and the line
              const baseline = {
                type: 'scatter', mode: 'lines',
                x: ohlcv.dates,
                y: ohlcv.dates.map(() => closes[0]),   // flat line at start price
                line: { color: 'transparent', width: 0 },
                showlegend: false,
                hoverinfo: 'skip',
                yaxis: 'y',
              };

              const priceLine = {
                type: 'scatter', mode: 'lines', name: 'Price',
                x: ohlcv.dates,
                y: ohlcv.close,
                line: { color: lineColor, width: 2 },
                fill: 'tonexty',
                fillcolor: priceUp ? 'rgba(10,123,68,0.08)' : 'rgba(190,27,27,0.07)',
                hovertemplate: '<b>%{x}</b><br>₦%{y:,.2f}<extra></extra>',
                yaxis: 'y',
              };

              const changeLine = {
                type: 'scatter', mode: 'lines', name: 'Day Δ%',
                x: ohlcv.dates,
                y: ohlcv.change_pct,
                line: { color: COLORS.accent, width: 1.5, dash: 'dot' as const },
                hovertemplate: '<b>%{x}</b><br>%{y:.2f}%<extra>Day Δ</extra>',
                yaxis: 'y2',
              };

              return (
                <PlotlyChart
                  data={[baseline, priceLine, changeLine]}
                  layout={{
                    ...plotlyLayout({ margin: { t: 8, b: 48, l: 64, r: 48 } }),
                    yaxis: {
                      ...plotlyLayout().yaxis,
                      tickprefix: '₦',
                      autorange: true,          // don't anchor at zero
                      rangemode: 'normal',      // zoom to data extent
                    },
                    yaxis2: {
                      overlaying: 'y', side: 'right', ticksuffix: '%',
                      tickfont: { size: 10, color: COLORS.ink4, family: "'JetBrains Mono', monospace" },
                      gridcolor: 'transparent', zerolinecolor: COLORS.border,
                    },
                    legend: { orientation: 'h', y: -0.18 },
                  }}
                  height={300}
                />
              );
            })()
        }
      </div>

      {/* ── Earnings history + Balance sheet ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Earnings history — NEW */}
        <ChartCard title="Earnings History" subtitle="quarterly revenue · EPS" loading={earnLoad} height={280}>
          {!earnLoad && (!earnings || !earnings.periods.length)
            ? <div className="flex items-center justify-center h-[280px] text-[12px] text-[var(--ink-4)]">
              No earnings data available
            </div>
            : <PlotlyChart
              data={[revenueBar, epsLine]}
              layout={{
                ...plotlyLayout({ margin: { t: 8, b: 56, l: 64, r: 48 } }),
                yaxis: { ...plotlyLayout().yaxis, tickprefix: '₦', title: { text: 'Revenue (B)', font: { size: 10 } } },
                yaxis2: {
                  overlaying: 'y', side: 'right',
                  tickfont: { size: 10, color: COLORS.ink4, family: "'JetBrains Mono',monospace" },
                  gridcolor: 'transparent', zerolinecolor: COLORS.border,
                  title: { text: 'EPS', font: { size: 10 } }
                },
                legend: { orientation: 'h', y: -0.22 },
                barmode: 'group',
              }}
              height={280}
            />
          }
        </ChartCard>

        {/* Balance sheet trend — NEW */}
        <ChartCard title="Balance Sheet Trend" subtitle="annual assets · liabilities · equity" loading={bsLoad} height={280}>
          {!bsLoad && (!balance || !balance.periods.length)
            ? <div className="flex items-center justify-center h-[280px] text-[12px] text-[var(--ink-4)]">
              No balance sheet data available
            </div>
            : <PlotlyChart
              data={[
                bsArea('Assets', balance?.assets ?? [], COLORS.accent, 'tozeroy'),
                bsArea('Liabilities', balance?.liabilities ?? [], COLORS.loss, 'tonexty'),
                bsArea('Equity', balance?.equity ?? [], COLORS.gain, 'tonexty'),
              ]}
              layout={{
                ...plotlyLayout({ margin: { t: 8, b: 56, l: 64, r: 16 } }),
                yaxis: { ...plotlyLayout().yaxis, tickprefix: '₦', ticksuffix: 'B' },
                legend: { orientation: 'h', y: -0.22 },
              }}
              height={280}
            />
          }
        </ChartCard>
      </div>

      {/* ── Fundamentals 2-col ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card px-5 py-4">
          <SectionLabel>Valuation</SectionLabel>
          {loading
            ? <div className="grid grid-cols-2 gap-3">{[...Array(8)].map((_, i) => <Sk key={i} w="w-full" h="h-8" />)}</div>
            : <div className="grid grid-cols-2 gap-x-6 gap-y-3.5">
              <Stat label="Market Cap" value={ov?.market_cap} />
              <Stat label="P/E Ratio" value={ov?.pe_ratio} mono />
              <Stat label="EPS" value={ov?.eps} mono />
              <Stat label="Book Value" value={ov?.book_value} mono />
              <Stat label="P/B Ratio" value={perf?.price_to_book} mono />
              <Stat label="P/S Ratio" value={perf?.price_to_sales} mono />
              <Stat label="EV/EBITDA" value={perf?.ev_ebitda} mono />
              <Stat label="EV/FCF" value={perf?.ev_fcf} mono />
            </div>
          }
        </div>
        <div className="card px-5 py-4">
          <SectionLabel>Profitability</SectionLabel>
          {loading
            ? <div className="grid grid-cols-2 gap-3">{[...Array(8)].map((_, i) => <Sk key={i} w="w-full" h="h-8" />)}</div>
            : <div className="grid grid-cols-2 gap-x-6 gap-y-3.5">
              <Stat label="Gross Margin" value={ov?.gross_margin} />
              <Stat label="Net Margin" value={ov?.net_margin} />
              <Stat label="Op. Margin" value={perf?.operating_margin} />
              <Stat label="EBITDA Margin" value={perf?.ebitda_margin} />
              <Stat label="ROE" value={ov?.roe} mono />
              <Stat label="ROA" value={perf?.roa} mono />
              <Stat label="ROIC" value={perf?.roic} mono />
              <Stat label="ROCE" value={perf?.roce} mono />
            </div>
          }
        </div>
      </div>

      {/* ── Return momentum ladder + Financial health ───────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Momentum ladder — REPLACES flat returns grid */}
        <div className="card px-5 py-4">
          <SectionLabel>Return Momentum</SectionLabel>
          {loading
            ? <div className="space-y-2">{[...Array(7)].map((_, i) => <Sk key={i} w="w-full" h="h-7" />)}</div>
            : perf
              ? <MomentumLadder perf={perf} />
              : <p className="text-[11px] text-[var(--ink-4)]">No return data</p>
          }
        </div>

        <div className="card px-5 py-4">
          <SectionLabel>Financial Health</SectionLabel>
          {loading
            ? <div className="grid grid-cols-2 gap-3">{[...Array(8)].map((_, i) => <Sk key={i} w="w-full" h="h-8" />)}</div>
            : <div className="grid grid-cols-2 gap-x-6 gap-y-3.5">
              <Stat label="Revenue" value={ov?.revenue} />
              <Stat label="Net Income" value={ov?.net_income} />
              <Stat label="Current Ratio" value={ov?.current_ratio} mono />
              <Stat label="Quick Ratio" value={perf?.quick_ratio} mono />
              <Stat label="D/E Ratio" value={ov?.debt_to_equity} mono />
              <Stat label="Debt/EBITDA" value={perf?.debt_ebitda} mono />
              <Stat label="Net Debt" value={perf?.net_debt} mono />
              <Stat label="Int. Coverage" value={perf?.interest_coverage} mono />
            </div>
          }
        </div>
      </div>

      {/* ── Quality scores (Piotroski + Altman badges) + Cash flow ─────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Quality badges — REPLACED raw Stat cells */}
        <div className="card px-5 py-4">
          <SectionLabel>Quality &amp; Risk</SectionLabel>
          {loading
            ? <div className="space-y-4">{[...Array(4)].map((_, i) => <Sk key={i} w="w-full" h="h-12" />)}</div>
            : <div className="space-y-5">
              <div>
                <span className="text-[9.5px] font-semibold uppercase tracking-[0.07em] text-[var(--ink-4)] block mb-2">Piotroski F-Score</span>
                <PiotroskiBadge score={perf?.piotroski_score ?? null} />
              </div>
              <div className="border-t border-[var(--border)] pt-4">
                <span className="text-[9.5px] font-semibold uppercase tracking-[0.07em] text-[var(--ink-4)] block mb-2">Altman Z-Score</span>
                <AltmanBadge score={perf?.altman_zscore ?? null} />
              </div>
              <div className="border-t border-[var(--border)] pt-4 grid grid-cols-2 gap-x-6 gap-y-3">
                <Stat label="Beta" value={perf?.beta} mono />
                <Stat label="Volatility" value={perf?.volatility} mono />
                <Stat label="Sharpe" value={perf?.sharpe_ratio} mono />
                <Stat label="Max Drawdown" value={perf?.max_drawdown} mono
                  accent={perf?.max_drawdown ? 'loss' : undefined} />
              </div>
            </div>
          }
        </div>

        <div className="card px-5 py-4">
          <SectionLabel>Cash Flow</SectionLabel>
          {loading
            ? <div className="grid grid-cols-2 gap-3">{[...Array(6)].map((_, i) => <Sk key={i} w="w-full" h="h-8" />)}</div>
            : <div className="grid grid-cols-2 gap-x-6 gap-y-3.5">
              <Stat label="Op. Cash Flow" value={perf?.operating_cash_flow} />
              <Stat label="Free Cash Flow" value={perf?.free_cash_flow} />
              <Stat label="FCF / Share" value={perf?.fcf_per_share} mono />
              <Stat label="FCF Margin" value={perf?.fcf_margin} />
              <Stat label="FCF Yield" value={perf?.fcf_yield} />
              <Stat label="CapEx" value={perf?.capex} mono />
            </div>
          }
        </div>
      </div>

      {/* ── Growth & Dividends ──────────────────────────────────────────── */}
      {!loading && (perf?.revenue_growth_yoy || perf?.earnings_growth_yoy || ov?.dividend_yield) && (
        <div className="card px-5 py-4">
          <SectionLabel>Growth &amp; Dividends</SectionLabel>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3.5">
            <Stat label="Revenue Growth" value={perf?.revenue_growth_yoy} />
            <Stat label="Earnings Growth" value={perf?.earnings_growth_yoy} />
            <Stat label="FCF Growth" value={perf?.fcf_growth_yoy} />
            <Stat label="Dividend Yield" value={ov?.dividend_yield} />
            <Stat label="Dividend Growth" value={perf?.dividend_growth_yoy} />
            <Stat label="Asset Turnover" value={perf?.asset_turnover} mono />
          </div>
        </div>
      )}

    </div>
  );
}