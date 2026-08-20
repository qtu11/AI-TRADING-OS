import { describe, it, expect } from "vitest";
import { calculateDisciplineScore } from "@/lib/math/discipline-score";

describe("Discipline Score Math Engine", () => {
  it("awards 100 points for a completely disciplined trading session", () => {
    const score = calculateDisciplineScore({
      followedPlan: true,
      movedStopLossPrematurely: false,
      exitedWinnerEarly: false,
      overtraded: false,
      revengeTraded: false,
      fomo: 2,
      revengeTendency: 1,
      greed: 2,
      stress: 3,
    });

    expect(score.totalScore).toBe(100);
    expect(score.rating).toBe("ELITE");
    expect(score.penalties).toHaveLength(0);
  });

  it("penalizes rule breaks such as moving SL and revenge trading", () => {
    const score = calculateDisciplineScore({
      followedPlan: false, // -30
      movedStopLossPrematurely: true, // -15
      exitedWinnerEarly: true, // -10
      overtraded: false,
      revengeTraded: true, // -15
      fomo: 8, // -5
      revengeTendency: 7, // -5
    });

    // Max 100 - 30 - 15 - 10 - 15 - 10 = 20 points
    expect(score.totalScore).toBe(20);
    expect(score.rating).toBe("RECKLESS");
    expect(score.penalties.length).toBeGreaterThanOrEqual(4);
  });
});
