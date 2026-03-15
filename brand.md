# equitee — Brand Guide

> Feed this file to Claude Code alongside `CLAUDE.md` to apply the brand to the app.
> All logo SVGs are inlined — no external files needed to read this document.

---

## Identity

| | |
|---|---|
| **Name** | `equitee` — always lowercase. Never `Equitee` or `EQUITEE`. |
| **Tagline** | *Your edge in the market.* |
| **Category** | Personal finance / investment tracking |
| **Markets** | Nigerian Exchange (NGX) + US equities |
| **Personality** | Precise · Confident · Direct · Calm |

The trailing **e** is set in Signal Green (`#1DB87A`) in all digital brand contexts.

---

## Logo Mark — Concept

The mark is a **rising price chart polyline with a circle dot breaking above the line** — an upward signal piercing resistance. It communicates momentum, analysis, and positive returns in a single glyph.

The dot is always Signal Green. It is the one pixel of colour that anchors the identity. Never recolour it.

### Logo mark SVG (copy this into `Header.tsx`)

```svg
<svg width="14" height="14" viewBox="0 0 24 24" fill="none">
  <polyline
    points="2,18 8,10 13,15 19,7 22,10"
    stroke="white"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  />
  <circle cx="22" cy="6" r="2.5" fill="#1DB87A" />
</svg>
```

### Wordmark JSX (copy this into `Header.tsx`)

```tsx
<span className="font-bold text-[13px] tracking-tight">
  equite
  <span style={{ color: '#1DB87A' }}>e</span>
  <span className="hidden sm:inline font-normal text-[var(--ink-4)]">
    {' '}· portfolio
  </span>
</span>
```

---

## Logo Variants

### Primary — on dark (navy background)
> Use for: dark surfaces, splash screens, email headers

<svg width="560" height="160" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 160">
  <rect width="560" height="160" fill="#0B1F3A" rx="16"/>
  <rect x="28" y="28" width="104" height="104" fill="rgba(29,184,122,0.12)" rx="22"/>
  <polyline points="37.75,99.5 57.25,70.25 73.5,86.5 93,57.25 109.25,67" stroke="#1DB87A" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <circle cx="109.25" cy="50.75" r="9.75" fill="#1DB87A"/>
  <text x="152" y="90" font-family="'Arial', sans-serif" font-size="68" font-weight="600" letter-spacing="-2" fill="#FFFFFF">equite</text>
  <text x="422" y="90" font-family="'Arial', sans-serif" font-size="68" font-weight="600" letter-spacing="-2" fill="#1DB87A">e</text>
</svg>

---

### Primary — on light (white background)
> Use for: documents, presentations, light UI

<svg width="560" height="160" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 160">
  <rect width="560" height="160" fill="#FFFFFF" rx="16"/>
  <rect x="28" y="28" width="104" height="104" fill="#0B1F3A" rx="22"/>
  <polyline points="37.75,99.5 57.25,70.25 73.5,86.5 93,57.25 109.25,67" stroke="#1DB87A" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <circle cx="109.25" cy="50.75" r="9.75" fill="#1DB87A"/>
  <text x="152" y="90" font-family="'Arial', sans-serif" font-size="68" font-weight="600" letter-spacing="-2" fill="#0B1F3A">equite</text>
  <text x="422" y="90" font-family="'Arial', sans-serif" font-size="68" font-weight="600" letter-spacing="-2" fill="#1DB87A">e</text>
</svg>

---

### Primary — on canvas (app background)
> Use for: app dashboard header, product screenshots

<svg width="560" height="160" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 160">
  <rect width="560" height="160" fill="#F5F7FA" rx="16"/>
  <rect x="28" y="28" width="104" height="104" fill="#0B1F3A" rx="22"/>
  <polyline points="37.75,99.5 57.25,70.25 73.5,86.5 93,57.25 109.25,67" stroke="#1DB87A" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <circle cx="109.25" cy="50.75" r="9.75" fill="#1DB87A"/>
  <text x="152" y="90" font-family="'Arial', sans-serif" font-size="68" font-weight="600" letter-spacing="-2" fill="#0B1F3A">equite</text>
  <text x="422" y="90" font-family="'Arial', sans-serif" font-size="68" font-weight="600" letter-spacing="-2" fill="#1DB87A">e</text>
