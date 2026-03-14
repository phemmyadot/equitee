'use client';

import { useState, useEffect }    from 'react';
import { useSearchParams }         from 'next/navigation';
import Link                        from 'next/link';
import { fetchNGXTickerData, fetchNGXDividend } from '@/lib/api';
import { usePriceHistory }         from '@/lib/useHistory';
import { usePortfolio }            from '@/lib/PortfolioContext';
import ChartCard                   from '@/components/ui/ChartCard';
import { ChartSkeleton, ErrorMessage } from '@/components/ui/Feedback';
import PlotlyChart                 from '@/components/charts/PlotlyChart';
import { plotlyLayout, COLORS, sectorColor } from '@/lib/theme';
import { fmtNGNFull, fmtNGN, fmtPct, fmtPct2, fmtVol, isPositive } from '@/lib/formatters';
import type { TickerData, DividendInfo, StockRow } from '@/lib/api';

// ─────────────────────────────────────────────────────────────────────────────
// Micro primitives (all local — no extra files needed)
// ─────────────────────────────────────────────────────────────────────────────

function Skeleton({ w = 'w-24', h = 'h-3' }: { w?: string; h?: string }) {
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

// Single stat cell used in info grids
function Stat({
  label, value, mono = false, accent,
}: {
  label: string;
  value?: string | number | null;
  mono?: boolean;
  accent?: 'gain' | 'loss' | 'warn' | 'accent';
}) {
  const accentClass = accent === 'gain'   ? 'text-[var(--gain)]'
                    : accent === 'loss'   ? 'text-[var(--loss)]'
                    : accent === 'warn'   ? 'text-[var(--warn)]'
                    : accent === 'accent' ? 'text-[var(--accent)]'
                    : 'text-[var(--ink-2)]';

  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[9.5px] font-semibold uppercase tracking-[0.07em] text-[var(--ink-4)]">
        {label}
      </span>
      {value != null && value !== ''
        ? <span className={`text-[12px] leading-snug ${mono ? 'font-mono' : ''} ${accentClass}`}>{value}</span>
        : <span className="text-[11px] text-[var(--ink-4)]">—</span>
      }
    </div>
  );
}

