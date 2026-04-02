export const ROUTES = {
  login: '/login',
  register: '/register',
  ngx: '/ngx',
  us: '/us',
  combined: '/combined',
  dividends: '/dividends',
  history: '/history',
  watchlist: '/watchlist',
  settings: '/settings',
  ngxAdvanced: '/ngx/advanced',
  ngxTicker: (ticker: string) => `/ngx/${ticker}`,
} as const;