</svg>

---

### On Signal Green
> Use for: brand moments, promotional materials, success states

<svg width="560" height="160" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 160">
  <rect width="560" height="160" fill="#1DB87A" rx="16"/>
  <rect x="28" y="28" width="104" height="104" fill="rgba(255,255,255,0.18)" rx="22"/>
  <polyline points="37.75,99.5 57.25,70.25 73.5,86.5 93,57.25 109.25,67" stroke="#FFFFFF" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <circle cx="109.25" cy="50.75" r="9.75" fill="#FFFFFF"/>
  <text x="152" y="90" font-family="'Arial', sans-serif" font-size="68" font-weight="600" letter-spacing="-2" fill="#FFFFFF">equitee</text>
</svg>

---

### Monochrome — navy
> Use for: single-colour print, legal docs, letterhead

<svg width="560" height="160" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 160">
  <rect width="560" height="160" fill="#FFFFFF" rx="16"/>
  <rect x="28" y="28" width="104" height="104" fill="#0B1F3A" rx="22"/>
  <polyline points="37.75,99.5 57.25,70.25 73.5,86.5 93,57.25 109.25,67" stroke="#FFFFFF" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <circle cx="109.25" cy="50.75" r="9.75" fill="#FFFFFF"/>
  <text x="152" y="90" font-family="'Arial', sans-serif" font-size="68" font-weight="600" letter-spacing="-2" fill="#0B1F3A">equitee</text>
</svg>

---

### Monochrome — white (reversed)
> Use for: dark print, merchandise, emboss on dark fabric

<svg width="560" height="160" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 160">
  <rect width="560" height="160" fill="#0B1F3A" rx="16"/>
  <rect x="28" y="28" width="104" height="104" fill="rgba(255,255,255,0.15)" rx="22"/>
  <polyline points="37.75,99.5 57.25,70.25 73.5,86.5 93,57.25 109.25,67" stroke="#FFFFFF" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <circle cx="109.25" cy="50.75" r="9.75" fill="#FFFFFF"/>
  <text x="152" y="90" font-family="'Arial', sans-serif" font-size="68" font-weight="600" letter-spacing="-2" fill="#FFFFFF">equitee</text>
</svg>

---

## Icon Marks
> Use when the wordmark would be too small, or in square crops — app icon, favicon, social avatar.

### Navy (primary — use for app icon and favicon)

<svg width="160" height="160" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">
  <rect width="160" height="160" fill="#0B1F3A" rx="36"/>
  <polyline points="37.75,99.5 57.25,70.25 73.5,86.5 93,57.25 109.25,67" stroke="#1DB87A" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <circle cx="109.25" cy="50.75" r="9.75" fill="#1DB87A"/>
</svg>

### White background

<svg width="160" height="160" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">
  <rect width="160" height="160" fill="#FFFFFF" rx="36"/>
  <rect x="0" y="0" width="160" height="160" fill="none" stroke="#E4E7EC" stroke-width="1.5" rx="36"/>
  <polyline points="37.75,99.5 57.25,70.25 73.5,86.5 93,57.25 109.25,67" stroke="#0B1F3A" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <circle cx="109.25" cy="50.75" r="9.75" fill="#1DB87A"/>
</svg>

### Signal Green background

<svg width="160" height="160" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">
  <rect width="160" height="160" fill="#1DB87A" rx="36"/>
  <polyline points="37.75,99.5 57.25,70.25 73.5,86.5 93,57.25 109.25,67" stroke="#FFFFFF" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <circle cx="109.25" cy="50.75" r="9.75" fill="#FFFFFF"/>
</svg>

---

## Wordmarks (no icon)

### Navy on white

<svg width="420" height="100" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 100">
  <rect width="420" height="100" fill="#FFFFFF"/>
  <text x="4" y="72" font-family="'Arial', sans-serif" font-size="72" font-weight="600" letter-spacing="-2" fill="#0B1F3A">equite</text>
  <text x="284" y="72" font-family="'Arial', sans-serif" font-size="72" font-weight="600" letter-spacing="-2" fill="#1DB87A">e</text>
