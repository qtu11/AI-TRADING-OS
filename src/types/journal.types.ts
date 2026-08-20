export type MarketBias = "BULLISH" | "BEARISH" | "NEUTRAL" | "RANGING";
export type MarketVolatility = "LOW" | "NORMAL" | "HIGH" | "EXTREME";

export interface DailyJournal {
  id: string; // YYYY-MM-DD
  userId: string;
  date: string; // YYYY-MM-DD
  
  // Market Context
  marketBias: MarketBias;
  marketCondition: string;
  primarySession: string;
  volatility: MarketVolatility;
  importantNewsEvents: string[];
  
  // Structured Pre-Market & Post-Market Analysis
  preMarketNotes: string;
  watchedLevels: string;
  invalidationCriteria: string;
  expectedScenarios: string;
  postMarketReview: string;
  lessonsLearned: string;
  
  // Attached Media
  chartScreenshotUrls: string[];
  
  // Daily Summary (Auto aggregated from linked trades)
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakevenTrades: number;
  winRate: number;
  netProfit: number;
  grossProfit: number;
  grossLoss: number;
  profitFactor: number;
  averageRiskReward: number;
  
  // Psychology & Discipline Snapshot
  disciplineScore: number;
  followedPlan: boolean;
  
  // AI Daily Review
  aiDailyReview?: {
    summary: string;
    strengths: string[];
    weaknesses: string[];
    keyTakeaway: string;
    focusForTomorrow: string;
    confidence: number;
    generatedAt: string;
  };
  
  // Milestone Context (synced from MilestoneModal)
  milestoneContext?: {
    milestoneId: string;
    milestoneLabel: string;
    targetProfit: number;
    keyWins?: string;
    challenges?: string;
    nextMilestoneFocus?: string;
  };
  
  // Soft delete marker
  deletedAt?: string;
  
  createdAt: string;
  updatedAt: string;
}
