import { NextRequest, NextResponse } from "next/server";
import { getUserTrades, saveTrade, saveMT5Connection, getMT5Connection, recordAuditLog } from "@/lib/firebase/db-service";
import { parseMT5TradeRecord } from "@/lib/mt5/mt5-parser";
import { filterDuplicateTrades } from "@/lib/mt5/deduplication";
import { MT5RawTradeRecord } from "@/types/mt5.types";

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json();
    const targetUserId = raw.userId || "dev-trader-01";

    if (!raw.ticket || !raw.symbol) {
      return NextResponse.json(
        { error: "Invalid MT5 transaction payload. 'ticket' and 'symbol' are required." },
        { status: 400 }
      );
    }

    const tradeRecord: MT5RawTradeRecord = {
      ticket: Number(raw.ticket),
      symbol: String(raw.symbol),
      type: raw.type === "BUY" || raw.type === 0 ? "BUY" : "SELL",
      volume: Number(raw.volume) || 0.1,
      openPrice: Number(raw.openPrice) || 0,
      closePrice: raw.closePrice ? Number(raw.closePrice) : undefined,
      sl: Number(raw.sl) || 0,
      tp: Number(raw.tp) || 0,
      openTime: raw.openTime || Math.floor(Date.now() / 1000),
      closeTime: raw.closeTime || undefined,
      profit: Number(raw.profit) || 0,
      commission: Number(raw.commission) || 0,
      swap: Number(raw.swap) || 0,
      comment: raw.comment || "Realtime MT5 Webhook EA Execution",
    };

    const parsedTrade = parseMT5TradeRecord(tradeRecord, targetUserId);
    const existingTrades = await getUserTrades(targetUserId);
    const { newTrades, duplicateCount } = filterDuplicateTrades([parsedTrade], existingTrades);

    if (newTrades.length > 0) {
      for (const trade of newTrades) {
        await saveTrade(targetUserId, trade);
      }

      await recordAuditLog(
        targetUserId,
        "MT5_REALTIME_DEAL_INGESTED",
        `Realtime MT5 Deal #${raw.ticket} (${raw.symbol} ${raw.type} ${raw.volume}L) recorded.`,
        { ticket: raw.ticket, symbol: raw.symbol, netProfit: parsedTrade.netProfit }
      );

      return NextResponse.json({
        success: true,
        message: "Trade successfully ingested into AI Trading OS.",
        trade: parsedTrade,
      });
    } else {
      return NextResponse.json({
        success: true,
        message: "Trade already exists (deduplicated).",
        duplicate: true,
      });
    }
  } catch (error: any) {
    console.error("MT5 Webhook Ingestion Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process MT5 webhook" },
      { status: 500 }
    );
  }
}
