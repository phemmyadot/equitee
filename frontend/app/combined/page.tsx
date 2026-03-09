'use client';

import { usePortfolio } from '@/lib/PortfolioContext';
import KPICard          from '@/components/ui/KPICard';
import { ChartSkeleton } from '@/components/ui/Feedback';
import PlotlyChart      from '@/components/charts/PlotlyChart';
import { plotlyLayout, COLORS, sectorColor } from '@/lib/theme';
import { fmtUSD, fmtNGN, fmtPct, isPositive } from '@/lib/formatters';

export default function CombinedPage() {
  const { data, loading } = usePortfolio();

  if (loading && !data) return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap">{[...Array(3)].map((_, i) => <ChartSkeleton key={i} height={90} />)}</div>
      <ChartSkeleton height={500} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartSkeleton height={340} /><ChartSkeleton height={340} />
      </div>
    </div>
  );

  if (!data) return null;
  const { combined_kpis: ck, ngx_kpis: nk, us_kpis: uk, ngx_stocks, us_stocks, meta } = data;
  const usdngn = meta.usdngn;

  // ── Unified bar — all positions in USD ─────────────────────────────────────
  const ngxInUSD = ngx_stocks.map(s => ({
    ...s,
    equityUSD: (s.CurrentEquity ?? 0) / usdngn,
    costUSD:   (s.RemainingCost ?? 0) / usdngn,
    gainUSD:   (s.UnrealizedPL  ?? 0) / usdngn,
  }));

  const allStocks = [
    ...ngxInUSD.map(s => ({ ticker: s.Ticker, name: s.Stock, equityUSD: s.equityUSD, gainUSD: s.gainUSD, sector: s.Sector, market: 'NGX' })),
    ...us_stocks.map(s => ({ ticker: s.Ticker, name: s.Stock, equityUSD: s.CurrentEquity ?? 0, gainUSD: s.UnrealizedPL ?? 0, sector: s.Sector, market: 'US' })),
  ].sort((a, b) => b.equityUSD - a.equityUSD);

  const unifiedBar = {
    type: 'bar',
    x: allStocks.map(s => `${s.ticker} (${s.market})`),
    y: allStocks.map(s => s.equityUSD),
    marker: {
      color: allStocks.map(s => s.market === 'NGX' ? COLORS.blue : COLORS.gold),
      opacity: 0.85,
    },
    hovertemplate: '<b>%{x}</b><br>$%{y:,.2f}<extra></extra>',
  };

  // ── NGX vs US split donut ─────────────────────────────────────────────────
  const splitDonut = {
    type: 'pie',
    labels: ['NGX (₦)', 'US ($)'],
    values: [ck.ngx_usd, ck.us_usd],
    hole: 0.55,
    marker: { colors: [COLORS.blue, COLORS.gold] },
    textinfo: 'label+percent',
    textfont: { size: 11 },
    hovertemplate: '<b>%{label}</b><br>$%{value:,.2f}<br>%{percent}<extra></extra>',
  };

  // ── Return comparison — NGX vs US ─────────────────────────────────────────
  const ngxReturnBar = {
    name: 'NGX',
    type: 'bar',
    x: ngx_stocks.map(s => s.Ticker),
    y: ngx_stocks.map(s => s.ReturnPct ?? 0),
    marker: {
      color: ngx_stocks.map(s => (s.ReturnPct ?? 0) >= 0 ? COLORS.blue : COLORS.red),
      opacity: 0.85,
    },
    hovertemplate: '<b>%{x}</b> (NGX)<br>%{y:.1f}%<extra></extra>',
  };

  const usReturnBar = {
    name: 'US',
    type: 'bar',
    x: us_stocks.map(s => s.Ticker),
    y: us_stocks.map(s => s.ReturnPct ?? 0),
    marker: {
      color: us_stocks.map(s => (s.ReturnPct ?? 0) >= 0 ? COLORS.gold : COLORS.red),
      opacity: 0.85,
    },
    hovertemplate: '<b>%{x}</b> (US)<br>%{y:.1f}%<extra></extra>',
  };

  const ngxRetPct = nk.cost ? (nk.gain / nk.cost * 100) : 0;
  const usRetPct  = uk.cost ? (uk.gain / uk.cost * 100)  : 0;

  return (
    <div className="space-y-5">

      {/* KPIs */}
      <div className="flex gap-3 flex-wrap">
        <KPICard
          label="NGX (USD)"
          value={fmtUSD(ck.ngx_usd)}
          sub={`₦${usdngn.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}/USD · ${meta.fx_source}`}
          accent="blue"
          delay={0}
        />
        <KPICard label="US Portfolio" value={fmtUSD(ck.us_usd)}    accent="gold"                               delay={50}  />
        <KPICard label="Total (USD)"  value={fmtUSD(ck.total_usd)} accent="green"                              delay={100} />
        <KPICard
          label="NGX Return"
          value={fmtPct(ngxRetPct)}
          sub={`${fmtNGN(nk.gain)} unrealized`}
          accent={isPositive(ngxRetPct) ? 'green' : 'red'}
          delay={150}
        />
        <KPICard
          label="US Return"
          value={fmtPct(usRetPct)}
          sub={`${fmtUSD(uk.gain)} unrealized`}
          accent={isPositive(usRetPct) ? 'green' : 'red'}
          delay={200}
        />
      </div>

      {/* Unified bar */}
      <div className="chart-card">
        <div className="chart-title">
          FX-Adjusted Unified View <span>all positions in USD · blue = NGX · gold = US</span>
        </div>
        <PlotlyChart
          data={[unifiedBar]}
          layout={plotlyLayout({ margin: { t:10,b:80,l:72,r:8 } })}
          height={480}
        />
      </div>

      {/* Split donut + Return comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="chart-card">
          <div className="chart-title">NGX vs US Split <span>by USD value</span></div>
          <PlotlyChart
            data={[splitDonut]}
            layout={plotlyLayout({ margin: { t:10,b:10,l:10,r:10 }, showlegend: true,
              legend: { orientation: 'v', x: 1, xanchor: 'left', y: 0.5 } })}
            height={340}
          />
        </div>
        <div className="chart-card">
          <div className="chart-title">Return Comparison <span>NGX vs US</span></div>
          <PlotlyChart
            data={[ngxReturnBar, usReturnBar]}
            layout={plotlyLayout({
              barmode: 'group',
              margin: { t:10,b:80,l:60,r:8 },
              yaxis: { ticksuffix: '%', zerolinecolor: COLORS.muted },
            })}
            height={340}
          />
        </div>
      </div>

    </div>
  );
}