'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import KPICard from '@/components/molecules/KPICard';
import ChartCard from '@/components/molecules/ChartCard';
import PlotlyChart from '@/components/molecules/PlotlyChart';
import { plotlyLayout, COLORS, sectorColor } from '@/utils/theme';
import { fmtNGN, fmtPct } from '@/utils/formatters';
import { fetchNGXAdvanced } from '@/services/api';
import type { StockRow, NgxAdvancedResponse } from '@/models';
import { usePortfolio } from '@/context/PortfolioContext';

const PE_BENCHMARKS = [
  { label: 'NGX', value: 11, color: '#6366F1' },
  { label: 'Africa', value: 14.4, color: '#F59E0B' },
  { label: 'EM', value: 17, color: '#0EA5E9' },
  { label: 'S&P 500', value: 27, color: '#EF4444' },
];
const PE_MAX = 32;

const _n = (v: string | number | null | undefined): number | null => {
  if (v == null) return null;
  const f = parseFloat(String(v).replace(/[^0-9.-]/g, ''));
  return isNaN(f) ? null : f;
};

export default function NGXAdvancedPage() {
  const [resp, setResp] = useState<NgxAdvancedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const { refreshKey, setLastUpdated } = usePortfolio();
  const hasFetched = useRef(false);

  const load = useCallback(() => {
    fetchNGXAdvanced()
      .then((r) => { setResp(r); setLastUpdated(new Date()); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [setLastUpdated]);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    load();
  }, [load]);

  useEffect(() => {
    if (refreshKey === 0) return;
    load();
  }, [refreshKey, load]);

  if (!resp && !loading) return null;
  const isFirstLoad = loading && !resp;

  const active = (resp?.holdings ?? []).filter((s) => s.CurrentEquity != null);
  const wf = resp?.waterfall;
  const sectors = resp?.sectors ?? [];
  const correlation = resp?.correlation ?? null;
  const analytics = resp?.analytics ?? null;
  const relStrength = resp?.relative_strength ?? null;

  const totalEquity = active.reduce((sum, s) => sum + (s.CurrentEquity ?? 0), 0) || 1;
  const totalCost   = active.reduce((sum, s) => sum + (s.Shares ?? 0) * (s.AvgCost ?? 0), 0) || 1;

  const hhi = active.reduce((sum, s) => sum + ((s.CurrentEquity ?? 0) / totalEquity) ** 2, 0) * 10000;
  const hhiLabel = hhi < 1000 ? 'LOW' : hhi < 1800 ? 'MODERATE' : 'HIGH';

  // ── Weighted fundamentals ────────────────────────────────────────────────────
  const weightedAvg = (field: (row: StockRow) => number | null) => {
    let wsum = 0, wt = 0;
    active.forEach((s) => {
      const val = field(s);
      if (val == null || !isFinite(val)) return;
      const w = ((s.Shares ?? 0) * (s.AvgCost ?? 0)) / totalCost;
      wsum += val * w;
      wt += w;
    });
    return wt > 0.01 ? wsum / wt : null;
  };
  const wPE   = weightedAvg((s) => _n(s.PeRatio));
  const wROE  = weightedAvg((s) => { const v = _n(s.Roe); return v != null && v <= 150 ? v : null; });
  const wBeta = weightedAvg((s) => _n(s.Beta));
  const wDivY = weightedAvg((s) => _n(s.DividendYield));

  // ── Momentum vs Value ─────────────────────────────────────────────────────────
  const mvSplit = useMemo(() => {
    if (!active.length) return null;
    const rows = active.map((s) => {
      const pe  = _n(s.PeRatio);
      const roe = _n(s.Roe);
      const ret = s.ReturnPct ?? 0;
      const isMomentum = roe != null && roe > 15 && ret > 0;
      const isValue    = pe  != null && pe  < 12  && pe > 0;
      const label = isMomentum && isValue ? 'Quality' : isMomentum ? 'Momentum' : isValue ? 'Value' : 'Neutral';
      return { ticker: s.Ticker, name: s.Stock, sector: s.Sector, ret, pe, roe, label, equity: s.CurrentEquity ?? 0 };
    });
    const counts: Record<string, number> = {};
    rows.forEach((r) => { counts[r.label] = (counts[r.label] ?? 0) + 1; });
    return { rows, counts };
  }, [active]);

  // ── Sector fundamentals ───────────────────────────────────────────────────────
  const sectorFundamentals = useMemo(() => {
    if (!active.length) return null;
    const rows = active.map((s) => ({
      ticker: s.Ticker,
      sector: s.Sector || 'Other',
      pe:        _n(s.PeRatio),
      roe:       _n(s.Roe),
      netMargin: _n(s.PeRatio != null ? null : null), // not available in this endpoint
    }));

    const bySector: Record<string, typeof rows> = {};
    rows.forEach((r) => { (bySector[r.sector] ??= []).push(r); });

    const avg = (vals: (number | null)[]) => {
      const v = vals.filter((x): x is number => x != null);
      return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
    };
    const pctRank = (val: number | null, all: (number | null)[], higherBetter = true) => {
      if (val == null) return null;
      const valid = all.filter((x): x is number => x != null);
      if (!valid.length) return null;
      const below = valid.filter((x) => (higherBetter ? x < val : x > val)).length;
      return Math.round((below / valid.length) * 100);
    };

    const sectorAvgs: Record<string, { avg_pe: number | null; avg_roe: number | null; count: number }> = {};
    for (const [sector, items] of Object.entries(bySector)) {
      sectorAvgs[sector] = {
        avg_pe: avg(items.map((i) => i.pe)),
        avg_roe: avg(items.map((i) => i.roe)),
        count: items.length,
      };
    }

    const ranked = rows.map((r) => {
      const peers = bySector[r.sector];
      return {
        ...r,
        pe_rank:  pctRank(r.pe,  peers.map((p) => p.pe),  false),
        roe_rank: pctRank(r.roe, peers.map((p) => p.roe), true),
      };
    });

    return { sectorAvgs, ranked };
  }, [active]);

  // ── Chart traces ─────────────────────────────────────────────────────────────
  const costTrace = { name: 'Cost', type: 'bar', x: active.map((s) => s.Ticker), y: active.map((s) => s.RemainingCost ?? 0), marker: { color: COLORS['border-strong'], opacity: 1 }, hovertemplate: '<b>%{x}</b> Cost<br>₦%{y:,.0f}<extra></extra>' };
  const gainTrace = { name: 'Gain', type: 'bar', x: active.map((s) => s.Ticker), y: active.map((s) => Math.max(0, s.UnrealizedPL ?? 0)), marker: { color: COLORS.gain, opacity: 0.8 }, hovertemplate: '<b>%{x}</b> Gain<br>₦%{y:,.0f}<extra></extra>' };
  const lossTrace = { name: 'Loss', type: 'bar', x: active.map((s) => s.Ticker), y: active.map((s) => Math.min(0, s.UnrealizedPL ?? 0)), marker: { color: COLORS.loss, opacity: 0.8 }, hovertemplate: '<b>%{x}</b> Loss<br>₦%{y:,.0f}<extra></extra>' };

  const waterfallTrace = wf ? {
    type: 'waterfall', orientation: 'v',
    measure: ['absolute', 'relative', 'relative', 'total'],
    x: ['Total Cost', 'Realized P/L', 'Unrealized G/L', 'Current Equity'],
    y: [wf.total_cost, wf.realized_pl, wf.unrealized_pl, wf.current_equity],
    connector: { line: { color: COLORS.border, width: 1.5 } },
    increasing: { marker: { color: COLORS.gain } },
    decreasing: { marker: { color: COLORS.loss } },
    totals: { marker: { color: COLORS.accent } },
    texttemplate: '%{y:,.0f}', textposition: 'outside',
    textfont: { size: 10, color: COLORS.ink2 },
    hovertemplate: '<b>%{x}</b><br>₦%{y:,.0f}<extra></extra>',
  } : null;

  const hhiColor = hhi < 1000 ? COLORS.gain : hhi < 1800 ? COLORS.warn : COLORS.loss;
  const hhiGauge = {
    type: 'indicator', mode: 'gauge+number', value: hhi,
    title: { text: `${hhiLabel} Concentration`, font: { size: 11, color: COLORS.ink3 } },
    number: { font: { size: 36, color: hhiColor, family: "'JetBrains Mono', monospace" }, valueformat: '.0f' },
    gauge: {
      axis: { range: [0, 3000], tickvals: [0, 1000, 1800, 3000], ticktext: ['0', '1000', '1800', '3000'], tickfont: { size: 9, color: COLORS.ink4 }, linecolor: COLORS.border },
      bar: { color: hhiColor, thickness: 0.22 },
      bgcolor: COLORS.canvas, bordercolor: COLORS.border, borderwidth: 1,
      steps: [{ range: [0, 1000], color: COLORS.gainLight }, { range: [1000, 1800], color: '#FEF3CD' }, { range: [1800, 3000], color: COLORS.lossLight }],
      threshold: { line: { color: hhiColor, width: 2 }, thickness: 0.7, value: hhi },
    },
  };

  const mean = active.length ? active.reduce((a, b) => a + (b.ReturnPct ?? 0), 0) / active.length : 0;
  const scatter = {
    type: 'scatter', mode: 'markers+text',
    x: active.map((s) => Math.abs((s.ReturnPct ?? 0) - mean)),
    y: active.map((s) => s.ReturnPct ?? 0),
    text: active.map((s) => s.Ticker),
    textposition: 'top center', textfont: { size: 9, color: COLORS.ink3 },
    marker: {
      size: active.map((s) => Math.max(10, Math.sqrt((s.CurrentEquity ?? 0) / totalEquity) * 80)),
      color: active.map((s) => sectorColor(s.Sector)), opacity: 0.75, line: { color: '#fff', width: 1.5 },
    },
    hovertemplate: '<b>%{text}</b><br>Return: %{y:.1f}%<br>Risk: %{x:.1f}<extra></extra>',
  };

  const sectorTotalEquity = sectors.reduce((s, r) => s + (r.Equity ?? 0), 0) || 1;
  const sectorBubble = {
    type: 'scatter', mode: 'markers+text',
    x: sectors.map((s) => ((s.Equity ?? 0) / sectorTotalEquity) * 100),
    y: sectors.map((s) => s.GainPct ?? 0),
    text: sectors.map((s) => s.Sector),
    textposition: 'top center', textfont: { size: 9, color: COLORS.ink3 },
    marker: {
      size: sectors.map((s) => Math.max(14, Math.sqrt((s.Equity ?? 0) / sectorTotalEquity) * 120)),
      color: sectors.map((s) => sectorColor(s.Sector)), opacity: 0.8, line: { color: '#fff', width: 1.5 },
    },
    hovertemplate: '<b>%{text}</b><br>Weight: %{x:.1f}%<br>Return: %{y:.1f}%<extra></extra>',
  };

  const rsBarTrace = relStrength?.items.length ? {
    type: 'bar', orientation: 'h',
    y: relStrength.items.map((i) => i.ticker),
    x: relStrength.items.map((i) => i.rs_pct ?? i.stock_return ?? 0),
    marker: { color: relStrength.items.map((i) => i.outperform === true ? COLORS.gain : i.outperform === false ? COLORS.loss : COLORS['border-strong']), opacity: 0.85 },
    hovertemplate: relStrength.has_index_data ? '<b>%{y}</b><br>vs NGXASI: %{x:+.1f}%<extra></extra>' : '<b>%{y}</b><br>Return: %{x:.1f}%<extra></extra>',
  } : null;

  const heatmap = correlation && correlation.tickers.length >= 2 ? {
    type: 'heatmap', x: correlation.tickers, y: correlation.tickers, z: correlation.matrix, zmin: -1, zmax: 1,
    colorscale: [[0,'#BE1B1B'],[0.25,'#E07070'],[0.5,'#F5F5F5'],[0.75,'#6BAED6'],[1,'#1A56DB']],
    showscale: true, colorbar: { thickness: 10, len: 0.8, tickfont: { size: 9 }, tickvals: [-1,-0.5,0,0.5,1] },
    text: correlation.matrix.map((row) => row.map((v) => v.toFixed(2))),
    texttemplate: '%{text}', textfont: { size: 10, color: '#333' },
    hovertemplate: '%{y} × %{x}<br>r = %{z:.3f}<extra></extra>',
  } : null;

  return (
    <div className="space-y-5">
      {/* P/E Benchmark Widget */}
      <div className="bg-white rounded-2xl border border-[var(--border)] px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--ink-4)]">P/E vs Global Markets</p>
            <p className="text-[11px] text-[var(--ink-3)] mt-0.5">
              Portfolio weighted P/E:{' '}
              <span className="font-mono font-semibold text-[var(--ink)]">{wPE != null ? `${wPE.toFixed(1)}×` : '—'}</span>
            </p>
          </div>
          {wPE != null && (() => {
            const below = PE_BENCHMARKS.filter(b => wPE < b.value);
            const msg = below.length === PE_BENCHMARKS.length ? 'Cheaper than all benchmarks' : below.length === 0 ? 'Pricier than all benchmarks' : `Cheaper than ${below.map(b => b.label).join(', ')}`;
            const accent = below.length >= 2 ? 'var(--gain)' : below.length === 0 ? 'var(--loss)' : 'var(--warn)';
            return <span className="text-[10px] font-semibold px-2 py-1 rounded-lg" style={{ color: accent, background: accent + '18' }}>{msg}</span>;
          })()}
        </div>
        <div className="relative h-8 mt-4 mb-6">
          <div className="absolute left-0 right-0 top-3 h-1.5 rounded-full bg-[var(--border)]" />
          {PE_BENCHMARKS.map((b) => {
            const pct = (b.value / PE_MAX) * 100;
            return (
              <div key={b.label} className="absolute top-0 flex flex-col items-center" style={{ left: `${pct}%`, transform: 'translateX(-50%)' }}>
                <div className="w-0.5 h-3 rounded-full mt-1.5" style={{ background: b.color }} />
                <span className="text-[8px] font-bold mt-1 whitespace-nowrap" style={{ color: b.color }}>{b.label} {b.value}×</span>
              </div>
            );
          })}
          {wPE != null && wPE > 0 && wPE <= PE_MAX && (
            <div className="absolute top-0 flex flex-col items-center z-10" style={{ left: `${(wPE / PE_MAX) * 100}%`, transform: 'translateX(-50%)' }}>
              <div className="w-3 h-3 rounded-full border-2 border-white shadow-md" style={{ background: 'var(--accent)', marginTop: '0px' }} />
              <span className="text-[8px] font-bold text-[var(--accent)] mt-1 whitespace-nowrap">You {wPE.toFixed(1)}×</span>
            </div>
          )}
        </div>
      </div>

      {/* Momentum vs Value Split */}
      {mvSplit && (
        <div className="bg-white rounded-2xl border border-[var(--border)] px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--ink-4)] mb-3">Momentum vs Value</p>
          <div className="flex gap-4 flex-wrap mb-3">
            {([['Momentum','#10B981','ROE>15% + Return>0%'],['Value','#6366F1','P/E<12 + undervalued'],['Quality','#F59E0B','High ROE + Low P/E'],['Neutral','#9CA3AF','No clear signal']] as [string,string,string][]).map(([label,color,desc]) => (
              <div key={label} className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                <div>
                  <span className="text-[11px] font-semibold text-[var(--ink)]">{mvSplit.counts[label] ?? 0} {label}</span>
                  <p className="text-[9px] text-[var(--ink-4)]">{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  {['Ticker','Type','Return','P/E','ROE %'].map((h) => (
                    <th key={h} className={`py-1.5 px-2 text-[9px] font-semibold uppercase tracking-wide text-[var(--ink-4)] ${h==='Ticker'||h==='Type'?'text-left':'text-right'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mvSplit.rows.map((r) => {
                  const colorMap: Record<string,string> = { Momentum:'#10B981',Value:'#6366F1',Quality:'#F59E0B',Neutral:'#9CA3AF' };
                  const c = colorMap[r.label];
                  return (
                    <tr key={r.ticker} className="border-b border-[var(--border)] hover:bg-[var(--sidebar)]">
                      <td className="py-1.5 px-2 font-mono font-semibold text-[var(--ink)]">{r.ticker}</td>
                      <td className="py-1.5 px-2"><span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ color: c, background: c+'20' }}>{r.label}</span></td>
                      <td className={`py-1.5 px-2 font-mono text-right text-[11px] ${r.ret>=0?'text-[var(--gain)]':'text-[var(--loss)]'}`}>{r.ret>=0?'+':''}{r.ret.toFixed(1)}%</td>
                      <td className="py-1.5 px-2 font-mono text-right text-[var(--ink-2)]">{r.pe!=null?`${r.pe.toFixed(1)}×`:'—'}</td>
                      <td className="py-1.5 px-2 font-mono text-right text-[var(--ink-2)]">{r.roe!=null?`${r.roe.toFixed(1)}%`:'—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ChartCard title="Cost Basis vs Current Value" subtitle="grey = cost · green = gain · red = loss" loading={isFirstLoad} height={380}>
        <PlotlyChart data={[costTrace, gainTrace, lossTrace]} layout={plotlyLayout({ barmode: 'stack', margin: { t: 8, b: 56, l: 72, r: 8 } })} height={380} />
      </ChartCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard title="Portfolio Value Waterfall" loading={isFirstLoad} height={360}>
          {waterfallTrace && <PlotlyChart data={[waterfallTrace]} layout={plotlyLayout({ margin: { t: 32, b: 56, l: 72, r: 8 } })} height={360} />}
        </ChartCard>
        <ChartCard title="Concentration Risk" subtitle="Herfindahl–Hirschman Index" loading={isFirstLoad} height={360}>
          <PlotlyChart data={[hhiGauge]} layout={plotlyLayout({ margin: { t: 32, b: 16, l: 20, r: 20 } })} height={360} />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard title="Risk–Return" subtitle="size = equity weight · colour = sector" loading={isFirstLoad} height={400}>
          <PlotlyChart data={[scatter]} layout={plotlyLayout({ margin: { t: 16, b: 56, l: 60, r: 16 }, xaxis: { title: { text: 'Return deviation from mean', font: { size: 10 } }, tickfont: { size: 9 } }, yaxis: { title: { text: 'Return %', font: { size: 10 } }, ticksuffix: '%' } })} height={400} />
        </ChartCard>
        <ChartCard title="Sector Weight vs Return" subtitle="size = equity · colour = sector" loading={isFirstLoad} height={400}>
          <PlotlyChart data={[sectorBubble]} layout={plotlyLayout({ margin: { t: 16, b: 56, l: 60, r: 16 }, xaxis: { title: { text: 'Portfolio weight %', font: { size: 10 } }, tickfont: { size: 9 }, ticksuffix: '%' }, yaxis: { title: { text: 'Return %', font: { size: 10 } }, ticksuffix: '%', zerolinecolor: COLORS['border-strong'] } })} height={400} />
        </ChartCard>
      </div>

      {/* Analytics KPIs */}
      {analytics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KPICard label="Max Drawdown" value={analytics.max_drawdown_pct != null ? `-${analytics.max_drawdown_pct.toFixed(1)}%` : '—'} sub={`last ${analytics.days}d`} accent={analytics.max_drawdown_pct != null && analytics.max_drawdown_pct > 20 ? 'loss' : analytics.max_drawdown_pct != null && analytics.max_drawdown_pct > 10 ? 'warn' : 'gain'} />
          <KPICard label="Sharpe Ratio" value={analytics.sharpe != null ? analytics.sharpe.toFixed(2) : '—'} sub="annualised" accent={analytics.sharpe != null && analytics.sharpe > 1 ? 'gain' : analytics.sharpe != null && analytics.sharpe > 0 ? 'neutral' : 'loss'} />
          <KPICard label="Snapshots" value={analytics.data_points} sub={`last ${analytics.days}d`} accent="neutral" />
          <KPICard label="Risk-Adj Return" value={analytics.sharpe != null && analytics.max_drawdown_pct != null && analytics.max_drawdown_pct > 0 ? ((analytics.sharpe / analytics.max_drawdown_pct) * 10).toFixed(2) : '—'} sub="Sharpe / drawdown" accent="neutral" />
        </div>
      )}

      {rsBarTrace && (
        <ChartCard title="Relative Strength" subtitle={relStrength?.has_index_data ? `vs NGXASI · last ${relStrength.days}d · green = outperforming` : `absolute returns · last ${relStrength?.days ?? 90}d · NGXASI data loading`} loading={false} height={Math.max(240, (relStrength?.items.length ?? 0) * 36 + 60)}>
          <PlotlyChart data={[rsBarTrace]} layout={plotlyLayout({ margin: { t: 8, b: 40, l: 80, r: 24 }, xaxis: { ticksuffix: '%', tickfont: { size: 9 }, zerolinecolor: COLORS['border-strong'] }, yaxis: { tickfont: { size: 10 } }, bargap: 0.35 })} height={Math.max(240, (relStrength?.items.length ?? 0) * 36 + 60)} />
        </ChartCard>
      )}

      {sectorFundamentals && Object.keys(sectorFundamentals.sectorAvgs).length > 0 && (
        <ChartCard title="Sector Fundamentals" subtitle="avg metrics per sector · coloured rank = percentile within sector (green = top)" loading={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  {['Ticker','Sector','P/E','ROE %'].map((h) => (
                    <th key={h} className={`py-2 px-3 font-semibold text-[var(--ink-3)] uppercase tracking-wide text-[9px] ${h==='Ticker'||h==='Sector'?'text-left':'text-right'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const rankColor = (pct: number | null) => pct == null ? 'text-[var(--ink-4)]' : pct >= 67 ? 'text-[var(--gain)] font-semibold' : pct >= 34 ? 'text-[var(--warn)]' : 'text-[var(--loss)]';
                  const fmt = (v: number | null, dec = 1) => v != null ? v.toFixed(dec) : '—';
                  let lastSector = '';
                  return sectorFundamentals.ranked.map((r) => {
                    const sa = sectorFundamentals.sectorAvgs[r.sector];
                    const showHeader = r.sector !== lastSector;
                    lastSector = r.sector;
                    return [
                      showHeader && (
                        <tr key={`hdr-${r.sector}`} className="bg-[var(--sidebar)] border-t border-[var(--border)]">
                          <td colSpan={4} className="py-1.5 px-3 text-[9px] font-bold uppercase tracking-widest text-[var(--ink-3)]">
                            {r.sector}<span className="ml-2 font-normal text-[var(--ink-4)]">avg P/E {fmt(sa.avg_pe)} · ROE {fmt(sa.avg_roe)}%</span>
                          </td>
                        </tr>
                      ),
                      <tr key={r.ticker} className="border-b border-[var(--border)] hover:bg-[var(--sidebar)] transition-colors">
                        <td className="py-2 px-3 font-mono font-semibold text-[var(--ink)]">{r.ticker}</td>
                        <td className="py-2 px-3 text-[var(--ink-3)]" />
                        <td className="text-right py-2 px-3 font-mono"><span className="text-[var(--ink-2)]">{fmt(r.pe)}</span>{r.pe_rank!=null&&<span className={`ml-1 text-[9px] ${rankColor(r.pe_rank)}`}>{r.pe_rank}p</span>}</td>
                        <td className="text-right py-2 px-3 font-mono"><span className="text-[var(--ink-2)]">{fmt(r.roe)}</span>{r.roe_rank!=null&&<span className={`ml-1 text-[9px] ${rankColor(r.roe_rank)}`}>{r.roe_rank}p</span>}</td>
                      </tr>,
                    ];
                  });
                })()}
              </tbody>
            </table>
          </div>
        </ChartCard>
      )}

      {heatmap && (
        <ChartCard title="Return Correlation" subtitle={`pairwise · last ${correlation!.days}d daily returns`} loading={false} height={Math.max(300, correlation!.tickers.length * 48 + 60)}>
          <PlotlyChart data={[heatmap]} layout={plotlyLayout({ margin: { t: 8, b: 80, l: 80, r: 40 }, xaxis: { tickfont: { size: 10 }, tickangle: -40 }, yaxis: { tickfont: { size: 10 } } })} height={Math.max(300, correlation!.tickers.length * 48 + 60)} />
        </ChartCard>
      )}
    </div>
  );
}
