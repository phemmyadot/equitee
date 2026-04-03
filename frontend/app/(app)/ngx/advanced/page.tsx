'use client';

import { useState, useEffect, useMemo } from 'react';
import { usePortfolio } from '@/context/PortfolioContext';
import KPICard from '@/components/molecules/KPICard';
import ChartCard from '@/components/molecules/ChartCard';
import { ChartSkeleton } from '@/components/atoms/Feedback';
import PlotlyChart from '@/components/molecules/PlotlyChart';
import { plotlyLayout, COLORS, sectorColor } from '@/utils/theme';
import { fmtNGN, fmtPct, isPositive } from '@/utils/formatters';
import { fetchNGXTickerData, fetchCorrelation, fetchAnalytics, fetchRelativeStrength } from '@/services/api';
import type { TickerData, CorrelationData, AnalyticsData, RelativeStrengthData } from '@/models';

export default function NGXAdvancedPage() {
  const { data, loading } = usePortfolio();
  const isFirstLoad = loading && !data;

  const [tickerMap, setTickerMap] = useState<Record<string, TickerData>>({});
  const [correlation, setCorrelation] = useState<CorrelationData | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [relStrength, setRelStrength] = useState<RelativeStrengthData | null>(null);

  useEffect(() => {
    const active = (data?.ngx_stocks ?? []).filter((s) => s.CurrentEquity != null);
    if (!active.length) return;
    Promise.allSettled(active.map((s) => fetchNGXTickerData(s.Ticker))).then((results) => {
      const map: Record<string, TickerData> = {};
      results.forEach((r, i) => {
        if (r.status === 'fulfilled') map[active[i].Ticker] = r.value;
      });
      setTickerMap(map);
    });
  }, [data?.ngx_stocks?.length]);

  useEffect(() => {
    fetchCorrelation(90)
      .then(setCorrelation)
      .catch(() => {});
    fetchAnalytics(180)
      .then(setAnalytics)
      .catch(() => {});
    fetchRelativeStrength(90)
      .then(setRelStrength)
      .catch(() => {});
  }, []);

  if (!data && !loading) return null;

  const active = (data?.ngx_stocks ?? []).filter((s) => s.CurrentEquity != null);
  const k = data?.ngx_kpis;
  const wf = data?.waterfall;
  const meta = data?.meta;
  const totalEquity = k?.equity || 1;

  // ── Weighted fundamentals ────────────────────────────────────────────────────
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
      const w = (s.CurrentEquity ?? 0) / totalEquity;
      wsum += val * w;
      wt += w;
    });
    return wt > 0.01 ? wsum / wt : null;
  };
  const wPE = weightedAvg((td) => _n(td.overview?.pe_ratio));
  const wROE = weightedAvg((td) => _n(td.overview?.roe));
  const wBeta = weightedAvg((td) => _n(td.performance?.beta));
  const wDivY = weightedAvg((td) => _n(td.overview?.dividend_yield));
  const annualDivIncome =
    Object.keys(tickerMap).length > 0
      ? active.reduce((sum, s) => {
          const dy = _n(tickerMap[s.Ticker]?.overview?.dividend_yield);
          return sum + (dy != null ? ((s.CurrentEquity ?? 0) * dy) / 100 : 0);
        }, 0)
      : null;

  const costTrace = {
    name: 'Cost',
    type: 'bar',
    x: active.map((s) => s.Ticker),
    y: active.map((s) => s.RemainingCost ?? 0),
    marker: { color: COLORS['border-strong'], opacity: 1 },
    hovertemplate: '<b>%{x}</b> Cost<br>₦%{y:,.0f}<extra></extra>',
  };
  const gainTrace = {
    name: 'Gain',
    type: 'bar',
    x: active.map((s) => s.Ticker),
    y: active.map((s) => Math.max(0, s.UnrealizedPL ?? 0)),
    marker: { color: COLORS.gain, opacity: 0.8 },
    hovertemplate: '<b>%{x}</b> Gain<br>₦%{y:,.0f}<extra></extra>',
  };
  const lossTrace = {
    name: 'Loss',
    type: 'bar',
    x: active.map((s) => s.Ticker),
    y: active.map((s) => Math.min(0, s.UnrealizedPL ?? 0)),
    marker: { color: COLORS.loss, opacity: 0.8 },
    hovertemplate: '<b>%{x}</b> Loss<br>₦%{y:,.0f}<extra></extra>',
  };

  const waterfallTrace = wf
    ? {
        type: 'waterfall',
        orientation: 'v',
        measure: ['absolute', 'relative', 'relative', 'total'],
        x: ['Total Cost', 'Realized P/L', 'Unrealized G/L', 'Current Equity'],
        y: [wf.total_cost, wf.realized_pl, wf.unrealized_pl, wf.current_equity],
        connector: { line: { color: COLORS.border, width: 1.5 } },
        increasing: { marker: { color: COLORS.gain } },
        decreasing: { marker: { color: COLORS.loss } },
        totals: { marker: { color: COLORS.accent } },
        texttemplate: '%{y:,.0f}',
        textposition: 'outside',
        textfont: { size: 10, color: COLORS.ink2 },
        hovertemplate: '<b>%{x}</b><br>₦%{y:,.0f}<extra></extra>',
      }
    : null;

  const hhi = meta?.hhi ?? 0;
  const hhiColor = hhi < 1000 ? COLORS.gain : hhi < 1800 ? COLORS.warn : COLORS.loss;
  const hhiGauge = {
    type: 'indicator',
    mode: 'gauge+number',
    value: hhi,
    title: {
      text: `${meta?.hhi_label ?? ''} Concentration`,
      font: { size: 11, color: COLORS.ink3 },
    },
    number: {
      font: { size: 36, color: hhiColor, family: "'JetBrains Mono', monospace" },
      valueformat: '.0f',
    },
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
        { range: [0, 1000], color: COLORS.gainLight },
        { range: [1000, 1800], color: '#FEF3CD' },
        { range: [1800, 3000], color: COLORS.lossLight },
      ],
      threshold: { line: { color: hhiColor, width: 2 }, thickness: 0.7, value: hhi },
    },
  };

  const mean = active.length
    ? active.reduce((a, b) => a + (b.ReturnPct ?? 0), 0) / active.length
    : 0;

  const scatter = {
    type: 'scatter',
    mode: 'markers+text',
    x: active.map((s) => Math.abs((s.ReturnPct ?? 0) - mean)),
    y: active.map((s) => s.ReturnPct ?? 0),
    text: active.map((s) => s.Ticker),
    textposition: 'top center',
    textfont: { size: 9, color: COLORS.ink3 },
    marker: {
      size: active.map((s) => Math.max(10, Math.sqrt((s.CurrentEquity ?? 0) / totalEquity) * 80)),
      color: active.map((s) => sectorColor(s.Sector)),
      opacity: 0.75,
      line: { color: '#fff', width: 1.5 },
    },
    hovertemplate: '<b>%{text}</b><br>Return: %{y:.1f}%<br>Risk: %{x:.1f}<extra></extra>',
  };

  const ngx_sectors = data?.ngx_sectors ?? [];
  const sectorTotalEquity = ngx_sectors.reduce((s, r) => s + (r.Equity ?? 0), 0) || 1;
  const sectorBubble = {
    type: 'scatter',
    mode: 'markers+text',
    x: ngx_sectors.map((s) => ((s.Equity ?? 0) / sectorTotalEquity) * 100),
    y: ngx_sectors.map((s) => s.GainPct ?? 0),
    text: ngx_sectors.map((s) => s.Sector),
    textposition: 'top center',
    textfont: { size: 9, color: COLORS.ink3 },
    marker: {
      size: ngx_sectors.map((s) =>
        Math.max(14, Math.sqrt((s.Equity ?? 0) / sectorTotalEquity) * 120),
      ),
      color: ngx_sectors.map((s) => sectorColor(s.Sector)),
      opacity: 0.8,
      line: { color: '#fff', width: 1.5 },
    },
    hovertemplate: '<b>%{text}</b><br>Weight: %{x:.1f}%<br>Return: %{y:.1f}%<extra></extra>',
  };

  // ── Sector fundamentals (percentile rank within sector) ───────────────────────
  const sectorFundamentals = useMemo(() => {
    if (!Object.keys(tickerMap).length) return null;
    const rows = active.map((s) => {
      const td = tickerMap[s.Ticker];
      if (!td) return null;
      return {
        ticker:    s.Ticker,
        sector:    s.Sector || 'Other',
        pe:        _n(td.overview?.pe_ratio),
        roe:       _n(td.overview?.roe),
        netMargin: _n(td.performance?.net_margin),
        opMargin:  _n(td.performance?.operating_margin),
      };
    }).filter(Boolean) as { ticker: string; sector: string; pe: number|null; roe: number|null; netMargin: number|null; opMargin: number|null }[];

    const bySector: Record<string, typeof rows> = {};
    rows.forEach((r) => { (bySector[r.sector] ??= []).push(r); });

    const avg = (vals: (number|null)[]) => {
      const v = vals.filter((x): x is number => x != null);
      return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
    };
    const pctRank = (val: number|null, all: (number|null)[], higherBetter = true) => {
      if (val == null) return null;
      const valid = all.filter((x): x is number => x != null);
      if (!valid.length) return null;
      const below = valid.filter((x) => higherBetter ? x < val : x > val).length;
      return Math.round((below / valid.length) * 100);
    };

    const sectorAvgs: Record<string, { avg_pe: number|null; avg_roe: number|null; avg_net_margin: number|null; avg_op_margin: number|null; count: number }> = {};
    for (const [sector, items] of Object.entries(bySector)) {
      sectorAvgs[sector] = {
        avg_pe:         avg(items.map((i) => i.pe)),
        avg_roe:        avg(items.map((i) => i.roe)),
        avg_net_margin: avg(items.map((i) => i.netMargin)),
        avg_op_margin:  avg(items.map((i) => i.opMargin)),
        count:          items.length,
      };
    }

    const ranked = rows.map((r) => {
      const peers = bySector[r.sector];
      return {
        ...r,
        pe_rank:  pctRank(r.pe,        peers.map((p) => p.pe),        false),
        roe_rank: pctRank(r.roe,       peers.map((p) => p.roe),       true),
        nm_rank:  pctRank(r.netMargin, peers.map((p) => p.netMargin), true),
      };
    });

    return { sectorAvgs, ranked };
  }, [active, tickerMap]);

  // ── Relative strength bar chart trace ─────────────────────────────────────────
  const rsBarTrace = relStrength?.items.length
    ? {
        type:        'bar',
        orientation: 'h',
        y: relStrength.items.map((i) => i.ticker),
        x: relStrength.items.map((i) => i.rs_pct ?? i.stock_return ?? 0),
        marker: {
          color: relStrength.items.map((i) =>
            i.outperform === true ? COLORS.gain : i.outperform === false ? COLORS.loss : COLORS['border-strong'],
          ),
          opacity: 0.85,
        },
        hovertemplate: relStrength.has_index_data
          ? '<b>%{y}</b><br>vs NGXASI: %{x:+.1f}%<extra></extra>'
          : '<b>%{y}</b><br>Return: %{x:.1f}%<extra></extra>',
      }
    : null;

  // ── Correlation heatmap trace ─────────────────────────────────────────────────
  const heatmap =
    correlation && correlation.tickers.length >= 2
      ? {
          type: 'heatmap',
          x: correlation.tickers,
          y: correlation.tickers,
          z: correlation.matrix,
          zmin: -1,
          zmax: 1,
          colorscale: [
            [0, '#BE1B1B'],
            [0.25, '#E07070'],
            [0.5, '#F5F5F5'],
            [0.75, '#6BAED6'],
            [1, '#1A56DB'],
          ],
          showscale: true,
          colorbar: {
            thickness: 10,
            len: 0.8,
            tickfont: { size: 9 },
            tickvals: [-1, -0.5, 0, 0.5, 1],
          },
          text: correlation.matrix.map((row) => row.map((v) => v.toFixed(2))),
          texttemplate: '%{text}',
          textfont: { size: 10, color: '#333' },
          hovertemplate: '%{y} × %{x}<br>r = %{z:.3f}<extra></extra>',
        }
      : null;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {isFirstLoad ? (
          [...Array(5)].map((_, i) => <ChartSkeleton key={i} height={88} />)
        ) : (
          <>
            <KPICard label="Total Equity" value={fmtNGN(k?.equity)} accent="neutral" delay={0} />
            <KPICard
              label="Unrealized G/L"
              value={fmtNGN(k?.gain)}
              accent={isPositive(k?.gain) ? 'gain' : 'loss'}
              delay={50}
            />
            <KPICard
              label="Realized P/L"
              value={fmtNGN(k?.realized_pl)}
              accent={isPositive(k?.realized_pl) ? 'gain' : 'loss'}
              delay={100}
            />
            <KPICard
              label="Return"
              value={fmtPct(k?.return_pct)}
              accent={isPositive(k?.return_pct) ? 'gain' : 'loss'}
              delay={150}
            />
            <KPICard
              label="HHI Index"
              value={hhi.toFixed(0)}
              sub={`${meta?.hhi_label ?? ''} concentration`}
              accent={hhi < 1000 ? 'gain' : hhi < 1800 ? 'warn' : 'loss'}
              delay={200}
            />
          </>
        )}
      </div>

      {/* Weighted fundamentals strip */}
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
              label="Annual Div Income"
              value={annualDivIncome != null ? fmtNGN(annualDivIncome) : '—'}
              sub="projected"
              accent="accent"
              delay={200}
            />
          </>
        )}
      </div>

      <ChartCard
        title="Cost Basis vs Current Value"
        subtitle="grey = cost · green = gain · red = loss"
        loading={isFirstLoad}
        height={380}
      >
        <PlotlyChart
          data={[costTrace, gainTrace, lossTrace]}
          layout={plotlyLayout({ barmode: 'stack', margin: { t: 8, b: 56, l: 72, r: 8 } })}
          height={380}
        />
      </ChartCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard title="Portfolio Value Waterfall" loading={isFirstLoad} height={360}>
          {waterfallTrace && (
            <PlotlyChart
              data={[waterfallTrace]}
              layout={plotlyLayout({ margin: { t: 32, b: 56, l: 72, r: 8 } })}
              height={360}
            />
          )}
        </ChartCard>
        <ChartCard
          title="Concentration Risk"
          subtitle="Herfindahl–Hirschman Index"
          loading={isFirstLoad}
          height={360}
        >
          <PlotlyChart
            data={[hhiGauge]}
            layout={plotlyLayout({ margin: { t: 32, b: 16, l: 20, r: 20 } })}
            height={360}
          />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard
          title="Risk–Return"
          subtitle="size = equity weight · colour = sector"
          loading={isFirstLoad}
          height={400}
        >
          <PlotlyChart
            data={[scatter]}
            layout={plotlyLayout({
              margin: { t: 16, b: 56, l: 60, r: 16 },
              xaxis: {
                title: { text: 'Return deviation from mean', font: { size: 10 } },
                tickfont: { size: 9 },
              },
              yaxis: { title: { text: 'Return %', font: { size: 10 } }, ticksuffix: '%' },
            })}
            height={400}
          />
        </ChartCard>
        <ChartCard
          title="Sector Weight vs Return"
          subtitle="size = equity · colour = sector"
          loading={isFirstLoad}
          height={400}
        >
          <PlotlyChart
            data={[sectorBubble]}
            layout={plotlyLayout({
              margin: { t: 16, b: 56, l: 60, r: 16 },
              xaxis: {
                title: { text: 'Portfolio weight %', font: { size: 10 } },
                tickfont: { size: 9 },
                ticksuffix: '%',
              },
              yaxis: {
                title: { text: 'Return %', font: { size: 10 } },
                ticksuffix: '%',
                zerolinecolor: COLORS['border-strong'],
              },
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
            value={
              analytics.max_drawdown_pct != null
                ? `-${analytics.max_drawdown_pct.toFixed(1)}%`
                : '—'
            }
            sub={`last ${analytics.days}d`}
            accent={
              analytics.max_drawdown_pct != null && analytics.max_drawdown_pct > 20
                ? 'loss'
                : analytics.max_drawdown_pct != null && analytics.max_drawdown_pct > 10
                  ? 'warn'
                  : 'gain'
            }
          />
          <KPICard
            label="Sharpe Ratio"
            value={analytics.sharpe != null ? analytics.sharpe.toFixed(2) : '—'}
            sub="annualised"
            accent={
              analytics.sharpe != null && analytics.sharpe > 1
                ? 'gain'
                : analytics.sharpe != null && analytics.sharpe > 0
                  ? 'neutral'
                  : 'loss'
            }
          />
          <KPICard
            label="Snapshots"
            value={analytics.data_points}
            sub={`last ${analytics.days}d`}
            accent="neutral"
          />
          <KPICard
            label="Risk-Adj Return"
            value={
              analytics.sharpe != null &&
              analytics.max_drawdown_pct != null &&
              analytics.max_drawdown_pct > 0
                ? ((analytics.sharpe / analytics.max_drawdown_pct) * 10).toFixed(2)
                : '—'
            }
            sub="Sharpe / drawdown"
            accent="neutral"
          />
        </div>
      )}

      {/* Relative strength vs NGX All-Share Index */}
      {rsBarTrace && (
        <ChartCard
          title="Relative Strength"
          subtitle={
            relStrength?.has_index_data
              ? `vs NGXASI · last ${relStrength.days}d · green = outperforming`
              : `absolute returns · last ${relStrength?.days ?? 90}d · NGXASI data loading`
          }
          loading={false}
          height={Math.max(240, (relStrength?.items.length ?? 0) * 36 + 60)}
        >
          <PlotlyChart
            data={[rsBarTrace]}
            layout={plotlyLayout({
              margin: { t: 8, b: 40, l: 80, r: 24 },
              xaxis:  { ticksuffix: '%', tickfont: { size: 9 }, zerolinecolor: COLORS['border-strong'] },
              yaxis:  { tickfont: { size: 10 } },
              bargap: 0.35,
            })}
            height={Math.max(240, (relStrength?.items.length ?? 0) * 36 + 60)}
          />
        </ChartCard>
      )}

      {/* Sector Fundamentals + Percentile Rank */}
      {sectorFundamentals && Object.keys(sectorFundamentals.sectorAvgs).length > 0 && (
        <ChartCard
          title="Sector Fundamentals"
          subtitle="avg metrics per sector · coloured rank = percentile within sector (green = top)"
          loading={false}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  {['Ticker', 'Sector', 'P/E', 'ROE %', 'Net Margin %', 'Op Margin %'].map((h) => (
                    <th
                      key={h}
                      className={`py-2 px-3 font-semibold text-[var(--ink-3)] uppercase tracking-wide text-[9px] ${h === 'Ticker' || h === 'Sector' ? 'text-left' : 'text-right'}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const rankColor = (pct: number | null) => {
                    if (pct == null) return 'text-[var(--ink-4)]';
                    if (pct >= 67) return 'text-[var(--gain)] font-semibold';
                    if (pct >= 34) return 'text-[var(--warn)]';
                    return 'text-[var(--loss)]';
                  };
                  const fmt = (v: number | null, dec = 1) => (v != null ? v.toFixed(dec) : '—');
                  const RankCell = ({ val, rank, dec = 1 }: { val: number | null; rank: number | null; dec?: number }) => (
                    <td className="text-right py-2 px-3 font-mono">
                      <span className="text-[var(--ink-2)]">{fmt(val, dec)}</span>
                      {rank != null && (
                        <span className={`ml-1 text-[9px] ${rankColor(rank)}`}>{rank}p</span>
                      )}
                    </td>
                  );
                  let lastSector = '';
                  return sectorFundamentals.ranked.map((r) => {
                    const sa = sectorFundamentals.sectorAvgs[r.sector];
                    const showHeader = r.sector !== lastSector;
                    lastSector = r.sector;
                    return [
                      showHeader && (
                        <tr key={`hdr-${r.sector}`} className="bg-[var(--sidebar)] border-t border-[var(--border)]">
                          <td colSpan={6} className="py-1.5 px-3 text-[9px] font-bold uppercase tracking-widest text-[var(--ink-3)]">
                            {r.sector}
                            <span className="ml-2 font-normal text-[var(--ink-4)]">
                              avg P/E {fmt(sa.avg_pe)} · ROE {fmt(sa.avg_roe)}% · NM {fmt(sa.avg_net_margin)}% · OM {fmt(sa.avg_op_margin)}%
                            </span>
                          </td>
                        </tr>
                      ),
                      <tr key={r.ticker} className="border-b border-[var(--border)] hover:bg-[var(--sidebar)] transition-colors">
                        <td className="py-2 px-3 font-mono font-semibold text-[var(--ink)]">{r.ticker}</td>
                        <td className="py-2 px-3 text-[var(--ink-3)]" />
                        <RankCell val={r.pe}        rank={r.pe_rank}  />
                        <RankCell val={r.roe}       rank={r.roe_rank} />
                        <RankCell val={r.netMargin} rank={r.nm_rank}  />
                        <RankCell val={r.opMargin}  rank={null}       />
                      </tr>,
                    ];
                  });
                })()}
              </tbody>
            </table>
            <p className="text-[9px] text-[var(--ink-4)] px-3 pb-2 mt-1">
              p = percentile rank within sector (0 = lowest, 100 = highest). Lower P/E ranked higher.
            </p>
          </div>
        </ChartCard>
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
              margin: { t: 8, b: 80, l: 80, r: 40 },
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
