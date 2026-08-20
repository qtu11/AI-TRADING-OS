export interface MT5AccountConnection {
  id: string;
  userId: string;
  accountNumber: string;
  brokerServer: string;
  accountName?: string;
  currency: string;
  leverage: number;
  balance: number;
  equity: number;
  freeMargin: number;
  marginLevel: number;
  status: "CONNECTED" | "DISCONNECTED" | "ERROR" | "SYNCING";
  lastSyncAt?: string;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MT5RawTradeRecord {
  ticket: number | string;
  symbol: string;
  type: "BUY" | "SELL" | 0 | 1;
  volume: number;
  openPrice: number;
  closePrice?: number;
  sl: number;
  tp: number;
  openTime: string | number;
  closeTime?: string | number;
  profit: number;
  commission: number;
  swap: number;
  comment?: string;
}

export interface MT5SyncResult {
  success: boolean;
  totalFetched: number;
  newImported: number;
  duplicatesSkipped: number;
  errors: string[];
  syncTimestamp: string;
}
