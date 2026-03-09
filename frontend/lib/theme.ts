/**
 * Shared design tokens and Plotly layout factory.
 * Single source of truth for all chart styling.
 */

export const COLORS = {
  bg:      '#07090f',
  surface: '#0d1019',
  panel:   '#121620',
  border:  '#1a2035',
  green:   '#00e87a',
  red:     '#ff3d5a',
  gold:    '#f5c518',
  blue:    '#4d8eff',
  purple:  '#a78bfa',
  snow:    '#e2e8f8',
  muted:   '#3a4260',
  dim:     '#252d45',
} as const;

export const SECTOR_COLORS: Record<string, string> = {
  Healthcare:    '#00c2a8',
  Telecom:       '#4d8eff',
  Agro:          '#7ec850',
  Energy:        '#ff9f43',
  Construction:  '#a29bfe',
  Insurance:     '#fd79a8',
  Manufacturing: '#f5c518',
  Banking:       '#6c5ce7',
  Consumer:      '#b2bec3',
  Technology:    '#00cec9',
  Media:         '#e17055',
  Other:         '#636e72',
};

export function sectorColor(sector: string): string {
  return SECTOR_COLORS[sector] ?? COLORS.blue;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function plotlyLayout(overrides: Record<string, any> = {}): Record<string, any> {
  return {
    paper_bgcolor: 'transparent',
    plot_bgcolor:  'transparent',
    font:          { family: "'IBM Plex Mono', monospace", color: COLORS.snow, size: 11 },
    margin:        { t: 20, b: 40, l: 48, r: 16 },
    colorway:      [COLORS.blue, COLORS.green, COLORS.gold, COLORS.purple, COLORS.red],
    xaxis: {
      gridcolor:    COLORS.border,
      linecolor:    COLORS.border,
      tickfont:     { size: 10, color: COLORS.muted },
      zerolinecolor: COLORS.border,
    },
    yaxis: {
      gridcolor:    COLORS.border,
      linecolor:    COLORS.border,
      tickfont:     { size: 10, color: COLORS.muted },
      zerolinecolor: COLORS.border,
    },
    legend: {
      bgcolor:     'transparent',
      font:        { size: 10, color: COLORS.snow },
    },
    hoverlabel: {
      bgcolor:     COLORS.panel,
      bordercolor: COLORS.border,
      font:        { family: "'IBM Plex Mono', monospace", size: 11, color: COLORS.snow },
    },
    ...overrides,
  };
}

export const PLOTLY_CONFIG = {
  displayModeBar:  false,
  responsive:      true,
  staticPlot:      false,
} as const;