</svg>

### White on dark

<svg width="420" height="100" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 100">
  <rect width="420" height="100" fill="#0B1F3A"/>
  <text x="4" y="72" font-family="'Arial', sans-serif" font-size="72" font-weight="600" letter-spacing="-2" fill="#FFFFFF">equite</text>
  <text x="284" y="72" font-family="'Arial', sans-serif" font-size="72" font-weight="600" letter-spacing="-2" fill="#1DB87A">e</text>
</svg>

---

## Tagline Lockup
> Use for: landing page hero, presentation cover, onboarding

<svg width="560" height="210" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 210">
  <rect width="560" height="210" fill="#FFFFFF" rx="16"/>
  <rect x="28" y="24" width="88" height="88" fill="#0B1F3A" rx="18"/>
  <polyline points="36.25,84.5 52.75,59.75 66.5,73.5 83,48.75 96.75,57" stroke="#1DB87A" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <circle cx="96.75" cy="43.25" r="8.25" fill="#1DB87A"/>
  <text x="134" y="76" font-family="'Arial', sans-serif" font-size="56" font-weight="600" letter-spacing="-2" fill="#0B1F3A">equite</text>
  <text x="368" y="76" font-family="'Arial', sans-serif" font-size="56" font-weight="600" letter-spacing="-2" fill="#1DB87A">e</text>
  <line x1="134" y1="104" x2="530" y2="104" stroke="#E4E7EC" stroke-width="1"/>
  <text x="134" y="136" font-family="'Arial', sans-serif" font-size="24" font-weight="400" letter-spacing="1" fill="#6B7280">Your edge in the market.</text>
</svg>

---

## Colour System

### Primary palette

| Swatch | Name | Hex | Usage |
|--------|------|-----|-------|
| 🟦 | **Navy** | `#0B1F3A` | Primary ink, logo background, headings |
| 🟩 | **Signal Green** | `#1DB87A` | Accent, gain, live data, the trailing "e" |
| 🟨 | **Mint** | `#E6F7F0` | Green tint backgrounds |
| ⬜ | **Canvas** | `#F5F7FA` | App background |

### Semantic palette

| Swatch | Name | Hex | Usage |
|--------|------|-----|-------|
| 🟥 | **Loss Red** | `#E24B4A` | Sell · danger · negative returns |
| 🟧 | **Amber** | `#F0A500` | Warning · hold · delayed prices |
| 🔵 | **Teal** | `#0E7490` | Accumulate · info |
| 🔷 | **Blue** | `#1A56DB` | Interactive · links · US market badge |

### Colour rules

- Navy + Signal Green is the primary pairing.
- Signal Green on white for all positive/gain values.
- Loss Red on white for all negative/loss values.
- Never use Signal Green as a text colour on a green background — contrast fails.
- Never add colours to the palette without review.
- No gradients on the mark.

---

## Typography

Two typefaces only. Sans for reasoning, mono for data.

### Plus Jakarta Sans — UI & display

```
Usage:   All UI text, headings, labels, body copy, navigation
Weights: 400 Regular · 500 Medium · 700 Bold (display only)
Source:  Google Fonts (free)
Import:  https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;700
```

### JetBrains Mono — data & numbers

```
Usage:   All prices, percentages, share counts, ticker symbols, dates, code
Weights: 400 Regular · 500 Medium
Source:  Google Fonts (free)
Import:  https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500
```

### Type scale

| Role | Size | Weight | Usage |
|------|------|--------|-------|
| Display | 42px | 700 | Hero wordmark only |
| H1 | 28px | 500 | Page titles |
| H2 | 22px | 500 | Section headings |
| Body | 13px | 400 | All prose, line-height 1.6 |
| Label | 10px | 600 | Uppercase field labels, tracking +70 |
| Data large | 20px mono | 600 | Primary KPI numbers |
| Data small | 12px mono | 500 | Table cells, inline values |

