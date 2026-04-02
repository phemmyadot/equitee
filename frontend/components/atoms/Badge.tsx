type Source = 'ngx' | 'yahoo' | 'no-data' | string;

export default function SourceBadge({ source }: { source: Source }) {
  if (source === 'ngx') {
    return (
      <span className="badge badge-live">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--gain)] inline-block" />
        Live
      </span>
    );
  }
  if (source === 'yahoo') {
    return (
      <span className="badge badge-yahoo">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--warn)] inline-block" />
        Yahoo
      </span>
    );
  }
  return <span className="badge badge-nodata text-[var(--ink-4)]">— n/a</span>;
}
