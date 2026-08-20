export const APP_CONFIG = {
  name: "AI TRADING OS",
  shortName: "TradingOS",
  tagline: "The Operating System for Elite Forex Traders & Investors",
  version: "1.0.0",
  author: "AI Trading OS Architecture Team",
  company: "FinTech Intelligence Systems",
  defaultCurrency: "USD",
  supportedCurrencies: ["USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF"],
  
  // Forex Sessions configuration (UTC based)
  sessions: {
    sydney: { name: "Sydney", openUTC: 21, closeUTC: 6, color: "#38BDF8" },
    tokyo: { name: "Tokyo", openUTC: 0, closeUTC: 9, color: "#EC4899" },
    london: { name: "London", openUTC: 7, closeUTC: 16, color: "#6366F1" },
    newYork: { name: "New York", openUTC: 12, closeUTC: 21, color: "#10B981" },
  },

  // Popular Forex & CFD Instruments with Standard Pip Specifications
  instruments: [
    { symbol: "EURUSD", name: "Euro / US Dollar", type: "forex", pipSize: 0.0001, defaultLotUnit: 100000 },
    { symbol: "GBPUSD", name: "British Pound / US Dollar", type: "forex", pipSize: 0.0001, defaultLotUnit: 100000 },
    { symbol: "USDJPY", name: "US Dollar / Japanese Yen", type: "forex", pipSize: 0.01, defaultLotUnit: 100000 },
    { symbol: "AUDUSD", name: "Australian Dollar / US Dollar", type: "forex", pipSize: 0.0001, defaultLotUnit: 100000 },
    { symbol: "USDCAD", name: "US Dollar / Canadian Dollar", type: "forex", pipSize: 0.0001, defaultLotUnit: 100000 },
    { symbol: "USDCHF", name: "US Dollar / Swiss Franc", type: "forex", pipSize: 0.0001, defaultLotUnit: 100000 },
    { symbol: "EURJPY", name: "Euro / Japanese Yen", type: "forex", pipSize: 0.01, defaultLotUnit: 100000 },
    { symbol: "GBPJPY", name: "British Pound / Japanese Yen", type: "forex", pipSize: 0.01, defaultLotUnit: 100000 },
    { symbol: "XAUUSD", name: "Gold / US Dollar", type: "metal", pipSize: 0.01, defaultLotUnit: 100 },
    { symbol: "XAGUSD", name: "Silver / US Dollar", type: "metal", pipSize: 0.001, defaultLotUnit: 5000 },
    { symbol: "NAS100", name: "Nasdaq 100 Index", type: "index", pipSize: 1.0, defaultLotUnit: 1 },
    { symbol: "US30", name: "Dow Jones 30 Index", type: "index", pipSize: 1.0, defaultLotUnit: 1 },
    { symbol: "BTCUSD", name: "Bitcoin / US Dollar", type: "crypto", pipSize: 1.0, defaultLotUnit: 1 },
  ],

  // Risk Profiles
  riskProfiles: {
    conservative: {
      name: "Conservative",
      riskPerTradeMax: 0.5,
      dailyLossLimitMax: 1.0,
      maxTradesPerDay: 2,
      description: "Focus on maximum capital preservation with tight risk parameters.",
    },
    moderate: {
      name: "Moderate",
      riskPerTradeMax: 1.0,
      dailyLossLimitMax: 2.0,
      maxTradesPerDay: 3,
      description: "Balanced growth and managed drawdowns for steady compounding.",
    },
    aggressive: {
      name: "Aggressive",
      riskPerTradeMax: 2.0,
      dailyLossLimitMax: 4.0,
      maxTradesPerDay: 5,
      description: "High performance targets with higher tolerance for volatility.",
    },
  },

  // Default Daily Task Checklist Template
  defaultDailyTasks: [
    { id: "task-news", label: "Check Economic Calendar & High Impact News", category: "prep" },
    { id: "task-bias", label: "Conduct Multi-Timeframe Analysis & Set Market Bias", category: "prep" },
    { id: "task-levels", label: "Mark Key Support/Resistance & Invalidation Levels", category: "prep" },
    { id: "task-plan", label: "Confirm Setup Rules & Risk-to-Reward Ratio (Min 1:1.5)", category: "prep" },
    { id: "task-execute", label: "Execute Trades within Allowed Trading Window Only", category: "execution" },
    { id: "task-screenshot", label: "Capture Before & After Chart Screenshots", category: "execution" },
    { id: "task-journal", label: "Complete Daily Journal & Execution Notes", category: "review" },
    { id: "task-psychology", label: "Log Psychology & Emotional Discipline Check", category: "review" },
    { id: "task-eod", label: "Perform End-of-Day Performance Review & Variance Check", category: "review" },
  ],
} as const;

export type AppConfig = typeof APP_CONFIG;
