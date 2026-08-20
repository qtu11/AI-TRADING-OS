# AI TRADING OS — Firestore Database Architecture & Schema

## Entity Relationship Model (ERD)

Data is structured in strict user-isolated subcollections to maximize security, indexing speed, and realtime listener efficiency.

```
users/{userId}
├── tradingPlans/{planId}
├── trades/{tradeId}
├── dailyTasks/{taskId}
├── journals/{dateStr} (YYYY-MM-DD)
├── psychology/{entryId}
├── strategies/{strategyId}
├── goals/{goalId}
├── reviews/{reviewId}
├── notifications/{notificationId}
├── integrations/{integrationId} (e.g. "mt5")
└── auditLogs/{logId}
```

---

## Detailed Collection Schemas

### 1. `users/{userId}`
- `id`: string (Firebase Auth UID)
- `email`: string
- `displayName`: string
- `photoURL`: string (optional)
- `timezone`: string (e.g. "America/New_York", "Asia/Ho_Chi_Minh")
- `currency`: string (e.g. "USD", "EUR", "GBP")
- `startingCapital`: number
- `experienceLevel`: "beginner" | "intermediate" | "advanced" | "pro"
- `tradingStyle`: "scalping" | "day_trading" | "swing" | "position"
- `preferredSessions`: string[]
- `preferredSymbols`: string[]
- `riskProfile`: "conservative" | "moderate" | "aggressive" | "custom"
- `onboardingCompleted`: boolean
- `activePlanId`: string (optional)
- `createdAt`: ISO String
- `updatedAt`: ISO String

### 2. `users/{userId}/trades/{tradeId}`
- `id`: string (UUID or "mt5-{ticket}")
- `userId`: string
- `externalTradeId`: string (optional MT5 ticket)
- `source`: "MANUAL" | "MT5" | "CSV_IMPORT"
- `symbol`: string (e.g. "EURUSD", "XAUUSD")
- `direction`: "BUY" | "SELL"
- `status`: "OPEN" | "CLOSED" | "CANCELLED"
- `lots`: number
- `openPrice`: number
- `closePrice`: number (optional)
- `stopLoss`: number
- `takeProfit`: number
- `openTime`: ISO String
- `closeTime`: ISO String (optional)
- `grossProfit`: number
- `commission`: number
- `swap`: number
- `netProfit`: number
- `riskRewardRatio`: number
- `plannedRiskReward`: number
- `outcome`: "WIN" | "LOSS" | "BREAKEVEN"
- `session`: "Asian" | "London" | "New York" | "London+NY"
- `strategyName`: string
- `notes`: string
- `preTradeEmotion`: string
- `followedPlan`: boolean
- `screenshotBeforeUrl`: string (optional)
- `screenshotAfterUrl`: string (optional)
- `aiAudit`: TradeAIAudit object (optional)

### 3. `users/{userId}/tradingPlans/{planId}`
- `id`: string
- `userId`: string
- `name`: string
- `status`: "ACTIVE" | "COMPLETED" | "ARCHIVED"
- `startingCapital`: number
- `targetCapital`: number
- `targetProfit`: number
- `durationMonths`: 1 | 3 | 6 | 9 | 12
- `startDate`: YYYY-MM-DD
- `endDate`: YYYY-MM-DD
- `riskProfile`: string
- `riskPerTradePercent`: number
- `maxDailyLossPercent`: number
- `maxTradesPerDay`: number
- `allowedSessions`: string[]
- `allowedSymbols`: string[]
- `requiredTotalReturnPercent`: number
- `requiredMonthlyReturnPercent`: number
- `requiredWeeklyReturnPercent`: number
- `requiredDailyReturnDollars`: number
- `feasibilityScore`: number (0-100)
- `feasibilityRating`: string
- `riskOfRuinPercent`: number
- `maxDrawdownProjectedPercent`: number
- `expectedLosingStreak`: number
- `milestones`: PlanMilestone[]
- `createdAt`: ISO String
- `updatedAt`: ISO String

### 4. `users/{userId}/journals/{dateStr}`
- `id`: YYYY-MM-DD
- `userId`: string
- `date`: YYYY-MM-DD
- `marketBias`: "BULLISH" | "BEARISH" | "NEUTRAL" | "RANGING"
- `volatility`: "LOW" | "NORMAL" | "HIGH" | "EXTREME"
- `primarySession`: string
- `preMarketNotes`: string
- `watchedLevels`: string
- `invalidationCriteria`: string
- `postMarketReview`: string
- `lessonsLearned`: string
- `chartScreenshotUrls`: string[]
- `totalTrades`: number
- `winningTrades`: number
- `losingTrades`: number
- `winRate`: number
- `netProfit`: number
- `profitFactor`: number
- `disciplineScore`: number
- `aiDailyReview`: AIJournalReview object (optional)

### 5. `users/{userId}/psychology/{entryId}`
- `id`: string
- `userId`: string
- `date`: YYYY-MM-DD
- `confidence`: number (1-10)
- `fear`: number (1-10)
- `stress`: number (1-10)
- `fomo`: number (1-10)
- `greed`: number (1-10)
- `calm`: number (1-10)
- `revengeTendency`: number (1-10)
- `followedPlan`: boolean
- `movedStopLossPrematurely`: boolean
- `exitedWinnerEarly`: boolean
- `overtraded`: boolean
- `revengeTraded`: boolean
- `dailyDisciplineScore`: number (0-100)
- `mentalStateNotes`: string
- `physicalState`: "OPTIMAL" | "RESTED" | "TIRED" | "DISTRACTED"
