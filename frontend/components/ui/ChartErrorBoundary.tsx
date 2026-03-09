'use client';

import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props {
  children:  ReactNode;
  title?:    string;
  height?:   number;
}

interface State {
  hasError: boolean;
  message:  string;
}

/**
 * Per-chart error boundary.
 * Catches any render error inside a chart and shows a contained
 * error card instead of crashing the whole page.
 *
 * Usage:
 *   <ChartErrorBoundary title="Equity Chart">
 *     <PlotlyChart ... />
 *   </ChartErrorBoundary>
 */
export default class ChartErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[ChartErrorBoundary] ${this.props.title ?? 'chart'}:`, error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false, message: '' });
  };

  render() {
    const { hasError, message } = this.state;
    const { children, title, height = 300 } = this.props;

    if (!hasError) return children;

    return (
      <div
        className="
          flex flex-col items-center justify-center gap-3
          border border-[rgba(255,61,90,0.2)] rounded-lg
          bg-[rgba(255,61,90,0.04)]
        "
        style={{ height }}
      >
        <span className="font-mono text-[10px] text-[var(--red)] tracking-wider">
          ⚠ {title ? `${title.toUpperCase()} ` : ''}RENDER ERROR
        </span>
        <span className="font-mono text-[9px] text-[var(--muted)] max-w-[280px] text-center leading-relaxed px-4">
          {message || 'An unexpected error occurred while rendering this chart.'}
        </span>
        <button
          onClick={this.handleRetry}
          className="
            font-mono text-[9px] tracking-wider
            border border-[var(--muted)] text-[var(--muted)]
            px-3 py-1 rounded
            hover:border-[var(--snow)] hover:text-[var(--snow)]
            transition-colors duration-150
          "
        >
          RETRY
        </button>
      </div>
    );
  }
}