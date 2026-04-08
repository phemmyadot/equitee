export interface SaleEvent {
  id: number;
  ticker: string;
  name: string;
  market: string;
  shares_sold: number;
  sale_price: number;
  proceeds: number;
  realized_pl: number;
  fully_closed: boolean;
  sold_at: string;
}
