'use client';

import { useState, useEffect } from 'react';
import { usePortfolio } from '@/context/PortfolioContext';
import KPICard           from '@/components/ui/KPICard';
import ChartCard         from '@/components/ui/ChartCard';
import { ChartSkeleton } from '@/components/ui/Feedback';
import PlotlyChart       from '@/components/charts/PlotlyChart';
import { plotlyLayout, COLORS, sectorColor } from '@/lib/theme';
import { fmtNGN, fmtPct, isPositive } from '@/lib/formatters';
import { fetchNGXTickerData, fetchCorrelation, fetchAnalytics } from '@/services/api';
import type { TickerData, CorrelationData, AnalyticsData } from '@/services/api';

export default function NGXAdvancedPage() {
  const { data, loading } = usePortfolio();
  const isFirstLoad = loading && !data;

  const [tickerMap,   setTickerMap]   = useState<Record<string, TickerData>>({});
  const [correlation, setCorrelation] = useState<CorrelationData | null>(null);
  const [analytics,   setAnalytics]   = useState<AnalyticsData | null>(null);

  useEffect(() => {
    const active = (data?.ngx_stocks ?? []).filter(s => s.CurrentEquity != null);
    if (!active.length) return;
    Promise.allSettled(active.map(s => fetchNGXTickerData(s.Ticker)))
      .then(results => {
        const map: Record<string, TickerData> = {};
        results.forEach((r, i) => {
          if (r.status === 'fulfilled') map[active[i].Ticker] = r.value;
        });
        setTickerMap(map);
      });
  }, [data?.ngx_stocks?.length]);

  useEffect(() => {
    fetchCorrelation(90).then(setCorrelation).catch(() => {});
    fetchAnalytics(180).then(setAnalytics).catch(() => {});
  }, []);

  if (!data && !loading) return null;

  const active     = (data?.ngx_stocks ?? []).filter(s => s.CurrentEquity != null);
  const k          = data?.ngx_kpis;
  const wf         = data?.waterfall;
  const meta       = data?.meta;
  const totalEquity = (k?.equity || 1);

  // ── Weighted fundamentals ────────────────────────────────────────────────────
  const _n = (v: string | number | null | undefined) => {
    if (v == null) return null;
    const f = parseFloat(String(v).replace(/[^0-9.-]/g, ''));
    return isNaN(f) ? null : f;
  };
  const weightedAvg = (field: (td: TickerData) => number | null) => {
    let wsum = 0, wt = 0;
    active.forEach(s => {
      const td = tickerMap[s.Ticker];
      if (!td) return;
      const val = field(td);
      if (val == null || !isFinite(val)) return;
      const w = (s.CurrentEquity ?? 0) / totalEquity;
      wsum += val * w;
      wt   += w;
    });
    return wt > 0.01 ? wsum / wt : null;
  };
  const wPE   = weightedAvg(td => _n(td.overview?.pe_ratio));
  const wROE  = weightedAvg(td => _n(td.overview?.roe));
  const wBeta = weightedAvg(td => _n(td.performance?.beta));
  const wDivY = weightedAvg(td => _n(td.overview?.dividend_yield));
  const annualDivIncome = Object.keys(tickerMap).length > 0
    ? active.reduce((sum, s) => {
        const dy = _n(tickerMap[s.Ticker]?.overview?.dividend_yield);
        return sum + (dy != null ? (s.CurrentEquity ?? 0) * dy / 100 : 0);
      }, 0)
    : null;

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

  const ngx_sectors = data?.ngx_sectors ?? [];
  const sectorTotalEquity = ngx_sectors.reduce((s, r) => s + (r.Equity ?? 0), 0) || 1;
  const sectorBubble = {
    type: 'scatter', mode: 'markers+text',
    x: ngx_sectors.map(s => (s.Equity ?? 0) / sectorTotalEquity * 100),
    y: ngx_sectors.map(s => s.GainPct ?? 0),
    text: ngx_sectors.map(s => s.Sector),
    textposition: 'top center',
    textfont: { size: 9, color: COLORS.ink3 },
    marker: {
      size: ngx_sectors.map(s => Math.max(14, Math.sqrt((s.Equity ?? 0) / sectorTotalEquity) * 120)),
      color: ngx_sectors.map(s => sectorColor(s.Sector)),
      opacity: 0.8,
      line: { color: '#fff', width: 1.5 },
    },
    hovertemplate: '<b>%{text}</b><br>Weight: %{x:.1f}%<br>Return: %{y:.1f}%<extra></extra>',
  };

  // ── Correlation heatmap trace ─────────────────────────────────────────────────
  const heatmap = correlation && correlation.tickers.length >= 2 ? {
    type: 'heatmap',
    x: correlation.tickers,
    y: correlation.tickers,
    z: correlation.matrix,
    zmin: -1, zmax: 1,
    colorscale: [
      [0,    '#BE1B1B'],
      [0.25, '#E07070'],
      [0.5,  '#F5F5F5'],
      [0.75, '#6BAED6'],
      [1,    '#1A56DB'],
    ],
    showscale: true,
    colorbar: { thickness: 10, len: 0.8, tickfont: { size: 9 }, tickvals: [-1, -0.5, 0, 0.5, 1] },
    text: correlation.matrix.map(row => row.map(v => v.toFixed(2))),
    texttemplate: '%{text}',
    textfont: { size: 10, color: '#333' },
    hovertemplate: '%{y} × %{x}<br>r = %{z:.3f}<extra></extra>',
  } : null;

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

      {/* Weighted fundamentals strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {isFirstLoad ? [...Array(5)].map((_, i) => <ChartSkeleton key={i} height={88} />) : <>
          <KPICard label="Wtd P/E"           value={wPE   != null ? wPE.toFixed(1)        : '—'} sub="weighted avg"         accent="neutral" delay={0}   />
          <KPICard label="Wtd ROE"           value={wROE  != null ? wROE.toFixed(1) + '%' : '—'} sub="weighted avg"         accent={wROE != null && wROE > 0 ? 'gain' : 'neutral'} delay={50}  />
          <KPICard label="Wtd Beta"          value={wBeta != null ? wBeta.toFixed(2)       : '—'} sub="market sensitivity"  accent={wBeta != null && wBeta < 1 ? 'gain' : 'neutral'} delay={100} />
          <KPICard label="Wtd Div Yield"     value={wDivY != null ? wDivY.toFixed(2) + '%': '—'} sub="weighted avg"         accent="neutral" delay={150} />
          <KPICard label="Annual Div Income" value={annualDivIncome != null ? fmtNGN(annualDivIncome) : '—'} sub="projected" accent="accent" delay={200} />
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        <ChartCard title="Sector Weight vs Return" subtitle="size = equity · colour = sector" loading={isFirstLoad} height={400}>
          <PlotlyChart
            data={[sectorBubble]}
            layout={plotlyLayout({
              margin: { t:16,b:56,l:60,r:16 },
              xaxis: { title: { text: 'Portfolio weight %', font: { size: 10 } }, tickfont: { size: 9 }, ticksuffix: '%' },
              yaxis: { title: { text: 'Return %', font: { size: 10 } }, ticksuffix: '%', zerolinecolor: COLORS['border-strong'] },
            })}
            height={400}
          />
        </ChartCard>
      </div>

      {/* Analytics KPIs — drawdown + Sharpe */}
      {analytics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KPICard
            label="Max Drawdown"
            value={analytics.max_drawdown_pct != null ? `-${analytics.max_drawdown_pct.toFixed(1)}%` : '—'}
            sub={`last ${analytics.days}d`}
            accent={analytics.max_drawdown_pct != null && analytics.max_drawdown_pct > 20 ? 'loss' : analytics.max_drawdown_pct != null && analytics.max_drawdown_pct > 10 ? 'warn' : 'gain'}
          />
          <KPICard
            label="Sharpe Ratio"
            value={analytics.sharpe != null ? analytics.sharpe.toFixed(2) : '—'}
            sub="annualised"
            accent={analytics.sharpe != null && analytics.sharpe > 1 ? 'gain' : analytics.sharpe != null && analytics.sharpe > 0 ? 'neutral' : 'loss'}
          />
          <KPICard label="Snapshots" value={analytics.data_points} sub={`last ${analytics.days}d`} accent="neutral" />
          <KPICard
            label="Risk-Adj Return"
            value={analytics.sharpe != null && analytics.max_drawdown_pct != null && analytics.max_drawdown_pct > 0
              ? (analytics.sharpe / analytics.max_drawdown_pct * 10).toFixed(2) : '—'}
            sub="Sharpe / drawdown"
            accent="neutral"
          />
        </div>
      )}

      {/* Correlation heatmap */}
      {heatmap && (
        <ChartCard
          title="Return Correlation"
          subtitle={`pairwise · last ${correlation!.days}d daily returns`}
          loading={false}
          height={Math.max(300, correlation!.tickers.length * 48 + 60)}
        >
          <PlotlyChart
            data={[heatmap]}
            layout={plotlyLayout({
              margin: { t:8, b:80, l:80, r:40 },
              xaxis: { tickfont: { size: 10 }, tickangle: -40 },
              yaxis: { tickfont: { size: 10 } },
            })}
            height={Math.max(300, correlation!.tickers.length * 48 + 60)}
          />
        </ChartCard>
      )}

    </div>
  );
}