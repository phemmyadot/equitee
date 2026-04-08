import type { SaleEvent } from '@/models/trades';

async function request<T>(path: string): Promise<T> {
  let res = await fetch(path, { cache: 'no-store' });
  if (res.status === 401) {
    const r = await fetch('/api/auth/refresh', { method: 'POST' });
    if (!r.ok) { window.location.href = '/login'; throw new Error('Session expired'); }
    res = await fetch(path, { cache: 'no-store' });
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { detail?: string }).detail ?? res.statusText);
  return data as T;
}

export const getTrades = () => request<SaleEvent[]>('/api/trades');
