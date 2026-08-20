export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role?: "admin" | "user";
  timezone: string;
  currency: string;
  startingCapital: number;
  experienceLevel: "beginner" | "intermediate" | "advanced" | "pro";
  tradingStyle: "scalping" | "day_trading" | "swing" | "position";
  preferredSessions: Array<"sydney" | "tokyo" | "london" | "newYork">;
  preferredSymbols: string[];
  riskProfile: "conservative" | "moderate" | "aggressive" | "custom";
  customRiskPerTrade?: number;
  customDailyLossLimit?: number;
  onboardingCompleted: boolean;
  activePlanId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserSettings {
  theme: "dark";
  soundEffects: boolean;
  showDemoNotice: boolean;
  timezone: string;
  currency: string;
  riskGuardEnabled: boolean;
  maxConsecutiveLosses: number;
  cooldownPeriodMinutes: number;
}
