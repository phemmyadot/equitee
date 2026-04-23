export interface HoldingRecord {
  id: number;
  ticker: string;
  name: string;
  market: 'ngx' | 'us';
  shares: number;
  avg_cost: number;
  sector: string;
  is_active: boolean;
  created_at: string;
  purchase_date: string | null;
}

export interface ClosedRecord {
  id: number;
  ticker: string;
  name: string;
  market: string;
  realized_pl: number;
  closed_at: string;
}

export interface SellResult {
  holding: HoldingRecord;
  realized_pl: number;
  fully_closed: boolean;
  closed_position?: ClosedRecord;
}

export interface CashBalance {
  ngn: number;
  usd: number;
}

export interface InviteCode {
  code: string;
  used: boolean;
  used_at: string | null;
  created_at: string;
}

export interface SettingsInit {
  holdings: HoldingRecord[];
  closed: ClosedRecord[];
  cash: CashBalance;
  invites: InviteCode[] | null;
}
