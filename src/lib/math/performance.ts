import { Trade } from "@/types/trade.types";

export interface PerformanceMetrics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakevenTrades: number;
  winRate: number; // in % (e.g. 62.5)
  lossRate: number; // in %
  netProfit: number;
  grossProfit: number;
  grossLoss: number;
  profitFactor: number; // Gross Profit / Abs(Gross Loss)
  expectancy: number; // (WinRate * AvgWin) - (LossRate * AvgLoss) in $
  averageWin: number;
  averageLoss: number;
  averageRiskReward: number;
  largestWin: number;
  largestLoss: number;
  averageHoldingTimeMinutes: number;
}

export function calculateTradeMetrics(trades: Trade[]): PerformanceMetrics {
  const closedTrades = trades.filter((t) => t.status === "CLOSED" && t.netProfit !== undefined);

  if (closedTrades.length === 0) {
    return {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      breakevenTrades: 0,
      winRate: 0,
      lossRate: 0,
      netProfit: 0,
      grossProfit: 0,
      grossLoss: 0,
      profitFactor: 0,
      expectancy: 0,
      averageWin: 0,
      averageLoss: 0,
      averageRiskReward: 0,
      largestWin: 0,
      largestLoss: 0,
      averageHoldingTimeMinutes: 0,
    };
  }

  let grossProfit = 0;
  let grossLoss = 0;
  let winningTrades = 0;
  let losingTrades = 0;
  let breakevenTrades = 0;
  let largestWin = 0;
  let largestLoss = 0;
  let totalRR = 0;
  let validRRCount = 0;
  let totalHoldingMinutes = 0;
  let validHoldingCount = 0;

  for (const trade of closedTrades) {
    const pnl = Number(trade.netProfit ?? 0);

    if (pnl > 0.0001) {
      grossProfit += pnl;
      winningTrades += 1;
      if (pnl > largestWin) largestWin = pnl;
    } else if (pnl < -0.0001) {
      grossLoss += Math.abs(pnl);
      losingTrades += 1;
      if (Math.abs(pnl) > largestLoss) largestLoss = Math.abs(pnl);
    } else {
      breakevenTrades += 1;
    }

    if (trade.riskRewardRatio !== undefined && !isNaN(trade.riskRewardRatio) && trade.riskRewardRatio > 0) {
      totalRR += Number(trade.riskRewardRatio);
      validRRCount += 1;
    }

    if (trade.openTime && trade.closeTime) {
      const open = new Date(trade.openTime).getTime();
      const close = new Date(trade.closeTime).getTime();
      if (!isNaN(open) && !isNaN(close) && close >= open) {
        totalHoldingMinutes += (close - open) / (1000 * 60);
        validHoldingCount += 1;
      }
    }
  }

  const totalTrades = closedTrades.length;
  const netProfit = Number((grossProfit - grossLoss).toFixed(2));
  const winRate = Number(((winningTrades / totalTrades) * 100).toFixed(2));
  const lossRate = Number(((losingTrades / totalTrades) * 100).toFixed(2));

  const averageWin = winningTrades > 0 ? Number((grossProfit / winningTrades).toFixed(2)) : 0;
  const averageLoss = losingTrades > 0 ? Number((grossLoss / losingTrades).toFixed(2)) : 0;

  // Profit Factor: Gross Profit / Gross Loss (if Gross Loss is 0 and Gross Profit > 0, cap at 99.99 for clean display)
  const profitFactor = grossLoss > 0
    ? Number((grossProfit / grossLoss).toFixed(2))
    : grossProfit > 0
    ? 99.99
    : 0;

  // Expectancy = (Win% * AvgWin) - (Loss% * AvgLoss) in dollars per trade
  const decimalWinRate = winningTrades / totalTrades;
  const decimalLossRate = losingTrades / totalTrades;
  const expectancy = Number(((decimalWinRate * averageWin) - (decimalLossRate * averageLoss)).toFixed(2));

  const averageRiskReward = validRRCount > 0 ? Number((totalRR / validRRCount).toFixed(2)) : 0;
  const averageHoldingTimeMinutes = validHoldingCount > 0 ? Math.round(totalHoldingMinutes / validHoldingCount) : 0;

  return {
    totalTrades,
    winningTrades,
    losingTrades,
    breakevenTrades,
    winRate,
    lossRate,
    netProfit,
    grossProfit: Number(grossProfit.toFixed(2)),
    grossLoss: Number(grossLoss.toFixed(2)),
    profitFactor,
    expectancy,
    averageWin,
    averageLoss,
    averageRiskReward,
    largestWin: Number(largestWin.toFixed(2)),
    largestLoss: Number(largestLoss.toFixed(2)),
    averageHoldingTimeMinutes,
  };
}
