export interface PsychologyEntry {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  tradeId?: string; // Optional link to specific trade
  
  // Emotional States (Rating 1 to 10)
  confidence: number;
  fear: number;
  stress: number;
  fomo: number;
  greed: number;
  calm: number;
  revengeTendency: number;
  
  // Behavioral Adherence Checks (Boolean)
  followedPlan: boolean;
  movedStopLossPrematurely: boolean;
  exitedWinnerEarly: boolean;
  overtraded: boolean;
  revengeTraded: boolean;
  lateEntry: boolean;
  
  // Qualitative Reflections
  mentalStateNotes: string;
  physicalState: "RESTED" | "TIRED" | "DISTRACTED" | "OPTIMAL";
  
  // Calculated Score
  dailyDisciplineScore: number; // 0 - 100
  
  createdAt: string;
  updatedAt: string;
}

export interface PsychologyInsight {
  metric: string;
  correlationText: string;
  confidence: number;
  sampleSize: number;
  verdict: "WARNING" | "NEUTRAL" | "POSITIVE";
  actionableRecommendation: string;
}
