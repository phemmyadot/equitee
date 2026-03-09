'use client';

import { usePortfolio } from '@/lib/PortfolioContext';
import KPICard           from '@/components/ui/KPICard';
import ChartCard         from '@/components/ui/ChartCard';
import { ChartSkeleton } from '@/components/ui/Feedback';
import PlotlyChart       from '@/components/charts/PlotlyChart';
import { plotlyLayout, COLORS, sectorColor } from '@/lib/theme';
import { fmtNGN, fmtPct, isPositive } from '@/lib/formatters';

export default function NGXAdvancedPage() {
  const { data, loading } = usePortfolio();
  const isFirstLoad = loading && !data;

  if (!data && !loading) return null;

  const active     = (data?.ngx_stocks ?? []).filter(s => s.CurrentEquity != null);
  const k          = data?.ngx_kpis;
  const wf         = data?.waterfall;
  const meta       = data?.meta;
  const totalEquity = k?.equity || 1;

  // ── Cost Basis stacked bar ─────────────────────────────────────────────────
  const costTrace = {
    name: 'Cost', type: 'bar',
    x: active.map(s => s.Ticker),
    y: active.map(s => s.RemainingCost ?? 0),
    marker: { color: COLORS.dim, opacity: 0.9 },
    hovertemplate: '<b>%{x}</b> Cost<br>₦%{y:,.0f}<extra></extra>',
  };
  const gainTrace = {
    name: 'Gain', type: 'bar',
    x: active.map(s => s.Ticker),
    y: active.map(s => Math.max(0, s.UnrealizedPL ?? 0)),
    marker: { color: COLORS.green, opacity: 0.75 },
    hovertemplate: '<b>%{x}</b> Gain<br>₦%{y:,.0f}<extra></extra>',
  };
  const lossTrace = {
    name: 'Loss', type: 'bar',
    x: active.map(s => s.Ticker),
    y: active.map(s => Math.min(0, s.UnrealizedPL ?? 0)),
    marker: { color: COLORS.red, opacity: 0.75 },
    hovertemplate: '<b>%{x}</b> Loss<br>₦%{y:,.0f}<extra></extra>',
  };

  // ── Waterfall ─────────────────────────────────────────────────────────────
  const waterfallTrace = wf ? {
    type: 'waterfall', orientation: 'v',
    measure: ['absolute', 'relative', 'relative', 'total'],
    x: ['Total Cost', 'Realized P/L', 'Unrealized G/L', 'Current Equity'],
    y: [wf.total_cost, wf.realized_pl, wf.unrealized_pl, wf.current_equity],
    connector: { line: { color: COLORS.border, width: 1.5 } },
    increasing: { marker: { color: COLORS.green } },
    decreasing: { marker: { color: COLORS.red   } },
    totals:     { marker: { color: COLORS.gold  } },
    texttemplate: '%{y:,.0f}', textposition: 'outside',
    textfont: { size: 10 },
    hovertemplate: '<b>%{x}</b><br>₦%{y:,.0f}<extra></extra>',
  } : null;

  // ── HHI Gauge ─────────────────────────────────────────────────────────────
  const hhi      = meta?.hhi ?? 0;
  const hhiColor = hhi < 1000 ? COLORS.green : hhi < 1800 ? COLORS.gold : COLORS.red;
  const hhiGauge = {
    type: 'indicator', mode: 'gauge+number+delta',
    value: hhi,
    title: { text: `${meta?.hhi_label ?? ''} CONCENTRATION`, font: { size: 11, color: COLORS.muted } },
    number: { font: { size: 32, color: hhiColor, family: "'IBM Plex Mono', monospace" } },
    gauge: {
      axis: { range: [0, 3000], tickvals: [0,1000,1800,3000], ticktext: ['0','1000','1800','3000'], tickfont: { size: 9 } },
      bar: { color: hhiColor, thickness: 0.25 },
      bgcolor: COLORS.dim, bordercolor: COLORS.border,
      steps: [
        { range: [0,    1000], color: 'rgba(0,232,122,0.08)' },
        { range: [1000, 1800], color: 'rgba(245,197,24,0.08)' },
        { range: [1800, 3000], color: 'rgba(255,61,90,0.08)'  },
      ],
      threshold: { line: { color: hhiColor, width: 2 }, thickness: 0.7, value: hhi },
    },
  };

  // ── Risk–Return Scatter ────────────────────────────────────────────────────
  const mean = active.length
    ? active.reduce((a, b) => a + (b.ReturnPct ?? 0), 0) / active.length
    : 0;

  const scatter = {
    type: 'scatter', mode: 'markers+text',
    x: active.map(s => Math.abs((s.ReturnPct ?? 0) - mean)),
    y: active.map(s => s.ReturnPct ?? 0),
    text: active.map(s => s.Ticker),
    textposition: 'top center',
    textfont: { size: 9, color: COLORS.muted },
    marker: {
      size: active.map(s => Math.max(8, Math.sqrt((s.CurrentEquity ?? 0) / totalEquity) * 80)),
      color: active.map(s => sectorColor(s.Sector)),
      opacity: 0.8,
      line: { color: COLORS.border, width: 1 },
    },
    hovertemplate: '<b>%{text}</b><br>Return: %{y:.1f}%<br>Risk proxy: %{x:.1f}<extra></extra>',
  };

  return (
    <div className="space-y-5">

      {/* KPIs */}
      <div className="flex gap-3 flex-wrap">
        {isFirstLoad ? [...Array(5)].map((_, i) => <ChartSkeleton key={i} height={88} />) : <>
          <KPICard label="Total Equity"   value={fmtNGN(k?.equity)}      accent="gold"                                       delay={0}   />
          <KPICard label="Unrealized G/L" value={fmtNGN(k?.gain)}        accent={isPositive(k?.gain) ? 'green' : 'red'}      delay={50}  />
          <KPICard label="Realized P/L"   value={fmtNGN(k?.realized_pl)} accent={isPositive(k?.realized_pl) ? 'green':'red'} delay={100} />
          <KPICard label="Return"         value={fmtPct(k?.return_pct)}  accent={isPositive(k?.return_pct) ? 'green':'red'}  delay={150} />
          <KPICard
            label="HHI" value={`${hhi.toFixed(0)}`}
            sub={`${meta?.hhi_label ?? ''} concentration`}
            accent={hhi < 1000 ? 'green' : hhi < 1800 ? 'gold' : 'red'}
            delay={200}
          />
        </>}
      </div>

      {/* Cost basis */}
      <ChartCard title="Cost Basis vs Current Value" subtitle="grey = cost · green = gain · red = loss" loading={isFirstLoad} height={400}>
        <PlotlyChart
          data={[costTrace, gainTrace, lossTrace]}
          layout={plotlyLayout({ barmode: 'stack', margin: { t:10,b:60,l:72,r:8 } })}
          height={400}
        />
      </ChartCard>

      {/* Waterfall + HHI */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard title="Portfolio Value Waterfall" loading={isFirstLoad} height={380}>
          {waterfallTrace && (
            <PlotlyChart
              data={[waterfallTrace]}
              layout={plotlyLayout({ margin: { t:40,b:60,l:72,r:8 } })}
              height={380}
            />
          )}
        </ChartCard>
        <ChartCard title="Concentration Risk" subtitle="HHI gauge" loading={isFirstLoad} height={380}>
          <PlotlyChart
            data={[hhiGauge]}
            layout={plotlyLayout({ margin: { t:40,b:20,l:20,r:20 } })}
            height={380}
          />
        </ChartCard>
      </div>

      {/* Scatter */}
      <ChartCard title="Risk-Return Scatter" subtitle="size = equity weight · colour = sector" loading={isFirstLoad} height={420}>
        <PlotlyChart
          data={[scatter]}
          layout={plotlyLayout({
            margin: { t:20,b:60,l:60,r:20 },
            xaxis: { title: { text: 'Return deviation from mean (risk proxy)', font: { size: 10 } } },
            yaxis: { title: { text: 'Return %', font: { size: 10 } }, ticksuffix: '%' },
          })}
          height={420}
        />
      </ChartCard>

    </div>
  );
}