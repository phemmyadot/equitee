/**
 * Price Target Computation
 * ========================
 * Derives buy / sell price zones from fundamental and technical anchors.
 *
 * Priority order for buy zone:
 *   1. Graham Number (intrinsic value floor)
 *   2. MA-200 (technical support)
 *   3. Price fallback (simple % below current)
 *
 * Priority order for sell zone:
 *   1. Graham Number × premium (intrinsic value ceiling)
 *   2. 52-week high (technical resistance)
 *   3. Price fallback (simple % above current)
 */

export interface TargetResult {
  direction:  'buy' | 'sell' | 'hold';
  buy_low:    number | null;
  buy_high:   number | null;
  sell_low:   number | null;
  sell_high:  number | null;
  rationale:  string[];
}

function r2(n: number) { return Math.round(n * 100) / 100; }

export function computeTargets(
  price:       number | null,
  graham:      number | null,   // √(22.5 × EPS × BV/share)
  ma50:        number | null,
  ma200:       number | null,
  w52h:        number | null,
  w52l:        number | null,
  signalTotal: number | null,   // -10 … +10 from computeSignal
): TargetResult | null {
  if (!price || price <= 0) return null;

  const rationale: string[] = [];

  // ── Direction ──────────────────────────────────────────────────────────
  const direction: TargetResult['direction'] =
    signalTotal != null && signalTotal > 1  ? 'buy'  :
    signalTotal != null && signalTotal < -1 ? 'sell' :
    'hold';

  // ── Buy zone ───────────────────────────────────────────────────────────
  let buy_low: number | null  = null;
  let buy_high: number | null = null;

  const tech = ma200 ?? ma50;

  if (graham && graham > 0 && tech) {
    // Both fundamental and technical anchors available
    buy_low  = r2(Math.max(graham * 0.70, tech * 0.90));
    buy_high = r2(Math.min(graham * 0.92, Math.max(tech * 1.05, price * 0.96)));
    rationale.push(`Buy zone based on Graham Number (₦${graham.toFixed(0)}) & MA-${ma200 ? '200' : '50'}`);
  } else if (graham && graham > 0) {
    buy_low  = r2(graham * 0.75);
    buy_high = r2(graham * 0.92);
    rationale.push(`Buy zone based on Graham Number (₦${graham.toFixed(0)})`);
  } else if (tech) {
    buy_low  = r2(tech * 0.93);
    buy_high = r2(tech * 1.02);
    rationale.push(`Buy zone based on MA-${ma200 ? '200' : '50'} (₦${tech.toFixed(0)})`);
  } else {
    // Price-only fallback
    buy_low  = r2(price * 0.82);
    buy_high = r2(price * 0.92);
    rationale.push('Buy zone estimated as 8–18% below current price (no fundamental anchor)');
  }

  if (buy_high <= buy_low) buy_high = r2(buy_low * 1.08);

  // ── Sell zone ──────────────────────────────────────────────────────────
  let sell_low: number | null  = null;
  let sell_high: number | null = null;

  if (graham && graham > 0 && w52h) {
    sell_low  = r2(Math.max(graham * 1.10, w52h * 0.90));
    sell_high = r2(Math.max(graham * 1.40, w52h * 1.02));
    rationale.push(`Sell zone based on Graham premium & 52W high (₦${w52h.toFixed(0)})`);
  } else if (graham && graham > 0) {
    sell_low  = r2(graham * 1.10);
    sell_high = r2(graham * 1.40);
    rationale.push(`Sell zone based on Graham Number premium`);
  } else if (w52h) {
    sell_low  = r2(w52h * 0.90);
    sell_high = r2(w52h * 1.05);
    rationale.push(`Sell zone based on 52W high resistance (₦${w52h.toFixed(0)})`);
  } else {
    sell_low  = r2(price * 1.20);
    sell_high = r2(price * 1.40);
    rationale.push('Sell zone estimated as 20–40% above current price (no fundamental anchor)');
  }

  if (sell_high <= sell_low) sell_high = r2(sell_low * 1.15);

  // If current price is already above sell_low, adjust sell zone up
  if (price >= sell_low) {
    sell_low  = r2(price * 1.08);
    sell_high = r2(Math.max(sell_high, price * 1.25));
  }

  return { direction, buy_low, buy_high, sell_low, sell_high, rationale };
}
