'use client';

import { usePortfolio } from '@/lib/PortfolioContext';
import KPICard          from '@/components/ui/KPICard';
import SourceBadge      from '@/components/ui/Badge';
import { ChartSkeleton, PriceBanner } from '@/components/ui/Feedback';
import PlotlyChart      from '@/components/charts/PlotlyChart';
import { plotlyLayout, COLORS, sectorColor } from '@/lib/theme';
import { fmtUSD, fmtPct, fmtPct2, isPositive } from '@/lib/formatters';
import type { StockRow } from '@/lib/api';
import StockTable, { ColDef } from '@/components/ui/StockTable';

export default function USPortfolioPage() {
  const { data, loading } = usePortfolio();

  if (loading && !data) return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap">{[...Array(4)].map((_, i) => <ChartSkeleton key={i} height={90} />)}</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartSkeleton height={320} /><ChartSkeleton height={320} />
      </div>
    </div>
  );

  if (!data) return null;
  const { us_kpis: k, us_stocks, us_sectors, meta } = data;

  // ── Charts ─────────────────────────────────────────────────────────────────
  const equityBar = {
    type: 'bar',
    x: us_stocks.map(s => s.Ticker),
    y: us_stocks.map(s => s.CurrentEquity),
    marker: { color: us_stocks.map(s => sectorColor(s.Sector)), opacity: 0.9 },
    hovertemplate: '<b>%{x}</b><br>$%{y:,.2f}<extra></extra>',
  };

  const sectorDonut = {
    type: 'pie',
    labels: us_sectors.map(s => s.Sector),
    values: us_sectors.map(s => s.Equity),
    hole: 0.55,
    marker: { colors: us_sectors.map(s => sectorColor(s.Sector)) },
    textinfo: 'label+percent',
    textfont: { size: 10 },
    hovertemplate: '<b>%{label}</b><br>$%{value:,.2f}<br>%{percent}<extra></extra>',
  };

  const returnBar = {
    type: 'bar',
    x: us_stocks.map(s => s.Ticker),
    y: us_stocks.map(s => s.ReturnPct),
    marker: {
      color: us_stocks.map(s => (s.ReturnPct ?? 0) >= 0 ? COLORS.green : COLORS.red),
      opacity: 0.85,
    },
    hovertemplate: '<b>%{x}</b><br>%{y:.1f}%<extra></extra>',
  };

  const costBasisBar = [
    {
      name: 'Cost',
      type: 'bar',
      x: us_stocks.map(s => s.Ticker),
      y: us_stocks.map(s => s.RemainingCost ?? 0),
      marker: { color: COLORS.dim },
    },
    {
      name: 'Gain',
      type: 'bar',
      x: us_stocks.map(s => s.Ticker),
      y: us_stocks.map(s => Math.max(0, s.UnrealizedPL ?? 0)),
      marker: { color: COLORS.green, opacity: 0.75 },
    },
    {
      name: 'Loss',
      type: 'bar',
      x: us_stocks.map(s => s.Ticker),
      y: us_stocks.map(s => Math.min(0, s.UnrealizedPL ?? 0)),
      marker: { color: COLORS.red, opacity: 0.75 },
    },
  ];

  // ── Table columns ──────────────────────────────────────────────────────────
  const cols: ColDef<StockRow>[] = [
    { key: 'Ticker', label: 'Ticker', render: v => <b>{v}</b> },
    { key: 'Stock',  label: 'Company' },
    { key: 'Sector', label: 'Sector',
      render: (v: string) => (
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: sectorColor(v) }} />
          {v}
        </span>
      )
    },
    { key: 'LivePrice', label: 'Price', right: true,
      render: (v: number) => v != null
        ? <span className="font-mono font-bold text-[var(--snow)]">${Number(v).toFixed(2)}</span>
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
      render: (v: number) => v != null ? <span className="font-mono text-[var(--muted)]">${Number(v).toFixed(2)}</span> : '',
    },
    { key: 'DayLow', label: 'Low', right: true,
      render: (v: number) => v != null ? <span className="font-mono text-[var(--muted)]">${Number(v).toFixed(2)}</span> : '',
    },
    { key: 'RemainingCost', label: 'Cost', right: true,
      render: (v: number) => <span className="font-mono">{fmtUSD(v)}</span>,
      sortValue: (r: StockRow) => r.RemainingCost ?? 0,
    },
    { key: 'CurrentEquity', label: 'Equity', right: true,
      render: (v: number) => <b className="font-mono">{fmtUSD(v)}</b>,
      sortValue: (r: StockRow) => r.CurrentEquity ?? 0,
    },
    { key: 'UnrealizedPL', label: 'G/L', right: true,
      render: (v: number) => <span className={`font-mono ${isPositive(v) ? 'pos' : 'neg'}`}>{fmtUSD(v)}</span>,
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

      {/* KPIs */}
      <div className="flex gap-3 flex-wrap">
        <KPICard label="Total Equity"    value={fmtUSD(k.equity)}     accent="gold"                              delay={0}  />
        <KPICard label="Total Cost"      value={fmtUSD(k.cost)}       accent="blue"                              delay={50} />
        <KPICard label="Unrealized Gain" value={fmtUSD(k.gain)}       accent={isPositive(k.gain) ? 'green':'red'} delay={100} />
        <KPICard label="Return"          value={fmtPct(k.return_pct)} accent={isPositive(k.return_pct) ? 'green':'red'} delay={150} />
        <KPICard label="Positions"       value={k.positions}           accent="purple"                            delay={200} />
      </div>

      {/* Price banner */}
      <PriceBanner
        live={meta.us_prices_live}
        total={meta.us_prices_total}
        source={meta.us_price_source}
        ageSeconds={meta.us_price_age}
      />

      {/* Equity + Donut */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="chart-card">
          <div className="chart-title">Portfolio Equity by Stock</div>
          <PlotlyChart data={[equityBar]} layout={plotlyLayout({ margin: { t:10,b:60,l:60,r:8 } })} height={300} />
        </div>
        <div className="chart-card">
          <div className="chart-title">Sector Allocation</div>
          <PlotlyChart
            data={[sectorDonut]}
            layout={plotlyLayout({ margin: { t:10,b:10,l:10,r:10 }, showlegend: true,
              legend: { orientation: 'v', x: 1, xanchor: 'left', y: 0.5 } })}
            height={300}
          />
        </div>
      </div>

      {/* Return + Cost basis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="chart-card">
          <div className="chart-title">Return % <span>per stock</span></div>
          <PlotlyChart
            data={[returnBar]}
            layout={plotlyLayout({ margin: { t:10,b:60,l:60,r:8 },
              yaxis: { ticksuffix: '%', zerolinecolor: COLORS.muted } })}
            height={300}
          />
        </div>
        <div className="chart-card">
          <div className="chart-title">Cost Basis vs Value</div>
          <PlotlyChart
            data={costBasisBar}
            layout={plotlyLayout({ barmode: 'stack', margin: { t:10,b:60,l:60,r:8 } })}
            height={300}
          />
        </div>
      </div>

      {/* Table */}
      <div className="chart-card">
        <div className="chart-title">US Holdings Detail</div>
        <StockTable rows={us_stocks} cols={cols} />
      </div>

    </div>
  );
}