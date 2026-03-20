/**
 * Price Target Computation
 * ========================
 * Derives buy / sell price zones from fundamental and technical anchors.
 *
 * The Graham Number is a useful fair-value anchor but is unreliable for
 * financial stocks (banks, insurance) where high leverage is structural —
 * resulting in a Graham Number many times the market price. The logic below
 * handles three cases:
 *
 *   Case A — deeply undervalued (price < Graham × 0.75):
 *     Buy zone  → anchored to current price / MA support (stock is already cheap)
 *     Sell zone → path toward fair value, capped at 2.5× current price
 *
 *   Case B — moderately undervalued (Graham × 0.75 ≤ price < Graham):
 *     Buy zone  → below Graham, anchored to fundamental discount
 *     Sell zone → at / above Graham Number
 *
 *   Case C — overvalued (price ≥ Graham) or no Graham:
 *     Buy zone  → MA support level
 *     Sell zone → 52W high resistance
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

  // ── Direction ──────────────────────────────────────────────────────────────
  const direction: TargetResult['direction'] =
    signalTotal != null && signalTotal > 1  ? 'buy'  :
    signalTotal != null && signalTotal < -1 ? 'sell' :
    'hold';

  const tech = ma200 ?? ma50;   // prefer MA-200 as support anchor

  // ── Buy zone ───────────────────────────────────────────────────────────────
  let buy_low: number | null  = null;
  let buy_high: number | null = null;

  if (graham && graham > 0) {

    if (price < graham * 0.75) {
      // Case A: deeply undervalued — stock is already in buy territory
      // Anchor zone to current price / MA support, not to Graham (which may be
      // inflated for financials). Buy_high capped at 52W high to stay realistic.
      const techFloor = tech ? Math.min(price * 0.90, tech * 0.97) : price * 0.90;
      const capHigh   = w52h ? Math.min(price * 1.15, w52h * 1.02) : price * 1.15;
      buy_low  = r2(Math.max(techFloor, price * 0.82));
      buy_high = r2(capHigh);
      rationale.push(`Trading at deep discount to Graham Number (₦${graham.toFixed(0)}) — in buy zone now`);

    } else if (price < graham) {
      // Case B: moderately undervalued — traditional Graham-anchored zone
      buy_low  = r2(graham * 0.72);
      buy_high = r2(graham * 0.88);
      rationale.push(`Buy zone anchored to Graham Number discount (₦${graham.toFixed(0)})`);

    } else {
      // Case C: at/above Graham — only buy on a technical pullback
      buy_low  = tech ? r2(tech * 0.92) : r2(price * 0.84);
      buy_high = tech ? r2(tech * 1.01) : r2(price * 0.93);
      rationale.push(`Trading above fair value (Graham ₦${graham.toFixed(0)}) — buy on pullback only`);
    }

  } else if (tech) {
    buy_low  = r2(tech * 0.93);
    buy_high = r2(tech * 1.02);
    rationale.push(`Buy zone based on MA-${ma200 ? '200' : '50'} support (₦${tech.toFixed(0)})`);
  } else {
    buy_low  = r2(price * 0.82);
    buy_high = r2(price * 0.92);
    rationale.push('Buy zone estimated 8–18% below current price (no fundamental anchor)');
  }

  if (buy_high !== null && buy_low !== null && buy_high <= buy_low)
    buy_high = r2(buy_low * 1.08);

  // ── Sell zone ──────────────────────────────────────────────────────────────
  let sell_low: number | null  = null;
  let sell_high: number | null = null;

  if (graham && graham > 0) {

    if (price < graham * 0.75) {
      // Case A: deeply undervalued — sell target is the path toward fair value,
      // capped at 2.5× current price so targets stay actionable.
      sell_low  = r2(Math.min(graham * 0.70, price * 1.40));
      sell_high = r2(Math.min(graham * 0.90, price * 2.50));
      rationale.push(`Sell targets on approach to Graham fair value (₦${graham.toFixed(0)})`);

    } else if (price < graham) {
      // Case B: moderately undervalued — sell at/above Graham
      const floor = Math.max(graham * 0.95, w52h ? w52h * 0.95 : price * 1.15);
      sell_low  = r2(floor);
      sell_high = r2(Math.max(graham * 1.20, w52h ? w52h * 1.05 : price * 1.40));
      rationale.push(`Sell zone at fair value / Graham premium (₦${graham.toFixed(0)})`);

    } else {
      // Case C: above Graham — sell at premium to Graham
      sell_low  = r2(Math.max(graham * 1.10, w52h ? w52h * 0.92 : price * 1.15));
      sell_high = r2(Math.max(graham * 1.40, w52h ? w52h * 1.05 : price * 1.40));
      rationale.push(`Sell zone at Graham premium (₦${(graham * 1.1).toFixed(0)}+)`);
    }

  } else if (w52h) {
    sell_low  = r2(w52h * 0.90);
    sell_high = r2(w52h * 1.05);
    rationale.push(`Sell zone at 52W high resistance (₦${w52h.toFixed(0)})`);
  } else {
    sell_low  = r2(price * 1.20);
    sell_high = r2(price * 1.40);
    rationale.push('Sell zone estimated 20–40% above current price (no fundamental anchor)');
  }

  // Always ensure sell zone is above the current price
  if (sell_low !== null && price >= sell_low) {
    sell_low  = r2(price * 1.08);
    sell_high = r2(Math.max(sell_high ?? price * 1.25, price * 1.25));
  }

  if (sell_high !== null && sell_low !== null && sell_high <= sell_low)
    sell_high = r2(sell_low * 1.15);

  return { direction, buy_low, buy_high, sell_low, sell_high, rationale };
}
