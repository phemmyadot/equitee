'use client';

/**
 * SignalScore
 * ===========
 * Composite buy / accumulate / hold / reduce / sell signal computed entirely
 * from data already fetched on the profile page.
 *
 * Scoring model (total = weighted sum, normalised to -10 … +10):
 *
 *  Dimension       Weight  Inputs
 *  ─────────────── ─────── ──────────────────────────────────────────────────
 *  Momentum         25 %   return ladder direction, 52W range position
 *  Valuation        25 %   P/E, P/B, FCF yield, EV/EBITDA
 *  Quality          30 %   Piotroski F-Score, Altman Z, ROE, ROIC
 *  Dividend         10 %   yield, payout coverage (YoC from portfolio)
 *  Risk             10 %   Altman Z distress check, max drawdown, D/E
 *
 * Each dimension is scored -1 … +1 before weighting.
 * A score < -3 = Sell, -3…-1 = Reduce, -1…+1 = Hold, +1…+4 = Accumulate, > +4 = Buy.
 */

import type { TickerOverview, TickerPerformance, StockRow, DividendInfo } from '@/services/api';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Parse any "string | number | null" the backend might send. */
function n(v: string | number | null | undefined): number | null {
    if (v == null) return null;
    if (typeof v === 'number') return v;
    const clean = String(v).replace(/[^0-9.-]/g, '');
    const f = parseFloat(clean);
    return isNaN(f) ? null : f;
}

/** Clamp x to [-1, +1]. */
const clamp = (x: number) => Math.max(-1, Math.min(1, x));

// ─────────────────────────────────────────────────────────────────────────────
// Dimension scorers  (each returns -1 … +1)
// ─────────────────────────────────────────────────────────────────────────────

function scoreMomentum(perf: TickerPerformance, livePrice?: number | null): {
    score: number; signals: string[];
} {
    const signals: string[] = [];
    let pts = 0, count = 0;

    // Return ladder — reward consistent positive trend
    const returns = [
        n(perf.return_1m), n(perf.return_3m), n(perf.return_6m), n(perf.return_1y),
    ];
    const valid = returns.filter((r): r is number => r !== null);
    if (valid.length >= 1) {
        const positives = valid.filter(r => r > 0).length;
        const ladderPct = positives / valid.length;
        pts += clamp((ladderPct - 0.5) * 4);   // 0.5 = neutral, 1.0 = +2 → clamped +1
        count += 1;
        if (positives >= 3) signals.push(`${positives}/${valid.length} return periods positive`);
        else if (positives <= 1) signals.push(`Only ${positives}/${valid.length} return periods positive`);
    }

    // 52W range position
    const lo = n(perf.week_52_low);
    const hi = n(perf.week_52_high);
    if (lo && hi && hi > lo && livePrice) {
        const rangePct = (livePrice - lo) / (hi - lo);  // 0=at 52W low, 1=at 52W high
        // Sweet spot: 30–75% of range (not a falling knife, not overextended)
        if (rangePct >= 0.3 && rangePct <= 0.75) {
            pts += 0.5;
            signals.push(`Price at ${(rangePct * 100).toFixed(0)}% of 52W range`);
        } else if (rangePct > 0.85) {
            pts -= 0.3;
            signals.push(`Near 52W high (${(rangePct * 100).toFixed(0)}% of range)`);
        } else if (rangePct < 0.2) {
            pts -= 0.5;
            signals.push(`Near 52W low (${(rangePct * 100).toFixed(0)}% of range)`);
        }
        count += 1;
    }

    return { score: count > 0 ? clamp(pts / count) : 0, signals };
}


