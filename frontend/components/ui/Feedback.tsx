export function Spinner() {
  return (
    <div className="flex items-center justify-center h-full min-h-[120px]">
      <div className="font-mono text-[11px] text-[var(--muted)] tracking-widest animate-pulse">
        LOADING···
      </div>
    </div>
  );
}

export function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div
      className="skeleton rounded-lg w-full"
      style={{ height }}
    />
  );
}

export function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="
      font-mono text-[11px] text-[var(--red)]
      bg-[rgba(255,61,90,0.08)] border border-[rgba(255,61,90,0.2)]
      rounded-lg p-4 flex items-center gap-3
    ">
      <span>⚠</span>
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
    <div className="price-banner flex flex-wrap items-center gap-x-4 gap-y-1">
      <span>
        <span className="text-[var(--green)]">●</span>{' '}
        <strong className="text-[var(--snow)]">{live}/{total}</strong> positions with live prices ({pct}%)
      </span>
      <span className="text-[var(--gold)]">{source}</span>
      {age !== null && <span>cached {age}m ago</span>}
    </div>
  );
}