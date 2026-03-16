'use client';

import { useState } from 'react';
import { usePortfolioHistory } from '@/hooks/useHistory';
import { usePortfolio }        from '@/context/PortfolioContext';
import KPICard                 from '@/components/ui/KPICard';
import ChartCard               from '@/components/ui/ChartCard';
import { ChartSkeleton }       from '@/components/ui/Feedback';
import PlotlyChart             from '@/components/charts/PlotlyChart';
import { plotlyLayout, COLORS, sectorColor } from '@/lib/theme';
import { fmtUSD, fmtNGN, fmtPct, isPositive } from '@/lib/formatters';
import type { PortfolioPoint } from '@/services/api';
import { IconChartHistory } from '@/components/ui/icons';

const DAY_OPTIONS = [
  { label: '7d',  value: 7   },
  { label: '30d', value: 30  },
  { label: '90d', value: 90  },
  { label: '1y',  value: 365 },
] as const;

function fmt(ts: string) {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// ── Mini stat derived from history ───────────────────────────────────────────
function periodReturn(points: PortfolioPoint[], key: keyof PortfolioPoint) {
  if (points.length < 2) return null;
  const first = points[0][key] as number;
  const last  = points[points.length - 1][key] as number;
  if (!first) return null;
  return ((last - first) / first) * 100;
}

export default function HistoryPage() {
  const [days, setDays]   = useState(90);
  const { data: live }    = usePortfolio();
  const { data, loading, error } = usePortfolioHistory(days);

  const points  = data?.points ?? [];
  const hasData = points.length >= 2;

  // ── Derived period stats ──────────────────────────────────────────────────
  const totalRet  = periodReturn(points, 'total_usd');
  const ngxRet    = periodReturn(points, 'ngx_usd');
  const usRet     = periodReturn(points, 'us_equity_usd');
  const first     = points[0];
  const last      = points[points.length - 1];
  const totalDiff = hasData ? last.total_usd - first.total_usd : null;

  // ── Total USD value line ──────────────────────────────────────────────────
  const totalLine = {
    type: 'scatter', mode: 'lines', name: 'Total (USD)',
    x: points.map(p => fmt(p.ts)),
    y: points.map(p => p.total_usd),
    line: { color: COLORS.accent, width: 2.5 },
    fill: 'tozeroy',
    fillcolor: 'rgba(26,86,219,0.06)',
    hovertemplate: '<b>%{x}</b><br>$%{y:,.2f}<extra>Total</extra>',
  };

  const ngxLine = {
    type: 'scatter', mode: 'lines', name: 'NGX (USD)',
    x: points.map(p => fmt(p.ts)),
    y: points.map(p => p.ngx_usd),
    line: { color: COLORS.teal, width: 1.75, dash: 'dot' },
    hovertemplate: '<b>%{x}</b><br>$%{y:,.2f}<extra>NGX</extra>',
  };

  const usLine = {
    type: 'scatter', mode: 'lines', name: 'US',
    x: points.map(p => fmt(p.ts)),
    y: points.map(p => p.us_equity_usd),
    line: { color: COLORS.purple, width: 1.75, dash: 'dot' },
    hovertemplate: '<b>%{x}</b><br>$%{y:,.2f}<extra>US</extra>',
  };

  // ── NGX in ₦ ─────────────────────────────────────────────────────────────
  const ngxNgnLine = {
    type: 'scatter', mode: 'lines', name: 'NGX Equity (₦)',
    x: points.map(p => fmt(p.ts)),
    y: points.map(p => p.ngx_equity_ngn),
    line: { color: COLORS.accent, width: 2.5 },
    fill: 'tozeroy',
    fillcolor: 'rgba(26,86,219,0.06)',
    hovertemplate: '<b>%{x}</b><br>₦%{y:,.0f}<extra>NGX ₦</extra>',
  };
  const ngxCostLine = {
    type: 'scatter', mode: 'lines', name: 'NGX Cost (₦)',
    x: points.map(p => fmt(p.ts)),
    y: points.map(p => p.ngx_cost_ngn),
    line: { color: COLORS['border-strong'], width: 1.5, dash: 'dash' },
    hovertemplate: '<b>%{x}</b><br>₦%{y:,.0f}<extra>Cost</extra>',
  };

  // ── US equity + cost ──────────────────────────────────────────────────────
  const usEquityLine = {
    type: 'scatter', mode: 'lines', name: 'US Equity ($)',
    x: points.map(p => fmt(p.ts)),
    y: points.map(p => p.us_equity_usd),
    line: { color: COLORS.teal, width: 2.5 },
    fill: 'tozeroy',
    fillcolor: 'rgba(14,116,144,0.06)',
    hovertemplate: '<b>%{x}</b><br>$%{y:,.2f}<extra>US Equity</extra>',
  };
  const usCostLine = {
    type: 'scatter', mode: 'lines', name: 'US Cost ($)',
    x: points.map(p => fmt(p.ts)),
    y: points.map(p => p.us_cost_usd),
    line: { color: COLORS['border-strong'], width: 1.5, dash: 'dash' },
    hovertemplate: '<b>%{x}</b><br>$%{y:,.2f}<extra>Cost</extra>',
  };

  // ── FX rate ───────────────────────────────────────────────────────────────
  const fxLine = {
    type: 'scatter', mode: 'lines', name: 'USD/NGN',
    x: points.map(p => fmt(p.ts)),
    y: points.map(p => p.usdngn),
    line: { color: COLORS.warn, width: 2 },
    hovertemplate: '<b>%{x}</b><br>₦%{y:,.2f}<extra>USD/NGN</extra>',
  };

  // ── NGX unrealized gain ₦ ────────────────────────────────────────────────
  const gainBar = {
    type: 'bar', name: 'NGX Unrealized G/L (₦)',
    x: points.map(p => fmt(p.ts)),
    y: points.map(p => p.ngx_gain_ngn),
    marker: {
      color: points.map(p => p.ngx_gain_ngn >= 0 ? COLORS.gain : COLORS.loss),
      opacity: 0.8,
    },
    hovertemplate: '<b>%{x}</b><br>₦%{y:,.0f}<extra></extra>',
  };

  const baseLayout = plotlyLayout({
    margin: { t: 12, b: 48, l: 60, r: 16 },
    xaxis: { showgrid: false },
  });

  return (
    <div className="space-y-5">

      {/* ── Day selector ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[15px] font-semibold text-[var(--ink)]">Portfolio History</h1>
          <p className="text-[11px] text-[var(--ink-4)] mt-0.5">
            {data ? `${data.count} snapshots over ${data.days} days` : 'Loading…'}
          </p>
        </div>
        <div className="flex gap-1.5">
          {DAY_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setDays(opt.value)}
              className={[
                'px-3 py-1.5 rounded-md text-[11px] font-semibold transition-colors duration-150',
                days === opt.value
                  ? 'bg-[var(--accent)] text-white'
                  : 'bg-white border border-[var(--border)] text-[var(--ink-3)] hover:text-[var(--ink)] hover:border-[var(--border-strong)]',
              ].join(' ')}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── KPI strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {loading
          ? [...Array(4)].map((_, i) => <ChartSkeleton key={i} height={88} />)
          : <>
            <KPICard
              label="Current Value"
              value={fmtUSD(last?.total_usd)}
              sub={`${data?.days}d snapshot`}
              accent="neutral"
            />
            <KPICard
              label={`${days}d Change`}
              value={totalDiff != null ? fmtUSD(totalDiff) : '—'}
              sub={totalRet != null ? fmtPct(totalRet) : undefined}
              accent={isPositive(totalDiff) ? 'gain' : 'loss'}
            />
            <KPICard
              label="NGX Return"
              value={ngxRet != null ? fmtPct(ngxRet) : '—'}
              sub={`${days}d period`}
              accent={isPositive(ngxRet) ? 'gain' : 'loss'}
            />
            <KPICard
              label="US Return"
              value={usRet != null ? fmtPct(usRet) : '—'}
              sub={`${days}d period`}
              accent={isPositive(usRet) ? 'gain' : 'loss'}
            />
          </>
        }
      </div>

      {/* ── No data state ── */}
      {!loading && !hasData && (
        <div className="card px-6 py-12 flex flex-col items-center gap-3 text-center">
          <IconChartHistory width={32} height={32} style={{ stroke: 'var(--ink-4)', strokeWidth: 1.5 }} />
          <p className="text-[13px] font-medium text-[var(--ink-2)]">No snapshot data yet</p>
          <p className="text-[11px] text-[var(--ink-4)] max-w-[320px]">
            Snapshots are written each time <code className="font-mono bg-[var(--canvas)] px-1 rounded">/api/data</code> is
            called. Refresh the dashboard a few times and come back — data will appear here automatically.
          </p>
        </div>
      )}

      {/* ── Combined value over time ── */}
      {(loading || hasData) && (
        <ChartCard
          title="Portfolio Value Over Time"
          subtitle="total · NGX (USD) · US"
          loading={loading}
          height={340}
        >
          <PlotlyChart
            data={[totalLine, ngxLine, usLine]}
            layout={{
              ...baseLayout,
              yaxis: { ...baseLayout.yaxis, tickprefix: '$' },
              legend: { orientation: 'h', y: -0.18 },
            }}
            height={340}
          />
        </ChartCard>
      )}

      {/* ── NGX ₦ + US $ side by side ── */}
      {(loading || hasData) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ChartCard title="NGX Equity vs Cost" subtitle="in ₦" loading={loading} height={280}>
            <PlotlyChart
              data={[ngxNgnLine, ngxCostLine]}
              layout={{
                ...baseLayout,
                yaxis: { ...baseLayout.yaxis, tickprefix: '₦' },
                legend: { orientation: 'h', y: -0.22 },
              }}
              height={280}
            />
          </ChartCard>
          <ChartCard title="US Equity vs Cost" subtitle="in $" loading={loading} height={280}>
            <PlotlyChart
              data={[usEquityLine, usCostLine]}
              layout={{
                ...baseLayout,
                yaxis: { ...baseLayout.yaxis, tickprefix: '$' },
                legend: { orientation: 'h', y: -0.22 },
              }}
              height={280}
            />
          </ChartCard>
        </div>
      )}

      {/* ── NGX Unrealized G/L + FX rate ── */}
      {(loading || hasData) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ChartCard title="NGX Unrealized G/L Over Time" subtitle="in ₦" loading={loading} height={260}>
            <PlotlyChart
              data={[gainBar]}
              layout={{
                ...baseLayout,
                yaxis: { ...baseLayout.yaxis, tickprefix: '₦', zerolinewidth: 1.5 },
              }}
              height={260}
            />
          </ChartCard>
          <ChartCard title="USD/NGN Rate Over Time" loading={loading} height={260}>
            <PlotlyChart
              data={[fxLine]}
              layout={{
                ...baseLayout,
                yaxis: { ...baseLayout.yaxis, tickprefix: '₦' },
              }}
              height={260}
            />
          </ChartCard>
        </div>
      )}

    </div>
  );
}