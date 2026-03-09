'use client';

import { useState } from 'react';
import clsx from 'clsx';

export interface ColDef<T> {
  key:     keyof T | string;
  label:   string;
  right?:  boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  render?: (value: any, row: T) => React.ReactNode;
  sortValue?: (row: T) => number | string;
}

interface StockTableProps<T> {
  rows:  T[];
  cols:  ColDef<T>[];
  maxH?: string;
}

export default function StockTable<T extends Record<string, unknown>>({
  rows, cols, maxH = '420px',
}: StockTableProps<T>) {
  const [sortKey,  setSortKey]  = useState<string | null>(null);
  const [sortDir,  setSortDir]  = useState<'asc' | 'desc'>('desc');

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const sorted = [...rows].sort((a, b) => {
    if (!sortKey) return 0;
    const col = cols.find(c => c.key === sortKey);
    const va = col?.sortValue ? col.sortValue(a) : (a[sortKey] ?? '');
    const vb = col?.sortValue ? col.sortValue(b) : (b[sortKey] ?? '');
    if (va < vb) return sortDir === 'asc' ? -1 : 1;
    if (va > vb) return sortDir === 'asc' ?  1 : -1;
    return 0;
  });

  return (
    <div className="overflow-x-auto" style={{ maxHeight: maxH, overflowY: 'auto' }}>
      <table className="data-table">
        <thead className="sticky top-0 bg-[var(--panel)] z-10">
          <tr>
            {cols.map((col) => (
              <th
                key={String(col.key)}
                onClick={() => col.sortValue !== undefined && handleSort(String(col.key))}
                className={clsx(
                  col.right && 'right',
                  col.sortValue !== undefined && 'cursor-pointer select-none hover:text-[var(--snow)] transition-colors'
                )}
              >
                {col.label}
                {sortKey === String(col.key) && (
                  <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
                )}
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