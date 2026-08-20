export type PlanDurationMonths = 1 | 3 | 6 | 9 | 12;

export interface TradingPlan {
  id: string;
  userId: string;
  name: string;
  status: "ACTIVE" | "COMPLETED" | "ARCHIVED";
  
  // Core financial inputs
  startingCapital: number;
  targetCapital: number;
  targetProfit: number;
  durationMonths: PlanDurationMonths;
  startDate: string;
  endDate: string;
  
  // Risk parameters
  riskProfile: "conservative" | "moderate" | "aggressive" | "custom";
  riskPerTradePercent: number;
  maxDailyLossPercent: number;
  maxTradesPerDay: number;
  
  // Execution constraints
  allowedSessions: Array<"Asian" | "London" | "New York" | "Sydney">;
  allowedTradingDays: Array<"Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday">;
  allowedSymbols: string[];
  strategyIds: string[];
  
  // Deterministic Math Calculations
  requiredTotalReturnPercent: number;
  requiredMonthlyReturnPercent: number;
  requiredWeeklyReturnPercent: number;
  requiredDailyReturnDollars: number;
  feasibilityScore: number; // 0 - 100%
  feasibilityRating: "VERY_REALISTIC" | "REALISTIC" | "AGGRESSIVE" | "UNREALISTIC";
  riskOfRuinPercent: number;
  maxDrawdownProjectedPercent: number;
  expectedLosingStreak: number;
  
  // AI Optimization suggestions
  aiRecommendation?: string;
  
  // Milestones hierarchy
  milestones: PlanMilestone[];
  
  createdAt: string;
  updatedAt: string;
}

export interface PlanMilestone {
  id: string;
  periodType: "MONTH" | "WEEK";
  periodIndex: number;
  periodLabel: string; // e.g. "Month 1 - August 2026" or "Week 1"
  startDate: string;
  endDate: string;
  targetProfit: number;
  targetPips?: number;
  actualProfit: number;
  actualTrades: number;
  status: "PENDING" | "IN_PROGRESS" | "ACHIEVED" | "MISSED";
}

export interface DailyTask {
  id: string;
  planId: string;
  date: string; // YYYY-MM-DD
  title: string;
  category: "prep" | "execution" | "review";
  completed: boolean;
  completedAt?: string;
  notes?: string;
}
