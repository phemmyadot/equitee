'use client';

import { useState } from 'react';
import clsx from 'clsx';

export interface ColDef<T extends Record<string, any>> {
  key: keyof T | string;
  label: string;
  right?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  render?: (value: any, row: T) => React.ReactNode;
  sortValue?: (row: T) => number | string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface StockTableProps<T extends Record<string, any>> {
  rows: T[];
  cols: ColDef<T>[];
  maxH?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function StockTable<T extends Record<string, any>>({
  rows,
  cols,
  maxH = '420px',
}: StockTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const sorted = [...rows].sort((a, b) => {
    if (!sortKey) return 0;
    const col = cols.find((c) => c.key === sortKey);
    const va = col?.sortValue ? col.sortValue(a) : (a[sortKey] ?? '');
    const vb = col?.sortValue ? col.sortValue(b) : (b[sortKey] ?? '');
    if (va < vb) return sortDir === 'asc' ? -1 : 1;
    if (va > vb) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div
      style={{ maxHeight: maxH }}
      className="overflow-auto rounded-lg border border-[var(--border)]"
    >
      <table className="data-table">
        <thead>
          <tr>
            {cols.map((col) => (
              <th
                key={String(col.key)}
                onClick={() => col.sortValue !== undefined && handleSort(String(col.key))}
                className={clsx(
                  col.right && 'right',
                  col.sortValue &&
                    'cursor-pointer select-none hover:text-[var(--ink-2)] transition-colors',
                )}
              >
                <span className="inline-flex items-center gap-1">
                  {col.label}
                  {col.sortValue && (
                    <span
                      className={clsx(
                        'text-[8px] transition-opacity',
                        sortKey === String(col.key) ? 'opacity-100' : 'opacity-30',
                      )}
                    >
                      {sortKey === String(col.key) ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
                    </span>
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <tr key={i}>
              {cols.map((col) => {
                const val = row[col.key as string];
                return (
                  <td key={String(col.key)} className={clsx(col.right && 'right')}>
                    {col.render ? col.render(val, row) : String(val ?? '—')}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
