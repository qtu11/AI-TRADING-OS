export type TradeDirection = "BUY" | "SELL";
export type TradeStatus = "OPEN" | "CLOSED" | "CANCELLED" | "PENDING";
export type TradeSession = "Asian" | "London" | "New York" | "London+NY" | "Sydney" | "Other";
export type TradeOutcome = "WIN" | "LOSS" | "BREAKEVEN";

export interface Trade {
  id: string;
  userId: string;
  externalTradeId?: string; // MT5 ticket or broker id for deduplication
  source: "MANUAL" | "MT5" | "CSV_IMPORT";
  symbol: string;
  direction: TradeDirection;
  status: TradeStatus;
  
  // Execution prices & sizes
  lots: number;
  openPrice: number;
  closePrice?: number;
  stopLoss: number;
  takeProfit: number;
  
  // Timestamps (ISO strings)
  openTime: string;
  closeTime?: string;
  
  // Financial metrics
  grossProfit?: number;
  commission?: number;
  swap?: number;
  netProfit?: number;
  pips?: number;
  riskAmount?: number; // Dollar amount risked
  riskPercent?: number; // Account % risked
  riskRewardRatio?: number; // Actual R:R achieved
  plannedRiskReward?: number; // Target R:R at entry
  outcome?: TradeOutcome;
  
  // Context & Metadata
  strategyId?: string;
  strategyName?: string;
  session: TradeSession;
  timeframe?: string;
  notes?: string;
  
  // Psychology & Screenshots
  preTradeEmotion?: string;
  postTradeEmotion?: string;
  followedPlan?: boolean;
  screenshotBeforeUrl?: string;
  screenshotAfterUrl?: string;
  
  // AI Audit
  aiAudit?: TradeAIAudit;
  
  createdAt: string;
  updatedAt: string;
}

export interface TradeAIAudit {
  overallScore: number; // 0 - 100
  entryQualityScore: number;
  riskManagementScore: number;
  disciplineScore: number;
  verdict: "EXCELLENT" | "SOLID" | "RULE_VIOLATION" | "RECKLESS";
  strengths: string[];
  mistakes: string[];
  recommendations: string[];
  generatedAt: string;
}

export interface TradeFilterOptions {
  symbol?: string;
  strategyId?: string;
  session?: TradeSession;
  outcome?: TradeOutcome;
  direction?: TradeDirection;
  startDate?: string;
  endDate?: string;
  source?: "MANUAL" | "MT5" | "CSV_IMPORT";
  status?: TradeStatus;
  page?: number;
  pageSize?: number;
}
