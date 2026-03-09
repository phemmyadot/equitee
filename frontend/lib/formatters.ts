/**
 * Number formatters used across all views.
 */

export function fmtNGN(v?: number | null): string {
  if (v == null) return '—';
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `₦${(v / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000)     return `₦${(v / 1_000).toFixed(1)}K`;
  return `₦${v.toFixed(2)}`;
}

export function fmtNGNFull(v?: number | null): string {
  if (v == null) return '—';
  return `₦${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function fmtUSD(v?: number | null): string {
  if (v == null) return '—';
  return `$${Math.abs(v) >= 1_000
    ? v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : v.toFixed(2)}`;
}

export function fmtPct(v?: number | null, showPlus = true): string {
  if (v == null) return '—';
  const sign = showPlus && v > 0 ? '+' : '';
  return `${sign}${v.toFixed(1)}%`;
}

export function fmtPct2(v?: number | null): string {
  if (v == null) return '—';
  const sign = v > 0 ? '+' : '';
  return `${sign}${v.toFixed(2)}%`;
}

export function fmtVol(v?: number | null): string {
  if (v == null) return '—';
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `${(v / 1_000).toFixed(0)}K`;
  return v.toLocaleString();
}

export function fmtAge(seconds?: number | null): string {
  if (seconds == null) return '—';
  if (seconds < 60)    return `${seconds}s ago`;
  return `${Math.round(seconds / 60)}m ago`;
}

export function isPositive(v?: number | null): boolean {
  return v != null && v >= 0;
}