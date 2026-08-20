import { NextRequest, NextResponse } from "next/server";
import { callAIWithSchema } from "@/lib/ai/ai-client";
import { AINewsAnalysisSchema } from "@/lib/ai/schemas";

export async function POST(req: NextRequest) {
  try {
    const { event } = await req.json();

    if (!event || !event.title) {
      return NextResponse.json({ error: "Missing event data" }, { status: 400 });
    }

    const systemPrompt = `You are a Wall Street Chief Macroeconomic Strategist & Senior Risk Officer. 
Analyze the high-impact financial news event from Forex Factory and generate a quantitative trading playbook with scenario analysis and risk directives.`;

    const userPrompt = `ECONOMIC EVENT DETAILS:
- Event: ${event.title}
- Currency / Country: ${event.currency || event.country || "USD"}
- Impact Level: ${event.impact || "High"}
- Forecast: ${event.forecast || "N/A"}
- Previous: ${event.previous || "N/A"}
- Actual: ${event.actual || "Pending release"}
- Date & Time: ${event.date} ${event.time || ""}

Provide an in-depth macro breakdown with clear bullish & bearish reaction mechanics for major currencies and assets (XAUUSD, EURUSD, USDJPY, US30).`;

    const curr = (event.currency || event.country || "USD").toUpperCase();
    const isUSD = curr === "USD";

    const fallback = {
      eventTitle: event.title,
      currency: curr,
      impactLevel: (event.impact === "High" ? "HIGH" : event.impact === "Medium" ? "MODERATE" : "LOW") as any,
      economicEssence: `${event.title} is a critical macroeconomic indicator reflecting economic momentum, inflation pressures, or monetary policy orientation in ${curr}. Central banks closely monitor this release to calibrate benchmark interest rates.`,
      bullishScenario: {
        condition: `Actual figure exceeds consensus forecast (${event.forecast || "Expected level"}).`,
        marketReaction: isUSD
          ? `Reinforces ${curr} strength via hawkish yield repricing. Pressures Gold and risk assets lower while driving Treasury yields up.`
          : `Strengthens ${curr} against counterpart currencies due to superior economic resilience.`,
        affectedAssets: isUSD ? ["XAUUSD (Bearish)", "EURUSD (Bearish)", "USDJPY (Bullish)", "US30 (Volatile)"] : [`${curr}USD (Bullish)`, `EUR${curr} (Bearish)`],
      },
      bearishScenario: {
        condition: `Actual figure falls short of forecast (${event.forecast || "Expected level"}).`,
        marketReaction: isUSD
          ? `Triggers USD depreciation on dovish policy expectations. Sparks a liquidity rally in Gold and equity indices.`
          : `Weakens ${curr} as growth or inflation concerns mount.`,
        affectedAssets: isUSD ? ["XAUUSD (Bullish)", "EURUSD (Bullish)", "USDJPY (Bearish)", "US30 (Bullish)"] : [`${curr}USD (Bearish)`, `EUR${curr} (Bullish)`],
      },
      expectedVolatilityPips: event.impact === "High" ? "60 - 130 Pips" : "25 - 50 Pips",
      actionableDirectives: [
        "Flatten all short-term scalp positions 15 minutes before release to prevent slippage.",
        "Widen stop-loss thresholds by at least 1.5x if maintaining macro swing positions.",
        "Refrain from placing pre-news limit or stop orders due to initial spread widening.",
        "Wait for the 15-minute post-news candle to close before executing pullback or continuation strategies.",
      ],
      dangerTimeWindow: "T-15 min to T+20 min relative to official release time.",
      tradingRecommendation: (event.impact === "High" ? "WAIT_FOR_REACTION" : "REDUCE_LOT_SIZE") as any,
      confidenceScore: 92,
    };

    const analysis = await callAIWithSchema(
      systemPrompt,
      userPrompt,
      AINewsAnalysisSchema,
      fallback
    );

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error: any) {
    console.error("AI News Analysis Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to analyze news event" },
      { status: 500 }
    );
  }
}
