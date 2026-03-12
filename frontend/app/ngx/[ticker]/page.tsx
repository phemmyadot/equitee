'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { usePortfolio } from '@/lib/PortfolioContext';
import { fetchTickerData } from '@/lib/api';
import KPICard from '@/components/ui/KPICard';
import ChartCard from '@/components/ui/ChartCard';
import Sparkline from '@/components/ui/Sparkline';
import { ChartSkeleton } from '@/components/ui/Feedback';
import { sectorColor } from '@/lib/theme';
import { fmtNGN, fmtNGNFull, fmtPct, fmtPct2, fmtVol, isPositive } from '@/lib/formatters';
import type { StockRow } from '@/lib/api';

interface MetricSection {
  title: string;
  subtitle: string;
  metrics: Array<{
    label: string;
    getValue: (data: any) => string;
    accent: (data: any) => 'gain' | 'loss' | 'neutral' | 'warn' | 'accent';
  }>;
}

export default function StockDetailsPage() {
  const parent = useRouter();
  const params = useParams();
  const ticker = params.ticker as string;
  const { data } = usePortfolio();

  const [tickerData, setTickerData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const stock = (data?.ngx_stocks ?? []).find(s => s.Ticker === ticker);

  useEffect(() => {
    async function loadTickerData() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchTickerData(ticker);
        setTickerData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load ticker data');
      } finally {
        setLoading(false);
      }
    }
    if (ticker) {
      loadTickerData();
    }
  }, [ticker]);

  if (!loading && !stock) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => parent.back()}
            className="px-3 py-2 rounded text-[var(--ink-3)] hover:bg-[var(--border)] text-sm"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-[var(--ink)]">Stock Not Found</h1>
        </div>
      </div>
    );
  }

  const isFirstLoad = loading || !tickerData;

  // Helper to render metric cards in a section
  const renderMetricGrid = (metrics: any[], cols: number, isFirstLoad: boolean) => {
    const colMap: Record<number, string> = {
      3: 'lg:grid-cols-3',
      4: 'lg:grid-cols-4',
      5: 'lg:grid-cols-5',
      6: 'lg:grid-cols-6',
    };
    return (
      <div className={`grid grid-cols-2 sm:grid-cols-3 ${colMap[cols] || colMap[5]} gap-3`}>
        {isFirstLoad
          ? [...Array(Math.min(cols, 5))].map((_, i) => <ChartSkeleton key={i} height={88} />)
          : metrics}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with back button and ticker info */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => parent.back()}
          className="px-3 py-2 rounded text-[var(--ink-3)] hover:bg-[var(--border)] text-sm"
        >
          ← Back to NGX
        </button>
        {isFirstLoad ? (
          <ChartSkeleton height={40} />
        ) : (
          <div>
            <h1 className="text-3xl font-bold text-[var(--ink)]">{stock?.Ticker}</h1>
            <p className="text-sm text-[var(--ink-3)]">{stock?.Stock}</p>
          </div>
        )}
      </div>

      {/* 1. INVESTMENT THESIS - Core decision metrics */}
      <div className="space-y-3 p-4 rounded-lg bg-[var(--canvas)] border border-[var(--border)]">
        <div>
          <h2 className="text-lg font-bold text-[var(--ink)]">💡 Investment Thesis</h2>
          <p className="text-xs text-[var(--ink-3)]">Key metrics for investment decision</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {isFirstLoad
            ? [...Array(6)].map((_, i) => <ChartSkeleton key={i} height={88} />)
            : stock && tickerData && (
                <>
                  <KPICard
                    label="Live Price"
                    value={stock.LivePrice ? fmtNGNFull(stock.LivePrice) : '—'}
                    accent="neutral"
                    delay={0}
                  />
                  <KPICard
                    label="Day Change"
                    value={stock.LiveChangePct != null ? fmtPct2(stock.LiveChangePct) : '—'}
                    accent={stock.LiveChangePct != null && isPositive(stock.LiveChangePct) ? 'gain' : 'loss'}
                    delay={50}
                  />
                  <KPICard
                    label="P/E Ratio"
                    value={tickerData.overview?.pe_ratio ? `${tickerData.overview.pe_ratio.toFixed(1)}x` : '—'}
                    accent={tickerData.overview?.pe_ratio && tickerData.overview.pe_ratio < 15 ? 'gain' : 'neutral'}
                    delay={100}
                  />
                  <KPICard
                    label="Div Yield"
                    value={tickerData.overview?.dividend_yield ? fmtPct(tickerData.overview.dividend_yield) : '—'}
                    accent={tickerData.overview?.dividend_yield && isPositive(tickerData.overview.dividend_yield) ? 'gain' : 'neutral'}
                    delay={150}
                  />
                  <KPICard
                    label="ROE"
                    value={tickerData.overview?.roe ? `${tickerData.overview.roe.toFixed(0)}%` : '—'}
                    accent={tickerData.overview?.roe && isPositive(tickerData.overview.roe) ? 'gain' : 'neutral'}
                    delay={200}
                  />
                  <KPICard
                    label="1Y Return"
                    value={tickerData.performance?.return_1y ? fmtPct(tickerData.performance.return_1y) : '—'}
                    accent={tickerData.performance?.return_1y && isPositive(tickerData.performance.return_1y) ? 'gain' : 'loss'}
                    delay={250}
                  />
                </>
              )}
        </div>
      </div>

      {/* 2. BUSINESS QUALITY - Is this a good business? */}
      <div className="space-y-3 p-4 rounded-lg bg-[var(--canvas)] border border-[var(--border)]">
        <div>
          <h2 className="text-lg font-bold text-[var(--ink)]">📊 Business Quality</h2>
          <p className="text-xs text-[var(--ink-3)]">Profitability and earnings power</p>
        </div>
        {renderMetricGrid(
          isFirstLoad ? [] : tickerData ? [
            <KPICard
              key="gross-margin"
              label="Gross Margin"
              value={tickerData.overview?.gross_margin != null ? fmtPct(tickerData.overview.gross_margin) : '—'}
              accent="neutral"
              delay={0}
            />,
            <KPICard
              key="operating-margin"
              label="Operating Margin"
              value={tickerData.performance?.operating_margin != null ? fmtPct(tickerData.performance.operating_margin) : '—'}
              accent={tickerData.performance?.operating_margin && isPositive(tickerData.performance.operating_margin) ? 'gain' : 'neutral'}
              delay={50}
            />,
            <KPICard
              key="net-margin"
              label="Net Margin"
              value={tickerData.overview?.net_margin != null ? fmtPct(tickerData.overview.net_margin) : '—'}
              accent={tickerData.overview?.net_margin && isPositive(tickerData.overview.net_margin) ? 'gain' : 'neutral'}
              delay={100}
            />,
            <KPICard
              key="ebitda-margin"
              label="EBITDA Margin"
              value={tickerData.performance?.ebitda_margin != null ? fmtPct(tickerData.performance.ebitda_margin) : '—'}
              accent="neutral"
              delay={150}
            />,
            <KPICard
              key="fcf-margin"
              label="FCF Margin"
              value={tickerData.performance?.fcf_margin != null ? fmtPct(tickerData.performance.fcf_margin) : '—'}
              accent={tickerData.performance?.fcf_margin && isPositive(tickerData.performance.fcf_margin) ? 'gain' : 'neutral'}
              delay={200}
            />,
          ] : [],
          5,
          isFirstLoad
        )}
      </div>

      {/* 3. CAPITAL EFFICIENCY - Returns on invested capital */}
      <div className="space-y-3 p-4 rounded-lg bg-[var(--canvas)] border border-[var(--border)]">
        <div>
          <h2 className="text-lg font-bold text-[var(--ink)]">⚡ Capital Efficiency</h2>
          <p className="text-xs text-[var(--ink-3)]">Management of invested capital</p>
        </div>
        {renderMetricGrid(
          isFirstLoad ? [] : tickerData ? [
            <KPICard
              key="roa"
              label="ROA"
              value={tickerData.performance?.roa != null ? fmtPct(tickerData.performance.roa) : '—'}
              accent={tickerData.performance?.roa && isPositive(tickerData.performance.roa) ? 'gain' : 'neutral'}
              delay={0}
            />,
            <KPICard
              key="roic"
              label="ROIC"
              value={tickerData.performance?.roic != null ? fmtPct(tickerData.performance.roic) : '—'}
              accent={tickerData.performance?.roic && tickerData.performance.roic > 15 ? 'gain' : 'neutral'}
              delay={50}
            />,
            <KPICard
              key="roce"
              label="ROCE"
              value={tickerData.performance?.roce != null ? fmtPct(tickerData.performance.roce) : '—'}
              accent={tickerData.performance?.roce && tickerData.performance.roce > 15 ? 'gain' : 'neutral'}
              delay={100}
            />,
            <KPICard
              key="asset-turnover"
              label="Asset Turnover"
              value={tickerData.performance?.asset_turnover != null ? `${tickerData.performance.asset_turnover.toFixed(2)}x` : '—'}
              accent="neutral"
              delay={150}
            />,
          ] : [],
          4,
          isFirstLoad
        )}
      </div>

      {/* 4. FINANCIAL HEALTH - Debt and liquidity */}
      <div className="space-y-3 p-4 rounded-lg bg-[var(--canvas)] border border-[var(--border)]">
        <div>
          <h2 className="text-lg font-bold text-[var(--ink)]">🛡️ Financial Health</h2>
          <p className="text-xs text-[var(--ink-3)]">Debt capacity and liquidity</p>
        </div>
        {renderMetricGrid(
          isFirstLoad ? [] : tickerData ? [
            <KPICard
              key="current-ratio"
              label="Current Ratio"
              value={tickerData.overview?.current_ratio != null ? `${tickerData.overview.current_ratio.toFixed(2)}` : '—'}
              accent={tickerData.overview?.current_ratio && tickerData.overview.current_ratio >= 1 ? 'gain' : 'warn'}
              delay={0}
            />,
            <KPICard
              key="quick-ratio"
              label="Quick Ratio"
              value={tickerData.performance?.quick_ratio != null ? `${tickerData.performance.quick_ratio.toFixed(2)}` : '—'}
              accent={tickerData.performance?.quick_ratio && tickerData.performance.quick_ratio >= 1 ? 'gain' : 'neutral'}
              delay={50}
            />,
            <KPICard
              key="debt-to-equity"
              label="Debt/Equity"
              value={tickerData.overview?.debt_to_equity ? `${tickerData.overview.debt_to_equity.toFixed(2)}x` : '—'}
              accent={tickerData.overview?.debt_to_equity && tickerData.overview.debt_to_equity < 2 ? 'gain' : 'warn'}
              delay={100}
            />,
            <KPICard
              key="debt-ebitda"
              label="Debt/EBITDA"
              value={tickerData.performance?.debt_ebitda != null ? `${tickerData.performance.debt_ebitda.toFixed(2)}x` : '—'}
              accent={tickerData.performance?.debt_ebitda && tickerData.performance.debt_ebitda <= 3 ? 'gain' : 'warn'}
              delay={150}
            />,
            <KPICard
              key="interest-coverage"
              label="Interest Coverage"
              value={tickerData.performance?.interest_coverage != null ? `${tickerData.performance.interest_coverage.toFixed(2)}x` : '—'}
              accent={tickerData.performance?.interest_coverage && tickerData.performance.interest_coverage >= 3 ? 'gain' : 'warn'}
              delay={200}
            />,
          ] : [],
          5,
          isFirstLoad
        )}
      </div>

      {/* 5. CASH GENERATION - Free cash flow and operating metrics */}
      <div className="space-y-3 p-4 rounded-lg bg-[var(--canvas)] border border-[var(--border)]">
        <div>
          <h2 className="text-lg font-bold text-[var(--ink)]">💰 Cash Generation</h2>
          <p className="text-xs text-[var(--ink-3)]">Operating and free cash flow metrics</p>
        </div>
        {renderMetricGrid(
          isFirstLoad ? [] : tickerData ? [
            <KPICard
              key="fcf"
              label="Free Cash Flow"
              value={tickerData.performance?.free_cash_flow != null ? `₦${(tickerData.performance.free_cash_flow / 1000000).toFixed(1)}M` : '—'}
              accent="neutral"
              delay={0}
            />,
            <KPICard
              key="fcf-per-share"
              label="FCF Per Share"
              value={tickerData.performance?.fcf_per_share != null ? fmtNGN(tickerData.performance.fcf_per_share) : '—'}
              accent="neutral"
              delay={50}
            />,
            <KPICard
              key="operating-cf"
              label="Operating CF"
              value={tickerData.performance?.operating_cash_flow != null ? `₦${(tickerData.performance.operating_cash_flow / 1000000).toFixed(1)}M` : '—'}
              accent="neutral"
              delay={100}
            />,
            <KPICard
              key="capex"
              label="CapEx"
              value={tickerData.performance?.capex != null ? `₦${(tickerData.performance.capex / 1000000).toFixed(1)}M` : '—'}
              accent="neutral"
              delay={150}
            />,
            <KPICard
              key="fcf-yield"
              label="FCF Yield"
              value={tickerData.performance?.fcf_yield != null ? fmtPct(tickerData.performance.fcf_yield) : '—'}
              accent={tickerData.performance?.fcf_yield && isPositive(tickerData.performance.fcf_yield) ? 'gain' : 'neutral'}
              delay={200}
            />,
          ] : [],
          5,
          isFirstLoad
        )}
      </div>

      {/* 6. GROWTH & MOMENTUM - 52-week and YoY metrics */}
      <div className="space-y-3 p-4 rounded-lg bg-[var(--canvas)] border border-[var(--border)]">
        <div>
          <h2 className="text-lg font-bold text-[var(--ink)]">📈 Growth & Momentum</h2>
          <p className="text-xs text-[var(--ink-3)]">Price action and growth trends</p>
        </div>
        {renderMetricGrid(
          isFirstLoad ? [] : tickerData ? [
            <KPICard
              key="week52-high"
              label="52W High"
              value={tickerData.performance?.week_52_high ? fmtNGNFull(tickerData.performance.week_52_high) : '—'}
              accent="neutral"
              delay={0}
            />,
            <KPICard
              key="week52-low"
              label="52W Low"
              value={tickerData.performance?.week_52_low ? fmtNGNFull(tickerData.performance.week_52_low) : '—'}
              accent="neutral"
              delay={50}
            />,
            <KPICard
              key="week52-change"
              label="52W Change"
              value={tickerData.performance?.week_52_change ? fmtPct(tickerData.performance.week_52_change) : '—'}
              accent={tickerData.performance?.week_52_change && isPositive(tickerData.performance.week_52_change) ? 'gain' : 'loss'}
              delay={100}
            />,
            <KPICard
              key="revenue-growth"
              label="Revenue Growth"
              value={tickerData.performance?.revenue_growth_yoy != null ? fmtPct(tickerData.performance.revenue_growth_yoy) : '—'}
              accent={tickerData.performance?.revenue_growth_yoy && isPositive(tickerData.performance.revenue_growth_yoy) ? 'gain' : 'neutral'}
              delay={150}
            />,
            <KPICard
              key="earnings-growth"
              label="Earnings Growth"
              value={tickerData.performance?.earnings_growth_yoy != null ? fmtPct(tickerData.performance.earnings_growth_yoy) : '—'}
              accent={tickerData.performance?.earnings_growth_yoy && isPositive(tickerData.performance.earnings_growth_yoy) ? 'gain' : 'neutral'}
              delay={200}
            />,
          ] : [],
          5,
          isFirstLoad
        )}
      </div>

      {/* 7. VALUATION - Price multiples */}
      <div className="space-y-3 p-4 rounded-lg bg-[var(--canvas)] border border-[var(--border)]">
        <div>
          <h2 className="text-lg font-bold text-[var(--ink)]">💵 Valuation</h2>
          <p className="text-xs text-[var(--ink-3)]">Price multiples and relative value</p>
        </div>
        {renderMetricGrid(
          isFirstLoad ? [] : tickerData ? [
            <KPICard
              key="market-cap"
              label="Market Cap"
              value={tickerData.overview?.market_cap ? `₦${tickerData.overview.market_cap.toFixed(2)}T` : '—'}
              accent="neutral"
              delay={0}
            />,
            <KPICard
              key="ev-ebitda"
              label="EV/EBITDA"
              value={tickerData.performance?.ev_ebitda != null ? `${tickerData.performance.ev_ebitda.toFixed(2)}x` : '—'}
              accent="neutral"
              delay={50}
            />,
            <KPICard
              key="ev-fcf"
              label="EV/FCF"
              value={tickerData.performance?.ev_fcf != null ? `${tickerData.performance.ev_fcf.toFixed(2)}x` : '—'}
              accent="neutral"
              delay={100}
            />,
            <KPICard
              key="price-to-book"
              label="P/B Ratio"
              value={tickerData.performance?.price_to_book != null ? `${tickerData.performance.price_to_book.toFixed(2)}x` : '—'}
              accent="neutral"
              delay={150}
            />,
            <KPICard
              key="price-to-sales"
              label="P/S Ratio"
              value={tickerData.performance?.price_to_sales != null ? `${tickerData.performance.price_to_sales.toFixed(2)}x` : '—'}
              accent="neutral"
              delay={200}
            />,
          ] : [],
          5,
          isFirstLoad
        )}
      </div>

      {/* 8. QUALITY SCORES - Piotroski and Altman (Phase 5) */}
      <div className="space-y-3 p-4 rounded-lg bg-[var(--canvas)] border border-[var(--border)]">
        <div>
          <h2 className="text-lg font-bold text-[var(--ink)]">🏆 Quality Scores</h2>
          <p className="text-xs text-[var(--ink-3)]">Financial strength indicators</p>
        </div>
        {renderMetricGrid(
          isFirstLoad ? [] : tickerData ? [
            <KPICard
              key="piotroski"
              label="Piotroski F-Score"
              value={tickerData.performance?.piotroski_score != null ? `${tickerData.performance.piotroski_score}/9` : '—'}
              accent={tickerData.performance?.piotroski_score && tickerData.performance.piotroski_score >= 6 ? 'gain' : 'neutral'}
              delay={0}
            />,
            <KPICard
              key="altman"
              label="Altman Z-Score"
              value={tickerData.performance?.altman_zscore != null ? tickerData.performance.altman_zscore.toFixed(2) : '—'}
              accent={tickerData.performance?.altman_zscore && tickerData.performance.altman_zscore > 3 ? 'gain' : 'neutral'}
              delay={50}
            />,
          ] : [],
          2,
          isFirstLoad
        )}
      </div>

      {/* 9. YOUR HOLDINGS - Personal position metrics */}
      <div className="space-y-3 p-4 rounded-lg bg-[var(--canvas)] border border-[var(--border)]">
        <div>
          <h2 className="text-lg font-bold text-[var(--ink)]">💼 Your Holdings</h2>
          <p className="text-xs text-[var(--ink-3)]">Your personal position details</p>
        </div>
        {renderMetricGrid(
          isFirstLoad ? [] : stock ? [
            <KPICard
              key="shares"
              label="Shares Owned"
              value={stock.Shares ? stock.Shares.toLocaleString() : '—'}
              accent="neutral"
              delay={0}
            />,
            <KPICard
              key="cost"
              label="Total Cost"
              value={stock.RemainingCost ? fmtNGN(stock.RemainingCost) : '—'}
              accent="neutral"
              delay={50}
            />,
            <KPICard
              key="equity"
              label="Current Value"
              value={stock.CurrentEquity ? fmtNGN(stock.CurrentEquity) : '—'}
              accent="accent"
              delay={100}
            />,
            <KPICard
              key="pl"
              label="Unrealized Gain/Loss"
              value={stock.UnrealizedPL ? fmtNGN(stock.UnrealizedPL) : '—'}
              accent={stock.UnrealizedPL != null && isPositive(stock.UnrealizedPL) ? 'gain' : 'loss'}
              delay={150}
            />,
            <KPICard
              key="return"
              label="Return %"
              value={stock.ReturnPct != null ? fmtPct(stock.ReturnPct) : '—'}
              accent={stock.ReturnPct != null && isPositive(stock.ReturnPct) ? 'gain' : 'loss'}
              delay={200}
            />,
          ] : [],
          5,
          isFirstLoad
        )}
      </div>

      {/* 10. COMPANY PROFILE */}
      {!isFirstLoad && tickerData?.profile && (
        <div className="space-y-3 p-4 rounded-lg bg-[var(--canvas)] border border-[var(--border)]">
          <h2 className="text-lg font-bold text-[var(--ink)]">🏢 Company Profile</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
            <div className="space-y-1">
              <p className="text-[var(--ink-3)]">Industry</p>
              <p className="text-[var(--ink)] font-medium">{tickerData.profile.industry || '—'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[var(--ink-3)]">Founded</p>
              <p className="text-[var(--ink)] font-medium">{tickerData.profile.founded || '—'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[var(--ink-3)]">Website</p>
              {tickerData.profile.website && (
                <a href={tickerData.profile.website} target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline text-sm">
                  {new URL(tickerData.profile.website).hostname}
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 11. PRICE CHART */}
      {!isFirstLoad && stock && (
        <ChartCard title="90-Day Price" subtitle="activity" loading={isFirstLoad} height={300}>
          <div className="flex items-center justify-center h-[300px]">
            <Sparkline ticker={stock.Ticker} />
          </div>
        </ChartCard>
      )}
    </div>
  );
}
