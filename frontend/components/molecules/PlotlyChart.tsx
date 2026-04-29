'use client';

/**
 * SSR-safe Plotly wrapper.
 * Plotly.js accesses `window` on import — we lazy-load it client-side only.
 */

import dynamic from 'next/dynamic';
import { ChartSkeleton } from '@/components/atoms/Feedback';
import { PLOTLY_CONFIG } from '@/utils/theme';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Plot = dynamic(() => import('react-plotly.js'), {
  ssr: false,
  loading: ({}) => <ChartSkeleton />,
}) as React.ComponentType<{
  data: Plotly.Data[];
  layout: Partial<Plotly.Layout>;
  config: Partial<Plotly.Config>;
  style: React.CSSProperties;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onClick?: (event: any) => void;
}>;

interface PlotlyChartProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  layout?: Record<string, any>;
  height?: number;
  onClickPoint?: (x: string) => void;
}

export default function PlotlyChart({ data, layout = {}, height = 320, onClickPoint }: PlotlyChartProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleClick = onClickPoint ? (event: any) => {
    const x = event?.points?.[0]?.x;
    if (x != null) onClickPoint(String(x));
  } : undefined;

  return (
    <Plot
      data={data}
      layout={layout}
      config={PLOTLY_CONFIG}
      style={{ width: '100%', height }}
      onClick={handleClick}
    />
  );
}
