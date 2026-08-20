export interface AIBriefingResponse {
  date: string;
  summary: string;
  focusPoints: string[];
  restrictedEvents: string[];
  maxRiskWarning?: string;
  sessionNotes: string;
  confidenceScore: number; // 0 - 100
  evidenceSampleTrades: number;
}

export interface AITradeAuditResponse {
  overallScore: number;
  entryQualityScore: number;
  riskManagementScore: number;
  disciplineScore: number;
  verdict: "EXCELLENT" | "SOLID" | "RULE_VIOLATION" | "RECKLESS";
  strengths: string[];
  mistakes: string[];
  recommendations: string[];
  confidence: number;
}

export interface AIReviewResponse {
  periodType: "WEEKLY" | "MONTHLY";
  periodLabel: string;
  executiveSummary: string;
  performanceAnalysis: string;
  riskAnalysis: string;
  psychologyAnalysis: string;
  strengths: string[];
  weaknesses: string[];
  actionItems: string[];
  singleMainFocus: string;
  recommendedPlanAdjustment?: string;
  confidence: number;
  sampleTradesCount: number;
}

export interface AIChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  suggestedActions?: string[];
  dataReferences?: {
    totalTradesAnalyzed?: number;
    samplePeriod?: string;
    metricsCited?: Record<string, number | string>;
  };
}
