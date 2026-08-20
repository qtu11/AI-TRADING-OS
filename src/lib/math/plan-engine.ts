import { PlanDurationMonths, PlanMilestone } from "@/types/plan.types";

export interface PlanEngineInput {
  startingCapital: number;
  targetProfit: number;
  durationMonths: PlanDurationMonths;
  riskPerTradePercent: number;
  maxDailyLossPercent: number;
  maxTradesPerDay: number;
  estimatedWinRatePercent?: number; // default 50%
  estimatedRiskReward?: number; // default 1.5
}

export interface PlanFeasibilityResult {
  requiredTotalReturnPercent: number;
  requiredMonthlyReturnPercent: number;
  requiredWeeklyReturnPercent: number;
  requiredDailyReturnDollars: number;
  feasibilityScore: number; // 0 to 100
  feasibilityRating: "VERY_REALISTIC" | "REALISTIC" | "AGGRESSIVE" | "UNREALISTIC";
  riskOfRuinPercent: number;
  maxDrawdownProjectedPercent: number;
  expectedLosingStreak: number;
  totalTradingDaysEstimated: number;
  recommendedAdjustment?: string;
}

export function calculatePlanFeasibility(input: PlanEngineInput): PlanFeasibilityResult {
  const {
    startingCapital,
    targetProfit,
    durationMonths,
    riskPerTradePercent,
    maxTradesPerDay,
    estimatedWinRatePercent = 50,
    estimatedRiskReward = 1.5,
  } = input;

  const safeCapital = Math.max(100, startingCapital);
  const safeProfit = Math.max(1, targetProfit);
  const safeDuration = Math.max(1, durationMonths);

  // Approximate trading days (approx 21 active forex trading days per month)
  const totalTradingDaysEstimated = safeDuration * 21;
  const totalTradingWeeks = safeDuration * 4.33;

  // Percentage returns required
  const requiredTotalReturnPercent = Number(((safeProfit / safeCapital) * 100).toFixed(2));
  
  // Compound monthly return required: (1 + totalReturn)^(1/months) - 1
  const growthMultiplier = (safeCapital + safeProfit) / safeCapital;
  const requiredMonthlyReturnPercent = Number(
    ((Math.pow(growthMultiplier, 1 / safeDuration) - 1) * 100).toFixed(2)
  );

  const requiredWeeklyReturnPercent = Number(
    ((Math.pow(growthMultiplier, 1 / totalTradingWeeks) - 1) * 100).toFixed(2)
  );

  const requiredDailyReturnDollars = Number(
    (safeProfit / totalTradingDaysEstimated).toFixed(2)
  );

  // Expected losing streak formula: ln(N) / -ln(1 - p) where N = total trades, p = win rate (so 1-p = loss rate)
  const totalEstimatedTrades = totalTradingDaysEstimated * Math.max(1, maxTradesPerDay * 0.7);
  const lossProbability = Math.max(0.1, 1 - (estimatedWinRatePercent / 100));
  const expectedLosingStreak = Math.min(
    25,
    Math.max(2, Math.round(Math.log(Math.max(10, totalEstimatedTrades)) / -Math.log(lossProbability)))
  );

  // Projected Drawdown: based on expected losing streak * risk per trade * slippage multiplier
  const maxDrawdownProjectedPercent = Number(
    Math.min(95, expectedLosingStreak * riskPerTradePercent * 1.35).toFixed(1)
  );

  // Risk of Ruin estimation (Perry Kaufman formula approximation)
  // R = ((1 - A) / (1 + A))^U where A = Edge, U = Units of risk
  const winRateDec = estimatedWinRatePercent / 100;
  const lossRateDec = 1 - winRateDec;
  const edge = (winRateDec * estimatedRiskReward) - lossRateDec;
  
  let riskOfRuinPercent = 1;
  if (edge <= 0) {
    riskOfRuinPercent = 99.9;
  } else {
    const unitsOfCapital = 100 / Math.max(0.25, riskPerTradePercent);
    const rBase = (1 - edge) / (1 + edge);
    if (rBase > 0 && rBase < 1) {
      riskOfRuinPercent = Number((Math.pow(rBase, unitsOfCapital / 10) * 100).toFixed(1));
    }
  }

  // Feasibility Score (0 to 100):
  // Monthly return benchmark:
  // <= 3% / mo -> 95 score
  // 5% / mo -> 85 score
  // 10% / mo -> 65 score
  // 20% / mo -> 35 score
  // > 35% / mo -> < 15 score
  let feasibilityScore = 100;
  
  if (requiredMonthlyReturnPercent <= 4) {
    feasibilityScore = 95 - (requiredMonthlyReturnPercent * 2);
  } else if (requiredMonthlyReturnPercent <= 10) {
    feasibilityScore = 85 - ((requiredMonthlyReturnPercent - 4) * 4);
  } else if (requiredMonthlyReturnPercent <= 25) {
    feasibilityScore = 60 - ((requiredMonthlyReturnPercent - 10) * 2.5);
  } else {
    feasibilityScore = Math.max(5, 25 - ((requiredMonthlyReturnPercent - 25) * 0.8));
  }

  // Penalty if risk per trade is too high
  if (riskPerTradePercent > 2.0) {
    feasibilityScore -= (riskPerTradePercent - 2.0) * 12;
  }

  feasibilityScore = Number(Math.max(5, Math.min(98, feasibilityScore)).toFixed(0));

  let feasibilityRating: "VERY_REALISTIC" | "REALISTIC" | "AGGRESSIVE" | "UNREALISTIC" = "REALISTIC";
  let recommendedAdjustment: string | undefined;

  if (feasibilityScore >= 80) {
    feasibilityRating = "VERY_REALISTIC";
  } else if (feasibilityScore >= 60) {
    feasibilityRating = "REALISTIC";
  } else if (feasibilityScore >= 35) {
    feasibilityRating = "AGGRESSIVE";
    recommendedAdjustment = `Consider increasing the plan duration from ${durationMonths} months to ${Math.min(12, durationMonths * 2)} months, or lowering the target profit to reduce required monthly return.`;
  } else {
    feasibilityRating = "UNREALISTIC";
    recommendedAdjustment = `A required return of +${requiredMonthlyReturnPercent}% per month carries a high probability of severe drawdown. Extend duration or adjust profit targets to preserve capital.`;
  }

  return {
    requiredTotalReturnPercent,
    requiredMonthlyReturnPercent,
    requiredWeeklyReturnPercent,
    requiredDailyReturnDollars,
    feasibilityScore,
    feasibilityRating,
    riskOfRuinPercent: Math.min(100, Math.max(0.1, riskOfRuinPercent)),
    maxDrawdownProjectedPercent,
    expectedLosingStreak,
    totalTradingDaysEstimated,
    recommendedAdjustment,
  };
}