function scoreValuation(ov: TickerOverview, perf: TickerPerformance): {
    score: number; signals: string[];
} {
    const signals: string[] = [];
    let pts = 0, count = 0;

    // P/E: lower is better; <10 strong buy, 10-20 fair, >30 expensive
    const pe = n(ov.pe_ratio);
    if (pe !== null && pe > 0) {
        const s = pe < 10 ? 1 : pe < 15 ? 0.5 : pe < 25 ? 0 : pe < 35 ? -0.5 : -1;
        pts += s; count++;
        if (s > 0) signals.push(`P/E ${pe.toFixed(1)}x — cheap`);
        else if (s < 0) signals.push(`P/E ${pe.toFixed(1)}x — expensive`);
    }

    // P/B: <1 = trading below book (often a buy signal if profitable)
    const pb = n(perf.price_to_book);
    if (pb !== null && pb > 0) {
        const s = pb < 1 ? 1 : pb < 2 ? 0.5 : pb < 4 ? 0 : -0.5;
        pts += s; count++;
        if (pb < 1) signals.push(`P/B ${pb.toFixed(2)}x — below book value`);
    }

    // FCF yield: higher is better (>8% strong, 4-8% fair, <2% poor)
    const fcfY = n(perf.fcf_yield);
    if (fcfY !== null) {
        const s = fcfY > 8 ? 1 : fcfY > 4 ? 0.5 : fcfY > 0 ? 0 : -0.5;
        pts += s; count++;
        if (fcfY > 8) signals.push(`FCF yield ${fcfY.toFixed(1)}% — strong cash generation`);
        else if (fcfY < 0) signals.push(`Negative FCF yield`);
    }

    // EV/EBITDA: <8 cheap, 8-15 fair, >20 expensive
    const evEb = n(perf.ev_ebitda);
    if (evEb !== null && evEb > 0) {
        const s = evEb < 8 ? 0.75 : evEb < 15 ? 0.25 : evEb < 20 ? -0.25 : -0.75;
        pts += s; count++;
    }

    return { score: count > 0 ? clamp(pts / count) : 0, signals };
}


function scoreQuality(ov: TickerOverview, perf: TickerPerformance): {
    score: number; signals: string[];
} {
    const signals: string[] = [];
    let pts = 0, count = 0;

    // Piotroski F-Score (0-9): ≥7 strong, 4-6 neutral, <4 weak
    const pio = n(perf.piotroski_score);
    if (pio !== null) {
        const s = pio >= 7 ? 1 : pio >= 4 ? 0 : -1;
        pts += s; count++;
        if (pio >= 7) signals.push(`Piotroski ${pio}/9 — fundamentally strong`);
        else if (pio < 4) signals.push(`Piotroski ${pio}/9 — weak fundamentals`);
        else signals.push(`Piotroski ${pio}/9 — neutral`);
    }

    // Altman Z: ≥3 safe, 1.81-3 grey zone, <1.81 distress
    const z = n(perf.altman_zscore);
    if (z !== null) {
        const s = z >= 3 ? 0.75 : z >= 1.81 ? 0 : -1;
        pts += s; count++;
        if (z < 1.81) signals.push(`Altman Z ${z.toFixed(2)} — distress zone`);
        else if (z >= 3) signals.push(`Altman Z ${z.toFixed(2)} — financially safe`);
    }

    // ROE: >15% good, >25% excellent, <5% poor
    const roe = n(ov.roe);
    if (roe !== null) {
        const s = roe > 25 ? 1 : roe > 15 ? 0.5 : roe > 5 ? 0 : -0.5;
        pts += s; count++;
        if (roe > 20) signals.push(`ROE ${roe.toFixed(1)}% — high return on equity`);
    }

    // ROIC: >10% good, >20% excellent
    const roic = n(perf.roic);
    if (roic !== null) {
        const s = roic > 20 ? 1 : roic > 10 ? 0.5 : roic > 0 ? 0 : -0.5;
        pts += s; count++;
    }

    // Earnings growth YoY
    const eg = n(perf.earnings_growth_yoy);
    if (eg !== null) {
        const s = eg > 20 ? 1 : eg > 0 ? 0.5 : eg > -10 ? -0.25 : -1;
        pts += s; count++;
        if (eg > 20) signals.push(`Earnings +${eg.toFixed(0)}% YoY`);
        else if (eg < -10) signals.push(`Earnings ${eg.toFixed(0)}% YoY — declining`);
    }

    return { score: count > 0 ? clamp(pts / count) : 0, signals };
}


function scoreDividend(
    ov: TickerOverview,
    posRow?: StockRow | null,
    dividend?: DividendInfo | null,
): { score: number; signals: string[] } {
    const signals: string[] = [];
    let pts = 0, count = 0;

    // Dividend yield
    const dy = n(ov.dividend_yield);
    if (dy !== null && dy > 0) {
        const s = dy > 8 ? 1 : dy > 4 ? 0.5 : dy > 1 ? 0 : -0.25;
        pts += s; count++;
        if (dy > 6) signals.push(`Dividend yield ${dy.toFixed(1)}%`);
    }

    // Yield on cost (personal — only if holding)
    if (posRow && dividend?.cash_amount && posRow.AvgCost) {
        const yoc = (dividend.cash_amount / posRow.AvgCost) * 100;
        const s = yoc > 12 ? 1 : yoc > 6 ? 0.5 : yoc > 2 ? 0 : -0.25;
        pts += s; count++;
        if (yoc > 8) signals.push(`Yield on cost ${yoc.toFixed(1)}% — strong income`);
    }

    // Dividend growth
    const dg = n(ov.dividend_yield);   // proxy — use growth field if available
    const dgRaw = null as number | null;  // placeholder — field not in overview
    if (dgRaw !== null && dgRaw > 0) {
        pts += 0.5; count++;
        signals.push(`Dividend growing ${dgRaw.toFixed(0)}% YoY`);
    }

    return { score: count > 0 ? clamp(pts / count) : 0, signals };
}


