import { NextRequest, NextResponse } from "next/server";
import { getUserTrades, getActiveTradingPlan } from "@/lib/firebase/db-service";
import { calculateTradeMetrics } from "@/lib/math/performance";
import { callAIWithSchema } from "@/lib/ai/ai-client";
import { AICopilotResponseSchema } from "@/lib/ai/schemas";

export async function POST(req: NextRequest) {
  try {
    const { userId, message, history } = await req.json();
    const targetUserId = userId || "dev-trader-01";

    let trades: any[] = [];
    let plan: any = null;

    try {
      [trades, plan] = await Promise.all([
        getUserTrades(targetUserId, { pageSize: 50 }),
        getActiveTradingPlan(targetUserId),
      ]);
    } catch (err) {
      console.warn("Firestore fetch error in Copilot:", err);
    }

    const metrics = calculateTradeMetrics(trades);

    const systemPrompt = `You are the AI TRADING OS Copilot — an elite quantitative trading coach and behavioral analyst.
You have access to the trader's verified real-time data:
- Active Plan: ${plan ? plan.name : "None configured"} (Risk per trade: ${plan?.riskPerTradePercent || 0.5}%)
- Total Trades Recorded: ${metrics.totalTrades}
- Win Rate: ${metrics.winRate}% (${metrics.winningTrades} Wins, ${metrics.losingTrades} Losses)
- Net P&L: $${metrics.netProfit}
- Profit Factor: ${metrics.profitFactor}
- Average Risk-to-Reward: ${metrics.averageRiskReward}R

RULES:
1. Ground your answers ONLY in verified data. If there are no trades or insufficient data, explicitly inform the trader.
2. Never promise guaranteed profits or future price certainty.
3. Be concise, professional, and focus on risk discipline and execution quality.
4. Output STRICT JSON conforming to the schema.`;

    const userPrompt = `Trader Question: "${message}"`;

    const fallbackReply = metrics.totalTrades > 0
      ? `Based on your ${metrics.totalTrades} verified trades, your current Win Rate is **${metrics.winRate}%** with a Profit Factor of **${metrics.profitFactor}** and Net P&L of **$${metrics.netProfit}**.\n\n${
          metrics.winRate >= 50
            ? "Your execution shows positive mathematical expectancy. Continue prioritizing your allowed sessions and adhering to your risk limits."
            : "Focus on trimming losing trades earlier and ensuring your planned setups maintain at least a 1:1.5 Risk-to-Reward ratio."
        }`
      : `I have analyzed your workspace. You currently have no closed trade records. Once you log trades or connect your MT5 account, I will provide deep statistical and psychological pattern recognition.`;

    const fallback = {
      reply: fallbackReply,
      suggestedActions: [
        "What is my highest expectancy trading session?",
        "Am I respecting my daily loss limits?",
        "How can I improve my Risk:Reward ratio?",
      ],
      dataReferences: {
        totalTradesAnalyzed: metrics.totalTrades,
        metricsCited: {
          winRate: `${metrics.winRate}%`,
          netProfit: `$${metrics.netProfit}`,
          profitFactor: metrics.profitFactor,
        },
      },
    };

    const result = await callAIWithSchema(
      systemPrompt,
      userPrompt,
      AICopilotResponseSchema,
      fallback
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("AI Copilot Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process copilot query" },
      { status: 500 }
    );
  }
}
