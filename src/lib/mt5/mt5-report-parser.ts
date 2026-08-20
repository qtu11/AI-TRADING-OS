import { Trade, TradeDirection } from "@/types/trade.types";

/**
 * Parser for MetaTrader 5 Detailed Statement HTML files
 * Extracts all closed deals, volume, symbols, SL/TP, swap, commission, net profit, and timestamps.
 */
export function parseMT5HTMLReport(htmlContent: string, userId: string): Trade[] {
  const trades: Trade[] = [];

  try {
    // Parse HTML table rows using regex / DOM matching compatible in Node & browser
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, "text/html");
    const rows = Array.from(doc.querySelectorAll("tr"));

    for (const row of rows) {
      const cells = Array.from(row.querySelectorAll("td")).map((c) => c.textContent?.trim() || "");
      if (cells.length < 13) continue;

      // Check if this row is a trade deal: e.g. Open Time, Ticket, Symbol, Type, Volume, Price, SL, TP, Close Time, Price, Commission, Swap, Profit
      const [openTimeStr, ticketStr, symbol, typeStr, volumeStr, openPriceStr, slStr, tpStr, closeTimeStr, closePriceStr, commStr, swapStr, profitStr] = cells;

      const ticket = parseInt(ticketStr, 10);
      const volume = parseFloat(volumeStr);
      const openPrice = parseFloat(openPriceStr);
      const closePrice = parseFloat(closePriceStr);

      if (isNaN(ticket) || isNaN(volume) || isNaN(openPrice)) {
        continue; // Skip header / summary rows
      }

      const isBuy = typeStr.toLowerCase().includes("buy");
      const isSell = typeStr.toLowerCase().includes("sell");
      if (!isBuy && !isSell) continue;

      const direction: TradeDirection = isBuy ? "BUY" : "SELL";
      const grossProfit = parseFloat(profitStr.replace(/[^0-9.-]/g, "")) || 0;
      const commission = parseFloat(commStr.replace(/[^0-9.-]/g, "")) || 0;
      const swap = parseFloat(swapStr.replace(/[^0-9.-]/g, "")) || 0;
      const netProfit = Number((grossProfit + commission + swap).toFixed(2));

      const sl = parseFloat(slStr) || 0;
      const tp = parseFloat(tpStr) || 0;

      // Parse timestamps
      let openTimeIso: string;
      try {
        openTimeIso = new Date(openTimeStr.replace(/\./g, "-")).toISOString();
      } catch {
        openTimeIso = new Date().toISOString();
      }

      let closeTimeIso: string | undefined;
      try {
        if (closeTimeStr) {
          closeTimeIso = new Date(closeTimeStr.replace(/\./g, "-")).toISOString();
        }
      } catch {
        closeTimeIso = undefined;
      }

      // Calculate R:R
      let riskRewardRatio: number | undefined;
      if (sl > 0 && openPrice !== sl) {
        const slDist = Math.abs(openPrice - sl);
        const winDist = Math.abs((closePrice || openPrice) - openPrice);
        riskRewardRatio = netProfit > 0 ? Number((winDist / slDist).toFixed(2)) : -1.0;
      }

      // Determine session
      const openHourUTC = new Date(openTimeIso).getUTCHours();
      let session: any = "Other";
      if (openHourUTC >= 7 && openHourUTC < 12) session = "London";
      else if (openHourUTC >= 12 && openHourUTC < 16) session = "London+NY";
      else if (openHourUTC >= 16 && openHourUTC < 21) session = "New York";
      else session = "Asian";

      trades.push({
        id: `mt5-${ticket}`,
        userId,
        externalTradeId: String(ticket),
        source: "MT5",
        symbol: symbol.toUpperCase(),
        direction,
        status: closePrice ? "CLOSED" : "OPEN",
        lots: volume,
        openPrice,
        closePrice: closePrice || undefined,
        stopLoss: sl,
        takeProfit: tp,
        openTime: openTimeIso,
        closeTime: closeTimeIso,
        grossProfit,
        commission,
        swap,
        netProfit,
        riskRewardRatio,
        outcome: netProfit > 0 ? "WIN" : netProfit < 0 ? "LOSS" : "BREAKEVEN",
        session,
        notes: `Imported from MT5 Detailed Statement (Ticket #${ticket})`,
        followedPlan: true,
        createdAt: openTimeIso,
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.warn("MT5 HTML Report parse error:", err);
  }

  return trades;
}

/**
 * Generate MQL5 Expert Advisor Script for automated real-time bridge
 */
export function getMQL5BridgeScript(webhookUrl: string, userId: string): string {
  return `//+------------------------------------------------------------------+
//|                                        AI_Trading_OS_Bridge.mq5  |
//|                        Copyright 2026, AI Trading OS Platform    |
//|                                      https://aitrading.os        |
//+------------------------------------------------------------------+
#property copyright "AI Trading OS Platform"
#property link      "https://aitrading.os"
#property version   "1.00"
#property strict

input string InpWebhookUrl = "${webhookUrl}";
input string InpUserId     = "${userId}";

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
   Print("AI Trading OS Bridge EA initialized successfully for User: ", InpUserId);
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Trade transaction listener                                       |
//+------------------------------------------------------------------+
void OnTradeTransaction(const MqlTradeTransaction& trans,
                        const MqlTradeRequest& request,
                        const MqlTradeResult& result)
{
   if(trans.type == TRADE_TRANSACTION_DEAL_ADD)
   {
      ulong dealTicket = trans.deal;
      if(dealTicket > 0 && HistoryDealSelect(dealTicket))
      {
         string symbol = HistoryDealGetString(dealTicket, DEAL_SYMBOL);
         long dealType = HistoryDealGetInteger(dealTicket, DEAL_TYPE);
         double volume = HistoryDealGetDouble(dealTicket, DEAL_VOLUME);
         double price = HistoryDealGetDouble(dealTicket, DEAL_PRICE);
         double profit = HistoryDealGetDouble(dealTicket, DEAL_PROFIT);
         double commission = HistoryDealGetDouble(dealTicket, DEAL_COMMISSION);
         double swap = HistoryDealGetDouble(dealTicket, DEAL_SWAP);
         datetime dealTime = (datetime)HistoryDealGetInteger(dealTicket, DEAL_TIME);

         string json = StringFormat(
            "{\\"userId\\":\\"%s\\",\\"ticket\\":%d,\\"symbol\\":\\"%s\\",\\"type\\":\\"%s\\",\\"volume\\":%.2f,\\"openPrice\\":%.5f,\\"profit\\":%.2f,\\"commission\\":%.2f,\\"swap\\":%.2f,\\"openTime\\":%d}",
            InpUserId,
            dealTicket,
            symbol,
            (dealType == DEAL_TYPE_BUY ? "BUY" : "SELL"),
            volume,
            price,
            profit,
            commission,
            swap,
            (int)dealTime
         );

         SendTradeWebhook(json);
      }
   }
}

//+------------------------------------------------------------------+
//| Send HTTP POST JSON WebRequest to AI Trading OS                  |
//+------------------------------------------------------------------+
void SendTradeWebhook(string jsonPayload)
{
   char postData[];
   char resultData[];
   string headers = "Content-Type: application/json\\r\\n";
   string resultHeaders;
   
   StringToCharArray(jsonPayload, postData, 0, WHOLE_ARRAY, CP_UTF8);
   ArrayResize(postData, ArraySize(postData) - 1); // remove null terminator
   
   int res = WebRequest("POST", InpWebhookUrl, headers, 3000, postData, resultData, resultHeaders);
   if(res == 200)
   {
      Print("AI Trading OS: Trade synced successfully.");
   }
   else
   {
      Print("AI Trading OS: WebRequest failed. Error Code: ", GetLastError(), " HTTP Status: ", res);
      Print("Ensure WebRequest URL is allowed in MT5: Tools -> Options -> Expert Advisors -> Allow WebRequest");
   }
}
//+------------------------------------------------------------------+
`;
}
