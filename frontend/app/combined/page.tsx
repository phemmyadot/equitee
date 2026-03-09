'use client';

import { usePortfolio } from '@/lib/PortfolioContext';
import KPICard          from '@/components/ui/KPICard';
import { ChartSkeleton } from '@/components/ui/Feedback';
import PlotlyChart      from '@/components/charts/PlotlyChart';
import { plotlyLayout, COLORS, sectorColor } from '@/lib/theme';
import { fmtUSD, fmtNGN, fmtPct, isPositive } from '@/lib/formatters';
import ChartCard from '@/components/ui/ChartCard';

export default function CombinedPage() {
  const { data, loading } = usePortfolio();
  const isFirstLoad = loading && !data;

  if (!data && !loading) return null;

  const ck        = data?.combined_kpis;
  const nk        = data?.ngx_kpis;
  const uk        = data?.us_kpis;
  const meta      = data?.meta;
  const usdngn    = meta?.usdngn ?? 1;
  const ngx_stocks = data?.ngx_stocks ?? [];
  const us_stocks  = data?.us_stocks  ?? [];

  // ── Unified bar ────────────────────────────────────────────────────────────
  const allStocks = [
    ...ngx_stocks.map(s => ({
      label:     `${s.Ticker} (NGX)`,
      equityUSD: (s.CurrentEquity ?? 0) / usdngn,
      sector:    s.Sector,
      market:    'NGX',
    })),
    ...us_stocks.map(s => ({
      label:     `${s.Ticker} (US)`,
      equityUSD: s.CurrentEquity ?? 0,
      sector:    s.Sector,
      market:    'US',
    })),
  ].sort((a, b) => b.equityUSD - a.equityUSD);

  const unifiedBar = {
    type: 'bar',
    x: allStocks.map(s => s.label),
    y: allStocks.map(s => s.equityUSD),
    marker: {
      color: allStocks.map(s => s.market === 'NGX' ? COLORS.blue : COLORS.gold),
      opacity: 0.85,
    },
    hovertemplate: '<b>%{x}</b><br>$%{y:,.2f}<extra></extra>',
  };

  // ── Split donut ────────────────────────────────────────────────────────────
  const splitDonut = {
    type: 'pie',
    labels: ['NGX (₦)', 'US ($)'],
    values: [ck?.ngx_usd ?? 0, ck?.us_usd ?? 0],
    hole: 0.55,
    marker: { colors: [COLORS.blue, COLORS.gold] },
    textinfo: 'label+percent',
    textfont: { size: 11 },
    hovertemplate: '<b>%{label}</b><br>$%{value:,.2f}<br>%{percent}<extra></extra>',
  };

  // ── Return comparison ──────────────────────────────────────────────────────
  const ngxReturnBar = {
    name: 'NGX', type: 'bar',
    x: ngx_stocks.map(s => s.Ticker),
    y: ngx_stocks.map(s => s.ReturnPct ?? 0),
    marker: { color: ngx_stocks.map(s => (s.ReturnPct ?? 0) >= 0 ? COLORS.blue : COLORS.red), opacity: 0.85 },
    hovertemplate: '<b>%{x}</b> (NGX)<br>%{y:.1f}%<extra></extra>',
  };
  const usReturnBar = {
    name: 'US', type: 'bar',
    x: us_stocks.map(s => s.Ticker),
    y: us_stocks.map(s => s.ReturnPct ?? 0),
    marker: { color: us_stocks.map(s => (s.ReturnPct ?? 0) >= 0 ? COLORS.gold : COLORS.red), opacity: 0.85 },
    hovertemplate: '<b>%{x}</b> (US)<br>%{y:.1f}%<extra></extra>',
  };

  const ngxRetPct = nk?.cost ? ((nk.gain / nk.cost) * 100) : 0;
  const usRetPct  = uk?.cost ? ((uk.gain / uk.cost)  * 100) : 0;

  // ── Sector breakdown combined donut ───────────────────────────────────────
  const sectorMap: Record<string, number> = {};
  ngx_stocks.forEach(s => {
    const usd = (s.CurrentEquity ?? 0) / usdngn;
    sectorMap[s.Sector] = (sectorMap[s.Sector] ?? 0) + usd;
  });
  us_stocks.forEach(s => {
    sectorMap[s.Sector] = (sectorMap[s.Sector] ?? 0) + (s.CurrentEquity ?? 0);
  });
  const sectorDonut = {
    type: 'pie',
    labels: Object.keys(sectorMap),
    values: Object.values(sectorMap),
    hole: 0.5,
    marker: { colors: Object.keys(sectorMap).map(sectorColor) },
    textinfo: 'label+percent',
    textfont: { size: 10 },
    hovertemplate: '<b>%{label}</b><br>$%{value:,.2f}<br>%{percent}<extra></extra>',
  };

  return (
    <div className="space-y-5">

      {/* KPIs */}
      <div className="flex gap-3 flex-wrap">
        {isFirstLoad ? [...Array(5)].map((_, i) => <ChartSkeleton key={i} height={88} />) : <>
          <KPICard
            label="NGX (USD)" value={fmtUSD(ck?.ngx_usd)}
            sub={`₦${usdngn.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}/USD · ${meta?.fx_source ?? ''}`}
            accent="blue" delay={0}
          />
          <KPICard label="US Portfolio" value={fmtUSD(ck?.us_usd)}    accent="gold"  delay={50}  />
          <KPICard label="Total (USD)"  value={fmtUSD(ck?.total_usd)} accent="green" delay={100} />
          <KPICard
            label="NGX Return" value={fmtPct(ngxRetPct)}
            sub={`${fmtNGN(nk?.gain)} unrealized`}
            accent={isPositive(ngxRetPct) ? 'green' : 'red'} delay={150}
          />
          <KPICard
            label="US Return" value={fmtPct(usRetPct)}
            sub={`${fmtUSD(uk?.gain)} unrealized`}
            accent={isPositive(usRetPct) ? 'green' : 'red'} delay={200}
          />
        </>}
      </div>

      {/* Unified bar */}
      <ChartCard
        title="FX-Adjusted Unified View"
        subtitle="all positions in USD · blue = NGX · gold = US"
        loading={isFirstLoad} height={480}
      >
        <PlotlyChart
          data={[unifiedBar]}
          layout={plotlyLayout({ margin: { t:10,b:80,l:72,r:8 } })}
          height={480}
        />
      </ChartCard>

      {/* Split donut + Return comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard title="NGX vs US Split" subtitle="by USD value" loading={isFirstLoad} height={340}>
          <PlotlyChart
            data={[splitDonut]}
            layout={plotlyLayout({ margin: { t:10,b:10,l:10,r:10 }, showlegend: true,
              legend: { orientation: 'v', x: 1, xanchor: 'left', y: 0.5 } })}
            height={340}
          />
        </ChartCard>
        <ChartCard title="Return Comparison" subtitle="NGX vs US" loading={isFirstLoad} height={340}>
          <PlotlyChart
            data={[ngxReturnBar, usReturnBar]}
            layout={plotlyLayout({ barmode: 'group', margin: { t:10,b:80,l:60,r:8 },
              yaxis: { ticksuffix: '%', zerolinecolor: COLORS.muted } })}
            height={340}
          />
        </ChartCard>
      </div>

      {/* Combined sector donut */}
      <ChartCard title="Combined Sector Breakdown" subtitle="NGX + US in USD" loading={isFirstLoad} height={360}>
        <PlotlyChart
          data={[sectorDonut]}
          layout={plotlyLayout({ margin: { t:10,b:10,l:10,r:10 }, showlegend: true,
            legend: { orientation: 'v', x: 1, xanchor: 'left', y: 0.5 } })}
          height={360}
        />
      </ChartCard>

    </div>
  );
}