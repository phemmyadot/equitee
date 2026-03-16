'use client';

import { usePriceHistory } from '@/hooks/useHistory';
import type { PricePoint } from '@/services/api';

interface SparklineProps {
  ticker: string;
  days?:  number;
  width?: number;
  height?: number;
}

function buildPath(points: PricePoint[], w: number, h: number): string {
  const prices = points.map(p => p.price).filter((p): p is number => p != null);
  if (prices.length < 2) return '';

  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const pad = 2;

  const xs = prices.map((_, i) => pad + (i / (prices.length - 1)) * (w - pad * 2));
  const ys = prices.map(p => pad + (1 - (p - min) / range) * (h - pad * 2));

  return xs
    .map((x, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${ys[i].toFixed(1)}`)
    .join(' ');
}

export default function Sparkline({ ticker, days = 90, width = 80, height = 28 }: SparklineProps) {
  const { data, loading } = usePriceHistory(ticker, days);

  if (loading) {
    return (
      <div
        className="skeleton rounded"
        style={{ width, height }}
      />
    );
  }

  const points = data?.points ?? [];
  if (points.length < 2) {
    return <span className="text-[var(--ink-4)] text-[10px] font-mono">—</span>;
  }

  const path = buildPath(points, width, height);
  const prices = points.map(p => p.price).filter((p): p is number => p != null);
  const first = prices[0];
  const last  = prices[prices.length - 1];
  const isUp  = last >= first;
  const color = isUp ? 'var(--gain)' : 'var(--loss)';

  // Fill area under the line
  const fillPath = path + ` L${(width - 2).toFixed(1)},${height} L2,${height} Z`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ display: 'block', overflow: 'visible' }}
      aria-label={`${ticker} price sparkline`}
    >
      {/* Area fill */}
      <path
        d={fillPath}
        fill={color}
        opacity={0.08}
      />
      {/* Line */}
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* End dot */}
      <circle
        cx={parseFloat(path.split(' ').at(-1)!.replace(/^L/, '').split(',')[0])}
        cy={parseFloat(path.split(' ').at(-1)!.split(',')[1])}
        r={2}
        fill={color}
      />
    </svg>
  );
}