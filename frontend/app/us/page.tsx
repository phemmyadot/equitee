'use client';

import { usePortfolio } from '@/lib/PortfolioContext';
import KPICard          from '@/components/ui/KPICard';
import ChartCard        from '@/components/ui/ChartCard';
import StockTable, { type ColDef } from '@/components/ui/StockTable';
import SourceBadge      from '@/components/ui/Badge';
import { ChartSkeleton, PriceBanner } from '@/components/ui/Feedback';
import PlotlyChart      from '@/components/charts/PlotlyChart';
import { plotlyLayout, COLORS, sectorColor } from '@/lib/theme';
import { fmtUSD, fmtPct, fmtPct2, isPositive } from '@/lib/formatters';
import type { StockRow } from '@/lib/api';

export default function USPortfolioPage() {
  const { data, loading } = usePortfolio();
  const isFirstLoad = loading && !data;
  if (!data && !loading) return null;

  const k          = data?.us_kpis;
  const us_stocks  = data?.us_stocks ?? [];
  const us_sectors = data?.us_sectors ?? [];
  const meta       = data?.meta;

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
    hole: 0.58,
    marker: { colors: us_sectors.map(s => sectorColor(s.Sector)), line: { color: '#fff', width: 2 } },
    textinfo: 'label+percent',
    textfont: { size: 10 },
    hovertemplate: '<b>%{label}</b><br>$%{value:,.2f}<br>%{percent}<extra></extra>',
  };

  const returnBar = {
    type: 'bar',
    x: us_stocks.map(s => s.Ticker),
    y: us_stocks.map(s => s.ReturnPct),
    marker: {
      color: us_stocks.map(s => (s.ReturnPct ?? 0) >= 0 ? COLORS.gain : COLORS.loss),
      opacity: 0.85,
    },
    hovertemplate: '<b>%{x}</b><br>%{y:.1f}%<extra></extra>',
  };

  const costBasisBar = [
    { name: 'Cost', type: 'bar', x: us_stocks.map(s => s.Ticker), y: us_stocks.map(s => s.RemainingCost ?? 0), marker: { color: COLORS['border-strong'] } },
    { name: 'Gain', type: 'bar', x: us_stocks.map(s => s.Ticker), y: us_stocks.map(s => Math.max(0, s.UnrealizedPL ?? 0)), marker: { color: COLORS.gain, opacity: 0.8 } },
    { name: 'Loss', type: 'bar', x: us_stocks.map(s => s.Ticker), y: us_stocks.map(s => Math.min(0, s.UnrealizedPL ?? 0)), marker: { color: COLORS.loss, opacity: 0.8 } },
  ];

  const cols: ColDef<StockRow>[] = [
    { key: 'Ticker', label: 'Ticker',
      render: v => <span className="font-mono font-semibold text-[var(--ink)] text-[11px]">{v}</span>
    },
    { key: 'Stock', label: 'Company',
      render: v => <span className="text-[var(--ink-2)]">{v}</span>
    },
    { key: 'Sector', label: 'Sector',
      render: (v: string) => (
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: sectorColor(v) }} />
          <span className="text-[var(--ink-3)]">{v}</span>
        </span>
      ),
    },
    { key: 'LivePrice', label: 'Price', right: true,
      render: (v: number) => v != null
        ? <span className="font-mono font-semibold text-[var(--ink)]">${Number(v).toFixed(2)}</span>
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
      render: (v: number) => v != null ? <span className="font-mono text-[var(--ink-3)]">${Number(v).toFixed(2)}</span> : '',
    },
    { key: 'DayLow', label: 'Low', right: true,
      render: (v: number) => v != null ? <span className="font-mono text-[var(--ink-3)]">${Number(v).toFixed(2)}</span> : '',
    },
    { key: 'RemainingCost', label: 'Cost', right: true,
      render: (v: number) => <span className="font-mono text-[var(--ink-3)]">{fmtUSD(v)}</span>,
      sortValue: (r: StockRow) => r.RemainingCost ?? 0,
    },
    { key: 'CurrentEquity', label: 'Equity', right: true,
      render: (v: number) => <span className="font-mono font-semibold text-[var(--ink)]">{fmtUSD(v)}</span>,
      sortValue: (r: StockRow) => r.CurrentEquity ?? 0,
    },
    { key: 'UnrealizedPL', label: 'G/L', right: true,
      render: (v: number) => (
        <span className={`font-mono font-medium text-[11px] ${isPositive(v) ? 'text-[var(--gain)]' : 'text-[var(--loss)]'}`}>
          {fmtUSD(v)}
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
  ];

  return (
    <div className="space-y-5">

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {isFirstLoad ? [...Array(5)].map((_, i) => <ChartSkeleton key={i} height={88} />) : <>
          <KPICard label="Total Equity"    value={fmtUSD(k?.equity)}     accent="neutral"                               delay={0}   />
          <KPICard label="Total Cost"      value={fmtUSD(k?.cost)}       accent="neutral"                               delay={50}  />
          <KPICard label="Unrealized G/L"  value={fmtUSD(k?.gain)}       accent={isPositive(k?.gain) ? 'gain':'loss'}   delay={100} />
          <KPICard label="Return"          value={fmtPct(k?.return_pct)} accent={isPositive(k?.return_pct) ? 'gain':'loss'} delay={150} />
          <KPICard label="Positions"       value={k?.positions ?? '—'}   accent="accent"                                delay={200} />
        </>}
      </div>

      {meta && (
        <PriceBanner
          live={meta.us_prices_live}
          total={meta.us_prices_total}
          source={meta.us_price_source}
          ageSeconds={meta.us_price_age}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard title="Portfolio Equity" subtitle="by stock" loading={isFirstLoad} height={280}>
          <PlotlyChart data={[equityBar]} layout={plotlyLayout({ margin: { t:8,b:56,l:60,r:8 } })} height={280} />
        </ChartCard>
        <ChartCard title="Sector Allocation" loading={isFirstLoad} height={280}>
          <PlotlyChart
            data={[sectorDonut]}
            layout={plotlyLayout({ margin: { t:8,b:8,l:8,r:8 }, showlegend: true,
              legend: { orientation: 'v', x: 1.02, xanchor: 'left', y: 0.5 } })}
            height={280}
          />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard title="Return %" subtitle="per stock" loading={isFirstLoad} height={280}>
          <PlotlyChart
            data={[returnBar]}
            layout={plotlyLayout({ margin: { t:8,b:56,l:60,r:8 },
              yaxis: { ticksuffix: '%', zerolinecolor: COLORS['border-strong'] } })}
            height={280}
          />
        </ChartCard>
        <ChartCard title="Cost Basis vs Value" loading={isFirstLoad} height={280}>
          <PlotlyChart
            data={costBasisBar}
            layout={plotlyLayout({ barmode: 'stack', margin: { t:8,b:56,l:60,r:8 } })}
            height={280}
          />
        </ChartCard>
      </div>

      <ChartCard title="US Holdings Detail" loading={isFirstLoad} height={360}>
        <StockTable rows={us_stocks} cols={cols} />
      </ChartCard>

    </div>
  );
}