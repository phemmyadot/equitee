'use client';

import { usePortfolio } from '@/context/PortfolioContext';
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

  const costTrace = {
    name: 'Cost', type: 'bar',
    x: active.map(s => s.Ticker),
    y: active.map(s => s.RemainingCost ?? 0),
    marker: { color: COLORS['border-strong'], opacity: 1 },
    hovertemplate: '<b>%{x}</b> Cost<br>₦%{y:,.0f}<extra></extra>',
  };
  const gainTrace = {
    name: 'Gain', type: 'bar',
    x: active.map(s => s.Ticker),
    y: active.map(s => Math.max(0, s.UnrealizedPL ?? 0)),
    marker: { color: COLORS.gain, opacity: 0.8 },
    hovertemplate: '<b>%{x}</b> Gain<br>₦%{y:,.0f}<extra></extra>',
  };
  const lossTrace = {
    name: 'Loss', type: 'bar',
    x: active.map(s => s.Ticker),
    y: active.map(s => Math.min(0, s.UnrealizedPL ?? 0)),
    marker: { color: COLORS.loss, opacity: 0.8 },
    hovertemplate: '<b>%{x}</b> Loss<br>₦%{y:,.0f}<extra></extra>',
  };

  const waterfallTrace = wf ? {
    type: 'waterfall', orientation: 'v',
    measure: ['absolute', 'relative', 'relative', 'total'],
    x: ['Total Cost', 'Realized P/L', 'Unrealized G/L', 'Current Equity'],
    y: [wf.total_cost, wf.realized_pl, wf.unrealized_pl, wf.current_equity],
    connector: { line: { color: COLORS.border, width: 1.5 } },
    increasing: { marker: { color: COLORS.gain } },
    decreasing: { marker: { color: COLORS.loss } },
    totals:     { marker: { color: COLORS.accent } },
    texttemplate: '%{y:,.0f}', textposition: 'outside',
    textfont: { size: 10, color: COLORS.ink2 },
    hovertemplate: '<b>%{x}</b><br>₦%{y:,.0f}<extra></extra>',
  } : null;

  const hhi      = meta?.hhi ?? 0;
  const hhiColor = hhi < 1000 ? COLORS.gain : hhi < 1800 ? COLORS.warn : COLORS.loss;
  const hhiGauge = {
    type: 'indicator', mode: 'gauge+number',
    value: hhi,
    title: { text: `${meta?.hhi_label ?? ''} Concentration`, font: { size: 11, color: COLORS.ink3 } },
    number: { font: { size: 36, color: hhiColor, family: "'JetBrains Mono', monospace" }, valueformat: '.0f' },
    gauge: {
      axis: {
        range: [0, 3000],
        tickvals: [0, 1000, 1800, 3000],
        ticktext: ['0', '1000', '1800', '3000'],
        tickfont: { size: 9, color: COLORS.ink4 },
        linecolor: COLORS.border,
      },
      bar: { color: hhiColor, thickness: 0.22 },
      bgcolor: COLORS.canvas,
      bordercolor: COLORS.border,
      borderwidth: 1,
      steps: [
        { range: [0,    1000], color: COLORS.gainLight  },
        { range: [1000, 1800], color: '#FEF3CD' },
        { range: [1800, 3000], color: COLORS.lossLight  },
      ],
      threshold: { line: { color: hhiColor, width: 2 }, thickness: 0.7, value: hhi },
    },
  };

  const mean = active.length
    ? active.reduce((a, b) => a + (b.ReturnPct ?? 0), 0) / active.length
    : 0;

  const scatter = {
    type: 'scatter', mode: 'markers+text',
    x: active.map(s => Math.abs((s.ReturnPct ?? 0) - mean)),
    y: active.map(s => s.ReturnPct ?? 0),
    text: active.map(s => s.Ticker),
    textposition: 'top center',
    textfont: { size: 9, color: COLORS.ink3 },
    marker: {
      size: active.map(s => Math.max(10, Math.sqrt((s.CurrentEquity ?? 0) / totalEquity) * 80)),
      color: active.map(s => sectorColor(s.Sector)),
      opacity: 0.75,
      line: { color: '#fff', width: 1.5 },
    },
    hovertemplate: '<b>%{text}</b><br>Return: %{y:.1f}%<br>Risk: %{x:.1f}<extra></extra>',
  };

  return (
    <div className="space-y-5">

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {isFirstLoad ? [...Array(5)].map((_, i) => <ChartSkeleton key={i} height={88} />) : <>
          <KPICard label="Total Equity"   value={fmtNGN(k?.equity)}      accent="neutral"                               delay={0}   />
          <KPICard label="Unrealized G/L" value={fmtNGN(k?.gain)}        accent={isPositive(k?.gain) ? 'gain':'loss'}   delay={50}  />
          <KPICard label="Realized P/L"   value={fmtNGN(k?.realized_pl)} accent={isPositive(k?.realized_pl) ? 'gain':'loss'} delay={100} />
          <KPICard label="Return"         value={fmtPct(k?.return_pct)}  accent={isPositive(k?.return_pct) ? 'gain':'loss'} delay={150} />
          <KPICard
            label="HHI Index" value={hhi.toFixed(0)}
            sub={`${meta?.hhi_label ?? ''} concentration`}
            accent={hhi < 1000 ? 'gain' : hhi < 1800 ? 'warn' : 'loss'}
            delay={200}
          />
        </>}
      </div>

      <ChartCard title="Cost Basis vs Current Value" subtitle="grey = cost · green = gain · red = loss" loading={isFirstLoad} height={380}>
        <PlotlyChart
          data={[costTrace, gainTrace, lossTrace]}
          layout={plotlyLayout({ barmode: 'stack', margin: { t:8,b:56,l:72,r:8 } })}
          height={380}
        />
      </ChartCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard title="Portfolio Value Waterfall" loading={isFirstLoad} height={360}>
          {waterfallTrace && (
            <PlotlyChart
              data={[waterfallTrace]}
              layout={plotlyLayout({ margin: { t:32,b:56,l:72,r:8 } })}
              height={360}
            />
          )}
        </ChartCard>
        <ChartCard title="Concentration Risk" subtitle="Herfindahl–Hirschman Index" loading={isFirstLoad} height={360}>
          <PlotlyChart
            data={[hhiGauge]}
            layout={plotlyLayout({ margin: { t:32,b:16,l:20,r:20 } })}
            height={360}
          />
        </ChartCard>
      </div>

      <ChartCard title="Risk–Return" subtitle="size = equity weight · colour = sector" loading={isFirstLoad} height={400}>
        <PlotlyChart
          data={[scatter]}
          layout={plotlyLayout({
            margin: { t:16,b:56,l:60,r:16 },
            xaxis: { title: { text: 'Return deviation from mean', font: { size: 10 } }, tickfont: { size: 9 } },
            yaxis: { title: { text: 'Return %', font: { size: 10 } }, ticksuffix: '%' },
          })}
          height={400}
        />
      </ChartCard>

    </div>
  );
}