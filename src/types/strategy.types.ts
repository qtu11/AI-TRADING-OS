export interface Strategy {
  id: string;
  userId: string;
  name: string;
  description: string;
  marketType: "FOREX" | "CRYPTO" | "INDICES" | "COMMODITIES" | "ALL";
  timeframe: string; // e.g. "15m", "1h", "4h", "Daily"
  
  // Strategy Rules
  entryConditions: string[];
  exitConditions: string[];
  stopLossRules: string;
  takeProfitRules: string;
  riskRules: string;
  invalidationConditions: string[];
  
  // Media Attachments
  exampleChartUrls: string[];
  
  // Deterministic Performance Metrics
  totalTrades: number;
  winRate: number;
  profitFactor: number;
  expectancy: number;
  netProfit: number;
  averageRiskReward: number;
  maxDrawdown: number;
  bestSession?: string;
  bestSymbol?: string;
  
  createdAt: string;
  updatedAt: string;
}
