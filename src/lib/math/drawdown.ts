import { Trade } from "@/types/trade.types";

export interface EquityPoint {
  index: number;
  timestamp: string;
  tradeId?: string;
  balance: number;
  equity: number;
  pnl: number;
  drawdownDollars: number;
  drawdownPercent: number;
}

export interface DrawdownResult {
  currentDrawdownDollars: number;
  currentDrawdownPercent: number;
  maxDrawdownDollars: number;
  maxDrawdownPercent: number;
  peakEquity: number;
  recoveryFactor: number;
  equityCurve: EquityPoint[];
}

export function calculateEquityCurveAndDrawdown(
  initialBalance: number,
  trades: Trade[]
): DrawdownResult {
  const safeInitialBalance = Math.max(0, initialBalance || 0);

  // Sort closed trades chronologically
  const closedTrades = [...trades]
    .filter((t) => t.status === "CLOSED" && t.netProfit !== undefined)
    .sort((a, b) => {
      const timeA = new Date(a.closeTime || a.openTime).getTime();
      const timeB = new Date(b.closeTime || b.openTime).getTime();
      return timeA - timeB;
    });

  const equityCurve: EquityPoint[] = [];
  
  // Starting point (trade 0)
  equityCurve.push({
    index: 0,
    timestamp: closedTrades.length > 0 ? closedTrades[0].openTime : new Date().toISOString(),
    balance: safeInitialBalance,
    equity: safeInitialBalance,
    pnl: 0,
    drawdownDollars: 0,
    drawdownPercent: 0,
  });

  let runningBalance = safeInitialBalance;
  let peakEquity = safeInitialBalance;
  let maxDrawdownDollars = 0;
  let maxDrawdownPercent = 0;

  for (let i = 0; i < closedTrades.length; i++) {
    const trade = closedTrades[i];
    const pnl = Number(trade.netProfit ?? 0);
    runningBalance += pnl;

    if (runningBalance > peakEquity) {
      peakEquity = runningBalance;
    }

    const currentDdDollars = peakEquity - runningBalance;
    const currentDdPercent = peakEquity > 0 ? (currentDdDollars / peakEquity) * 100 : 0;

    if (currentDdDollars > maxDrawdownDollars) {
      maxDrawdownDollars = currentDdDollars;
    }

    if (currentDdPercent > maxDrawdownPercent) {
      maxDrawdownPercent = currentDdPercent;
    }

    equityCurve.push({
      index: i + 1,
      timestamp: trade.closeTime || trade.openTime,
      tradeId: trade.id,
      balance: Number(runningBalance.toFixed(2)),
      equity: Number(runningBalance.toFixed(2)),
      pnl: Number(pnl.toFixed(2)),
      drawdownDollars: Number(currentDdDollars.toFixed(2)),
      drawdownPercent: Number(currentDdPercent.toFixed(2)),
    });
  }

  const currentEquity = runningBalance;
  const currentDrawdownDollars = peakEquity - currentEquity;
  const currentDrawdownPercent = peakEquity > 0 ? (currentDrawdownDollars / peakEquity) * 100 : 0;

  const totalNetProfit = currentEquity - safeInitialBalance;
  const recoveryFactor = maxDrawdownDollars > 0
    ? Number((totalNetProfit / maxDrawdownDollars).toFixed(2))
    : totalNetProfit > 0
    ? 99.99
    : 0;

  return {
    currentDrawdownDollars: Number(currentDrawdownDollars.toFixed(2)),
    currentDrawdownPercent: Number(currentDrawdownPercent.toFixed(2)),
    maxDrawdownDollars: Number(maxDrawdownDollars.toFixed(2)),
    maxDrawdownPercent: Number(maxDrawdownPercent.toFixed(2)),
    peakEquity: Number(peakEquity.toFixed(2)),
    recoveryFactor,
    equityCurve,
  };
}
