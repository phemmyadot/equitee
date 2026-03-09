import ChartErrorBoundary from './ChartErrorBoundary';
import { ChartSkeleton }   from './Feedback';

interface ChartCardProps {
  title:      string;
  subtitle?:  string;
  height?:    number;
  loading?:   boolean;
  children:   React.ReactNode;
  className?: string;
  fullRow?:   boolean;
}

/**
 * Unified chart card shell.
 * - Shows a labelled skeleton while `loading` is true
 * - Wraps children in a per-chart error boundary
 * - Consistent title/subtitle typography
 *
 * Usage:
 *   <ChartCard title="Sector Allocation" subtitle="by equity" loading={loading} height={320}>
 *     <PlotlyChart ... />
 *   </ChartCard>
 */
export default function ChartCard({
  title, subtitle, height = 320, loading = false, children, className = '', fullRow = false,
}: ChartCardProps) {
  return (
    <div className={`chart-card ${fullRow ? 'col-span-full' : ''} ${className}`}>
      <div className="chart-title">
        {title}
        {subtitle && <span>{subtitle}</span>}
      </div>

      {loading ? (
        <ChartSkeleton height={height} />
      ) : (
        <ChartErrorBoundary title={title} height={height}>
          {children}
        </ChartErrorBoundary>
      )}
    </div>
  );
}