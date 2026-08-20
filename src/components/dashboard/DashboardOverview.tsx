"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useCommand } from "@/context/CommandContext";
import { useLanguage } from "@/context/LanguageContext";
import { Trade } from "@/types/trade.types";
import { TradingPlan, DailyTask } from "@/types/plan.types";
import {
  getUserTrades,
  subscribeToTrades,
  getActiveTradingPlan,
  subscribeToActivePlan,
  getDailyTasks,
  saveDailyTask,
} from "@/lib/firebase/db-service";
import { calculateTradeMetrics } from "@/lib/math/performance";
import { calculateEquityCurveAndDrawdown } from "@/lib/math/drawdown";
import { AccountKPIGrid } from "./AccountKPIGrid";
import { EquityChart } from "./EquityChart";
import { TodayPlanCard } from "./TodayPlanCard";
import { AIBriefingCard } from "./AIBriefingCard";
import { RecentTradesTable } from "./RecentTradesTable";
import { RiskGuardBanner } from "@/components/common/RiskGuardBanner";
import { OutcomePieChart } from "@/components/charts/OutcomePieChart";
import { DailyPnLBarChart } from "@/components/charts/DailyPnLBarChart";
import { getTodayDateString } from "@/lib/utils/date";
import { APP_CONFIG } from "@/config/app.config";
import { PlusCircle, Target, Sparkles, ShieldCheck, Activity, BarChart2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface DashboardOverviewProps {
  onOpenTradeModal: () => void;
  onOpenPlanWizard: () => void;
  onSelectTrade: (trade: Trade) => void;
  onOpenJournal: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  onOpenTradeModal,
  onOpenPlanWizard,
  onSelectTrade,
  onOpenJournal,
}) => {
  const { userProfile, isAdmin } = useAuth();
  const { toggleAICopilot } = useCommand();
  const { t, language } = useLanguage();
  const isVi = language === "vi";

  const [trades, setTrades] = useState<Trade[]>([]);
  const [plan, setPlan] = useState<TradingPlan | null>(null);
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [loading, setLoading] = useState(true);

  const todayStr = getTodayDateString();
  const userId = userProfile?.id || "dev-trader-01";
  const startingCapital = userProfile?.startingCapital ?? 0;

  // Realtime Subscriptions
  useEffect(() => {
    if (!userId) return;

    // Subscribe to trades
    const unsubTrades = subscribeToTrades(userId, (liveTrades) => {
      setTrades(liveTrades);
      setLoading(false);
    });

    // Subscribe to active plan
    const unsubPlan = subscribeToActivePlan(userId, (livePlan) => {
      setPlan(livePlan);
    });

    // Load or initialize daily tasks
    getDailyTasks(userId, todayStr).then((existingTasks) => {
      if (existingTasks.length > 0) {
        setTasks(existingTasks);
      } else {
        // Initialize from template
        const initialTasks: DailyTask[] = APP_CONFIG.defaultDailyTasks.map((t) => ({
          id: `${t.id}-${todayStr}`,
          planId: plan?.id || "default",
          date: todayStr,
          title: t.label,
          category: t.category,
          completed: false,
        }));
        setTasks(initialTasks);
        initialTasks.forEach((t) => saveDailyTask(userId, t).catch(console.warn));
      }
    });

    return () => {
      if (unsubTrades) unsubTrades();
      if (unsubPlan) unsubPlan();
    };
  }, [userId, todayStr]);

  // Deterministic Math Calculations
  const metrics = calculateTradeMetrics(trades);
  const drawdown = calculateEquityCurveAndDrawdown(startingCapital, trades);

  // Calculate Today's P&L
  const todayTrades = trades.filter((t) => {
    const tradeDate = t.closeTime ? t.closeTime.split("T")[0] : t.openTime.split("T")[0];
    return tradeDate === todayStr && t.status === "CLOSED";
  });

  const todayProfit = todayTrades.reduce((acc, t) => acc + Number(t.netProfit || 0), 0);
  const currentBalance = startingCapital + metrics.netProfit;
  const currentEquity = currentBalance;

  // Risk Guard monitoring
  const dailyLossLimitDollars = plan
    ? (startingCapital * plan.maxDailyLossPercent) / 100
    : (startingCapital * 0.02);

  const currentDailyLoss = todayProfit < 0 ? Math.abs(todayProfit) : 0;
  const isRiskBreached = currentDailyLoss >= dailyLossLimitDollars && dailyLossLimitDollars > 0;

  // Task Toggle Handler
  const handleToggleTask = async (taskId: string, completed: boolean) => {
    const updated = tasks.map((t) =>
      t.id === taskId
        ? { ...t, completed, completedAt: completed ? new Date().toISOString() : undefined }
        : t
    );
    setTasks(updated);
    const targetTask = updated.find((t) => t.id === taskId);
    if (targetTask && userId) {
      await saveDailyTask(userId, targetTask).catch(console.warn);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Welcome & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-bg-surface border border-border shadow-sm transition-colors">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-txt-primary">
              {t("dash_good_morning")}, {userProfile?.displayName || "Trader"}
            </h1>
            {isAdmin && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                {t("role_admin")}
              </span>
            )}
          </div>
          <p className="text-xs text-txt-secondary mt-1 font-mono flex items-center gap-2">
            <span>{t("dash_active_plan")}: {plan ? plan.name : (isVi ? "Chưa thiết lập" : "None")}</span>
            <span>•</span>
            <span>Risk Profile: {userProfile?.riskProfile || "Moderate"}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link href="/market">
            <Button variant="secondary" size="sm">
              <Activity className="w-3.5 h-3.5 mr-1.5 text-sky-400" />
              {isVi ? "Chart Nến Realtime" : "Live Candle Chart"}
            </Button>
          </Link>

          <Button variant="secondary" size="sm" onClick={onOpenPlanWizard}>
            <Target className="w-3.5 h-3.5 mr-1.5 text-brand-500" />
            {plan ? t("btn_create_plan") : t("btn_create_plan")}
          </Button>

          <Button variant="secondary" size="sm" onClick={onOpenJournal}>
            <BookOpen className="w-3.5 h-3.5 mr-1.5 text-brand-400" />
            {isVi ? "Nhật Ký" : "Journal"}
          </Button>

          <Button variant="primary" size="sm" onClick={onOpenTradeModal}>
            <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
            {t("btn_new_trade")}
          </Button>
        </div>
      </div>

      {/* Risk Guard Realtime Banner */}
      <RiskGuardBanner
        currentDailyLoss={currentDailyLoss}
        dailyLossLimit={dailyLossLimitDollars}
        isBreached={isRiskBreached}
        consecutiveLosses={metrics.losingTrades}
      />

      {/* Account KPI Grid */}
      <AccountKPIGrid
        startingCapital={startingCapital}
        currentBalance={currentBalance}
        equity={currentEquity}
        todayProfit={todayProfit}
        metrics={metrics}
        drawdown={drawdown}
        currency={userProfile?.currency || "USD"}
      />

      {/* Equity Curve & Performance Chart */}
      <EquityChart
        equityPoints={drawdown.equityCurve}
        currency={userProfile?.currency || "USD"}
      />

      {/* Visual Analytics Snapshot (Pie & Bar Charts) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <OutcomePieChart metrics={metrics} />
        <DailyPnLBarChart trades={trades} />
      </div>

      {/* Today's Plan & AI Daily Briefing */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <TodayPlanCard
          plan={plan}
          tasks={tasks}
          onToggleTask={handleToggleTask}
          onCreatePlan={onOpenPlanWizard}
        />

        <AIBriefingCard onOpenCopilot={toggleAICopilot} />
      </div>

      {/* Recent Trades Table */}
      <RecentTradesTable
        trades={trades}
        onSelectTrade={onSelectTrade}
        currency={userProfile?.currency || "USD"}
      />
    </div>
  );
};
