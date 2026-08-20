import { describe, it, expect } from "vitest";
import { calculateEquityCurveAndDrawdown } from "@/lib/math/drawdown";
import { Trade } from "@/types/trade.types";

describe("Drawdown & Equity Math Engine", () => {
  it("calculates peak equity and maximum drawdown accurately", () => {
    const mockTrades: Trade[] = [
      {
        id: "1",
        userId: "u1",
        symbol: "EURUSD",
        direction: "BUY",
        status: "CLOSED",
        lots: 1.0,
        openPrice: 1.0800,
        stopLoss: 1.0750,
        takeProfit: 1.0900,
        openTime: "2026-08-16T08:00:00Z",
        closeTime: "2026-08-16T09:00:00Z",
        netProfit: 1000,
        session: "London",
        source: "MANUAL",
        createdAt: "2026-08-16T08:00:00Z",
        updatedAt: "2026-08-16T09:00:00Z",
      },
      {
        id: "2",
        userId: "u1",
        symbol: "EURUSD",
        direction: "BUY",
        status: "CLOSED",
        lots: 1.0,
        openPrice: 1.0850,
        stopLoss: 1.0800,
        takeProfit: 1.0900,
        openTime: "2026-08-16T10:00:00Z",
        closeTime: "2026-08-16T11:00:00Z",
        netProfit: -500,
        session: "London",
        source: "MANUAL",
        createdAt: "2026-08-16T10:00:00Z",
        updatedAt: "2026-08-16T11:00:00Z",
      },
      {
        id: "3",
        userId: "u1",
        symbol: "EURUSD",
        direction: "BUY",
        status: "CLOSED",
        lots: 1.0,
        openPrice: 1.0800,
        stopLoss: 1.0750,
        takeProfit: 1.0900,
        openTime: "2026-08-16T12:00:00Z",
        closeTime: "2026-08-16T13:00:00Z",
        netProfit: -300,
        session: "New York",
        source: "MANUAL",
        createdAt: "2026-08-16T12:00:00Z",
        updatedAt: "2026-08-16T13:00:00Z",
      },
      {
        id: "4",
        userId: "u1",
        symbol: "EURUSD",
        direction: "BUY",
        status: "CLOSED",
        lots: 1.0,
        openPrice: 1.0750,
        stopLoss: 1.0700,
        takeProfit: 1.0850,
        openTime: "2026-08-16T14:00:00Z",
        closeTime: "2026-08-16T15:00:00Z",
        netProfit: 1200,
        session: "New York",
        source: "MANUAL",
        createdAt: "2026-08-16T14:00:00Z",
        updatedAt: "2026-08-16T15:00:00Z",
      },
    ];

    const initialBalance = 10000;
    const result = calculateEquityCurveAndDrawdown(initialBalance, mockTrades);

    // Initial: 10000
    // Trade 1 (+1000) -> 11000 (Peak: 11000, DD: 0)
    // Trade 2 (-500)  -> 10500 (Peak: 11000, DD: 500)
    // Trade 3 (-300)  -> 10200 (Peak: 11000, DD: 800) -> Max Drawdown $800 = 7.27%
    // Trade 4 (+1200) -> 11400 (Peak: 11400, DD: 0)

    expect(result.peakEquity).toBe(11400);
    expect(result.maxDrawdownDollars).toBe(800);
    expect(result.maxDrawdownPercent).toBe(7.27);
    expect(result.currentDrawdownDollars).toBe(0);
    expect(result.recoveryFactor).toBe(1.75); // 1400 net profit / 800 max DD = 1.75
  });
});