export function generatePlanMilestones(
  planId: string,
  targetProfit: number,
  durationMonths: PlanDurationMonths,
  startDateStr: string,
  locale: string = "vi"
): PlanMilestone[] {
  const milestones: PlanMilestone[] = [];
  const start = new Date(startDateStr);
  const profitPerMonth = Number((targetProfit / durationMonths).toFixed(2));

  for (let m = 1; m <= durationMonths; m++) {
    const monthStart = new Date(start);
    monthStart.setMonth(monthStart.getMonth() + (m - 1));
    
    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1);
    monthEnd.setDate(monthEnd.getDate() - 1);

    const monthName = monthStart.toLocaleString(locale === "vi" ? "vi-VN" : "en-US", { month: "long", year: "numeric" });
    const periodLabel = locale === "vi" 
      ? `Tháng ${m} (${monthName})` 
      : `Month ${m} (${monthName})`;

    milestones.push({
      id: `milestone-${planId}-m${m}`,
      periodType: "MONTH",
      periodIndex: m,
      periodLabel,
      startDate: monthStart.toISOString().split("T")[0],
      endDate: monthEnd.toISOString().split("T")[0],
      targetProfit: profitPerMonth,
      actualProfit: 0,
      actualTrades: 0,
      status: m === 1 ? "IN_PROGRESS" : "PENDING",
    });
  }

  return milestones;
}
