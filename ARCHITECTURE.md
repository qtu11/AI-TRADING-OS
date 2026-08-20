# AI TRADING OS — System Architecture & Design Specification

## Overview

AI TRADING OS is architected as a high-density, institutional-grade Trading Operating System. The platform combines deterministic financial engineering with modern cloud databases and AI reasoning.

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Layer                           │
│  Next.js 15+ App Router, React 19, Tailwind, Recharts       │
│  AuthContext, CommandContext, NotificationContext           │
└──────────────────────────────┬──────────────────────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
┌──────────────────────────────┐    ┌──────────────────────────────┐
│     Client Direct Layer      │    │    Next.js Server Routes     │
│   Firebase Client SDK        │    │    /api/ai/*                 │
│   • Auth State Listeners     │    │    /api/mt5/*                │
│   • Firestore Subscriptions  │    │    Firebase Admin SDK        │
│   • Storage Uploads          │    │    Zod Schema Validation     │
└──────────────┬───────────────┘    └──────────────┬───────────────┘
               │                                   │
               │        ┌──────────────────────────┘
               ▼        ▼
┌─────────────────────────────────────────────────────────────┐
│                      Cloud Services                         │
│  Firebase Firestore (Encrypted subcollection database)      │
│  Firebase Auth (OAuth & Tokens)                             │
│  AI Inference Engine (GPT-4o / Claude 3.5 / Gemini Pro)    │
│  MT5 Bridge Gateway (REST API / Socket)                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. Closed-Loop Trading Intelligence System

The platform enforces a continuous 14-step feedback loop:

1. **Set Capital & Goals**: Trader establishes baseline account balance and financial targets.
2. **Trading Plan Formulation**: Duration, max daily loss, risk per trade, allowed sessions, and instruments are defined.
3. **Mathematical Feasibility**: Pure deterministic math calculates Required Return %, Risk of Ruin %, and Expected Consecutive Losses.
4. **Milestone Schedule Generation**: Annual, monthly, and weekly target slices are computed.
5. **Daily Workspace Initialization**: Daily task checklists and market bias inputs are automatically provisioned.
6. **Pre-Market Technical Preparation**: Support/Resistance levels and setup invalidation criteria are recorded.
7. **Trade Execution**: Trades are executed manually or via connected MT5 bridges.
8. **Anti-Duplicate Ingestion**: Unique ticket verification ensures zero duplicate entries.
9. **Journal Aggregation**: Daily journal automatically aggregates all closed orders, calculating P&L, Win Rate, and Avg R:R.
10. **Psychological & Discipline Scoring**: 1-10 emotional scales and 5 behavioral questions generate a 0-100 Discipline Score.
11. **AI Trade & Journal Audit**: Automated audit identifies entry quality, stop loss adherence, and psychological triggers.
12. **Quantitative Performance Analytics**: Segmentation across Day-of-Week heatmaps, session windows, and pairs.
13. **Executive Reviews**: Weekly and monthly synthesis highlighting 3 Core Strengths, 3 Weaknesses, and 1 Main Focus.
14. **Cycle Optimization**: Insights feed directly into the next Trading Plan iteration.

---

## 2. Deterministic Math Rule

Under no circumstances are financial metrics delegated to LLMs. All of the following are calculated via pure TypeScript math:

- Gross / Net Profit & Loss
- Win Rate % and Loss Rate %
- Profit Factor (Gross Profit / Gross Loss)
- Mathematical Expectancy per Trade
- Average Risk-to-Reward Ratio (Achieved vs Planned)
- Peak Equity & Maximum Drawdown (% and $)
- Recovery Factor
- Forex & CFD Position Sizing (Pips, Units, Lots)
- Risk of Ruin & Drawdown Projections
- Discipline Score (0 to 100)
