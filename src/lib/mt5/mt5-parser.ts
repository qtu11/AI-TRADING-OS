import { Trade, TradeDirection } from "@/types/trade.types";
import { MT5RawTradeRecord } from "@/types/mt5.types";

export function parseMT5TradeRecord(raw: MT5RawTradeRecord, userId: string): Trade {
  const isBuy = raw.type === "BUY" || raw.type === 0;
  const direction: TradeDirection = isBuy ? "BUY" : "SELL";

  const netPnl = Number((Number(raw.profit || 0) + Number(raw.commission || 0) + Number(raw.swap || 0)).toFixed(2));
  
  // Format Open & Close ISO strings
  const openTimeIso = typeof raw.openTime === "number"
    ? new Date(raw.openTime * 1000).toISOString()
    : new Date(raw.openTime).toISOString();

  const closeTimeIso = raw.closeTime
    ? typeof raw.closeTime === "number"
      ? new Date(raw.closeTime * 1000).toISOString()
      : new Date(raw.closeTime).toISOString()
    : undefined;

  // Determine Session from open UTC hour
  const openHourUTC = new Date(openTimeIso).getUTCHours();
  let session: any = "Other";
  if (openHourUTC >= 7 && openHourUTC < 12) {
    session = "London";
  } else if (openHourUTC >= 12 && openHourUTC < 16) {
    session = "London+NY";
  } else if (openHourUTC >= 16 && openHourUTC < 21) {
    session = "New York";
  } else {
    session = "Asian";
  }

  // Calculate R:R if SL is available
  let riskRewardRatio: number | undefined;
  if (raw.sl && raw.openPrice && raw.closePrice && raw.sl !== raw.openPrice) {
    const slDist = Math.abs(raw.openPrice - raw.sl);
    const winDist = Math.abs(raw.closePrice - raw.openPrice);
    const isWin = netPnl > 0;
    riskRewardRatio = isWin
      ? Number((winDist / slDist).toFixed(2))
      : -1.0;
  }

  return {
    id: `mt5-${raw.ticket}`,
    userId,
    externalTradeId: String(raw.ticket),
    source: "MT5",
    symbol: raw.symbol.toUpperCase(),
    direction,
    status: raw.closePrice ? "CLOSED" : "OPEN",
    lots: Number(raw.volume) || 0.1,
    openPrice: Number(raw.openPrice) || 0,
    closePrice: raw.closePrice ? Number(raw.closePrice) : undefined,
    stopLoss: Number(raw.sl) || 0,
    takeProfit: Number(raw.tp) || 0,
    openTime: openTimeIso,
    closeTime: closeTimeIso,
    grossProfit: Number(raw.profit || 0),
    commission: Number(raw.commission || 0),
    swap: Number(raw.swap || 0),
    netProfit: netPnl,
    riskRewardRatio,
    outcome: netPnl > 0 ? "WIN" : netPnl < 0 ? "LOSS" : "BREAKEVEN",
    session,
    notes: raw.comment || "Synced from MetaTrader 5",
    followedPlan: true,
    createdAt: openTimeIso,
    updatedAt: new Date().toISOString(),
  };
}
