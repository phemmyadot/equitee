export interface NGXPrice {
  symbol: string;
  price: number;
  close?: number;
  change?: number;
  change_pct?: number;
  high?: number;
  low?: number;
  volume?: number;
  value?: number;
}

export interface USPrice {
  symbol: string;
  price: number;
  close?: number;
  change?: number;
  change_pct?: number;
  high?: number;
  low?: number;
  volume?: number;
  currency: string;
}

export interface FXRate {
  rate: number;
  source: string;
  ts: number;
}

export interface StockRow {
  Stock: string;
  Ticker: string;
  Sector: string;
  Shares: number;
  AvgCost?: number;
  RemainingCost?: number;
  CurrentEquity?: number;
  UnrealizedPL?: number;
  RealizedPL: number;
  TotalPL?: number;
  ReturnPct?: number;
  OriginalCost?: number;
  LivePrice?: number;
  LiveChange?: number;
  LiveChangePct?: number;
  DayHigh?: number;
  DayLow?: number;
  Volume?: number;
  PriceSource: string;
  UsdEquity?: number;
  UsdCost?: number;
  UsdReturn?: number;
  RealReturnPct?: number;
  // Fundamentals — present on page-specific endpoints (ngx/home, ngx/advanced)
  PeRatio?: number | null;
  Roe?: number | null;
  Eps?: number | null;
  BookValue?: number | null;
  DividendYield?: number | null;
  Beta?: number | null;
  Ma50?: number | null;
  Ma200?: number | null;
  Week52High?: number | null;
  Week52Low?: number | null;
  Rsi14?: number | null;
  PiotroskiScore?: number | null;
  AltmanZscore?: number | null;
}

export interface SectorRow {
  Sector: string;
  Equity: number;
  GainPct: number;
  Count: number;
}

export interface SoldRow {
  Stock: string;
  Ticker: string;
  Market: string;
  RealizedPL: number;
}