function scoreRisk(ov: TickerOverview, perf: TickerPerformance): {
    score: number; signals: string[];
} {
    const signals: string[] = [];
    let pts = 0, count = 0;

    // Altman Z distress = hard negative
    const z = n(perf.altman_zscore);
    if (z !== null && z < 1.81) {
        pts -= 1; count++;
        signals.push(`Altman Z ${z.toFixed(2)} — high bankruptcy risk`);
    } else if (z !== null) {
        pts += 0.5; count++;
    }

    // Max drawdown: >40% severe, 20-40% moderate, <20% acceptable
    const md = n(perf.max_drawdown);
    if (md !== null) {
        const abs = Math.abs(md);
        const s = abs > 50 ? -1 : abs > 35 ? -0.5 : abs > 20 ? -0.25 : 0.25;
        pts += s; count++;
        if (abs > 40) signals.push(`Max drawdown ${abs.toFixed(0)}% — high risk`);
    }

    // D/E ratio: <0.5 safe, 0.5-1.5 moderate, >2 risky
    const de = n(ov.debt_to_equity);
    if (de !== null && de >= 0) {
        const s = de < 0.5 ? 0.5 : de < 1.5 ? 0 : de < 2.5 ? -0.5 : -1;
        pts += s; count++;
        if (de > 2) signals.push(`High D/E ratio ${de.toFixed(1)}x`);
    }

    // Sharpe ratio: >1 good, 0.5-1 ok, <0.5 poor risk-adjusted return
    const sharpe = n(perf.sharpe_ratio);
    if (sharpe !== null) {
        const s = sharpe > 1 ? 0.75 : sharpe > 0.5 ? 0.25 : sharpe > 0 ? -0.25 : -0.75;
        pts += s; count++;
        if (sharpe > 1) signals.push(`Sharpe ${sharpe.toFixed(2)} — good risk-adjusted return`);
    }

    return { score: count > 0 ? clamp(pts / count) : 0, signals };
}

// ─────────────────────────────────────────────────────────────────────────────
// Composite scorer
// ─────────────────────────────────────────────────────────────────────────────

export interface SignalResult {
    total: number;      // -10 … +10
    label: 'Strong Buy' | 'Buy' | 'Accumulate' | 'Hold' | 'Reduce' | 'Sell' | 'Strong Sell';
    color: string;
    bg: string;
    dimensions: {
        name: string;
        weight: number;
        score: number;      // -1 … +1 (raw before weighting)
        contrib: number;      // score × weight × 10
        signals: string[];
    }[];
    dataPoints: number;     // how many inputs were available
}