---

## CSS Design Tokens

Apply these to `portfolio_frontend/src/app/globals.css`:

```css
/* ── Brand update: replace blue accent with Signal Green ── */

/* Surfaces */
--canvas:        #F5F7FA;
--surface:       #FFFFFF;
--border:        #E4E7EC;
--border-strong: #CBD2DC;

/* Typography */
--ink:           #0B1F3A;   /* navy — brand primary */
--ink-2:         #374151;
--ink-3:         #6B7280;
--ink-4:         #9CA3AF;

/* Brand accent — CHANGED from #1A56DB to Signal Green */
--accent:        #1DB87A;
--accent-light:  #E6F7F0;

/* Semantic — unchanged */
--gain:          #0A7B44;
--gain-light:    #E6F7F0;
--loss:          #E24B4A;
--loss-light:    #FDEAEA;
--warn:          #92600A;
--warn-light:    #FEF3CD;
--teal:          #0E7490;
--purple:        #6D28D9;

/* Fonts */
--font-sans:     'Plus Jakarta Sans', sans-serif;
--font-mono:     'JetBrains Mono', monospace;
```

Apply these to `portfolio_frontend/src/lib/theme.ts`:

```ts
export const COLORS = {
  canvas:       '#F5F7FA',
  surface:      '#FFFFFF',
  border:       '#E4E7EC',
  'border-strong': '#CBD2DC',
  ink:          '#0B1F3A',
  ink2:         '#374151',
  ink3:         '#6B7280',
  ink4:         '#9CA3AF',
  accent:       '#1DB87A',   // Signal Green — CHANGED
  accentLight:  '#E6F7F0',   // CHANGED
  gain:         '#0A7B44',
  gainLight:    '#E6F7F0',
  loss:         '#E24B4A',
  lossLight:    '#FDEAEA',
  warn:         '#92600A',
  teal:         '#0E7490',
  purple:       '#6D28D9',
} as const;
```

---

## Signal Score Visual Language

The Signal Score is equitee's primary analytical output — a composite -10 to +10 score.

### Labels and colours

| Score range | Label | Colour | Background |
|-------------|-------|--------|------------|
| > +6 | Strong Buy | `#0A7B44` | `#E6F7F0` |
| +3 to +6 | Buy | `#0A7B44` | `#E6F7F0` |
| +1 to +3 | Accumulate | `#0E7490` | `#E0F2F7` |
| -1 to +1 | Hold | `#6B7280` | `#F5F7FA` |
| -3 to -1 | Reduce | `#92600A` | `#FEF3CD` |
| < -3 | Sell | `#BE1B1B` | `#FDEAEA` |

### Dimension weights

| Dimension | Weight | Key inputs |
|-----------|--------|------------|
| Quality | 30% | Piotroski F-Score, Altman Z, ROE, ROIC, earnings growth |
| Momentum | 25% | Return ladder 1M/3M/6M/1Y, 52W range position |
| Valuation | 25% | P/E, P/B, FCF yield, EV/EBITDA |
| Dividend | 10% | Yield, yield-on-cost, payout coverage |
| Risk | 10% | Altman Z distress, max drawdown, D/E, Sharpe |

---

## Status Badges

| Badge | Background | Text colour | Usage |
|-------|-----------|-------------|-------|
| NGX | `#0B1F3A` | `#FFFFFF` | Nigerian Exchange positions |
| US | `#EBF0FD` | `#1A56DB` | US equity positions |
| ● Live | `#E6F7F0` | `#0A7B44` | Real-time price confirmed |
| Cached | `#F5F7FA` | `#6B7280` | Price from cache within TTL |
| Delayed | `#FEF3CD` | `#92600A` | NGX 30-min delayed price |
| No data | `#F5F7FA` | `#9CA3AF` | Price unavailable |

---

## Implementation Checklist for Claude Code

Work through these in order. Each item is a precise file change.

