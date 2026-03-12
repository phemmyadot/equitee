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

  return (
    <div className="space-y-5">
      {/* Header with back button */}
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
            <h1 className="text-2xl font-bold text-[var(--ink)]">
              {stock?.Ticker} · {stock?.Stock}
            </h1>
            <p className="text-sm text-[var(--ink-3)]">Detailed holdings information</p>
          </div>
        )}
      </div>

      {/* Key Metrics - Price, Day Change, High, Low, Volume */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-[var(--ink)] uppercase">Price & Trading</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {isFirstLoad
            ? [...Array(5)].map((_, i) => <ChartSkeleton key={i} height={88} />)
            : stock && (
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
                    label="Day High"
                    value={stock.DayHigh ? fmtNGNFull(stock.DayHigh) : '—'}
                    accent="neutral"
                    delay={100}
                  />
                  <KPICard
                    label="Day Low"
                    value={stock.DayLow ? fmtNGNFull(stock.DayLow) : '—'}
                    accent="neutral"
                    delay={150}
                  />
                  <KPICard
                    label="Volume"
                    value={stock.Volume ? fmtVol(stock.Volume) : '—'}
                    accent="neutral"
                    delay={200}
                  />
                </>
              )}
        </div>
      </div>

      {/* Valuation & Fundamental Metrics from API */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-[var(--ink)] uppercase">Valuation & Fundamentals</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {isFirstLoad
            ? [...Array(6)].map((_, i) => <ChartSkeleton key={i} height={88} />)
            : tickerData && (
                <>
                  <KPICard
                    label="Market Cap"
                    value={tickerData.overview?.market_cap ? `₦${tickerData.overview.market_cap.toFixed(2)}T` : '—'}
                    accent="neutral"
                    delay={0}
                  />
                  <KPICard
                    label="P/E Ratio"
                    value={tickerData.overview?.pe_ratio ? `${tickerData.overview.pe_ratio.toFixed(2)}x` : '—'}
                    accent="neutral"
                    delay={50}
                  />
                  <KPICard
                    label="EPS"
                    value={tickerData.overview?.eps ? fmtNGN(tickerData.overview.eps) : '—'}
                    accent="neutral"
                    delay={100}
                  />
                  <KPICard
                    label="Book Value"
                    value={tickerData.overview?.book_value ? fmtNGN(tickerData.overview.book_value) : '—'}
                    accent="neutral"
                    delay={150}
                  />
                  <KPICard
                    label="Dividend Yield"
                    value={tickerData.overview?.dividend_yield ? fmtPct(tickerData.overview.dividend_yield) : '—'}
                    accent={tickerData.overview?.dividend_yield && isPositive(tickerData.overview.dividend_yield) ? 'gain' : 'neutral'}
                    delay={200}
                  />
                  <KPICard
                    label="ROE"
                    value={tickerData.overview?.roe ? `${tickerData.overview.roe.toFixed(2)}%` : '—'}
                    accent={tickerData.overview?.roe && isPositive(tickerData.overview.roe) ? 'gain' : 'neutral'}
                    delay={250}
                  />
                </>
              )}
        </div>
      </div>

      {/* Risk & Performance Metrics */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-[var(--ink)] uppercase">Profitability & Margins</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {isFirstLoad
            ? [...Array(5)].map((_, i) => <ChartSkeleton key={i} height={88} />)
            : tickerData && (
                <>
                  <KPICard
                    label="Gross Margin"
                    value={tickerData.overview?.gross_margin != null ? fmtPct(tickerData.overview.gross_margin) : '—'}
                    accent="neutral"
                    delay={0}
                  />
                  <KPICard
                    label="Operating Margin"
                    value={tickerData.performance?.operating_margin != null ? fmtPct(tickerData.performance.operating_margin) : '—'}
                    accent={tickerData.performance?.operating_margin && isPositive(tickerData.performance.operating_margin) ? 'gain' : 'neutral'}
                    delay={50}
                  />
                  <KPICard
                    label="Net Margin"
                    value={tickerData.overview?.net_margin != null ? fmtPct(tickerData.overview.net_margin) : '—'}
                    accent={tickerData.overview?.net_margin && isPositive(tickerData.overview.net_margin) ? 'gain' : 'neutral'}
                    delay={100}
                  />
                  <KPICard
                    label="EBITDA Margin"
                    value={tickerData.performance?.ebitda_margin != null ? fmtPct(tickerData.performance.ebitda_margin) : '—'}
                    accent="neutral"
                    delay={150}
                  />
                  <KPICard
                    label="FCF Margin"
                    value={tickerData.performance?.fcf_margin != null ? fmtPct(tickerData.performance.fcf_margin) : '—'}
                    accent={tickerData.performance?.fcf_margin && isPositive(tickerData.performance.fcf_margin) ? 'gain' : 'neutral'}
                    delay={200}
                  />
                </>
              )}
        </div>
      </div>

      {/* Efficiency Metrics */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-[var(--ink)] uppercase">Efficiency & Returns</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {isFirstLoad
            ? [...Array(4)].map((_, i) => <ChartSkeleton key={i} height={88} />)
            : tickerData && (
                <>
                  <KPICard
                    label="ROA"
                    value={tickerData.performance?.roa != null ? fmtPct(tickerData.performance.roa) : '—'}
                    accent={tickerData.performance?.roa && isPositive(tickerData.performance.roa) ? 'gain' : 'neutral'}
                    delay={0}
                  />
                  <KPICard
                    label="ROIC"
                    value={tickerData.performance?.roic != null ? fmtPct(tickerData.performance.roic) : '—'}
                    accent={tickerData.performance?.roic && isPositive(tickerData.performance.roic) ? 'gain' : 'neutral'}
                    delay={50}
                  />
                  <KPICard
                    label="ROCE"
                    value={tickerData.performance?.roce != null ? fmtPct(tickerData.performance.roce) : '—'}
                    accent={tickerData.performance?.roce && isPositive(tickerData.performance.roce) ? 'gain' : 'neutral'}
                    delay={100}
                  />
                  <KPICard
                    label="Asset Turnover"
                    value={tickerData.performance?.asset_turnover != null ? `${tickerData.performance.asset_turnover.toFixed(2)}x` : '—'}
                    accent="neutral"
                    delay={150}
                  />
                </>
              )}
        </div>
      </div>

      {/* Cash Flow Metrics */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-[var(--ink)] uppercase">Cash Flow</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {isFirstLoad
            ? [...Array(5)].map((_, i) => <ChartSkeleton key={i} height={88} />)
            : tickerData && (
                <>
                  <KPICard
                    label="Free Cash Flow"
                    value={tickerData.performance?.free_cash_flow != null ? fmtNGN(tickerData.performance.free_cash_flow) : '—'}
                    accent="neutral"
                    delay={0}
                  />
                  <KPICard
                    label="FCF Per Share"
                    value={tickerData.performance?.fcf_per_share != null ? fmtNGN(tickerData.performance.fcf_per_share) : '—'}
                    accent="neutral"
                    delay={50}
                  />
                  <KPICard
                    label="Operating CF"
                    value={tickerData.performance?.operating_cash_flow != null ? fmtNGN(tickerData.performance.operating_cash_flow) : '—'}
                    accent="neutral"
                    delay={100}
                  />
                  <KPICard
                    label="CapEx"
                    value={tickerData.performance?.capex != null ? fmtNGN(tickerData.performance.capex) : '—'}
                    accent="neutral"
                    delay={150}
                  />
                  <KPICard
                    label="FCF Yield"
                    value={tickerData.performance?.fcf_yield != null ? fmtPct(tickerData.performance.fcf_yield) : '—'}
                    accent={tickerData.performance?.fcf_yield && isPositive(tickerData.performance.fcf_yield) ? 'gain' : 'neutral'}
                    delay={200}
                  />
                </>
              )}
        </div>
      </div>

      {/* Risk & Performance Metrics */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-[var(--ink)] uppercase">Valuation & Financial Health</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {isFirstLoad
            ? [...Array(5)].map((_, i) => <ChartSkeleton key={i} height={88} />)
            : tickerData && (
                <>
                  <KPICard
                    label="EV/EBITDA"
                    value={tickerData.performance?.ev_ebitda != null ? `${tickerData.performance.ev_ebitda.toFixed(2)}x` : '—'}
                    accent="neutral"
                    delay={0}
                  />
                  <KPICard
                    label="EV/FCF"
                    value={tickerData.performance?.ev_fcf != null ? `${tickerData.performance.ev_fcf.toFixed(2)}x` : '—'}
                    accent="neutral"
                    delay={50}
                  />
                  <KPICard
                    label="Current Ratio"
                    value={tickerData.overview?.current_ratio != null ? `${tickerData.overview.current_ratio.toFixed(2)}` : '—'}
                    accent={tickerData.overview?.current_ratio && tickerData.overview.current_ratio >= 1 ? 'gain' : 'warn'}
                    delay={100}
                  />
                  <KPICard
                    label="Interest Coverage"
                    value={tickerData.performance?.interest_coverage != null ? `${tickerData.performance.interest_coverage.toFixed(2)}x` : '—'}
                    accent={tickerData.performance?.interest_coverage && tickerData.performance.interest_coverage >= 3 ? 'gain' : 'warn'}
                    delay={150}
                  />
                  <KPICard
                    label="Debt/EBITDA"
                    value={tickerData.performance?.debt_ebitda != null ? `${tickerData.performance.debt_ebitda.toFixed(2)}x` : '—'}
                    accent={tickerData.performance?.debt_ebitda && tickerData.performance.debt_ebitda <= 3 ? 'gain' : 'neutral'}
                    delay={200}
                  />
                </>
              )}
        </div>
      </div>

      {/* Company Profile */}
      {!isFirstLoad && tickerData?.profile && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-[var(--ink)] uppercase">Company Profile</h3>
          <div className="bg-white rounded-lg p-4 border border-[var(--border)]">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--ink-3)]">Industry</span>
                <span className="text-[var(--ink)] font-medium">{tickerData.profile.industry || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--ink-3)]">Founded</span>
                <span className="text-[var(--ink)] font-medium">{tickerData.profile.founded || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--ink-3)]">Website</span>
                <a href={tickerData.profile.website} target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline text-[12px]">
                  {tickerData.profile.website ? new URL(tickerData.profile.website).hostname : '—'}
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Portfolio metrics - Shares, Cost, Equity, G/L, Return */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-[var(--ink)] uppercase">Your Holdings</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {isFirstLoad
            ? [...Array(5)].map((_, i) => <ChartSkeleton key={i} height={88} />)
            : stock && (
                <>
                  <KPICard
                    label="Shares Owned"
                    value={stock.Shares ? stock.Shares.toLocaleString() : '—'}
                    accent="neutral"
                    delay={0}
                  />
                  <KPICard
                    label="Total Cost"
                    value={stock.RemainingCost ? fmtNGN(stock.RemainingCost) : '—'}
                    accent="neutral"
                    delay={50}
                  />
                  <KPICard
                    label="Current Equity"
                    value={stock.CurrentEquity ? fmtNGN(stock.CurrentEquity) : '—'}
                    accent="accent"
                    delay={100}
                  />
                  <KPICard
                    label="Unrealized G/L"
                    value={stock.UnrealizedPL ? fmtNGN(stock.UnrealizedPL) : '—'}
                    accent={stock.UnrealizedPL != null && isPositive(stock.UnrealizedPL) ? 'gain' : 'loss'}
                    delay={150}
                  />
                  <KPICard
                    label="Return"
                    value={stock.ReturnPct != null ? fmtPct(stock.ReturnPct) : '—'}
                    accent={stock.ReturnPct != null && isPositive(stock.ReturnPct) ? 'gain' : 'loss'}
                    delay={200}
                  />
                </>
              )}
        </div>
      </div>

      {/* Price Chart / Sparkline */}
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