// Top-level KPI card — mirrors existing KPICard but slightly more compact
function KpiCard({
  label, value, sub, accent = 'neutral', delay = 0,
}: {
  label: string; value: string; sub?: string;
  accent?: 'gain' | 'loss' | 'accent' | 'teal' | 'warn' | 'neutral';
  delay?: number;
}) {
  const cfg = {
    gain:    { val: 'text-[var(--gain)]',   dot: 'bg-[var(--gain)]'   },
    loss:    { val: 'text-[var(--loss)]',   dot: 'bg-[var(--loss)]'   },
    accent:  { val: 'text-[var(--accent)]', dot: 'bg-[var(--accent)]' },
    teal:    { val: 'text-[var(--teal)]',   dot: 'bg-[var(--teal)]'   },
    warn:    { val: 'text-[var(--warn)]',   dot: 'bg-[var(--warn)]'   },
    neutral: { val: 'text-[var(--ink)]',    dot: 'bg-[var(--ink-4)]'  },
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

// Inline return badge (e.g. "+4.2%")
function ReturnBadge({ value }: { value?: string | null }) {
  if (!value) return <span className="text-[var(--ink-4)] text-[11px] font-mono">—</span>;
  const num = parseFloat(value);
  const pos = !isNaN(num) ? num >= 0 : value.startsWith('+');
  return (
    <span className={`inline-flex items-center gap-0.5 font-mono text-[11px] font-semibold ${pos ? 'text-[var(--gain)]' : 'text-[var(--loss)]'}`}>
      {pos ? '▲' : '▼'} {value.replace(/^[+-]/, '')}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

export default function NGXProfilePage() {
  const params   = useSearchParams();
  const ticker   = (params.get('ticker') ?? '').toUpperCase();

  const [data,    setData]    = useState<TickerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [dividend, setDividend] = useState<DividendInfo | null>(null);
  const [divLoading, setDivLoading] = useState(true);

  const { data: portfolio } = usePortfolio();
  const { data: history, loading: histLoading } = usePriceHistory(ticker, 90);

  // Portfolio position row for this ticker
  const posRow: StockRow | undefined = portfolio?.ngx_stocks.find(s => s.Ticker === ticker);

  useEffect(() => {
    if (!ticker) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchNGXTickerData(ticker)
      .then(d  => { if (!cancelled) { setData(d);  setLoading(false); } })
      .catch(e => { if (!cancelled) { setError(e.message); setLoading(false); } });
    return () => { cancelled = true; };
  }, [ticker]);

  useEffect(() => {
    if (!ticker) return;
    let cancelled = false;
    setDivLoading(true);
    fetchNGXDividend(ticker)
      .then(d  => { if (!cancelled) { setDividend(d);  setDivLoading(false); } })
      .catch(() => { if (!cancelled) setDivLoading(false); }); // 404 = no dividend, not an error
    return () => { cancelled = true; };
  }, [ticker]);

  // ── Derived values ──────────────────────────────────────────────────────
  const price  = data?.price;
  const prof   = data?.profile;
  const ov     = data?.overview;
  const perf   = data?.performance;

  const livePrice   = price?.price ?? posRow?.LivePrice;
  const dayChange   = price?.change_pct ?? posRow?.LiveChangePct;
  const sectorName  = posRow?.Sector ?? '';
  const sectorCol   = sectorColor(sectorName);

  // Price history chart
  const pts = history?.points ?? [];
  const hasHistory = pts.length >= 2;

  const prices    = pts.map(p => p.price).filter((v): v is number => v != null);
  const pMin      = Math.min(...prices);
  const pMax      = Math.max(...prices);
  const priceUp   = prices.length >= 2 && prices[prices.length - 1] >= prices[0];

  const priceLine = {
    type: 'scatter', mode: 'lines',
    name: 'Price',
    x: pts.map(p => new Date(p.ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })),
    y: pts.map(p => p.price),
    line: { color: priceUp ? COLORS.gain : COLORS.loss, width: 2 },
    fill: 'tozeroy',
    fillcolor: priceUp ? 'rgba(10,123,68,0.07)' : 'rgba(190,27,27,0.06)',
    hovertemplate: '<b>%{x}</b><br>₦%{y:,.2f}<extra></extra>',
  };

  const changeLine = {
    type: 'scatter', mode: 'lines',
    name: 'Day Δ%',
    x: pts.map(p => new Date(p.ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })),
    y: pts.map(p => p.change_pct),
    line: { color: COLORS.accent, width: 1.5, dash: 'dot' as const },
    hovertemplate: '<b>%{x}</b><br>%{y:.2f}%<extra>Day Δ</extra>',
    yaxis: 'y2',
  };

  if (!ticker) {
    return (
      <div className="card px-6 py-12 text-center">
        <p className="text-[13px] text-[var(--ink-3)]">No ticker specified.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-5xl">

      {/* ── Breadcrumb ─────────────────────────────────────────────────── */}
      <nav className="flex items-center gap-1.5 text-[11px] text-[var(--ink-4)]">
        <Link href="/ngx" className="hover:text-[var(--ink)] transition-colors">NGX Overview</Link>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
        <span className="text-[var(--ink-3)] font-semibold">{ticker}</span>
      </nav>

      {/* ── Hero header ────────────────────────────────────────────────── */}
      <div className="card px-5 py-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">

          {/* Identity */}
          <div className="flex items-start gap-3.5">
            {/* Sector colour swatch */}
            <div className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center"
                 style={{ background: `${sectorCol}18`, border: `1.5px solid ${sectorCol}40` }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={sectorCol} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
            </div>

            <div>
              {loading
                ? <><Skeleton w="w-48" h="h-5" /><Skeleton w="w-32" h="h-3" /></>
                : <>
                  <h1 className="text-[16px] font-bold text-[var(--ink)] leading-tight">
                    {prof?.name ?? data?.ticker ?? ticker}
                  </h1>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="font-mono text-[11px] font-semibold text-[var(--ink-4)] bg-[var(--canvas)] border border-[var(--border)] px-2 py-0.5 rounded">
                      {ticker} · NGX
                    </span>
                    {sectorName && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded"
                            style={{ background: `${sectorCol}15`, color: sectorCol }}>
                        {sectorName}
                      </span>
                    )}
                    {prof?.industry && (
                      <span className="text-[10px] text-[var(--ink-4)]">{prof.industry}</span>
                    )}
                  </div>
                </>
              }
            </div>
          </div>

          {/* Live price block */}
          <div className="flex flex-col items-start sm:items-end gap-0.5 shrink-0">
            {loading
              ? <><Skeleton w="w-28" h="h-7" /><Skeleton w="w-16" h="h-3" /></>
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
              <a
                href={prof.website.startsWith('http') ? prof.website : `https://${prof.website}`}
                target="_blank" rel="noreferrer"
                className="flex items-center gap-1 text-[11px] text-[var(--accent)] hover:underline"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                {prof.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
              </a>
            )}
          </div>
        )}
      </div>

      {error && <ErrorMessage message={error} />}


      {/* ── Dividend card ──────────────────────────────────────────────── */}
      {(divLoading || dividend) && (
        <div className="card px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {/* Yield icon */}
              <div className="w-6 h-6 rounded-md bg-[var(--gain-light)] flex items-center justify-center">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--gain)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
              </div>
              <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--ink-3)]">Dividend</span>
            </div>
            {dividend && (
              <span className="text-[10px] font-mono text-[var(--ink-4)]">
                cached {dividend.timestamp ? new Date(dividend.timestamp).toLocaleDateString() : '—'}
              </span>
            )}
          </div>

          {divLoading
            ? <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => (
                <div key={i} className="flex flex-col gap-1.5">
                  <div className="skeleton rounded w-16 h-2.5" />
                  <div className="skeleton rounded w-24 h-4" />
                </div>
              ))}</div>
            : dividend
              ? <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4">

                  {/* Cash amount — most prominent */}
                  <div className="flex flex-col gap-0.5 sm:col-span-1">
                    <span className="text-[9.5px] font-semibold uppercase tracking-[0.07em] text-[var(--ink-4)]">Cash Amount</span>
                    <span className="font-mono text-[20px] font-bold text-[var(--gain)] leading-none mt-0.5">
                      {dividend.cash_amount != null
                        ? `₦${dividend.cash_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 3 })}`
                        : '—'}
                    </span>
                    <span className="text-[9px] text-[var(--ink-4)] font-mono mt-0.5">{dividend.currency} per share</span>
                  </div>

                  {/* Ex-dividend date */}
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9.5px] font-semibold uppercase tracking-[0.07em] text-[var(--ink-4)]">Ex-Div Date</span>
                    <span className="font-mono text-[13px] font-semibold text-[var(--ink-2)]">{dividend.ex_dividend_date ?? '—'}</span>
                    <span className="text-[9px] text-[var(--ink-4)] mt-0.5">Must hold before this</span>
                  </div>

                  {/* Record date */}
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9.5px] font-semibold uppercase tracking-[0.07em] text-[var(--ink-4)]">Record Date</span>
                    <span className="font-mono text-[13px] font-semibold text-[var(--ink-2)]">{dividend.record_date ?? '—'}</span>
                    <span className="text-[9px] text-[var(--ink-4)] mt-0.5">Eligibility confirmed</span>
                  </div>

                  {/* Pay date */}
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9.5px] font-semibold uppercase tracking-[0.07em] text-[var(--ink-4)]">Pay Date</span>
                    <span className="font-mono text-[13px] font-semibold text-[var(--ink-2)]">{dividend.pay_date ?? '—'}</span>
                    <span className="text-[9px] text-[var(--ink-4)] mt-0.5">Payment sent</span>
                  </div>

                  {/* My projected payout — only when holding shares */}
                  {posRow && dividend.cash_amount != null && (
                    <div className="sm:col-span-4 mt-1 pt-3 border-t border-[var(--border)] flex items-center gap-3">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--ink-4)" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
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

      {/* ── Portfolio position strip (only when held) ───────────────────── */}
      {posRow && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          <KpiCard label="My Equity"   value={fmtNGN(posRow.CurrentEquity)}  accent="neutral" delay={0}   />
          <KpiCard label="My Cost"     value={fmtNGN(posRow.RemainingCost)}  accent="neutral" delay={50}  />
          <KpiCard label="Unrealized"  value={fmtNGN(posRow.UnrealizedPL)}
            accent={isPositive(posRow.UnrealizedPL) ? 'gain' : 'loss'}       delay={100} />
          <KpiCard label="Return"      value={fmtPct(posRow.ReturnPct)}
            accent={isPositive(posRow.ReturnPct) ? 'gain' : 'loss'}          delay={150} />
          <KpiCard label="Shares"      value={String(posRow.Shares)}         accent="accent" delay={200}
            sub={`avg ₦${posRow.AvgCost?.toFixed(2) ?? '—'}`} />
        </div>
      )}

      {/* ── Price chart ────────────────────────────────────────────────── */}
      <ChartCard title="Price History" subtitle="90-day · day-change overlay" loading={histLoading} height={300}>
        {hasHistory
          ? <PlotlyChart
              data={[priceLine, changeLine]}
              layout={{
                ...plotlyLayout({ margin: { t: 8, b: 48, l: 64, r: 48 } }),
                yaxis:  { ...plotlyLayout().yaxis, tickprefix: '₦', title: { text: 'Price', font: { size: 10 } } },
                yaxis2: { overlaying: 'y', side: 'right', ticksuffix: '%',
                          tickfont: { size: 10, color: COLORS.ink4, family: "'JetBrains Mono', monospace" },
                          gridcolor: 'transparent', zerolinecolor: COLORS.border },
                legend: { orientation: 'h', y: -0.18 },
              }}
              height={300}
            />
          : <div className="flex items-center justify-center h-[300px] text-[12px] text-[var(--ink-4)]">
              No price history yet — snapshots accumulate over time.
            </div>
        }
      </ChartCard>

      {/* ── Fundamentals 2-col ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Valuation */}
        <div className="card px-5 py-4">
          <SectionLabel>Valuation</SectionLabel>
          {loading
            ? <div className="grid grid-cols-2 gap-3">{[...Array(8)].map((_, i) => <Skeleton key={i} w="w-full" h="h-8" />)}</div>
            : <div className="grid grid-cols-2 gap-x-6 gap-y-3.5">
                <Stat label="Market Cap"     value={ov?.market_cap}    />
                <Stat label="P/E Ratio"      value={ov?.pe_ratio}      mono />
                <Stat label="EPS"            value={ov?.eps}           mono />
                <Stat label="Book Value"     value={ov?.book_value}    mono />
                <Stat label="P/B Ratio"      value={perf?.price_to_book} mono />
                <Stat label="P/S Ratio"      value={perf?.price_to_sales} mono />
                <Stat label="EV/EBITDA"      value={perf?.ev_ebitda}   mono />
                <Stat label="EV/FCF"         value={perf?.ev_fcf}      mono />
              </div>
          }
        </div>

        {/* Profitability */}
        <div className="card px-5 py-4">
          <SectionLabel>Profitability</SectionLabel>
          {loading
            ? <div className="grid grid-cols-2 gap-3">{[...Array(8)].map((_, i) => <Skeleton key={i} w="w-full" h="h-8" />)}</div>
            : <div className="grid grid-cols-2 gap-x-6 gap-y-3.5">
                <Stat label="Gross Margin"   value={ov?.gross_margin}       />
                <Stat label="Net Margin"     value={ov?.net_margin}         />
                <Stat label="Op. Margin"     value={perf?.operating_margin} />
                <Stat label="EBITDA Margin"  value={perf?.ebitda_margin}    />
                <Stat label="ROE"            value={ov?.roe}            mono />
                <Stat label="ROA"            value={perf?.roa}          mono />
                <Stat label="ROIC"           value={perf?.roic}         mono />
                <Stat label="ROCE"           value={perf?.roce}         mono />
              </div>
          }
        </div>
      </div>

      {/* ── Returns + Financials 2-col ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Period returns */}
        <div className="card px-5 py-4">
          <SectionLabel>Returns</SectionLabel>
          {loading
            ? <div className="grid grid-cols-2 gap-3">{[...Array(8)].map((_, i) => <Skeleton key={i} w="w-full" h="h-8" />)}</div>
            : <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                {[
                  ['1 Day',  perf?.return_1d],
                  ['1 Week', perf?.return_1w],
                  ['1 Month',perf?.return_1m],
                  ['3 Month',perf?.return_3m],
                  ['6 Month',perf?.return_6m],
                  ['YTD',    perf?.return_ytd],
                  ['1 Year', perf?.return_1y],
                  ['52W High',perf?.week_52_high],
                ].map(([lbl, val]) => (
                  <div key={lbl as string} className="flex flex-col gap-0.5">
                    <span className="text-[9.5px] font-semibold uppercase tracking-[0.07em] text-[var(--ink-4)]">{lbl}</span>
                    <ReturnBadge value={val as string | null} />
                  </div>
                ))}
              </div>
          }
        </div>

        {/* Financial health */}
        <div className="card px-5 py-4">
          <SectionLabel>Financial Health</SectionLabel>
          {loading
            ? <div className="grid grid-cols-2 gap-3">{[...Array(8)].map((_, i) => <Skeleton key={i} w="w-full" h="h-8" />)}</div>
            : <div className="grid grid-cols-2 gap-x-6 gap-y-3.5">
                <Stat label="Revenue"         value={ov?.revenue}          />
                <Stat label="Net Income"      value={ov?.net_income}       />
                <Stat label="Current Ratio"   value={ov?.current_ratio}    mono />
                <Stat label="Quick Ratio"     value={perf?.quick_ratio}    mono />
                <Stat label="D/E Ratio"       value={ov?.debt_to_equity}   mono />
                <Stat label="Debt/EBITDA"     value={perf?.debt_ebitda}    mono />
                <Stat label="Net Debt"        value={perf?.net_debt}       mono />
                <Stat label="Int. Coverage"   value={perf?.interest_coverage} mono />
              </div>
          }
        </div>
      </div>

      {/* ── Cash flow + Scores ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Cash flow */}
        <div className="card px-5 py-4">
          <SectionLabel>Cash Flow</SectionLabel>
          {loading
            ? <div className="grid grid-cols-2 gap-3">{[...Array(6)].map((_, i) => <Skeleton key={i} w="w-full" h="h-8" />)}</div>
            : <div className="grid grid-cols-2 gap-x-6 gap-y-3.5">
                <Stat label="Op. Cash Flow"  value={perf?.operating_cash_flow} />
                <Stat label="Free Cash Flow" value={perf?.free_cash_flow}   />
                <Stat label="FCF / Share"    value={perf?.fcf_per_share}    mono />
                <Stat label="FCF Margin"     value={perf?.fcf_margin}       />
                <Stat label="FCF Yield"      value={perf?.fcf_yield}        />
                <Stat label="CapEx"          value={perf?.capex}            mono />
              </div>
          }
        </div>

        {/* Quality scores + risk */}
        <div className="card px-5 py-4">
          <SectionLabel>Quality &amp; Risk</SectionLabel>
          {loading
            ? <div className="grid grid-cols-2 gap-3">{[...Array(6)].map((_, i) => <Skeleton key={i} w="w-full" h="h-8" />)}</div>
            : <div className="grid grid-cols-2 gap-x-6 gap-y-3.5">
                <Stat label="Piotroski F"    value={perf?.piotroski_score}  mono accent="accent" />
                <Stat label="Altman Z"       value={perf?.altman_zscore}    mono accent="accent" />
                <Stat label="Beta"           value={perf?.beta}             mono />
                <Stat label="Volatility"     value={perf?.volatility}       mono />
                <Stat label="Sharpe Ratio"   value={perf?.sharpe_ratio}     mono />
                <Stat label="Max Drawdown"   value={perf?.max_drawdown}     mono
                  accent={perf?.max_drawdown ? 'loss' : undefined} />
              </div>
          }
        </div>
      </div>

      {/* ── Growth ──────────────────────────────────────────────────────── */}
      {!loading && (perf?.revenue_growth_yoy || perf?.earnings_growth_yoy || ov?.dividend_yield) && (
        <div className="card px-5 py-4">
          <SectionLabel>Growth &amp; Dividends</SectionLabel>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3.5">
            <Stat label="Revenue Growth"    value={perf?.revenue_growth_yoy}   />
            <Stat label="Earnings Growth"   value={perf?.earnings_growth_yoy}  />
            <Stat label="FCF Growth"        value={perf?.fcf_growth_yoy}       />
            <Stat label="Dividend Yield"    value={ov?.dividend_yield}         />
            <Stat label="Dividend Growth"   value={perf?.dividend_growth_yoy}  />
            <Stat label="Asset Turnover"    value={perf?.asset_turnover}  mono />
          </div>
        </div>
      )}

    </div>
  );
}