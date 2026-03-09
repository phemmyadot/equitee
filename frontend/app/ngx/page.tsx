'use client';

import { usePortfolio } from '@/lib/PortfolioContext';
import KPICard          from '@/components/ui/KPICard';
import StockTable, { type ColDef } from '@/components/ui/StockTable';
import SourceBadge      from '@/components/ui/Badge';
import { ChartSkeleton, PriceBanner } from '@/components/ui/Feedback';
import PlotlyChart      from '@/components/charts/PlotlyChart';
import { plotlyLayout, COLORS, sectorColor } from '@/lib/theme';
import { fmtNGN, fmtNGNFull, fmtPct, fmtPct2, fmtVol, isPositive } from '@/lib/formatters';
import type { StockRow } from '@/lib/api';

export default function NGXOverviewPage() {
  const { data, loading } = usePortfolio();

  if (loading && !data) return (
    <div className="space-y-6">
      <div className="flex gap-3 flex-wrap">{[...Array(6)].map((_, i) => <ChartSkeleton key={i} height={90} />)}</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartSkeleton height={340} /><ChartSkeleton height={340} />
      </div>
      <ChartSkeleton height={320} />
    </div>
  );

  if (!data) return null;
  const { ngx_kpis: k, ngx_stocks, ngx_sectors, meta } = data;
  const active = ngx_stocks.filter(s => s.CurrentEquity != null);

  // ── Charts ─────────────────────────────────────────────────────────────────

  // Equity bar
  const equityBar = {
    type: 'bar',
    x: active.map(s => s.Ticker),
    y: active.map(s => s.CurrentEquity),
    marker: { color: active.map(s => sectorColor(s.Sector)), opacity: 0.9 },
    hovertemplate: '<b>%{x}</b><br>₦%{y:,.0f}<extra></extra>',
  };

  // Sector donut
  const sectorDonut = {
    type: 'pie',
    labels: ngx_sectors.map(s => s.Sector),
    values: ngx_sectors.map(s => s.Equity),
    hole: 0.55,
    marker: { colors: ngx_sectors.map(s => sectorColor(s.Sector)) },
    textinfo: 'label+percent',
    textfont: { size: 10 },
    hovertemplate: '<b>%{label}</b><br>₦%{value:,.0f}<br>%{percent}<extra></extra>',
  };

  // Return diverging bar
  const returnBar = {
    type: 'bar',
    x: active.map(s => s.Ticker),
    y: active.map(s => s.ReturnPct),
    marker: {
      color: active.map(s =>
        (s.ReturnPct ?? 0) >= 0 ? COLORS.green : COLORS.red
      ),
      opacity: 0.85,
    },
    hovertemplate: '<b>%{x}</b><br>%{y:.1f}%<extra></extra>',
  };

  // Sector gain bar
  const sectorGainBar = {
    type: 'bar',
    x: ngx_sectors.map(s => s.Sector),
    y: ngx_sectors.map(s => s.GainPct),
    marker: {
      color: ngx_sectors.map(s =>
        s.GainPct >= 0 ? sectorColor(s.Sector) : COLORS.red
      ),
      opacity: 0.85,
    },
    hovertemplate: '<b>%{x}</b><br>%{y:.1f}%<extra></extra>',
  };

  // Treemap
  const treemap = {
    type: 'treemap',
    labels:  active.map(s => `${s.Ticker}<br>${fmtPct(s.ReturnPct ?? 0)}`),
    parents: active.map(() => ''),
    values:  active.map(s => s.CurrentEquity),
    customdata: active.map(s => [s.Stock, fmtNGN(s.CurrentEquity), fmtPct(s.ReturnPct ?? 0)]),
    hovertemplate: '<b>%{customdata[0]}</b><br>Equity: %{customdata[1]}<br>Return: %{customdata[2]}<extra></extra>',
    marker: {
      colors: active.map(s => s.ReturnPct ?? 0),
      colorscale: [[0,'#ff3d5a'],[0.2,'#ff9f43'],[0.4,'#f5c518'],[0.6,'#7ec850'],[1,'#00e87a']],
      cmin: -30, cmax: 130,
      showscale: true,
      colorbar: { thickness: 10, len: 0.5, tickfont: { size: 9 }, ticksuffix: '%' },
      line: { width: 1.5, color: COLORS.panel },
    },
    textfont: { size: 11 },
    tiling:   { packing: 'squarify' },
  };

  // ── Table columns ──────────────────────────────────────────────────────────
  const cols: ColDef<StockRow>[] = [
    { key: 'Ticker',       label: 'Ticker',  render: v => <b>{v}</b> },
    { key: 'Stock',        label: 'Company', render: v => <span className="text-[var(--snow)]">{v}</span> },
    { key: 'Sector',       label: 'Sector',
      render: (v: string) => (
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full inline-block flex-shrink-0"
            style={{ background: sectorColor(v) }} />
          {v}
        </span>
      )
    },
    { key: 'LivePrice',    label: 'Price', right: true,
      render: (v: number) => v != null
        ? <span className="font-mono font-bold text-[var(--snow)]">{fmtNGNFull(v)}</span>
        : <span className="text-[var(--muted)]">—</span>,
      sortValue: (r: StockRow) => r.LivePrice ?? 0,
    },
    { key: 'LiveChangePct', label: 'Day %', right: true,
      render: (v: number) => v != null
        ? <span className={`font-mono ${isPositive(v) ? 'pos' : 'neg'}`}>{fmtPct2(v)}</span>
        : '',
      sortValue: (r: StockRow) => r.LiveChangePct ?? 0,
    },
    { key: 'DayHigh', label: 'High', right: true,
      render: (v: number) => v != null ? <span className="font-mono text-[var(--muted)]">{fmtNGNFull(v)}</span> : '',
    },
    { key: 'DayLow', label: 'Low', right: true,
      render: (v: number) => v != null ? <span className="font-mono text-[var(--muted)]">{fmtNGNFull(v)}</span> : '',
    },
    { key: 'Volume', label: 'Volume', right: true,
      render: (v: number) => <span className="font-mono text-[var(--muted)]">{fmtVol(v)}</span>,
      sortValue: (r: StockRow) => r.Volume ?? 0,
    },
    { key: 'RemainingCost', label: 'Cost', right: true,
      render: (v: number) => <span className="font-mono">{fmtNGN(v)}</span>,
      sortValue: (r: StockRow) => r.RemainingCost ?? 0,
    },
    { key: 'CurrentEquity', label: 'Equity', right: true,
      render: (v: number) => <b className="font-mono">{fmtNGN(v)}</b>,
      sortValue: (r: StockRow) => r.CurrentEquity ?? 0,
    },
    { key: 'UnrealizedPL', label: 'G/L', right: true,
      render: (v: number) => <span className={`font-mono ${isPositive(v) ? 'pos' : 'neg'}`}>{fmtNGN(v)}</span>,
      sortValue: (r: StockRow) => r.UnrealizedPL ?? 0,
    },
    { key: 'ReturnPct', label: 'Return', right: true,
      render: (v: number) => <b className={`font-mono ${isPositive(v) ? 'pos' : 'neg'}`}>{fmtPct(v)}</b>,
      sortValue: (r: StockRow) => r.ReturnPct ?? 0,
    },
    { key: 'PriceSource', label: '', render: (v: string) => <SourceBadge source={v} /> },
  ];

  return (
    <div className="space-y-5">

      {/* KPI strip */}
      <div className="flex gap-3 flex-wrap">
        <KPICard label="Total Equity"    value={fmtNGN(k.equity)}      accent="gold"                              delay={0}  />
        <KPICard label="Total Cost"      value={fmtNGN(k.cost)}        accent="blue"                              delay={50} />
        <KPICard label="Unrealized Gain" value={fmtNGN(k.gain)}        accent={isPositive(k.gain) ? 'green':'red'} delay={100} />
        <KPICard label="Return"          value={fmtPct(k.return_pct)}  accent={isPositive(k.return_pct) ? 'green':'red'} delay={150} />
        <KPICard label="Realized P/L"    value={fmtNGN(k.realized_pl)} accent={isPositive(k.realized_pl) ? 'green':'red'} delay={200} />
        <KPICard label="Positions"       value={k.positions}            accent="purple"                            delay={250} />
      </div>

      {/* Price banner */}
      <PriceBanner
        live={meta.ngx_prices_live}
        total={meta.ngx_prices_total}
        source={meta.ngx_price_source}
        ageSeconds={meta.ngx_price_age}
      />

      {/* Equity + Sector donut */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="chart-card">
          <div className="chart-title">Portfolio Equity by Stock</div>
          <PlotlyChart data={[equityBar]} layout={plotlyLayout({ margin: { t:10,b:60,l:48,r:8 } })} height={320} />
        </div>
        <div className="chart-card">
          <div className="chart-title">Sector Allocation</div>
          <PlotlyChart
            data={[sectorDonut]}
            layout={plotlyLayout({ margin: { t:10,b:10,l:10,r:10 }, showlegend: true,
              legend: { orientation: 'v', x: 1, xanchor: 'left', y: 0.5 } })}
            height={320}
          />
        </div>
      </div>

      {/* Return + Sector gain */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="chart-card">
          <div className="chart-title">Unrealized Return % <span>per stock</span></div>
          <PlotlyChart
            data={[{ ...returnBar, type: 'bar' }]}
            layout={plotlyLayout({
              margin: { t:10,b:60,l:60,r:8 },
              yaxis: { ticksuffix: '%', gridcolor: COLORS.border, zerolinecolor: COLORS.muted },
            })}
            height={340}
          />
        </div>
        <div className="chart-card">
          <div className="chart-title">Gain % <span>by sector</span></div>
          <PlotlyChart
            data={[{ ...sectorGainBar, type: 'bar' }]}
            layout={plotlyLayout({
              margin: { t:10,b:80,l:60,r:8 },
              yaxis: { ticksuffix: '%', gridcolor: COLORS.border, zerolinecolor: COLORS.muted },
            })}
            height={340}
          />
        </div>
      </div>

      {/* Treemap */}
      <div className="chart-card">
        <div className="chart-title">Portfolio Treemap <span>size = equity · colour = return</span></div>
        <PlotlyChart
          data={[treemap]}
          layout={plotlyLayout({ margin: { t:10,b:10,l:10,r:10 } })}
          height={320}
        />
      </div>

      {/* Holdings table */}
      <div className="chart-card">
        <div className="chart-title">Holdings Detail</div>
        <StockTable rows={active} cols={cols} />
      </div>

    </div>
  );
}