/**
 * Design tokens + Plotly layout factory.
 * Light theme — matches globals.css variables exactly.
 */

export const COLORS = {
  canvas: '#F7F8FA',
  surface: '#FFFFFF',
  border: '#E4E7EC',
  'border-strong': '#CBD2DC',
  ink: '#0F1728',
  ink2: '#374151',
  ink3: '#6B7280',
  ink4: '#9CA3AF',
  accent: '#1DB87A',
  accentLight: '#E6F7F0',
  gain: '#0A7B44',
  gainLight: '#E6F4EE',
  loss: '#BE1B1B',
  lossLight: '#FDEAEA',
  warn: '#92600A',
  teal: '#0E7490',
  purple: '#6D28D9',
} as const;

export const SECTOR_COLORS: Record<string, string> = {
  Healthcare: '#0E7490',
  Telecom: '#1A56DB',
  Agro: '#2D7D3A',
  Energy: '#B45309',
  Construction: '#6D28D9',
  Insurance: '#BE185D',
  Manufacturing: '#92600A',
  Banking: '#1E40AF',
  Consumer: '#374151',
  Technology: '#0891B2',
  Media: '#9D174D',
  Other: '#6B7280',
};

export function sectorColor(sector: string): string {
  return SECTOR_COLORS[sector] ?? COLORS.accent;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function plotlyLayout(overrides: Record<string, any> = {}): Record<string, any> {
  return {
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    font: {
      family: "'Plus Jakarta Sans', sans-serif",
      color: COLORS.ink3,
      size: 11,
    },
    margin: { t: 12, b: 40, l: 52, r: 16 },
    colorway: [
      COLORS.accent,
      COLORS.teal,
      COLORS.gain,
      COLORS.warn,
      COLORS.purple,
      COLORS.loss,
      '#0891B2',
      '#2D7D3A',
    ],
    xaxis: {
      gridcolor: '#F0F2F5',
      linecolor: COLORS.border,
      tickfont: { size: 10, color: COLORS.ink4, family: "'JetBrains Mono', monospace" },
      zerolinecolor: COLORS.border,
      zerolinewidth: 1,
    },
    yaxis: {
      gridcolor: '#F0F2F5',
      linecolor: COLORS.border,
      tickfont: { size: 10, color: COLORS.ink4, family: "'JetBrains Mono', monospace" },
      zerolinecolor: COLORS['border-strong'],
      zerolinewidth: 1.5,
    },
    legend: {
      bgcolor: 'rgba(255,255,255,0)',
      font: { size: 11, color: COLORS.ink2, family: "'Plus Jakarta Sans', sans-serif" },
      borderwidth: 0,
    },
    hoverlabel: {
      bgcolor: '#FFFFFF',
      bordercolor: COLORS.border,
      font: { family: "'JetBrains Mono', monospace", size: 11, color: COLORS.ink },
    },
    ...overrides,
  };
}

export const PLOTLY_CONFIG = {
  displayModeBar: false,
  responsive: true,
  staticPlot: false,
} as const;
