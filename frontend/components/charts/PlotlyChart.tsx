'use client';

/**
 * SSR-safe Plotly wrapper.
 * Plotly.js accesses `window` on import — we lazy-load it client-side only.
 *
 * Usage:
 *   <PlotlyChart data={[...]} layout={{...}} height={320} />
 */

import dynamic from 'next/dynamic';
import { ChartSkeleton } from '@/components/ui/Feedback';
import { PLOTLY_CONFIG } from '@/lib/theme';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Plot = dynamic(() => import('react-plotly.js'), {
  ssr:     false,
  loading: ({ }) => <ChartSkeleton />,
}) as React.ComponentType<{
  data:   Plotly.Data[];
  layout: Partial<Plotly.Layout>;
  config: Partial<Plotly.Config>;
  style:  React.CSSProperties;
}>;

interface PlotlyChartProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data:    any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  layout?: Record<string, any>;
  height?: number;
}

export default function PlotlyChart({ data, layout = {}, height = 320 }: PlotlyChartProps) {
  return (
    <Plot
      data={data}
      layout={layout}
      config={PLOTLY_CONFIG}
      style={{ width: '100%', height }}
    />
  );
}