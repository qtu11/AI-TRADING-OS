import { describe, it, expect } from "vitest";
import { calculatePlanFeasibility, generatePlanMilestones } from "@/lib/math/plan-engine";

describe("Plan Engine Math", () => {
  it("evaluates a realistic trading plan with high feasibility score", () => {
    // Starting: $10,000, Target Profit: $2,000 over 6 months (20% total, ~3.1% / month)
    const plan = calculatePlanFeasibility({
      startingCapital: 10000,
      targetProfit: 2000,
      durationMonths: 6,
      riskPerTradePercent: 0.5,
      maxDailyLossPercent: 1.0,
      maxTradesPerDay: 3,
      estimatedWinRatePercent: 55,
      estimatedRiskReward: 1.8,
    });

    expect(plan.requiredTotalReturnPercent).toBe(20.0);
    expect(plan.requiredMonthlyReturnPercent).toBeLessThan(4.0);
    expect(plan.feasibilityScore).toBeGreaterThan(80);
    expect(plan.feasibilityRating).toBe("VERY_REALISTIC");
    expect(plan.riskOfRuinPercent).toBeLessThan(5);
  });

  it("identifies unrealistic high-return expectations", () => {
    // Starting: $1,000, Target Profit: $10,000 over 1 month (1000% return)
    const plan = calculatePlanFeasibility({
      startingCapital: 1000,
      targetProfit: 10000,
      durationMonths: 1,
      riskPerTradePercent: 3.0,
      maxDailyLossPercent: 10.0,
      maxTradesPerDay: 5,
      estimatedWinRatePercent: 50,
      estimatedRiskReward: 1.5,
    });

    expect(plan.feasibilityScore).toBeLessThan(35);
    expect(plan.feasibilityRating).toBe("UNREALISTIC");
    expect(plan.recommendedAdjustment).toBeDefined();
  });

  it("generates correct monthly milestone breakdowns", () => {
    const milestones = generatePlanMilestones("plan-1", 3000, 3, "2026-08-01");
    expect(milestones).toHaveLength(3);
    expect(milestones[0].targetProfit).toBe(1000);
    expect(milestones[0].status).toBe("IN_PROGRESS");
    expect(milestones[1].status).toBe("PENDING");
  });
});
