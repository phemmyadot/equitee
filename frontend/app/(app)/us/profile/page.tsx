'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  fetchUSTickerData,
  fetchUSPriceHistory,
  fetchWatchlistCheck,
  addToWatchlist,
  removeFromWatchlist,
} from '@/services/api';
import ChartCard from '@/components/molecules/ChartCard';
import { ErrorMessage } from '@/components/atoms/Feedback';
import SignalScore, { computeSignal } from '@/components/molecules/Signalscore';
import PlotlyChart from '@/components/molecules/PlotlyChart';
import { plotlyLayout, COLORS, sectorColor } from '@/utils/theme';
import { fmtUSD, fmtPct, fmtPct2, fmtVol, isPositive } from '@/utils/formatters';
import type { TickerData, DBPriceHistory } from '@/models';
import {
  IconChevronRight,
  IconGlobe,
  IconExternalLink,
  IconBookmark,
} from '@/components/atoms/icons';

// ── Helpers ───────────────────────────────────────────────────────────────────

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

function Stat({
  label,
  value,
  mono = false,
  accent,
}: {
  label: string;
  value?: string | number | null;
  mono?: boolean;
  accent?: 'gain' | 'loss' | 'warn' | 'accent';
}) {
  const c =
    accent === 'gain' ? 'text-[var(--gain)]' :
    accent === 'loss' ? 'text-[var(--loss)]' :
    accent === 'warn' ? 'text-amber-600' :
    accent === 'accent' ? 'text-[var(--accent)]' :
    'text-[var(--ink-2)]';
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[9.5px] font-semibold uppercase tracking-[0.07em] text-[var(--ink-4)]">{label}</span>
      {value != null && value !== '' ? (
        <span className={`text-[12px] leading-snug ${mono ? 'font-mono' : ''} ${c}`}>{value}</span>
      ) : (
        <span className="text-[11px] text-[var(--ink-4)]">—</span>
      )}
    </div>
  );
}

function n(v: string | number | null | undefined): number | null {
  if (v == null) return null;
  const f = parseFloat(String(v).replace(/[^0-9.-]/g, ''));
  return isNaN(f) ? null : f;
}

