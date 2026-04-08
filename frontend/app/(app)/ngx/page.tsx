'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePortfolio } from '@/context/PortfolioContext';
import KPICard from '@/components/molecules/KPICard';
import ChartCard from '@/components/molecules/ChartCard';
import StockTable, { type ColDef } from '@/components/molecules/StockTable';
import Sparkline from '@/components/atoms/Sparkline';
import { ChartSkeleton, PriceBanner } from '@/components/atoms/Feedback';
import PlotlyChart from '@/components/molecules/PlotlyChart';
import { plotlyLayout, COLORS, sectorColor } from '@/utils/theme';
import { fmtNGN, fmtNGNFull, fmtUSD, fmtPct, fmtPct2, isPositive } from '@/utils/formatters';
import { fetchNGXTickerData } from '@/services/api';
import type { StockRow, TickerData } from '@/models';
import { computeSignal } from '@/components/molecules/Signalscore';
import { computeTargets } from '@/utils/targets';

export default function NGXOverviewPage() {
  const { data, loading, dividendsData } = usePortfolio();
  const isFirstLoad = loading && !data;

  // Per-ticker fundamentals for signal + target computation
  // Loaded once per session — fundamentals don't change with live price polls
  const [tickerMap, setTickerMap] = useState<Record<string, TickerData>>({});
  const loadedTickersRef = useRef<string>('');

  useEffect(() => {
    const active = (data?.ngx_stocks ?? []).filter((s) => s.CurrentEquity != null);
    if (!active.length) return;
    const key = active.map((s) => s.Ticker).sort().join(',');
    if (key === loadedTickersRef.current) return; // already loaded this exact set
    loadedTickersRef.current = key;
    Promise.allSettled(active.map((s) => fetchNGXTickerData(s.Ticker))).then((results) => {
      const map: Record<string, TickerData> = {};
      results.forEach((r, i) => {
        if (r.status === 'fulfilled') map[active[i].Ticker] = r.value;
      });
      setTickerMap(map);
    });
  }, [data?.ngx_stocks?.length]);

  if (!data && !loading) return null;

  const k = data?.ngx_kpis;
  const ck = data?.combined_kpis;
  const active = (data?.ngx_stocks ?? []).filter((s) => s.CurrentEquity != null);
  const ngx_sectors = data?.ngx_sectors ?? [];
  const meta = data?.meta;

  // ── Weighted portfolio fundamentals ─────────────────────────────────────────
  // Use cost basis (shares × avg_cost) as weight — stable, price-independent
  const totalCost = active.reduce((sum, s) => sum + (s.Shares ?? 0) * (s.AvgCost ?? 0), 0) || 1;
  // totalEquity still used for equity-weight display column in the table
  const totalEquity = active.reduce((sum, s) => sum + (s.CurrentEquity ?? 0), 0) || 1;
  const _n = (v: string | number | null | undefined) => {
    if (v == null) return null;
    const f = parseFloat(String(v).replace(/[^0-9.-]/g, ''));
    return isNaN(f) ? null : f;
  };
  const weightedAvg = (field: (td: TickerData) => number | null) => {
    let wsum = 0,
      wt = 0;
    active.forEach((s) => {
      const td = tickerMap[s.Ticker];
      if (!td) return;
      const val = field(td);
      if (val == null || !isFinite(val)) return;
      const w = ((s.Shares ?? 0) * (s.AvgCost ?? 0)) / totalCost;
      wsum += val * w;
      wt += w;
    });
    return wt > 0.01 ? wsum / wt : null;
  };
  const wPE = weightedAvg((td) => _n(td.overview?.pe_ratio));
  // Cap ROE at 150% — values above that are scraping artefacts (near-zero equity)
  const wROE = weightedAvg((td) => {
    const v = _n(td.overview?.roe);
    return v != null && v <= 150 ? v : null;
  });
  const wBeta = weightedAvg((td) => _n(td.performance?.beta));
  const wDivY = weightedAvg((td) => _n(td.overview?.dividend_yield));
  const annualDivIncome = dividendsData?.total_projected_payout ?? null;

  // ── Today's movers ───────────────────────────────────────────────────────────
  const moversSorted = [...active].sort((a, b) => (b.LiveChangePct ?? 0) - (a.LiveChangePct ?? 0));
  const topMover = moversSorted[0] ?? null;
  const bottomMover = moversSorted[moversSorted.length - 1] ?? null;

  const equityBar = {
    type: 'bar',
    x: active.map((s) => s.Ticker),
    y: active.map((s) => s.CurrentEquity),
    marker: { color: active.map((s) => sectorColor(s.Sector)), opacity: 0.9 },
    hovertemplate: '<b>%{x}</b><br>₦%{y:,.0f}<extra></extra>',
  };

  const sectorDonut = {
    type: 'pie',
    labels: ngx_sectors.map((s) => s.Sector),
    values: ngx_sectors.map((s) => s.Equity),
    hole: 0.58,
    marker: {
      colors: ngx_sectors.map((s) => sectorColor(s.Sector)),
      line: { color: '#fff', width: 2 },
    },
    textinfo: 'label+percent',
    textfont: { size: 10 },
    hovertemplate: '<b>%{label}</b><br>₦%{value:,.0f}<br>%{percent}<extra></extra>',
  };

  const returnBar = {
    type: 'bar',
    x: active.map((s) => s.Ticker),
    y: active.map((s) => s.ReturnPct),
    marker: {
      color: active.map((s) => ((s.ReturnPct ?? 0) >= 0 ? COLORS.gain : COLORS.loss)),
      opacity: 0.85,
    },
    hovertemplate: '<b>%{x}</b><br>%{y:.1f}%<extra></extra>',
  };

  const sectorGainBar = {
    type: 'bar',
    x: ngx_sectors.map((s) => s.Sector),
    y: ngx_sectors.map((s) => s.GainPct),
    marker: {
      color: ngx_sectors.map((s) => (s.GainPct >= 0 ? sectorColor(s.Sector) : COLORS.loss)),
      opacity: 0.85,
    },
    hovertemplate: '<b>%{x}</b><br>%{y:.1f}%<extra></extra>',
  };

  const treemap = {
    type: 'treemap',
    labels: active.map((s) => `${s.Ticker}<br>${fmtPct(s.ReturnPct ?? 0)}`),
    parents: active.map(() => ''),
    values: active.map((s) => s.CurrentEquity),
    customdata: active.map((s) => [s.Stock, fmtNGN(s.CurrentEquity), fmtPct(s.ReturnPct ?? 0)]),
    hovertemplate:
      '<b>%{customdata[0]}</b><br>Equity: %{customdata[1]}<br>Return: %{customdata[2]}<extra></extra>',
    marker: {
      colors: active.map((s) => s.ReturnPct ?? 0),
      colorscale: [
        [0, '#BE1B1B'],
        [0.35, '#D97706'],
        [0.5, '#F5C518'],
        [0.7, '#2D7D3A'],
        [1, '#0A7B44'],
      ],
      cmin: -30,
      cmax: 100,
      showscale: true,
      colorbar: {
        thickness: 10,
        len: 0.5,
        tickfont: { size: 9 },
        ticksuffix: '%',
        bgcolor: 'transparent',
        borderwidth: 0,
      },
      line: { width: 2, color: '#fff' },
    },
    textfont: { size: 11, color: '#fff' },
    tiling: { packing: 'squarify' },
  };

  const cols: ColDef<StockRow>[] = [
    {
      key: 'Ticker',
      label: 'Ticker',
      render: (v: string) => (
        <Link
          href={`/ngx/profile?ticker=${v}`}
          className="font-mono font-semibold text-[11px] text-[var(--accent)] hover:underline"
        >
          {v}
        </Link>
      ),
    },
    {
      key: 'Stock',
      label: 'Company',
      render: (v: string, row: StockRow) => (
        <span className="flex items-center gap-1.5">
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ background: sectorColor(row.Sector ?? '') }}
          />
          <span className="text-[var(--ink-2)] text-[12px]">{v}</span>
        </span>
      ),
    },
    {
      key: 'LivePrice',
      label: 'Price',
      right: true,
      render: (v: number) =>
        v != null ? (
          <span className="font-mono font-semibold text-[var(--ink)]">{fmtNGNFull(v)}</span>
        ) : (
          <span className="text-[var(--ink-4)]">—</span>
        ),
      sortValue: (r: StockRow) => r.LivePrice ?? 0,
    },
    {
      key: 'LiveChangePct',
      label: 'Day %',
      right: true,
      render: (v: number) => {
        const val = v ?? 0;
        const col =
          val > 0 ? 'text-[var(--gain)]' : val < 0 ? 'text-[var(--loss)]' : 'text-[var(--ink-4)]';
        return <span className={`font-mono font-medium text-[11px] ${col}`}>{fmtPct2(val)}</span>;
      },
      sortValue: (r: StockRow) => r.LiveChangePct ?? 0,
    },
    {
      key: 'CurrentEquity',
      label: 'Equity',
      right: true,
      render: (v: number, row: StockRow) => {
        const wt = ((row.CurrentEquity ?? 0) / totalEquity) * 100;
        return (
          <div className="flex flex-col items-end gap-0.5">
            <span className="font-mono font-semibold text-[var(--ink)]">{fmtNGN(v)}</span>
            <span className="font-mono text-[9px] text-[var(--ink-4)]">{wt.toFixed(1)}%</span>
          </div>
        );
      },
      sortValue: (r: StockRow) => r.CurrentEquity ?? 0,
    },
    {
      key: 'UnrealizedPL',
      label: 'G/L',
      right: true,
      render: (v: number) => (
        <span
          className={`font-mono font-medium text-[11px] ${isPositive(v) ? 'text-[var(--gain)]' : 'text-[var(--loss)]'}`}
        >
          {fmtNGN(v)}
        </span>
      ),
      sortValue: (r: StockRow) => r.UnrealizedPL ?? 0,
    },
    {
      key: 'ReturnPct',
      label: 'Return',
      right: true,
      render: (v: number, row: StockRow) => (
        <div className="flex flex-col items-end gap-0.5">
          <span
            className={`font-mono font-semibold text-[12px] ${isPositive(v) ? 'text-[var(--gain)]' : 'text-[var(--loss)]'}`}
          >
            {fmtPct(v)}
          </span>
          {row.RealReturnPct != null && (
            <span
              className={`font-mono text-[9px] ${isPositive(row.RealReturnPct) ? 'text-[var(--gain)]' : 'text-[var(--loss)]'} opacity-70`}
              title="Inflation-adjusted (real) return"
            >
              {fmtPct(row.RealReturnPct)} real
            </span>
          )}
        </div>
      ),
      sortValue: (r: StockRow) => r.ReturnPct ?? 0,
    },
    {
      key: 'UsdEquity',
      label: 'USD Val',
      right: true,
      render: (v: number, row: StockRow) => (
        <div className="flex flex-col items-end gap-0.5">
          <span className="font-mono text-[11px] text-[var(--ink-2)]">{fmtUSD(v)}</span>
          {row.UsdReturn != null && (
            <span
              className={`font-mono text-[9px] ${isPositive(row.UsdReturn) ? 'text-[var(--gain)]' : 'text-[var(--loss)]'} opacity-70`}
            >
              {fmtUSD(row.UsdReturn)}
            </span>
          )}
        </div>
      ),
      sortValue: (r: StockRow) => r.UsdEquity ?? 0,
    },
    {
      key: 'signal',
      label: 'Signal',
      render: (_: unknown, row: StockRow) => {
        const td = tickerMap[row.Ticker];
        if (!td) return <span className="text-[var(--ink-4)] text-[10px]">…</span>;
        const price = td.price?.price ?? row.LivePrice ?? null;
        const sig = computeSignal(td.overview, td.performance, price, row, null);
        if (!sig) return <span className="text-[var(--ink-4)] text-[10px]">—</span>;
        const _n = (v: string | number | null | undefined) => {
          if (v == null) return null;
          const f = parseFloat(String(v).replace(/[^0-9.-]/g, ''));
          return isNaN(f) ? null : f;
        };
        const eps = _n(td.overview?.eps),
          bv = _n(td.overview?.book_value);
        const graham = eps && bv && eps > 0 && bv > 0 ? Math.sqrt(22.5 * eps * bv) : null;
        const tgt = computeTargets(
          price,
          graham,
          _n(td.performance?.ma_50),
          _n(td.performance?.ma_200),
          _n(td.performance?.week_52_high),
          _n(td.performance?.week_52_low),
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
            {zonePrice && (
              <span className="font-mono text-[9px] text-[var(--ink-4)]">{zonePrice}</span>
            )}
          </div>
        );
      },
    },
    {
      key: 'sparkline',
      label: '90d',
      render: (_: unknown, row: StockRow) => <Sparkline ticker={row.Ticker} />,
    },
  ];

  return (
    <div className="space-y-5">
      {/* KPI strip — portfolio summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {isFirstLoad ? (
          [...Array(6)].map((_, i) => <ChartSkeleton key={i} height={88} />)
        ) : (
          <>
            <KPICard
              label="Total Equity"
              value={fmtNGN(k?.equity)}
              sub={`${k?.positions ?? '—'} positions`}
              accent="neutral"
              delay={0}
            />
            <KPICard label="Total Cost" value={fmtNGN(k?.cost)} accent="neutral" delay={50} />
            <KPICard
              label="Unrealized G/L"
              value={fmtNGN(k?.gain)}
              accent={isPositive(k?.gain) ? 'gain' : 'loss'}
              delay={100}
            />
            <KPICard
              label="Return"
              value={fmtPct(k?.return_pct)}
              accent={isPositive(k?.return_pct) ? 'gain' : 'loss'}
              delay={150}
            />
            <KPICard
              label="Realized P/L"
              value={fmtNGN(k?.realized_pl)}
              accent={isPositive(k?.realized_pl) ? 'gain' : 'loss'}
              delay={200}
            />
            <KPICard
              label="Cash Balance"
              value={fmtNGN(k?.cash_balance_ngn ?? 0)}
              accent="teal"
              delay={250}
            />
          </>
        )}
      </div>

      {/* KPI strip — weighted fundamentals */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {isFirstLoad ? (
          [...Array(5)].map((_, i) => <ChartSkeleton key={i} height={88} />)
        ) : (
          <>
            <KPICard
              label="Wtd P/E"
              value={wPE != null ? wPE.toFixed(1) : '—'}
              sub="weighted avg"
              accent="neutral"
              delay={0}
            />
            <KPICard
              label="Wtd ROE"
              value={wROE != null ? wROE.toFixed(1) + '%' : '—'}
              sub="weighted avg"
              accent={wROE != null && wROE > 0 ? 'gain' : 'neutral'}
              delay={50}
            />
            <KPICard
              label="Wtd Beta"
              value={wBeta != null ? wBeta.toFixed(2) : '—'}
              sub="market sensitivity"
              accent={wBeta != null && wBeta < 1 ? 'gain' : 'neutral'}
              delay={100}
            />
            <KPICard
              label="Wtd Div Yield"
              value={wDivY != null ? wDivY.toFixed(2) + '%' : '—'}
              sub="weighted avg"
              accent="neutral"
              delay={150}
            />
            <KPICard
              label="Div Payout"
              value={annualDivIncome != null ? fmtNGN(annualDivIncome) : '—'}
              sub="from announced divs"
              accent="accent"
              delay={200}
            />
          </>
        )}
      </div>

      {/* Currency risk gauge */}
      {!isFirstLoad && ck?.ngx_pct != null && (
        <div className="bg-white rounded-2xl border border-[var(--border)] px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--ink-4)]">Currency Exposure</p>
              <p className="text-[11px] text-[var(--ink-3)] mt-0.5">
                NGX USD return:{' '}
                <span className={`font-semibold font-mono ${isPositive(ck.ngx_usd_return_pct) ? 'text-[var(--gain)]' : 'text-[var(--loss)]'}`}>
                  {fmtPct(ck.ngx_usd_return_pct)}
                </span>
                {(ck.ngx_pct ?? 0) > 80 && (
                  <span className="ml-2 text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                    ⚠ &gt;80% single currency
                  </span>
                )}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[10px] text-[var(--ink-4)]">NGN {fmtPct(ck.ngx_pct, false)} · USD {fmtPct(ck.us_pct, false)}</p>
            </div>
          </div>
          {/* Bar */}
          <div className="h-2 rounded-full bg-[var(--border)] overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--accent)] transition-all duration-500"
              style={{ width: `${Math.min(ck.ngx_pct ?? 0, 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[9px] text-[var(--ink-4)]">NGN (NGX)</span>
            <span className="text-[9px] text-[var(--ink-4)]">USD (US)</span>
          </div>
        </div>
      )}

      {/* Price banner */}
      {meta && (
        <PriceBanner
          live={meta.ngx_prices_live}
          total={meta.ngx_prices_total}
          source={meta.ngx_price_source}
          ageSeconds={meta.ngx_price_age}
        />
      )}

      {/* Equity + Sector */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard title="Portfolio Equity" subtitle="by stock" loading={isFirstLoad} height={300}>
          <PlotlyChart
            data={[equityBar]}
            layout={plotlyLayout({ margin: { t: 8, b: 56, l: 60, r: 8 } })}
            height={300}
          />
        </ChartCard>
        <ChartCard title="Sector Allocation" loading={isFirstLoad} height={300}>
          <PlotlyChart
            data={[sectorDonut]}
            layout={plotlyLayout({
              margin: { t: 8, b: 8, l: 8, r: 8 },
              showlegend: true,
              legend: { orientation: 'v', x: 1.02, xanchor: 'left', y: 0.5 },
            })}
            height={300}
          />
        </ChartCard>
      </div>

      {/* Return + Sector gain */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard
          title="Unrealized Return"
          subtitle="per stock"
          loading={isFirstLoad}
          height={320}
        >
          <PlotlyChart
            data={[returnBar]}
            layout={plotlyLayout({
              margin: { t: 8, b: 56, l: 60, r: 8 },
              yaxis: { ticksuffix: '%', zerolinecolor: COLORS['border-strong'] },
            })}
            height={320}
          />
        </ChartCard>
        <ChartCard title="Sector Gain %" loading={isFirstLoad} height={320}>
          <PlotlyChart
            data={[sectorGainBar]}
            layout={plotlyLayout({
              margin: { t: 8, b: 80, l: 60, r: 8 },
              yaxis: { ticksuffix: '%', zerolinecolor: COLORS['border-strong'] },
            })}
            height={320}
          />
        </ChartCard>
      </div>

      {/* Treemap */}
      <ChartCard
        title="Portfolio Treemap"
        subtitle="size = equity · colour = return"
        loading={isFirstLoad}
        height={300}
      >
        <PlotlyChart
          data={[treemap]}
          layout={plotlyLayout({ margin: { t: 8, b: 8, l: 8, r: 8 } })}
          height={300}
        />
      </ChartCard>

      {/* Today's movers callout */}
      {!isFirstLoad && topMover && bottomMover && topMover.Ticker !== bottomMover.Ticker && (
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Today's Best", row: topMover, sign: 1 },
            { label: "Today's Worst", row: bottomMover, sign: -1 },
          ].map(({ label, row, sign }) => {
            const pct = row.LiveChangePct ?? 0;
            const col = sign > 0 ? 'var(--gain)' : 'var(--loss)';
            const bg = sign > 0 ? 'var(--gain-light)' : 'var(--loss-light)';
            return (
              <div
                key={label}
                className="card px-4 py-3 flex items-center gap-3"
                style={{ background: bg }}
              >
                <div className="flex-1 min-w-0">
                  <p
                    className="text-[9px] font-bold uppercase tracking-widest"
                    style={{ color: col }}
                  >
                    {label}
                  </p>
                  <p className="font-mono font-bold text-[14px] text-[var(--ink)] leading-tight mt-0.5">
                    {row.Ticker}
                  </p>
                  <p className="text-[10px] text-[var(--ink-3)] truncate">{row.Stock}</p>
                </div>
                <span className="font-mono font-bold text-[18px] shrink-0" style={{ color: col }}>
                  {fmtPct2(pct)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Holdings table */}
      <ChartCard title="Holdings Detail" loading={isFirstLoad} height={420}>
        <StockTable rows={active} cols={cols} />
      </ChartCard>
    </div>
  );
}
