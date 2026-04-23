/**
 * CSV export utilities for portfolio snapshot downloads.
 */

import type { StockRow } from '@/models/market';
import type { SaleEvent, BuyEvent } from '@/models/trades';

function esc(v: string | number | null | undefined): string {
  if (v == null) return '';
  const s = String(v);
  return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
}

function row(...cells: (string | number | null | undefined)[]): string {
  return cells.map(esc).join(',');
}

function download(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function dateTag(): string {
  return new Date().toISOString().slice(0, 10);
}

export function exportNGXSnapshot(stocks: StockRow[]) {
  const header = row(
    'Ticker',
    'Company',
    'Sector',
    'Shares',
    'Avg Cost (NGN)',
    'Current Price (NGN)',
    'Current Equity (NGN)',
    'Unrealised P&L (NGN)',
    'Return %',
    'Realised P&L (NGN)',
    'USD Value',
    'USD Return',
  );
  const lines = stocks.map((s) =>
    row(
      s.Ticker,
      s.Stock,
      s.Sector,
      s.Shares,
      s.AvgCost?.toFixed(2),
      s.LivePrice?.toFixed(2),
      s.CurrentEquity?.toFixed(2),
      s.UnrealizedPL?.toFixed(2),
      s.ReturnPct?.toFixed(2),
      s.RealizedPL?.toFixed(2),
      s.UsdEquity?.toFixed(2),
      s.UsdReturn?.toFixed(2),
    ),
  );
  download([header, ...lines].join('\n'), `ngx-snapshot-${dateTag()}.csv`);
}

export function exportUSSnapshot(stocks: StockRow[]) {
  const header = row(
    'Ticker',
    'Company',
    'Sector',
    'Shares',
    'Avg Cost (USD)',
    'Current Price (USD)',
    'Current Equity (USD)',
    'Unrealised P&L (USD)',
    'Return %',
    'Realised P&L (USD)',
  );
  const lines = stocks.map((s) =>
    row(
      s.Ticker,
      s.Stock,
      s.Sector,
      s.Shares,
      s.AvgCost?.toFixed(2),
      s.LivePrice?.toFixed(2),
      s.CurrentEquity?.toFixed(2),
      s.UnrealizedPL?.toFixed(2),
      s.ReturnPct?.toFixed(2),
      s.RealizedPL?.toFixed(2),
    ),
  );
  download([header, ...lines].join('\n'), `us-snapshot-${dateTag()}.csv`);
}

export function exportCombinedSnapshot(
  ngxStocks: StockRow[],
  usStocks: StockRow[],
  usdngn: number,
) {
  const header = row(
    'Market',
    'Ticker',
    'Company',
    'Sector',
    'Shares',
    'Equity (USD)',
    'Cost (USD)',
    'Unrealised P&L (USD)',
    'Return %',
    'Realised P&L (USD)',
  );
  const ngxRows = ngxStocks.map((s) =>
    row(
      'NGX',
      s.Ticker,
      s.Stock,
      s.Sector,
      s.Shares,
      (s.UsdEquity ?? (s.CurrentEquity ?? 0) / usdngn).toFixed(2),
      (s.UsdCost ?? (s.RemainingCost ?? 0) / usdngn).toFixed(2),
      ((s.UnrealizedPL ?? 0) / usdngn).toFixed(2),
      s.ReturnPct?.toFixed(2),
      ((s.RealizedPL ?? 0) / usdngn).toFixed(2),
    ),
  );
  const usRows = usStocks.map((s) =>
    row(
      'US',
      s.Ticker,
      s.Stock,
      s.Sector,
      s.Shares,
      s.CurrentEquity?.toFixed(2),
      s.RemainingCost?.toFixed(2),
      s.UnrealizedPL?.toFixed(2),
      s.ReturnPct?.toFixed(2),
      s.RealizedPL?.toFixed(2),
    ),
  );
  download([header, ...ngxRows, ...usRows].join('\n'), `portfolio-snapshot-${dateTag()}.csv`);
}

export function exportTrades(sells: SaleEvent[], buys: BuyEvent[]) {
  const sellHeader = row(
    'Type',
    'Date',
    'Market',
    'Ticker',
    'Name',
    'Shares',
    'Price',
    'Commission',
    'Proceeds',
    'Realized P&L',
    'Close Type',
  );
  const sellRows = sells.map((t) =>
    row(
      'SELL',
      t.sold_at.slice(0, 10),
      t.market.toUpperCase(),
      t.ticker,
      t.name,
      t.shares_sold || '',
      t.sale_price || '',
      t.commission || '',
      t.proceeds || '',
      t.realized_pl,
      t.fully_closed ? 'Full' : 'Partial',
    ),
  );

  const buyHeader = row(
    'Type',
    'Date',
    'Market',
    'Ticker',
    'Name',
    'Shares',
    'Buy Price',
    'Commission',
    'Total Cost',
  );
  const buyRows = buys.map((t) =>
    row(
      'BUY',
      t.bought_at.slice(0, 10),
      t.market.toUpperCase(),
      t.ticker,
      t.name,
      t.shares_bought,
      t.buy_price,
      t.commission || '',
      t.total_cost,
    ),
  );

  const lines = [sellHeader, ...sellRows, '', buyHeader, ...buyRows];
  download(lines.join('\n'), `trades-${dateTag()}.csv`);
}
