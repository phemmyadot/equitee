'use client';

import Link               from 'next/link';
import { usePortfolio } from '@/context/PortfolioContext';
import KPICard          from '@/components/ui/KPICard';
import ChartCard        from '@/components/ui/ChartCard';
import StockTable, { type ColDef } from '@/components/ui/StockTable';
import SourceBadge      from '@/components/ui/Badge';
import Sparkline        from '@/components/ui/Sparkline';
import { ChartSkeleton, PriceBanner } from '@/components/ui/Feedback';
import PlotlyChart      from '@/components/charts/PlotlyChart';
import { plotlyLayout, COLORS, sectorColor } from '@/lib/theme';
import { fmtNGN, fmtNGNFull, fmtPct, fmtPct2, fmtVol, isPositive } from '@/lib/formatters';
import type { StockRow } from '@/services/api';

export default function NGXOverviewPage() {
  const { data, loading } = usePortfolio();
  const isFirstLoad = loading && !data;

  if (!data && !loading) return null;

  const k           = data?.ngx_kpis;
  const active      = (data?.ngx_stocks ?? []).filter(s => s.CurrentEquity != null);
  const ngx_sectors = data?.ngx_sectors ?? [];
  const meta        = data?.meta;

  const equityBar = {
    type: 'bar',
    x: active.map(s => s.Ticker),
    y: active.map(s => s.CurrentEquity),
    marker: { color: active.map(s => sectorColor(s.Sector)), opacity: 0.9 },
    hovertemplate: '<b>%{x}</b><br>₦%{y:,.0f}<extra></extra>',
  };

  const sectorDonut = {
    type: 'pie',
    labels: ngx_sectors.map(s => s.Sector),
    values: ngx_sectors.map(s => s.Equity),
    hole: 0.58,
    marker: { colors: ngx_sectors.map(s => sectorColor(s.Sector)), line: { color: '#fff', width: 2 } },
    textinfo: 'label+percent',
    textfont: { size: 10 },
    hovertemplate: '<b>%{label}</b><br>₦%{value:,.0f}<br>%{percent}<extra></extra>',
  };

  const returnBar = {
    type: 'bar',
    x: active.map(s => s.Ticker),
    y: active.map(s => s.ReturnPct),
    marker: {
      color: active.map(s => (s.ReturnPct ?? 0) >= 0 ? COLORS.gain : COLORS.loss),
      opacity: 0.85,
    },
    hovertemplate: '<b>%{x}</b><br>%{y:.1f}%<extra></extra>',
  };

  const sectorGainBar = {
    type: 'bar',
    x: ngx_sectors.map(s => s.Sector),
    y: ngx_sectors.map(s => s.GainPct),
    marker: {
      color: ngx_sectors.map(s => s.GainPct >= 0 ? sectorColor(s.Sector) : COLORS.loss),
      opacity: 0.85,
    },
    hovertemplate: '<b>%{x}</b><br>%{y:.1f}%<extra></extra>',
  };

  const treemap = {
    type: 'treemap',
    labels:  active.map(s => `${s.Ticker}<br>${fmtPct(s.ReturnPct ?? 0)}`),
    parents: active.map(() => ''),
    values:  active.map(s => s.CurrentEquity),
    customdata: active.map(s => [s.Stock, fmtNGN(s.CurrentEquity), fmtPct(s.ReturnPct ?? 0)]),
    hovertemplate: '<b>%{customdata[0]}</b><br>Equity: %{customdata[1]}<br>Return: %{customdata[2]}<extra></extra>',
    marker: {
      colors: active.map(s => s.ReturnPct ?? 0),
      colorscale: [[0,'#BE1B1B'],[0.35,'#D97706'],[0.5,'#F5C518'],[0.7,'#2D7D3A'],[1,'#0A7B44']],
      cmin: -30, cmax: 100,
      showscale: true,
      colorbar: { thickness: 10, len: 0.5, tickfont: { size: 9 }, ticksuffix: '%', bgcolor: 'transparent', borderwidth: 0 },
      line: { width: 2, color: '#fff' },
    },
    textfont: { size: 11, color: '#fff' },
    tiling: { packing: 'squarify' },
  };

  const cols: ColDef<StockRow>[] = [
    { key: 'Ticker',  label: 'Ticker',
      render: (v: string) => (
        <Link
          href={`/ngx/profile?ticker=${v}`}
          className="font-mono font-semibold text-[11px] text-[var(--accent)] hover:underline"
        >
          {v}
        </Link>
      ),
    },
    { key: 'Stock',   label: 'Company',
      render: v => <span className="text-[var(--ink-2)] text-[12px]">{v}</span>
    },
    { key: 'Sector',  label: 'Sector',
      render: (v: string) => (
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: sectorColor(v) }} />
          <span className="text-[var(--ink-3)]">{v}</span>
        </span>
      ),
    },
    { key: 'LivePrice', label: 'Price', right: true,
      render: (v: number) => v != null
        ? <span className="font-mono font-semibold text-[var(--ink)]">{fmtNGNFull(v)}</span>
        : <span className="text-[var(--ink-4)]">—</span>,
      sortValue: (r: StockRow) => r.LivePrice ?? 0,
    },
    { key: 'LiveChangePct', label: 'Day', right: true,
      render: (v: number) => v != null
        ? <span className={`font-mono font-medium text-[11px] ${isPositive(v) ? 'text-[var(--gain)]' : 'text-[var(--loss)]'}`}>{fmtPct2(v)}</span>
        : <span className="text-[var(--ink-4)]">—</span>,
      sortValue: (r: StockRow) => r.LiveChangePct ?? 0,
    },
    { key: 'DayHigh', label: 'High', right: true,
      render: (v: number) => v != null ? <span className="font-mono text-[var(--ink-3)]">{fmtNGNFull(v)}</span> : '',
    },
    { key: 'DayLow', label: 'Low', right: true,
      render: (v: number) => v != null ? <span className="font-mono text-[var(--ink-3)]">{fmtNGNFull(v)}</span> : '',
    },
    { key: 'Volume', label: 'Volume', right: true,
      render: (v: number) => <span className="font-mono text-[var(--ink-3)]">{fmtVol(v)}</span>,
      sortValue: (r: StockRow) => r.Volume ?? 0,
    },
    { key: 'RemainingCost', label: 'Cost', right: true,
      render: (v: number) => <span className="font-mono text-[var(--ink-3)]">{fmtNGN(v)}</span>,
      sortValue: (r: StockRow) => r.RemainingCost ?? 0,
    },
    { key: 'CurrentEquity', label: 'Equity', right: true,
      render: (v: number) => <span className="font-mono font-semibold text-[var(--ink)]">{fmtNGN(v)}</span>,
      sortValue: (r: StockRow) => r.CurrentEquity ?? 0,
    },
    { key: 'UnrealizedPL', label: 'G/L', right: true,
      render: (v: number) => (
        <span className={`font-mono font-medium text-[11px] ${isPositive(v) ? 'text-[var(--gain)]' : 'text-[var(--loss)]'}`}>
          {fmtNGN(v)}
        </span>
      ),
      sortValue: (r: StockRow) => r.UnrealizedPL ?? 0,
    },
    { key: 'ReturnPct', label: 'Return', right: true,
      render: (v: number) => (
        <span className={`font-mono font-semibold text-[12px] ${isPositive(v) ? 'text-[var(--gain)]' : 'text-[var(--loss)]'}`}>
          {fmtPct(v)}
        </span>
      ),
      sortValue: (r: StockRow) => r.ReturnPct ?? 0,
    },
    { key: 'PriceSource', label: '', render: (v: string) => <SourceBadge source={v} /> },
    { key: 'sparkline', label: '90d', render: (_: unknown, row: StockRow) => <Sparkline ticker={row.Ticker} /> },
  ];

  return (
    <div className="space-y-5">

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {isFirstLoad
          ? [...Array(6)].map((_, i) => <ChartSkeleton key={i} height={88} />)
          : <>
            <KPICard label="Total Equity"    value={fmtNGN(k?.equity)}      accent="neutral"                          delay={0}   />
            <KPICard label="Total Cost"      value={fmtNGN(k?.cost)}        accent="neutral"                          delay={50}  />
            <KPICard label="Unrealized G/L"  value={fmtNGN(k?.gain)}        accent={isPositive(k?.gain) ? 'gain':'loss'} delay={100} />
            <KPICard label="Return"          value={fmtPct(k?.return_pct)}  accent={isPositive(k?.return_pct) ? 'gain':'loss'} delay={150} />
            <KPICard label="Realized P/L"    value={fmtNGN(k?.realized_pl)} accent={isPositive(k?.realized_pl) ? 'gain':'loss'} delay={200} />
            <KPICard label="Positions"       value={k?.positions ?? '—'}    accent="accent"                           delay={250} />
          </>
        }
      </div>

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
          <PlotlyChart data={[equityBar]} layout={plotlyLayout({ margin: { t:8,b:56,l:60,r:8 } })} height={300} />
        </ChartCard>
        <ChartCard title="Sector Allocation" loading={isFirstLoad} height={300}>
          <PlotlyChart
            data={[sectorDonut]}
            layout={plotlyLayout({ margin: { t:8,b:8,l:8,r:8 }, showlegend: true,
              legend: { orientation: 'v', x: 1.02, xanchor: 'left', y: 0.5 } })}
            height={300}
          />
        </ChartCard>
      </div>

      {/* Return + Sector gain */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard title="Unrealized Return" subtitle="per stock" loading={isFirstLoad} height={320}>
          <PlotlyChart
            data={[returnBar]}
            layout={plotlyLayout({ margin: { t:8,b:56,l:60,r:8 },
              yaxis: { ticksuffix: '%', zerolinecolor: COLORS['border-strong'] } })}
            height={320}
          />
        </ChartCard>
        <ChartCard title="Sector Gain %" loading={isFirstLoad} height={320}>
          <PlotlyChart
            data={[sectorGainBar]}
            layout={plotlyLayout({ margin: { t:8,b:80,l:60,r:8 },
              yaxis: { ticksuffix: '%', zerolinecolor: COLORS['border-strong'] } })}
            height={320}
          />
        </ChartCard>
      </div>

      {/* Treemap */}
      <ChartCard title="Portfolio Treemap" subtitle="size = equity · colour = return" loading={isFirstLoad} height={300}>
        <PlotlyChart
          data={[treemap]}
          layout={plotlyLayout({ margin: { t:8,b:8,l:8,r:8 } })}
          height={300}
        />
      </ChartCard>

      {/* Holdings table */}
      <ChartCard title="Holdings Detail" loading={isFirstLoad} height={420}>
        <StockTable rows={active} cols={cols} />
      </ChartCard>

    </div>
  );
}