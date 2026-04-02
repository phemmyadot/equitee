'use client';

/**
 * PriceTargets
 * ============
 * Visual price-band card showing buy zone, current price, and sell zone.
 * Rendered on the ticker profile page directly below the Signal Score card.
 */

import type { TargetResult } from '@/utils/targets';
import { fmtNGNFull } from '@/utils/formatters';

interface Props {
  result: TargetResult;
  price: number;
  w52l?: number | null;
  w52h?: number | null;
  label: string;
  color: string;
}

export default function PriceTargets({ result, price, w52l, w52h, label, color }: Props) {
  const { direction, buy_low, buy_high, sell_low, sell_high, rationale } = result;

  const bandMin = Math.min(buy_low ?? price * 0.7, w52l ?? price * 0.7, price * 0.7);
  const bandMax = Math.max(sell_high ?? price * 1.4, w52h ?? price * 1.4, price * 1.4);
  const span = bandMax - bandMin || 1;

  function pct(v: number) {
    return (((v - bandMin) / span) * 100).toFixed(2) + '%';
  }

  const buyL = buy_low ? parseFloat(pct(buy_low)) : null;
  const buyR = buy_high ? parseFloat(pct(buy_high)) : null;
  const sellL = sell_low ? parseFloat(pct(sell_low)) : null;
  const sellR = sell_high ? parseFloat(pct(sell_high)) : null;
  const curP = parseFloat(pct(price));

  const dirLabel =
    direction === 'buy' ? 'Buy zone' : direction === 'sell' ? 'Sell zone' : 'Hold — monitor zones';

  const dirColor =
    direction === 'buy' ? 'var(--gain)' : direction === 'sell' ? 'var(--loss)' : 'var(--ink-4)';

  return (
    <div className="card px-5 py-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--ink-4)]">
          Price Targets
        </span>
        <div className="flex-1 h-px bg-[var(--border)]" />
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{ color, background: color + '22' }}
        >
          {label}
        </span>
      </div>

      <div className="relative h-6 rounded-full overflow-hidden bg-[var(--canvas)] border border-[var(--border)] mb-3">
        {buyL != null && buyR != null && (
          <div
            className="absolute top-0 h-full rounded-full opacity-60"
            style={{
              left: `${buyL}%`,
              width: `${buyR - buyL}%`,
              background: 'var(--gain)',
            }}
          />
        )}

        {sellL != null && sellR != null && (
          <div
            className="absolute top-0 h-full rounded-full opacity-60"
            style={{
              left: `${sellL}%`,
              width: `${sellR - sellL}%`,
              background: 'var(--loss)',
            }}
          />
        )}

        <div
          className="absolute top-0 w-0.5 h-full"
          style={{ left: `${curP}%`, background: color, zIndex: 10 }}
        />
        <div
          className="absolute w-2.5 h-2.5 rounded-full border-2 border-[var(--card)]"
          style={{
            left: `calc(${curP}% - 5px)`,
            top: '50%',
            transform: 'translateY(-50%)',
            background: color,
            zIndex: 11,
          }}
        />
      </div>

      <div className="flex justify-between text-[9px] text-[var(--ink-4)] mb-4">
        <span>{w52l ? fmtNGNFull(w52l) : ''}</span>
        <span className="font-semibold" style={{ color }}>
          ▲ {fmtNGNFull(price)}
        </span>
        <span>{w52h ? fmtNGNFull(w52h) : ''}</span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div
          className="rounded-lg p-3 border border-[var(--border)]"
          style={{ background: direction === 'buy' ? 'var(--gain-light)' : 'var(--canvas)' }}
        >
          <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-[var(--gain)] mb-1">
            Buy Zone
          </p>
          {buy_low && buy_high ? (
            <p className="font-mono text-[12px] font-semibold text-[var(--ink)]">
              {fmtNGNFull(buy_low)} – {fmtNGNFull(buy_high)}
            </p>
          ) : (
            <p className="text-[11px] text-[var(--ink-4)]">—</p>
          )}
        </div>

        <div
          className="rounded-lg p-3 border border-[var(--border)]"
          style={{ background: direction === 'sell' ? 'var(--loss-light)' : 'var(--canvas)' }}
        >
          <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-[var(--loss)] mb-1">
            Sell Zone
          </p>
          {sell_low && sell_high ? (
            <p className="font-mono text-[12px] font-semibold text-[var(--ink)]">
              {fmtNGNFull(sell_low)} – {fmtNGNFull(sell_high)}
            </p>
          ) : (
            <p className="text-[11px] text-[var(--ink-4)]">—</p>
          )}
        </div>
      </div>

      <p className="text-[10px] font-semibold mb-2" style={{ color: dirColor }}>
        {dirLabel}
      </p>

      <ul className="space-y-0.5">
        {rationale.map((r, i) => (
          <li key={i} className="text-[9px] text-[var(--ink-4)] flex gap-1.5">
            <span>·</span>
            <span>{r}</span>
          </li>
        ))}
      </ul>

      <p className="mt-3 text-[9px] text-[var(--ink-4)] border-t border-[var(--border)] pt-2">
        Price targets are model-derived estimates, not guarantees. Always do your own research.
      </p>
    </div>
  );
}
