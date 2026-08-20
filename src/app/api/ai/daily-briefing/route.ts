import { NextRequest, NextResponse } from "next/server";
import { getUserTrades, getActiveTradingPlan } from "@/lib/firebase/db-service";
import { calculateTradeMetrics } from "@/lib/math/performance";
import { callAIWithSchema } from "@/lib/ai/ai-client";
import { AIBriefingSchema } from "@/lib/ai/schemas";
import { buildAIBriefingPrompt } from "@/lib/ai/prompt-builder";
import { getTodayDateString } from "@/lib/utils/date";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();
    const targetUserId = userId || "dev-trader-01";

    let trades: any[] = [];
    let plan: any = null;

    try {
      [trades, plan] = await Promise.all([
        getUserTrades(targetUserId, { pageSize: 30 }),
        getActiveTradingPlan(targetUserId),
      ]);
    } catch (err) {
      console.warn("Firestore fetch error in briefing:", err);
    }

    const metrics = calculateTradeMetrics(trades);
    const todayStr = getTodayDateString();

    const systemPrompt = "You are an elite quantitative trading performance coach. Generate a high-discipline pre-market trading directive.";
    const userPrompt = buildAIBriefingPrompt(plan, trades, metrics);

    const fallback = {
      date: todayStr,
      summary: plan
        ? `Execute strictly within your ${plan.name} parameters today. Respect your ${plan.riskPerTradePercent}% risk limit and prioritize high-quality setups only.`
        : "Market analysis initialized. Connect your trading plan and log trades to unlock deep personalized daily directives.",
      focusPoints: [
        plan ? `Focus on allowed symbols: ${plan.allowedSymbols?.join(", ") || "EURUSD, XAUUSD"}.` : "Verify multi-timeframe trend alignment before entry.",
        plan ? `Cap maximum risk to ${plan.riskPerTradePercent}% per execution.` : "Maintain minimum 1:1.5 Risk-to-Reward ratio.",
        "Check Economic Calendar for high-impact news releases.",
        "Enforce strict 15-minute cooldown after any losing trade.",
      ],
      restrictedEvents: ["High Impact Central Bank Speeches", "NFP / CPI Releases"],
      sessionNotes: "Focus on peak liquidity windows (London & New York overlap).",
      confidenceScore: trades.length > 10 ? 88 : 75,
      evidenceSampleTrades: trades.length,
    };

    const briefing = await callAIWithSchema(
      systemPrompt,
      userPrompt,
      AIBriefingSchema,
      fallback
    );

    return NextResponse.json(briefing);
  } catch (error: any) {
    console.error("AI Daily Briefing Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate daily briefing" },
      { status: 500 }
    );
  }
}
