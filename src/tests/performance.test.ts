import { describe, it, expect } from "vitest";
import { calculateTradeMetrics } from "@/lib/math/performance";
import { Trade } from "@/types/trade.types";

describe("Performance Math Engine", () => {
  it("returns zero metrics for empty trade array", () => {
    const metrics = calculateTradeMetrics([]);
    expect(metrics.totalTrades).toBe(0);
    expect(metrics.winRate).toBe(0);
    expect(metrics.netProfit).toBe(0);
    expect(metrics.profitFactor).toBe(0);
  });

  it("calculates accurate P&L, win rate, and profit factor for a set of trades", () => {
    const mockTrades: Trade[] = [
      {
        id: "1",
        userId: "u1",
        symbol: "EURUSD",
        direction: "BUY",
        status: "CLOSED",
        lots: 1.0,
        openPrice: 1.0800,
        closePrice: 1.0850,
        stopLoss: 1.0780,
        takeProfit: 1.0860,
        openTime: "2026-08-16T08:00:00Z",
        closeTime: "2026-08-16T10:00:00Z",
        netProfit: 500,
        riskRewardRatio: 2.5,
        session: "London",
        source: "MANUAL",
        createdAt: "2026-08-16T08:00:00Z",
        updatedAt: "2026-08-16T10:00:00Z",
      },
      {
        id: "2",
        userId: "u1",
        symbol: "XAUUSD",
        direction: "SELL",
        status: "CLOSED",
        lots: 0.5,
        openPrice: 2450.0,
        closePrice: 2460.0,
        stopLoss: 2460.0,
        takeProfit: 2430.0,
        openTime: "2026-08-16T12:00:00Z",
        closeTime: "2026-08-16T13:00:00Z",
        netProfit: -200,
        riskRewardRatio: -1.0,
        session: "New York",
        source: "MANUAL",
        createdAt: "2026-08-16T12:00:00Z",
        updatedAt: "2026-08-16T13:00:00Z",
      },
      {
        id: "3",
        userId: "u1",
        symbol: "GBPUSD",
        direction: "BUY",
        status: "CLOSED",
        lots: 1.0,
        openPrice: 1.2900,
        closePrice: 1.2930,
        stopLoss: 1.2880,
        takeProfit: 1.2950,
        openTime: "2026-08-16T14:00:00Z",
        closeTime: "2026-08-16T15:30:00Z",
        netProfit: 300,
        riskRewardRatio: 1.5,
        session: "New York",
        source: "MANUAL",
        createdAt: "2026-08-16T14:00:00Z",
        updatedAt: "2026-08-16T15:30:00Z",
      },
    ];

    const metrics = calculateTradeMetrics(mockTrades);
    expect(metrics.totalTrades).toBe(3);
    expect(metrics.winningTrades).toBe(2);
    expect(metrics.losingTrades).toBe(1);
    expect(metrics.winRate).toBe(66.67);
    expect(metrics.grossProfit).toBe(800);
    expect(metrics.grossLoss).toBe(200);
    expect(metrics.netProfit).toBe(600);
    expect(metrics.profitFactor).toBe(4.0);
    expect(metrics.averageWin).toBe(400);
    expect(metrics.averageLoss).toBe(200);
    // Expectancy: (2/3 * 400) - (1/3 * 200) = 266.67 - 66.67 = 200
    expect(metrics.expectancy).toBe(200);
  });
});
