import { Trade } from "@/types/trade.types";

export function filterDuplicateTrades(
  incomingTrades: Trade[],
  existingTrades: Trade[]
): { newTrades: Trade[]; duplicateCount: number } {
  const existingExternalIds = new Set(
    existingTrades
      .filter((t) => t.externalTradeId)
      .map((t) => String(t.externalTradeId))
  );

  const existingLocalIds = new Set(existingTrades.map((t) => t.id));

  const newTrades: Trade[] = [];
  let duplicateCount = 0;

  for (const trade of incomingTrades) {
    const isDup =
      (trade.externalTradeId && existingExternalIds.has(String(trade.externalTradeId))) ||
      existingLocalIds.has(trade.id);

    if (isDup) {
      duplicateCount += 1;
    } else {
      newTrades.push(trade);
      if (trade.externalTradeId) existingExternalIds.add(String(trade.externalTradeId));
      existingLocalIds.add(trade.id);
    }
  }

  return { newTrades, duplicateCount };
}
