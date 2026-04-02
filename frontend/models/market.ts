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
