'use client';

import { Component, type ReactNode, type ErrorInfo } from 'react';
import { IconAlertCircle } from '@/components/atoms/icons';

interface Props {
  children: ReactNode;
  title?: string;
  height?: number;
}
interface State {
  hasError: boolean;
  message: string;
}

export default class ChartErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[ChartErrorBoundary] ${this.props.title}:`, error, info);
  }

  render() {
    const { hasError, message } = this.state;
    const { children, title, height = 300 } = this.props;

    if (!hasError) return children;

    return (
      <div
        className="flex flex-col items-center justify-center gap-3 rounded-lg bg-[var(--loss-light)] border border-[#F5C6C6]"
        style={{ height }}
      >
        <IconAlertCircle width={18} height={18} style={{ stroke: 'var(--loss)' }} />
        <span className="text-[11px] font-semibold text-[var(--loss)]">
          {title ? `${title} failed to render` : 'Chart error'}
        </span>
        {message && (
          <span className="text-[10px] text-[var(--ink-3)] max-w-[260px] text-center px-4">
            {message}
          </span>
        )}
        <button
          onClick={() => this.setState({ hasError: false, message: '' })}
          className="
            text-[11px] font-medium text-[var(--loss)]
            border border-[#F5C6C6] rounded px-3 py-1
            hover:bg-white transition-colors duration-150
          "
        >
          Retry
        </button>
      </div>
    );
  }
}
