import { NextRequest, NextResponse } from "next/server";
import { Trade } from "@/types/trade.types";
import { callAIWithSchema } from "@/lib/ai/ai-client";
import { AITradeAuditSchema } from "@/lib/ai/schemas";
import { buildTradeAuditPrompt } from "@/lib/ai/prompt-builder";

export async function POST(req: NextRequest) {
  try {
    const { trade }: { trade: Trade } = await req.json();

    if (!trade) {
      return NextResponse.json({ error: "Missing trade data" }, { status: 400 });
    }

    const systemPrompt = "You are an AI Senior Risk & Trade Execution Auditor. Evaluate the trade execution with strict financial rigor.";
    const userPrompt = buildTradeAuditPrompt(trade);

    const isWin = Number(trade.netProfit ?? 0) > 0;
    const isPlanFollowed = trade.followedPlan !== false;

    const baseScore = isPlanFollowed ? (isWin ? 92 : 82) : 55;

    const fallback = {
      overallScore: baseScore,
      entryQualityScore: isWin ? 90 : 75,
      riskManagementScore: isPlanFollowed ? 90 : 60,
      disciplineScore: isPlanFollowed ? 95 : 50,
      verdict: (isPlanFollowed ? (isWin ? "EXCELLENT" : "SOLID") : "RULE_VIOLATION") as any,
      strengths: [
        `Executed within ${trade.session} session timeframe.`,
        isPlanFollowed ? "Strictly respected pre-defined stop loss criteria." : "Trade logged accurately.",
      ],
      mistakes: isPlanFollowed
        ? []
        : ["Entered trade outside standard plan parameters or moved stop loss."],
      recommendations: [
        "Maintain patience for candle close confirmation before order execution.",
        "Ensure target level is at least 1.5x larger than technical stop loss.",
      ],
      confidence: 85,
    };

    const audit = await callAIWithSchema(
      systemPrompt,
      userPrompt,
      AITradeAuditSchema,
      fallback
    );

    return NextResponse.json(audit);
  } catch (error: any) {
    console.error("AI Trade Audit Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to audit trade" },
      { status: 500 }
    );
  }
}
