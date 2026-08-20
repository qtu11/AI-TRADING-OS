"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { TradingPlan } from "@/types/plan.types";
import { getActiveTradingPlan, subscribeToActivePlan } from "@/lib/firebase/db-service";
import { PlanBuilderWizard } from "@/components/plan/PlanBuilderWizard";
import { MilestoneModal } from "@/components/plan/MilestoneModal";
import { PlanMilestone } from "@/types/plan.types";
import { RealismGauge } from "@/components/plan/RealismGauge";
import { calculatePlanFeasibility } from "@/lib/math/plan-engine";
import { formatCurrency, formatPercent } from "@/lib/utils/currency";
import { Target, PlusCircle, Calendar, ShieldCheck, CheckCircle2, Award, Clock, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/common/EmptyState";
import { soundFX } from "@/lib/sound/sound-effects";

export default function PlanPage() {
  const { userProfile } = useAuth();
  const { language, t } = useLanguage();
  const userId = userProfile?.id || "dev-trader-01";

  const [plan, setPlan] = useState<TradingPlan | null>(null);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<PlanMilestone | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const unsub = subscribeToActivePlan(userId, (activePlan) => {
      setPlan(activePlan);
      setLoading(false);
    });
    return () => {
      if (unsub) unsub();
    };
  }, [userId]);

  const isVi = language === "vi";

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-bg-surface border border-border shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-txt-primary flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-500/15 text-brand-500 border border-brand-500/30">
              <Target className="w-5 h-5" />
            </div>
            <span>{isVi ? "Kế Hoạch Giao Dịch & Khung Chiến Lược" : "Trading Plan & Strategy Framework"}</span>
          </h1>
          <p className="text-xs text-txt-secondary mt-1 font-mono">
            {isVi
              ? "Phân bổ cột mốc mục tiêu, kiểm soát rủi ro và đánh giá tính khả thi toán học."
              : "Deterministic milestone scheduling, risk parameters, and mathematical feasibility analysis."}
          </p>
        </div>

        <Button variant="primary" size="md" onClick={() => setIsWizardOpen(true)}>
          <PlusCircle className="w-4 h-4 mr-2" />
          {plan
            ? isVi
              ? "Cấu Hình Chu Kỳ Kế Hoạch"
              : "Configure Plan Cycle"
            : isVi
            ? "Tạo Kế Hoạch Mới"
            : "Create Trading Plan"}
        </Button>
      </div>

      {!plan ? (
        <EmptyState
          icon={Target}
          title={isVi ? "Chưa Có Chu Kỳ Kế Hoạch Hoạt Động" : "No Active Trading Plan Cycle"}
          description={
            isVi
              ? "Tạo kế hoạch giao dịch đầu tiên để kích hoạt checklist hàng ngày, quản lý rủi ro và cột mốc tháng."
              : "Create your first structured trading plan to unlock automated daily checklists, risk guards, and monthly milestones."
          }
          actionLabel={isVi ? "Tạo Kế Hoạch Ngay" : "Create Trading Plan Now"}
          onAction={() => setIsWizardOpen(true)}
        />
      ) : (
        <div className="space-y-6">
          {/* Active Plan Overview Card */}
          <div className="bento-card p-5 sm:p-6 space-y-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-brand-500/50 to-transparent" />

            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
              <div>
                <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-txt-muted block">
                  {isVi ? "Chu Kỳ Giao Dịch Đang Chạy" : "Active Trading Cycle"}
                </span>
                <h3 className="text-lg font-bold text-txt-primary mt-0.5">{plan.name}</h3>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono px-3 py-1 rounded-full bg-gain-subtle text-gain border border-gain/40 font-bold">
                  {isVi ? "Trạng Thái: " : "Status: "}{plan.status}
                </span>
                <span className="text-xs font-mono px-3 py-1 rounded-full bg-bg-surface-subtle text-txt-secondary border border-border font-semibold">
                  {plan.durationMonths} {isVi ? "Tháng" : "Months"} ({plan.startDate} → {plan.endDate})
                </span>
              </div>
            </div>

            {/* Financial Parameters Matrix */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
              <div className="bg-bg-surface-subtle p-3.5 rounded-xl border border-border/60">
                <span className="text-[10px] text-txt-muted block uppercase font-medium">
                  {isVi ? "Vốn Khởi Điểm" : "Starting Capital"}
                </span>
                <span className="text-base font-bold text-txt-primary mt-1 block">
                  {formatCurrency(plan.startingCapital)}
                </span>
              </div>

              <div className="bg-bg-surface-subtle p-3.5 rounded-xl border border-border/60">
                <span className="text-[10px] text-txt-muted block uppercase font-medium">
                  {isVi ? "Vốn Mục Tiêu" : "Target Capital"}
                </span>
                <span className="text-base font-bold text-gain mt-1 block">
                  {formatCurrency(plan.targetCapital)}
                </span>
              </div>

              <div className="bg-bg-surface-subtle p-3.5 rounded-xl border border-border/60">
                <span className="text-[10px] text-txt-muted block uppercase font-medium">
                  {isVi ? "Rủi Ro / Lệnh" : "Risk per Trade"}
                </span>
                <span className="text-base font-bold text-amber-400 mt-1 block">
                  {formatPercent(plan.riskPerTradePercent, 2)}
                </span>
              </div>

              <div className="bg-bg-surface-subtle p-3.5 rounded-xl border border-border/60">
                <span className="text-[10px] text-txt-muted block uppercase font-medium">
                  {isVi ? "Giới Hạn Lỗ Ngày" : "Daily Max Loss"}
                </span>
                <span className="text-base font-bold text-loss mt-1 block">
                  {formatPercent(plan.maxDailyLossPercent, 1)} ({formatCurrency((plan.startingCapital * plan.maxDailyLossPercent) / 100)})
                </span>
              </div>
            </div>

            {/* Permitted Sessions & Symbols */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono pt-1">
              <div className="bg-bg-surface-subtle p-3 rounded-xl border border-border/60">
                <span className="text-[10px] text-txt-muted block uppercase mb-1 font-medium">
                  {isVi ? "Phiên Giao Dịch Cho Phép" : "Permitted Sessions"}
                </span>
                <span className="text-txt-primary font-semibold">{plan.allowedSessions?.join(", ") || "London, NY"}</span>
              </div>

              <div className="bg-bg-surface-subtle p-3 rounded-xl border border-border/60">
                <span className="text-[10px] text-txt-muted block uppercase mb-1 font-medium">
                  {isVi ? "Cặp Tiền Cho Phép" : "Permitted Symbols"}
                </span>
                <span className="text-txt-primary font-semibold">{plan.allowedSymbols?.join(", ") || "EURUSD, XAUUSD"}</span>
              </div>
            </div>
          </div>

          {/* Mathematical Realism Check */}
          <RealismGauge
            feasibility={{
              requiredTotalReturnPercent: plan.requiredTotalReturnPercent,
              requiredMonthlyReturnPercent: plan.requiredMonthlyReturnPercent,
              requiredWeeklyReturnPercent: plan.requiredWeeklyReturnPercent,
              requiredDailyReturnDollars: plan.requiredDailyReturnDollars,
              feasibilityScore: plan.feasibilityScore,
              feasibilityRating: plan.feasibilityRating,
              riskOfRuinPercent: plan.riskOfRuinPercent,
              maxDrawdownProjectedPercent: plan.maxDrawdownProjectedPercent,
              expectedLosingStreak: plan.expectedLosingStreak,
              totalTradingDaysEstimated: plan.durationMonths * 21,
              recommendedAdjustment: plan.aiRecommendation,
            }}
            startingCapital={plan.startingCapital}
            targetProfit={plan.targetProfit}
          />

          {/* Monthly Milestones Hierarchy */}
          <div className="bento-card p-5 sm:p-6 space-y-4 relative overflow-hidden">
            <div className="flex items-center gap-2 border-b border-border/60 pb-3">
              <Award className="w-4 h-4 text-brand-500" />
              <h3 className="text-sm font-bold text-txt-primary">
                {isVi ? "Lịch Trình Cột Mốc Hàng Tháng" : "Monthly Milestone Schedule"}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {plan.milestones?.map((milestone) => (
                <button
                  key={milestone.id}
                  onClick={() => {
                    soundFX.playClick(500);
                    setSelectedMilestone(milestone);
                  }}
                  className="group bg-bg-surface-subtle border border-border/60 hover:border-brand-500/60 p-4 rounded-xl space-y-2 text-xs font-mono text-left transition-all hover:shadow-md hover:bg-bg-surface-hover cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-txt-primary">{milestone.periodLabel}</span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                          milestone.status === "IN_PROGRESS"
                            ? "bg-sky-500/20 text-sky-400 border border-sky-500/40"
                            : milestone.status === "ACHIEVED"
                            ? "bg-gain-subtle text-gain border border-gain/40"
                            : "bg-bg-surface text-txt-muted border border-border"
                        }`}
                      >
                        {milestone.status}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-txt-muted group-hover:text-brand-400 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border/40 flex justify-between text-txt-secondary">
                    <span className="text-txt-muted">{isVi ? "Mục tiêu LN:" : "Target Profit:"}</span>
                    <span className="text-gain font-bold">+{formatCurrency(milestone.targetProfit)}</span>
                  </div>

                  <div className="flex justify-between text-txt-secondary text-[11px]">
                    <span className="text-txt-muted">{isVi ? "Thời gian:" : "Period:"}</span>
                    <span>{milestone.startDate} → {milestone.endDate}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Plan Builder Modal */}
      <PlanBuilderWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
      />

      {/* Milestone Modal */}
      <MilestoneModal
        isOpen={Boolean(selectedMilestone)}
        onClose={() => setSelectedMilestone(null)}
        milestone={selectedMilestone}
      />
    </div>
  );
}