export function computeSignal(
    ov: TickerOverview | null | undefined,
    perf: TickerPerformance | null | undefined,
    livePrice?: number | null,
    posRow?: StockRow | null,
    dividend?: DividendInfo | null,
): SignalResult | null {
    if (!ov && !perf) return null;

    const safeOv: TickerOverview = ov ?? {} as TickerOverview;
    const safePerf: TickerPerformance = perf ?? {} as TickerPerformance;

    const mom = scoreMomentum(safePerf, livePrice);
    const val = scoreValuation(safeOv, safePerf);
    const qual = scoreQuality(safeOv, safePerf);
    const div = scoreDividend(safeOv, posRow, dividend);
    const risk = scoreRisk(safeOv, safePerf);

    const WEIGHTS = { mom: 0.25, val: 0.25, qual: 0.30, div: 0.10, risk: 0.10 };

    const total = (
        mom.score * WEIGHTS.mom +
        val.score * WEIGHTS.val +
        qual.score * WEIGHTS.qual +
        div.score * WEIGHTS.div +
        risk.score * WEIGHTS.risk
    ) * 10;  // scale to -10 … +10

    const label =
        total > 6 ? 'Strong Buy' :
            total > 3 ? 'Buy' :
                total > 1 ? 'Accumulate' :
                    total > -1 ? 'Hold' :
                        total > -3 ? 'Reduce' :
                            total > -6 ? 'Sell' :
                                'Strong Sell';

    const color =
        total > 3 ? 'var(--gain)' :
            total > 1 ? '#0E7490' :  // teal = accumulate
                total > -1 ? 'var(--ink-3)' :  // grey = hold
                    total > -3 ? 'var(--warn)' :
                        'var(--loss)';

    const bg =
        total > 3 ? 'var(--gain-light)' :
            total > 1 ? '#E0F2F7' :
                total > -1 ? 'var(--sidebar)' :
                    total > -3 ? 'var(--warn-light)' :
                        'var(--loss-light)';

    const allSignals = [
        ...mom.signals, ...val.signals, ...qual.signals, ...div.signals, ...risk.signals,
    ];

    return {
        total: parseFloat(total.toFixed(2)),
        label,
        color,
        bg,
        dimensions: [
            { name: 'Momentum', weight: WEIGHTS.mom, score: mom.score, contrib: mom.score * WEIGHTS.mom * 10, signals: mom.signals },
            { name: 'Valuation', weight: WEIGHTS.val, score: val.score, contrib: val.score * WEIGHTS.val * 10, signals: val.signals },
            { name: 'Quality', weight: WEIGHTS.qual, score: qual.score, contrib: qual.score * WEIGHTS.qual * 10, signals: qual.signals },
            { name: 'Dividend', weight: WEIGHTS.div, score: div.score, contrib: div.score * WEIGHTS.div * 10, signals: div.signals },
            { name: 'Risk', weight: WEIGHTS.risk, score: risk.score, contrib: risk.score * WEIGHTS.risk * 10, signals: risk.signals },
        ],
        dataPoints: allSignals.length,
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// UI Component
// ─────────────────────────────────────────────────────────────────────────────

interface SignalScoreProps {
    ov: TickerOverview | null | undefined;
    perf: TickerPerformance | null | undefined;
    livePrice?: number | null;
    posRow?: StockRow | null;
    dividend?: DividendInfo | null;
    loading: boolean;
}

export default function SignalScore({ ov, perf, livePrice, posRow, dividend, loading }: SignalScoreProps) {
    if (loading) {
        return (
            <div className="card px-5 py-5 space-y-3">
                <div className="skeleton rounded w-32 h-5" />
                <div className="skeleton rounded w-full h-16" />
                <div className="grid grid-cols-5 gap-2">
                    {[...Array(5)].map((_, i) => <div key={i} className="skeleton rounded h-20" />)}
                </div>
            </div>
        );
    }

    const result = computeSignal(ov, perf, livePrice, posRow, dividend);

    if (!result) {
        return (
            <div className="card px-5 py-4 flex items-center gap-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ink-4)" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <p className="text-[12px] text-[var(--ink-4)]">
                    Not enough data to compute a signal for this ticker yet.
                </p>
            </div>
        );
    }

    const { total, label, color, bg, dimensions } = result;

    // Gauge arc path (SVG semi-circle, 0=left=-10, 1=right=+10)
    const gaugeAngle = ((total + 10) / 20) * 180;   // 0° … 180°
    const rad = (gaugeAngle - 90) * (Math.PI / 180);
    const R = 52;
    const cx = 64, cy = 60;
    const nx = cx + R * Math.cos(rad);
    const ny = cy + R * Math.sin(rad);

    // Zone colours on the gauge track
    const ZONES = [
        { from: 0, to: 36, col: 'var(--loss)' },   // Sell   -10 → -3
        { from: 36, to: 63, col: 'var(--warn)' },   // Reduce  -3 → -1
        { from: 63, to: 99, col: '#CBD2DC' },   // Hold    -1 → +1
        { from: 99, to: 126, col: '#0E7490' },   // Accum   +1 → +3
        { from: 126, to: 180, col: 'var(--gain)' },   // Buy     +3 → +10
    ];

    function arcPath(startDeg: number, endDeg: number) {
        const s = (startDeg - 90) * (Math.PI / 180);
        const e = (endDeg - 90) * (Math.PI / 180);
        const x1 = cx + R * Math.cos(s), y1 = cy + R * Math.sin(s);
        const x2 = cx + R * Math.cos(e), y2 = cy + R * Math.sin(e);
        return `M ${x1} ${y1} A ${R} ${R} 0 0 1 ${x2} ${y2}`;
    }

    return (
        <div className="card px-5 py-5">

            {/* ── Header ── */}
            <div className="flex items-center gap-2 mb-4">
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--ink-4)]">Signal Score</span>
                <div className="flex-1 h-px bg-[var(--border)]" />
                <span className="text-[9px] text-[var(--ink-4)]">{result.dataPoints} data points</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 items-start">

                {/* ── Gauge + label ── */}
                <div className="flex flex-col items-center shrink-0 w-[128px]">
                    <svg viewBox="0 0 128 68" width="128" height="68">
                        {/* Zone arcs */}
                        {ZONES.map((z, i) => (
                            <path
                                key={i}
                                d={arcPath(z.from, z.to)}
                                fill="none"
                                stroke={z.col}
                                strokeWidth="8"
                                strokeLinecap="butt"
                                opacity={0.25}
                            />
                        ))}
                        {/* Active filled arc */}
                        <path
                            d={arcPath(0, gaugeAngle)}
                            fill="none"
                            stroke={color}
                            strokeWidth="8"
                            strokeLinecap="butt"
                        />
                        {/* Needle */}
                        <line
                            x1={cx} y1={cy}
                            x2={nx} y2={ny}
                            stroke={color}
                            strokeWidth="2"
                            strokeLinecap="round"
                        />
                        <circle cx={cx} cy={cy} r="3" fill={color} />
                        {/* Score text */}
                        <text x={cx} y={cy - 12} textAnchor="middle"
                            fontSize="14" fontWeight="700" fontFamily="'JetBrains Mono', monospace"
                            fill={color}>
                            {total > 0 ? '+' : ''}{total.toFixed(1)}
                        </text>
                    </svg>

                    {/* Label badge */}
                    <span
                        className="mt-1 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide"
                        style={{ background: bg, color }}
                    >
                        {label}
                    </span>

                    {/* Scale hint */}
                    <div className="flex justify-between w-full mt-1.5 px-1">
                        <span className="text-[8px] text-[var(--loss)] font-semibold">−10</span>
                        <span className="text-[8px] text-[var(--ink-4)]">0</span>
                        <span className="text-[8px] text-[var(--gain)] font-semibold">+10</span>
                    </div>
                </div>

                {/* ── Dimension bars ── */}
                <div className="flex-1 space-y-2.5 w-full">
                    {dimensions.map(dim => {
                        const pct = Math.abs(dim.score) * 100;
                        const pos = dim.score >= 0;
                        const dCol = dim.score > 0.3 ? 'var(--gain)' : dim.score < -0.3 ? 'var(--loss)' : 'var(--ink-4)';
                        return (
                            <div key={dim.name}>
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] font-semibold text-[var(--ink-3)] w-20">{dim.name}</span>
                                        <span className="text-[8px] text-[var(--ink-4)]">{(dim.weight * 100).toFixed(0)}%</span>
                                    </div>
                                    <span className="font-mono text-[10px] font-semibold" style={{ color: dCol }}>
                                        {pos ? '+' : ''}{dim.score.toFixed(2)}
                                    </span>
                                </div>
                                {/* Bar — centred at midpoint, extends left (neg) or right (pos) */}
                                <div className="relative h-2 bg-[var(--canvas)] border border-[var(--border)] rounded-full overflow-hidden">
                                    <div
                                        className="absolute top-0 h-full rounded-full transition-all duration-500"
                                        style={{
                                            width: `${pct / 2}%`,
                                            left: pos ? '50%' : `${50 - pct / 2}%`,
                                            background: dCol,
                                            opacity: 0.8,
                                        }}
                                    />
                                    {/* Centre mark */}
                                    <div className="absolute top-0 left-1/2 w-px h-full bg-[var(--border-strong)]" />
                                </div>
                                {/* Top signal (first one only to keep it compact) */}
                                {dim.signals[0] && (
                                    <p className="text-[9px] text-[var(--ink-4)] mt-0.5 leading-tight">{dim.signals[0]}</p>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── Disclaimer ── */}
            <p className="mt-4 text-[9px] text-[var(--ink-4)] leading-relaxed border-t border-[var(--border)] pt-3">
                Signal score is a quantitative model based on available fundamental and technical data.
                It is not investment advice. Always conduct your own research before making any investment decision.
            </p>
        </div>
    );
}