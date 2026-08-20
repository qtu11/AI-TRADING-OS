# AI TRADING OS — AI Context Engine, Safety & Behavioral Architecture

## Principles of AI Operation

1. **Zero Hallucinated Numbers**: The AI model is strictly prohibited from guessing, inventing, or calculating financial account balances, P&L numbers, or win rates. All metrics cited by the AI must come from validated Firestore records.
2. **Deterministic Computation Separation**: Mathematical calculations (P&L, Drawdown, Position Sizing, Feasibility Score, Discipline Score) are computed in TypeScript prior to prompting the AI.
3. **Zod Schema Validation**: 100% of LLM JSON outputs are parsed and validated via Zod schemas before reaching the client interface.
4. **Insufficient Data Fallback**: When fewer than 5-20 trade records exist, the AI explicitly reports an &quot;Insufficient Sample Size&quot; state rather than generating unverified assertions.

---

## AI Service Endpoints

### 1. `/api/ai/daily-briefing`
- **Purpose**: Generates daily pre-market directives based on the active Trading Plan, recent trade win rate, and emotional state.
- **Output Schema**: `AIBriefingSchema` (summary, focusPoints, restrictedEvents, confidenceScore, evidenceSampleTrades).

### 2. `/api/ai/analyze-trade`
- **Purpose**: Automated post-execution audit assessing entry quality, stop loss discipline, and risk management.
- **Output Schema**: `AITradeAuditSchema` (overallScore, entryQualityScore, riskManagementScore, disciplineScore, verdict, strengths, mistakes, recommendations).

### 3. `/api/ai/analyze-journal`
- **Purpose**: End-of-day journal synthesis combining technical pre-market notes with actual execution performance.
- **Output Schema**: `AIJournalReviewSchema` (summary, strengths, weaknesses, keyTakeaway, focusForTomorrow).

### 4. `/api/ai/copilot`
- **Purpose**: Conversational AI assistant with full Firestore user context grounding.
- **Capabilities**: Explains performance variances, identifies session-specific expectancy, and coaches discipline.
