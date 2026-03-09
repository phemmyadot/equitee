export function Spinner() {
  return (
    <div className="flex items-center justify-center h-full min-h-[120px]">
      <svg className="animate-spin text-[var(--accent)]" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
      </svg>
    </div>
  );
}

export function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div className="skeleton w-full rounded-lg" style={{ height }} />
  );
}

export function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="
      text-[12px] text-[var(--loss)]
      bg-[var(--loss-light)] border border-[#F5C6C6]
      rounded-lg px-4 py-3 flex items-start gap-2.5
    ">
      <svg className="shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <span>{message}</span>
    </div>
  );
}

export function PriceBanner({
  live, total, source, ageSeconds,
}: { live: number; total: number; source: string; ageSeconds?: number | null }) {
  const pct = total ? Math.round(live / total * 100) : 0;
  const age = ageSeconds != null ? Math.round(ageSeconds / 60) : null;

  return (
    <div className="price-banner flex flex-wrap items-center gap-x-5 gap-y-1">
      <span className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--gain)] inline-block" />
        <strong className="text-[var(--ink-2)] font-semibold">{live}/{total}</strong>
        <span>positions with live prices</span>
        <span className="font-semibold text-[var(--ink-2)]">({pct}%)</span>
      </span>
      <span className="text-[var(--warn)] font-medium">{source}</span>
      {age !== null && (
        <span className="text-[var(--ink-4)]">
          cached {age}m ago
        </span>
      )}
    </div>
  );
}