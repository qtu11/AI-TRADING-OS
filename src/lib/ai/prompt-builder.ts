import { Trade } from "@/types/trade.types";
import { TradingPlan } from "@/types/plan.types";
import { DailyJournal } from "@/types/journal.types";
import { PerformanceMetrics } from "@/lib/math/performance";

export function sanitizePromptInput(input: string): string {
  if (!input) return "";
  return input
    .replace(/<[^>]*>?/gm, "")
    .replace(/[\r\n]{3,}/g, "\n\n")
    .trim();
}

export function buildAIBriefingPrompt(
  plan: TradingPlan | null,
  recentTrades: Trade[],
  metrics: PerformanceMetrics
): string {
  return `You are an elite quantitative trading performance coach.
Analyze the trader's active trading plan and recent execution metrics.

CONTEXT:
- Active Plan: ${plan ? `${plan.name} (Risk per trade: ${plan.riskPerTradePercent}%, Daily Max Loss: ${plan.maxDailyLossPercent}%, Allowed Sessions: ${plan.allowedSessions?.join(", ")}, Allowed Symbols: ${plan.allowedSymbols?.join(", ")})` : "No active trading plan configured."}
- Recent Performance: ${recentTrades.length} trades evaluated, Win Rate: ${metrics.winRate}%, Net P&L: $${metrics.netProfit}, Profit Factor: ${metrics.profitFactor}.

DIRECTIVES:
1. Provide a concise, disciplined daily directive summary.
2. Formulate 3-5 high-priority focus points for today's session.
3. If no recent data is available, explicitly state the rules defined in the trading plan.
4. Output STRICT JSON conforming to the requested schema.`;
}

export function buildTradeAuditPrompt(trade: Trade): string {
  return `You are an AI Senior Risk & Trade Auditor.
Audit the following trade execution against professional trading principles:

TRADE DETAILS:
- Symbol: ${trade.symbol} (${trade.direction})
- Lots: ${trade.lots}
- Entry Price: ${trade.openPrice}, Exit Price: ${trade.closePrice || "Open"}
- Stop Loss: ${trade.stopLoss}, Take Profit: ${trade.takeProfit}
- Net Profit: $${trade.netProfit ?? 0}
- Risk/Reward Achieved: ${trade.riskRewardRatio ?? "—"}R (Target was ${trade.plannedRiskReward ?? "—"}R)
- Session: ${trade.session}
- Strategy: ${trade.strategyName || "General"}
- Pre-Trade Emotion: ${trade.preTradeEmotion || "Calm"}
- Followed Plan: ${trade.followedPlan !== false ? "YES" : "NO (Rule Broken)"}
- Trader Notes: "${trade.notes || "None"}"

EVALUATE:
1. Entry quality and risk-to-reward viability.
2. Discipline score (penalize if plan was not followed or stops were moved).
3. 2-3 key strengths and 2-3 specific recommendations.
4. Output STRICT JSON conforming to the requested schema.`;
}
