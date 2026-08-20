export interface PositionCalculationInput {
  accountBalance: number;
  riskPercent: number;
  entryPrice: number;
  stopLossPrice: number;
  takeProfitPrice?: number;
  symbol: string;
  accountCurrency?: string;
}

export interface PositionCalculationResult {
  riskAmount: number;
  positionSizeLots: number;
  positionUnits: number;
  stopLossPips: number;
  takeProfitPips?: number;
  potentialLoss: number;
  potentialProfit?: number;
  riskRewardRatio?: number;
  isValid: boolean;
  errorMessage?: string;
}

export interface RiskGuardStatus {
  dailyLossLimit: number;
  currentDailyLoss: number;
  dailyLossPercent: number;
  isBreached: boolean;
  consecutiveLosses: number;
  maxConsecutiveLossesAllowed: number;
  isCooldownActive: boolean;
  cooldownUntil?: string;
  recommendation: string;
}
