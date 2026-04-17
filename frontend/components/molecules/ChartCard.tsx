import ChartErrorBoundary from '@/components/molecules/ChartErrorBoundary';
import { ChartSkeleton } from '@/components/atoms/Feedback';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  height?: number;
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export default function ChartCard({
  title,
  subtitle,
  height = 320,
  loading = false,
  children,
  className = '',
  action,
}: ChartCardProps) {
  return (
    <div className={`chart-card ${className}`}>
      <div className="chart-title flex items-center justify-between">
        <span>
          {title}
          {subtitle && <span>· {subtitle}</span>}
        </span>
        {action && <span>{action}</span>}
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
