import ChartErrorBoundary from './ChartErrorBoundary';
import { ChartSkeleton }   from './Feedback';

interface ChartCardProps {
  title:      string;
  subtitle?:  string;
  height?:    number;
  loading?:   boolean;
  children:   React.ReactNode;
  className?: string;
}

export default function ChartCard({
  title, subtitle, height = 320, loading = false, children, className = '',
}: ChartCardProps) {
  return (
    <div className={`chart-card ${className}`}>
      <div className="chart-title">
        {title}
        {subtitle && <span>· {subtitle}</span>}
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