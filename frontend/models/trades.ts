export interface TradesAll {
  sells: SaleEvent[];
  buys: BuyEvent[];
}

export interface SaleEvent {
  id: number;
  ticker: string;
  name: string;
  market: string;
  shares_sold: number;
  sale_price: number;
  commission: number;
  proceeds: number;
  realized_pl: number;
  fully_closed: boolean;
  sold_at: string;
}

export interface BuyEvent {
  id: number;
  ticker: string;
  name: string;
  market: string;
  shares_bought: number;
  buy_price: number;
  commission: number;
  total_cost: number;
  bought_at: string;
}
