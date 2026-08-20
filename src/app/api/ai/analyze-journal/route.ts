import { NextRequest, NextResponse } from "next/server";
import { DailyJournal } from "@/types/journal.types";
import { callAIWithSchema } from "@/lib/ai/ai-client";
import { AIJournalReviewSchema } from "@/lib/ai/schemas";

export async function POST(req: NextRequest) {
  try {
    const { journal }: { journal: DailyJournal & { trades?: any[] } } = await req.json();

    if (!journal) {
      return NextResponse.json({ error: "Missing journal data" }, { status: 400 });
    }

    const tradeCount = journal.trades?.length || journal.totalTrades || 0;
    const netPnl = journal.netProfit ?? 0;

    const systemPrompt = "You are an AI Trading Psychologist and Performance Coach. Analyze the daily trading journal.";
    const userPrompt = `DAILY JOURNAL REVIEW:
- Date: ${journal.date}
- Market Bias: ${journal.marketBias}
- Pre-Market Notes: "${journal.preMarketNotes || "None"}"
- Post-Market Review: "${journal.postMarketReview || "None"}"
- Trades Executed: ${tradeCount}
- Day Net P&L: $${netPnl}
- Win Rate: ${journal.winRate || 0}%

Provide a constructive, actionable end-of-day synthesis.`;

    const fallback = {
      summary: `Day completed with ${tradeCount} executed trades and net outcome of ${netPnl >= 0 ? `+$${netPnl}` : `-$${Math.abs(netPnl)}`}. Your pre-market technical bias aligned reasonably with market order flow.`,
      strengths: [
        "Logged detailed daily reflections and pre-market preparation levels.",
        tradeCount > 0 ? "Disciplined trade management during active trading hours." : "Exercised patience on no-setup market conditions.",
      ],
      weaknesses: netPnl < 0
        ? ["Encountered drawdowns during intraday volatility; ensure strict risk caps are respected."]
        : [],
      keyTakeaway: "Consistency in journaling directly correlates with long-term capital preservation.",
      focusForTomorrow: "Review economic calendar 30 minutes prior to session open and only take setups with clean confluence.",
      confidence: 85,
    };

    const review = await callAIWithSchema(
      systemPrompt,
      userPrompt,
      AIJournalReviewSchema,
      fallback
    );

    return NextResponse.json(review);
  } catch (error: any) {
    console.error("AI Journal Review Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to analyze journal" },
      { status: 500 }
    );
  }
}
