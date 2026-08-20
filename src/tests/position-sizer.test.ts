import { describe, it, expect } from "vitest";
import { calculatePositionSize } from "@/lib/math/position-sizer";

describe("Position Sizing Math Engine", () => {
  it("calculates correct lot size for EURUSD with 1% risk and 20 pip SL", () => {
    // Balance: $10,000, 1% Risk = $100.
    // EURUSD: 1 pip = 0.0001 = $10 per standard 1.0 lot.
    // 20 pips SL = 20 * $10 = $200 loss per 1.0 lot.
    // Required lots = $100 / $200 = 0.50 lots.
    const result = calculatePositionSize({
      accountBalance: 10000,
      riskPercent: 1.0,
      entryPrice: 1.0850,
      stopLossPrice: 1.0830,
      takeProfitPrice: 1.0890,
      symbol: "EURUSD",
    });

    expect(result.isValid).toBe(true);
    expect(result.riskAmount).toBe(100);
    expect(result.stopLossPips).toBe(20.0);
    expect(result.takeProfitPips).toBe(40.0);
    expect(result.positionSizeLots).toBe(0.5);
    expect(result.riskRewardRatio).toBe(2.0);
  });

  it("calculates correct lot size for Gold (XAUUSD)", () => {
    // Balance: $10,000, 1% Risk = $100.
    // Gold: 1 lot = 100 oz. PipSize = 0.01. $1 movement = 100 pips = $100 per lot.
    // Entry: 2400.00, SL: 2395.00 -> $5.00 distance = 500 pips.
    // Loss per 1 lot = 500 * (0.01 * 100) = 500 * $1 = $500.
    // Lots = $100 / $500 = 0.20 lots.
    const result = calculatePositionSize({
      accountBalance: 10000,
      riskPercent: 1.0,
      entryPrice: 2400.00,
      stopLossPrice: 2395.00,
      takeProfitPrice: 2410.00,
      symbol: "XAUUSD",
    });

    expect(result.isValid).toBe(true);
    expect(result.riskAmount).toBe(100);
    expect(result.positionSizeLots).toBe(0.2);
    expect(result.riskRewardRatio).toBe(2.0);
  });
});
