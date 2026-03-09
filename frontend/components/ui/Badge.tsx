import clsx from 'clsx';

type Source = 'ngx-api' | 'yahoo' | 'no-data' | string;

export default function SourceBadge({ source }: { source: Source }) {
  if (source === 'ngx-api') {
    return <span className="badge badge-live">● API</span>;
  }
  if (source === 'yahoo') {
    return <span className="badge badge-yahoo">● YHO</span>;
  }
  return <span className="badge badge-nodata">○ n/a</span>;
}