```
File: portfolio_frontend/src/app/globals.css
  [ ] --accent:       #1DB87A   (was #1A56DB)
  [ ] --accent-light: #E6F7F0   (was #EBF0FD)

File: portfolio_frontend/src/lib/theme.ts
  [ ] accent:      '#1DB87A'
  [ ] accentLight: '#E6F7F0'

File: portfolio_frontend/src/app/layout.tsx
  [ ] metadata.title: 'equitee'
  [ ] metadata.description: 'Your edge in the market.'

File: portfolio_frontend/src/components/layout/Header.tsx
  [ ] Replace logo mark SVG (see "Logo mark SVG" section above)
  [ ] Replace wordmark span (see "Wordmark JSX" section above)
  [ ] Replace logo div background: bg-[#0B1F3A]

File: portfolio_frontend/public/
  [ ] Add favicon.svg (copy equitee-icon-navy.svg, rename)
  [ ] Add favicon.ico (convert from equitee-icon-navy.png)
  [ ] Add og-image.png (use equitee-lockup-tagline.png, resize to 1200×630)

File: CLAUDE.md (root)
  [ ] Replace all "Portfolio Analyzer" with "equitee"
```

### Hardcoded hex audit

Search for these strings across all `.tsx` / `.css` files and replace with CSS variables:

```
#1A56DB  →  var(--accent)
#1447C0  →  var(--accent)     (hover state — darken Signal Green to #17a06b instead)
#EBF0FD  →  var(--accent-light)
```

Signal Green hover state (for buttons): `#17A06B` (10% darker than `#1DB87A`).

---

## Voice & Tone

**Do:**
- "GTCO · Signal +5.8 · Buy"
- "Your projected payout: ₦43,500"
- "Altman Z 3.24 — financially safe"
- "P/E 8.2x — cheap"

**Don't:**
- "It appears that based on available data this stock might be worth considering"
- "Exciting portfolio update!"
- Rounding numbers unnecessarily
- Hedging clear signals

---

## Domain & Handles

| | |
|---|---|
| Primary | `equitee.app` |
| Alternatives | `getequitee.io` · `equitee.finance` |
| Twitter/X | `@equiteeapp` |
| GitHub | `github.com/equitee` |
| App Store name | `equitee — portfolio tracker` |

---

## Logo Asset Files

All logo files are in `equitee_logos/` (also available as `equitee_logos.zip`):

```
equitee_logos/
├── equitee-logo-on-dark.svg          Primary logo — dark bg
├── equitee-logo-on-dark.png          PNG @1x
├── equitee-logo-on-dark@2x.png       PNG @2x
├── equitee-logo-on-light.svg         Primary logo — light bg
├── equitee-logo-on-light.png
├── equitee-logo-on-light@2x.png
├── equitee-logo-on-canvas.svg        Primary logo — app bg
├── equitee-logo-on-canvas.png
├── equitee-logo-on-canvas@2x.png
├── equitee-logo-on-green.svg         Brand moments
├── equitee-logo-on-green.png
├── equitee-logo-on-green@2x.png
├── equitee-logo-mono-navy.svg        Monochrome — navy
├── equitee-logo-mono-navy.png
├── equitee-logo-mono-navy@2x.png
├── equitee-logo-mono-white.svg       Monochrome — white
├── equitee-logo-mono-white.png
├── equitee-logo-mono-white@2x.png
├── equitee-icon-navy.svg             ← USE FOR FAVICON
├── equitee-icon-navy.png
├── equitee-icon-navy@2x.png
├── equitee-icon-white.svg
├── equitee-icon-white.png
├── equitee-icon-white@2x.png
├── equitee-icon-green.svg
├── equitee-icon-green.png
├── equitee-icon-green@2x.png
├── equitee-wordmark-navy.svg
├── equitee-wordmark-navy.png
├── equitee-wordmark-navy@2x.png
├── equitee-wordmark-on-dark.svg
├── equitee-wordmark-on-dark.png
├── equitee-wordmark-on-dark@2x.png
├── equitee-lockup-tagline.svg        ← USE FOR OG IMAGE BASE
├── equitee-lockup-tagline.png
└── equitee-lockup-tagline@2x.png
```

Use **SVG** for all web/screen contexts. Use **PNG @2x** for app stores, Notion, email, Figma.
