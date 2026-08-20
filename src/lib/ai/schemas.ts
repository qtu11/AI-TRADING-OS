import { z } from "zod";

export const AIBriefingSchema = z.object({
  date: z.string(),
  summary: z.string(),
  focusPoints: z.array(z.string()),
  restrictedEvents: z.array(z.string()),
  maxRiskWarning: z.string().optional(),
  sessionNotes: z.string(),
  confidenceScore: z.number().min(0).max(100),
  evidenceSampleTrades: z.number().default(0),
});

export const AITradeAuditSchema = z.object({
  overallScore: z.number().min(0).max(100),
  entryQualityScore: z.number().min(0).max(100),
  riskManagementScore: z.number().min(0).max(100),
  disciplineScore: z.number().min(0).max(100),
  verdict: z.enum(["EXCELLENT", "SOLID", "RULE_VIOLATION", "RECKLESS"]),
  strengths: z.array(z.string()),
  mistakes: z.array(z.string()),
  recommendations: z.array(z.string()),
  confidence: z.number().min(0).max(100),
});

export const AIJournalReviewSchema = z.object({
  summary: z.string(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  keyTakeaway: z.string(),
  focusForTomorrow: z.string(),
  confidence: z.number().min(0).max(100),
});

export const AIReviewPeriodSchema = z.object({
  periodType: z.enum(["WEEKLY", "MONTHLY"]),
  periodLabel: z.string(),
  executiveSummary: z.string(),
  performanceAnalysis: z.string(),
  riskAnalysis: z.string(),
  psychologyAnalysis: z.string(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  actionItems: z.array(z.string()),
  singleMainFocus: z.string(),
  recommendedPlanAdjustment: z.string().optional(),
  confidence: z.number().min(0).max(100),
  sampleTradesCount: z.number(),
});

export const AICopilotResponseSchema = z.object({
  reply: z.string(),
  suggestedActions: z.array(z.string()).optional(),
  dataReferences: z.object({
    totalTradesAnalyzed: z.number().optional(),
    samplePeriod: z.string().optional(),
    metricsCited: z.record(z.union([z.string(), z.number()])).optional(),
  }).optional(),
});

export const AINewsAnalysisSchema = z.object({
  eventTitle: z.string(),
  currency: z.string(),
  impactLevel: z.enum(["EXTREME", "HIGH", "MODERATE", "LOW"]),
  economicEssence: z.string(),
  bullishScenario: z.object({
    condition: z.string(),
    marketReaction: z.string(),
    affectedAssets: z.array(z.string()),
  }),
  bearishScenario: z.object({
    condition: z.string(),
    marketReaction: z.string(),
    affectedAssets: z.array(z.string()),
  }),
  expectedVolatilityPips: z.string(),
  actionableDirectives: z.array(z.string()),
  dangerTimeWindow: z.string(),
  tradingRecommendation: z.enum(["AVOID_TRADING", "REDUCE_LOT_SIZE", "WAIT_FOR_REACTION", "NORMAL_RISK"]),
  confidenceScore: z.number().min(0).max(100),
});