function fmtBig(v: number | null | undefined): string {
  if (v == null) return '—';
  if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`;
  if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
  return fmtUSD(v);
}

function fmtPctStat(v: string | number | null | undefined): string {
  const num = n(v);
  return num != null ? `${num.toFixed(2)}%` : '—';
}

const REC_COLORS: Record<string, string> = {
  'strong_buy': 'var(--gain)',
  'buy': '#22c55e',
  'hold': 'var(--warn, #f59e0b)',
  'underperform': '#f97316',
  'sell': 'var(--loss)',
};

const REC_LABELS: Record<string, string> = {
  'strong_buy': 'Strong Buy',
  'buy': 'Buy',
  'hold': 'Hold',
  'underperform': 'Underperform',
  'sell': 'Sell',
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function USProfilePage() {
  const searchParams = useSearchParams();
  const ticker = (searchParams.get('ticker') ?? '').toUpperCase();

  const [td, setTd] = useState<TickerData | null>(null);
  const [history, setHistory] = useState<DBPriceHistory | null>(null);
  const [histDays, setHistDays] = useState(90);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [watching, setWatching] = useState(false);
  const [watchBusy, setWatchBusy] = useState(false);

  useEffect(() => {
    if (!ticker) return;
    setLoading(true);
    setError(null);
    Promise.allSettled([
      fetchUSTickerData(ticker),
      fetchWatchlistCheck(ticker),
    ]).then(([tdRes, wRes]) => {
      if (tdRes.status === 'fulfilled') setTd(tdRes.value);
      else setError('Failed to load ticker data');
      if (wRes.status === 'fulfilled') setWatching(wRes.value.watching);
      setLoading(false);
    });
  }, [ticker]);

  useEffect(() => {
    if (!ticker) return;
    fetchUSPriceHistory(ticker, histDays).then(setHistory).catch(() => setHistory(null));
  }, [ticker, histDays]);

  const handleWatch = async () => {
    setWatchBusy(true);
    try {
      if (watching) {
        await removeFromWatchlist(ticker);
        setWatching(false);
      } else {
        await addToWatchlist(ticker, 'US');
        setWatching(true);
      }
    } finally {
      setWatchBusy(false);
    }
  };

  if (!ticker) return <p className="text-[var(--ink-4)] text-sm p-8">No ticker specified.</p>;
  if (error) return <ErrorMessage message={error} />;

  const ov = td?.overview ?? null;
  const perf = td?.performance ?? null;
  const prof = td?.profile ?? null;
  const price = td?.price?.price ?? null;
  const change = td?.price?.change ?? null;
  const changePct = td?.price?.change_pct ?? null;

  const sig = td ? computeSignal(ov, perf, price, null, null, prof?.sector ?? null) : null;

  const w52h = n(perf?.week_52_high);
  const w52l = n(perf?.week_52_low);
  const rangePct =
    w52h && w52l && w52h > w52l && price
      ? Math.max(0, Math.min(100, ((price - w52l) / (w52h - w52l)) * 100))
      : null;

  const rec = (ov as any)?.recommendation as string | null;
  const recColor = rec ? (REC_COLORS[rec] ?? 'var(--ink-3)') : null;
  const recLabel = rec ? (REC_LABELS[rec] ?? rec) : null;

  // ── Price chart ────────────────────────────────────────────────────────────
  const histDates = history?.dates ?? [];
  const histClose = history?.close ?? [];
  const histChg = history?.change_pct ?? [];

  const priceTrace = {
    type: 'scatter',
    x: histDates,
    y: histClose,
    mode: 'lines',
    line: { color: COLORS.accent, width: 2 },
    name: 'Price',
    yaxis: 'y',
    hovertemplate: '<b>%{x}</b><br>$%{y:,.2f}<extra></extra>',
  };

  const chgTrace = {
    type: 'bar',
    x: histDates,
    y: histChg,
    name: 'Day %',
    yaxis: 'y2',
    marker: {
      color: histChg.map((v) => ((v ?? 0) >= 0 ? COLORS.gain : COLORS.loss)),
      opacity: 0.45,
    },
    hovertemplate: '<b>%{x}</b><br>%{y:.2f}%<extra></extra>',
  };

  const chartLayout = plotlyLayout({
    margin: { t: 8, b: 48, l: 56, r: 56 },
    yaxis: { title: 'Price (USD)', tickprefix: '$', side: 'left' },
    yaxis2: {
      title: 'Day %',
      overlaying: 'y',
      side: 'right',
      showgrid: false,
      ticksuffix: '%',
      zeroline: false,
    },
    legend: { orientation: 'h', y: -0.15 },
  });

  return (
    <div className="space-y-5">

      {/* ── Breadcrumb ────────────────────────────────────────────────── */}
      <nav className="flex items-center gap-1.5 text-[10px] text-[var(--ink-4)]">
        <Link href="/us" className="hover:text-[var(--accent)] transition-colors">US Portfolio</Link>
        <IconChevronRight width={10} height={10} />
        <span className="font-semibold text-[var(--ink-2)]">{ticker}</span>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <div className="card px-5 py-4 space-y-4">
        {loading ? (
          <div className="space-y-3">
            <Sk w="w-32" h="h-5" />
            <Sk w="w-48" h="h-8" />
            <Sk w="w-64" h="h-3" />
          </div>
        ) : (
          <>
            {/* Name + sector */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-bold text-[22px] text-[var(--ink)] leading-none">{ticker}</span>
                  {prof?.sector && (
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ color: sectorColor(prof.sector), background: sectorColor(prof.sector) + '22' }}
                    >
                      {prof.sector}
                    </span>
                  )}
                  {recLabel && (
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ color: recColor ?? undefined, background: (recColor ?? '#000') + '22' }}
                    >
                      {recLabel}
                    </span>
                  )}
                </div>
                {prof?.name && (
                  <p className="text-[13px] text-[var(--ink-2)] mt-0.5">{prof.name}</p>
                )}
                {prof?.industry && (
                  <p className="text-[10px] text-[var(--ink-4)] mt-0.5">{prof.industry}</p>
                )}
              </div>

              {/* Watch button */}
              <button
                onClick={handleWatch}
                disabled={watchBusy}
                className={[
                  'flex items-center gap-1.5 h-8 px-3 rounded-lg text-[11px] font-semibold transition-colors disabled:opacity-40',
                  watching
                    ? 'bg-[var(--accent-light)] text-[var(--accent)]'
                    : 'border border-[var(--border)] text-[var(--ink-3)] hover:border-[var(--accent)] hover:text-[var(--accent)]',
                ].join(' ')}
              >
                <IconBookmark width={12} height={12} />
                {watching ? 'Watching' : 'Watch'}
              </button>
            </div>

            {/* Price */}
            <div className="flex items-end gap-3 flex-wrap">
              <span className="font-mono font-bold text-[32px] text-[var(--ink)] leading-none tabular-nums">
                {price != null ? `$${price.toFixed(2)}` : '—'}
              </span>
              {changePct != null && (
                <div className={`flex flex-col pb-0.5 ${isPositive(changePct) ? 'text-[var(--gain)]' : 'text-[var(--loss)]'}`}>
                  <span className="font-mono font-semibold text-[14px] leading-none">
                    {isPositive(changePct) ? '+' : ''}{change?.toFixed(2) ?? '—'}
                  </span>
                  <span className="font-mono text-[12px]">{fmtPct2(changePct)}</span>
                </div>
              )}
            </div>

            {/* 52W range bar */}
            {rangePct != null && w52l != null && w52h != null && (
              <div>
                <div className="flex justify-between text-[9px] font-mono text-[var(--ink-4)] mb-1">
                  <span>52W Low ${w52l.toFixed(2)}</span>
                  <span>52W High ${w52h.toFixed(2)}</span>
                </div>
                <div className="relative h-2 rounded-full bg-[var(--border)] overflow-hidden">
                  <div
                    className="absolute left-0 top-0 h-full rounded-full transition-all"
                    style={{
                      width: `${rangePct}%`,
                      background: rangePct > 70 ? 'var(--gain)' : rangePct > 35 ? 'var(--accent)' : 'var(--loss)',
                    }}
                  />
                </div>
                <p className="text-[9px] text-[var(--ink-4)] mt-1">
                  {rangePct.toFixed(0)}% of 52-week range
                </p>
              </div>
            )}

            {/* Meta row */}
            <div className="flex flex-wrap gap-4 text-[10px] text-[var(--ink-3)]">
              {prof?.headquarters && <span>{prof.headquarters}</span>}
              {prof?.employees && <span>{Number(prof.employees).toLocaleString()} employees</span>}
              {prof?.website && (
                <a
                  href={prof.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-[var(--accent)] transition-colors"
                >
                  <IconExternalLink width={10} height={10} />
                  {prof.website.replace(/^https?:\/\/(www\.)?/, '')}
                </a>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Signal Score ────────────────────────────────────────────────── */}
      {!loading && td && sig && (
        <div className="card px-5 py-4">
          <SectionLabel>Signal Score</SectionLabel>
          <SignalScore ov={ov} perf={perf} livePrice={price} posRow={null} dividend={null} loading={false} sector={prof?.sector ?? null} />
        </div>
      )}

      {/* ── Price History ────────────────────────────────────────────────── */}
      <ChartCard
        title="Price History"
        subtitle="daily close · USD"
        height={320}
        action={
          <div className="flex rounded-md border border-[var(--border)] overflow-hidden">
            {([7, 30, 90] as const).map((d) => (
              <button
                key={d}
                onClick={() => setHistDays(d)}
                className={[
                  'px-2.5 py-1 text-[10px] font-semibold transition-colors',
                  histDays === d
                    ? 'bg-[var(--accent-light)] text-[var(--accent)]'
                    : 'text-[var(--ink-4)] hover:text-[var(--ink)]',
                ].join(' ')}
              >
                {d}d
              </button>
            ))}
          </div>
        }
      >
        {histDates.length > 0 ? (
          <PlotlyChart data={[priceTrace, chgTrace]} layout={chartLayout} height={320} />
        ) : (
          <div className="flex items-center justify-center h-[320px] text-[var(--ink-4)] text-[12px]">
            No history available
          </div>
        )}
      </ChartCard>

      {/* ── Key Stats ───────────────────────────────────────────────────── */}
      {!loading && (
        <div className="card px-5 py-4">
          <SectionLabel>Key Statistics</SectionLabel>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4">
            <Stat label="Market Cap" value={fmtBig(n(ov?.market_cap))} mono />
            <Stat label="P/E (Trailing)" value={n(ov?.pe_ratio)?.toFixed(1)} mono />
            <Stat label="P/E (Forward)" value={n((ov as any)?.forward_pe)?.toFixed(1)} mono />
            <Stat label="EPS" value={n(ov?.eps) != null ? `$${n(ov?.eps)?.toFixed(2)}` : null} mono />
            <Stat label="Price / Book" value={n((ov as any)?.price_to_book)?.toFixed(2)} mono />
            <Stat label="EV / EBITDA" value={n((ov as any)?.ev_ebitda)?.toFixed(1)} mono />
            <Stat label="EV / Revenue" value={n((ov as any)?.ev_revenue)?.toFixed(2)} mono />
            <Stat label="Beta" value={n(perf?.beta)?.toFixed(2)} mono />
            <Stat label="Dividend Yield" value={fmtPctStat(ov?.dividend_yield)} mono />
            <Stat label="Div Rate / Share" value={n((ov as any)?.dividend_rate) != null ? `$${n((ov as any)?.dividend_rate)?.toFixed(2)}` : null} mono />
            <Stat label="Payout Ratio" value={fmtPctStat((ov as any)?.payout_ratio)} mono />
            <Stat label="Volume" value={fmtVol(n(td?.price?.volume))} mono />
          </div>
        </div>
      )}

      {/* ── Valuation + Profitability ────────────────────────────────────── */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card px-5 py-4">
            <SectionLabel>Profitability</SectionLabel>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <Stat label="Gross Margin" value={fmtPctStat(ov?.gross_margin)} mono accent={n(ov?.gross_margin) != null && n(ov!.gross_margin)! > 40 ? 'gain' : undefined} />
              <Stat label="Operating Margin" value={fmtPctStat((ov as any)?.operating_margin)} mono accent={n((ov as any)?.operating_margin) != null && n((ov as any)?.operating_margin)! > 15 ? 'gain' : undefined} />
              <Stat label="Net Margin" value={fmtPctStat(ov?.net_margin)} mono accent={n(ov?.net_margin) != null && n(ov!.net_margin)! > 10 ? 'gain' : undefined} />
              <Stat label="EBITDA Margin" value={fmtPctStat((ov as any)?.ebitda_margin)} mono />
              <Stat
                label="ROE"
                value={fmtPctStat(ov?.roe)}
                mono
                accent={n(ov?.roe) != null ? (n(ov!.roe)! > 15 ? 'gain' : n(ov!.roe)! < 0 ? 'loss' : undefined) : undefined}
              />
              <Stat
                label="ROA"
                value={fmtPctStat((ov as any)?.roa)}
                mono
                accent={n((ov as any)?.roa) != null && n((ov as any)?.roa)! > 5 ? 'gain' : undefined}
              />
            </div>
          </div>

          <div className="card px-5 py-4">
            <SectionLabel>Financial Health</SectionLabel>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <Stat label="Revenue" value={fmtBig(n(ov?.revenue))} mono />
              <Stat label="Net Income" value={fmtBig(n(ov?.net_income))} mono accent={n(ov?.net_income) != null ? (isPositive(n(ov!.net_income)) ? 'gain' : 'loss') : undefined} />
              <Stat label="Free Cash Flow" value={fmtBig(n((ov as any)?.free_cash_flow))} mono />
              <Stat label="Operating CF" value={fmtBig(n((ov as any)?.operating_cash_flow))} mono />
              <Stat label="Total Cash" value={fmtBig(n((ov as any)?.total_cash))} mono />
              <Stat label="Total Debt" value={fmtBig(n((ov as any)?.total_debt))} mono />
              <Stat label="Debt / Equity" value={n(ov?.debt_to_equity)?.toFixed(1)} mono />
              <Stat label="Current Ratio" value={n(ov?.current_ratio)?.toFixed(2)} mono accent={n(ov?.current_ratio) != null && n(ov!.current_ratio)! >= 1.5 ? 'gain' : n(ov?.current_ratio) != null && n(ov!.current_ratio)! < 1 ? 'loss' : undefined} />
            </div>
          </div>
        </div>
      )}

      {/* ── Growth + Technical ───────────────────────────────────────────── */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card px-5 py-4">
            <SectionLabel>Growth & Momentum</SectionLabel>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <Stat label="Revenue Growth (YoY)" value={fmtPctStat((ov as any)?.revenue_growth)} mono accent={n((ov as any)?.revenue_growth) != null ? (isPositive(n((ov as any)?.revenue_growth)) ? 'gain' : 'loss') : undefined} />
              <Stat label="Earnings Growth (YoY)" value={fmtPctStat((ov as any)?.earnings_growth)} mono accent={n((ov as any)?.earnings_growth) != null ? (isPositive(n((ov as any)?.earnings_growth)) ? 'gain' : 'loss') : undefined} />
              <Stat label="52W Change" value={fmtPctStat(perf?.week_52_change)} mono accent={n(perf?.week_52_change) != null ? (isPositive(n(perf!.week_52_change)) ? 'gain' : 'loss') : undefined} />
              <Stat label="Beta" value={n(perf?.beta)?.toFixed(2)} mono />
              <Stat label="MA 50d" value={n(perf?.ma_50) != null ? `$${n(perf!.ma_50)!.toFixed(2)}` : null} mono accent={price && n(perf?.ma_50) && price > n(perf!.ma_50)! ? 'gain' : price && n(perf?.ma_50) && price < n(perf!.ma_50)! ? 'loss' : undefined} />
              <Stat label="MA 200d" value={n(perf?.ma_200) != null ? `$${n(perf!.ma_200)!.toFixed(2)}` : null} mono accent={price && n(perf?.ma_200) && price > n(perf!.ma_200)! ? 'gain' : price && n(perf?.ma_200) && price < n(perf!.ma_200)! ? 'loss' : undefined} />
            </div>
          </div>

          {/* Analyst consensus */}
          {(n((ov as any)?.target_mean) || recLabel) && (
            <div className="card px-5 py-4">
              <SectionLabel>Analyst Consensus</SectionLabel>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <Stat label="Recommendation" value={recLabel} accent={rec === 'buy' || rec === 'strong_buy' ? 'gain' : rec === 'sell' ? 'loss' : undefined} />
                <Stat label="Analysts" value={(ov as any)?.analyst_count} mono />
                <Stat label="Target Mean" value={n((ov as any)?.target_mean) != null ? `$${n((ov as any)?.target_mean)!.toFixed(2)}` : null} mono />
                <Stat label="Target High" value={n((ov as any)?.target_high) != null ? `$${n((ov as any)?.target_high)!.toFixed(2)}` : null} mono accent="gain" />
                <Stat label="Target Low" value={n((ov as any)?.target_low) != null ? `$${n((ov as any)?.target_low)!.toFixed(2)}` : null} mono accent="loss" />
                {price && n((ov as any)?.target_mean) && (
                  <Stat
                    label="Upside to Target"
                    value={fmtPct(((n((ov as any)?.target_mean)! - price) / price) * 100)}
                    mono
                    accent={n((ov as any)?.target_mean)! > price ? 'gain' : 'loss'}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Business description ─────────────────────────────────────────── */}
      {!loading && prof?.description && (
        <div className="card px-5 py-4">
          <SectionLabel>About</SectionLabel>
          <p className="text-[11px] text-[var(--ink-3)] leading-relaxed line-clamp-4">
            {prof.description}
          </p>
          {prof.website && (
            <a
              href={prof.website}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-semibold text-[var(--accent)] hover:underline"
            >
              <IconGlobe width={11} height={11} />
              Visit website
            </a>
          )}
        </div>
      )}
    </div>
  );
}
