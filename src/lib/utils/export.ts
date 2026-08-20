import { Trade } from "@/types/trade.types";
import { DailyJournal } from "@/types/journal.types";

export function exportTradesToCSV(trades: Trade[]): void {
  if (trades.length === 0) return;

  const headers = [
    "ID",
    "Open Time",
    "Close Time",
    "Symbol",
    "Direction",
    "Status",
    "Lots",
    "Open Price",
    "Close Price",
    "Stop Loss",
    "Take Profit",
    "Gross Profit",
    "Commission",
    "Swap",
    "Net Profit",
    "R:R",
    "Session",
    "Strategy",
    "Source",
    "Notes",
  ];

  const rows = trades.map((t) => [
    t.id,
    t.openTime,
    t.closeTime || "",
    t.symbol,
    t.direction,
    t.status,
    t.lots,
    t.openPrice,
    t.closePrice ?? "",
    t.stopLoss,
    t.takeProfit,
    t.grossProfit ?? "",
    t.commission ?? "",
    t.swap ?? "",
    t.netProfit ?? "",
    t.riskRewardRatio ?? "",
    t.session,
    t.strategyName || "",
    t.source,
    `"${(t.notes || "").replace(/"/g, '""')}"`,
  ]);

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `ai_trading_os_trades_${new Date().toISOString().split("T")[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportDataToJSON(data: any, filenamePrefix: string): void {
  const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
    JSON.stringify(data, null, 2)
  )}`;
  const downloadAnchor = document.createElement("a");
  downloadAnchor.setAttribute("href", jsonString);
  downloadAnchor.setAttribute("download", `${filenamePrefix}_${new Date().toISOString().split("T")[0]}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function parseCSVToTrades(csvText: string, userId: string): Trade[] {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headerLine = lines[0].toLowerCase();
  const headers = headerLine.split(",").map((h) => h.trim().replace(/^["']|["']$/g, ""));

  const trades: Trade[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Split CSV handling basic quotes
    const values: string[] = [];
    let insideQuote = false;
    let currentVal = "";

    for (let char of line) {
      if (char === '"') {
        insideQuote = !insideQuote;
      } else if (char === "," && !insideQuote) {
        values.push(currentVal.trim().replace(/^["']|["']$/g, ""));
        currentVal = "";
      } else {
        currentVal += char;
      }
    }
    values.push(currentVal.trim().replace(/^["']|["']$/g, ""));

    const rowMap: Record<string, string> = {};
    headers.forEach((h, idx) => {
      rowMap[h] = values[idx] || "";
    });

    const symbol = (rowMap["symbol"] || rowMap["pair"] || rowMap["item"] || "EURUSD").toUpperCase();
    const rawDir = (rowMap["direction"] || rowMap["type"] || "BUY").toUpperCase();
    const direction = rawDir.includes("SELL") ? "SELL" : "BUY";
    const lots = parseFloat(rowMap["lots"] || rowMap["volume"] || rowMap["size"] || "0.1") || 0.1;
    const openPrice = parseFloat(rowMap["open price"] || rowMap["open"] || rowMap["price"] || "1.0800") || 1.08;
    const closePrice = parseFloat(rowMap["close price"] || rowMap["close"] || "") || undefined;
    const stopLoss = parseFloat(rowMap["stop loss"] || rowMap["sl"] || "0") || 0;
    const takeProfit = parseFloat(rowMap["take profit"] || rowMap["tp"] || "0") || 0;
    const netProfit = parseFloat(rowMap["net profit"] || rowMap["profit"] || rowMap["pnl"] || "0") || 0;
    const session = (rowMap["session"] || "London") as any;
    const openTime = rowMap["open time"] || rowMap["date"] || new Date().toISOString();
    const closeTime = rowMap["close time"] || (closePrice ? new Date().toISOString() : undefined);
    const strategyName = rowMap["strategy"] || "Imported CSV";
    const notes = rowMap["notes"] || "";

    const tradeId = `csv-${Date.now()}-${i}`;
    const nowIso = new Date().toISOString();

    trades.push({
      id: tradeId,
      userId,
      symbol,
      direction,
      status: closePrice ? "CLOSED" : "OPEN",
      lots,
      openPrice,
      closePrice,
      stopLoss,
      takeProfit,
      openTime,
      closeTime,
      grossProfit: netProfit > 0 ? netProfit : 0,
      netProfit,
      outcome: netProfit > 0 ? "WIN" : netProfit < 0 ? "LOSS" : "BREAKEVEN",
      session,
      strategyName,
      source: "CSV_IMPORT",
      notes,
      followedPlan: true,
      createdAt: nowIso,
      updatedAt: nowIso,
    });
  }

  return trades;
}
