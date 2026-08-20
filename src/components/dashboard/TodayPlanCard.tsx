"use client";

import React from "react";
import { TradingPlan, DailyTask } from "@/types/plan.types";
import { formatCurrency, formatPercent } from "@/lib/utils/currency";
import { useLanguage } from "@/context/LanguageContext";
import { Target, CheckCircle2, Circle, PlusCircle, ShieldCheck, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface TodayPlanCardProps {
  plan: TradingPlan | null;
  tasks: DailyTask[];
  onToggleTask: (taskId: string, completed: boolean) => void;
  onCreatePlan: () => void;
}

export const TodayPlanCard: React.FC<TodayPlanCardProps> = ({
  plan,
  tasks,
  onToggleTask,
  onCreatePlan,
}) => {
  const { language } = useLanguage();
  const isVi = language === "vi";

  if (!plan) {
    return (
      <div className="bento-card p-5 sm:p-6 flex flex-col justify-between transition-all relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-brand-500/40 to-transparent" />
        <div>
          <div className="flex items-center gap-2 border-b border-border/60 pb-3 mb-4">
            <Target className="w-4 h-4 text-brand-500" />
            <h3 className="text-sm font-semibold text-txt-primary">
              {isVi ? "Kế Hoạch Giao Dịch Hôm Nay" : "Today's Trading Plan"}
            </h3>
          </div>
          <p className="text-xs text-txt-secondary leading-relaxed mb-4">
            {isVi
              ? "Bạn chưa có chu kỳ Kế Hoạch Giao Dịch hoạt động. Kế hoạch xác lập quy tắc rủi ro, giới hạn thua lỗ hàng ngày, phiên giao dịch cho phép và mục tiêu cột mốc."
              : "You do not have an active Trading Plan cycle. An operational plan defines your risk rules, daily loss limits, permitted sessions, and milestone targets."}
          </p>
        </div>
        <Button variant="primary" size="md" onClick={onCreatePlan} className="w-full">
          <PlusCircle className="w-4 h-4 mr-2" />
          {isVi ? "Tạo Kế Hoạch Giao Dịch" : "Create Trading Plan"}
        </Button>
      </div>
    );
  }

  const completedCount = tasks.filter((t) => t.completed).length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className="bento-card p-5 sm:p-6 space-y-4 transition-all relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-sky-500/40 to-transparent" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-brand-500" />
          <h3 className="text-sm font-bold text-txt-primary">
            {isVi ? "Kế Hoạch Giao Dịch Hôm Nay" : "Today's Trading Plan"}
          </h3>
        </div>
        <span className="text-[11px] font-mono font-bold text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded-full border border-sky-500/30">
          {plan.name}
        </span>
      </div>

      {/* Plan Rules Grid */}
      <div className="grid grid-cols-2 gap-2.5 text-xs font-mono">
        <div className="bg-bg-surface-subtle p-3 rounded-xl border border-border/60 transition-colors">
          <span className="text-[10px] text-txt-muted block uppercase">
            {isVi ? "Phiên Cho Phép" : "Allowed Sessions"}
          </span>
          <span className="text-txt-primary font-semibold mt-0.5 block truncate">
            {plan.allowedSessions?.join(", ") || "London, NY"}
          </span>
        </div>

        <div className="bg-bg-surface-subtle p-3 rounded-xl border border-border/60 transition-colors">
          <span className="text-[10px] text-txt-muted block uppercase">
            {isVi ? "Rủi Ro / Lệnh" : "Risk / Trade"}
          </span>
          <span className="text-amber-400 font-semibold mt-0.5 block">
            {formatPercent(plan.riskPerTradePercent, 2)}
          </span>
        </div>

        <div className="bg-bg-surface-subtle p-3 rounded-xl border border-border/60 transition-colors">
          <span className="text-[10px] text-txt-muted block uppercase">
            {isVi ? "Giới Hạn Lỗ Ngày" : "Daily Loss Limit"}
          </span>
          <span className="text-loss font-semibold mt-0.5 block">
            {formatPercent(plan.maxDailyLossPercent, 1)} ({formatCurrency((plan.startingCapital * plan.maxDailyLossPercent) / 100)})
          </span>
        </div>

        <div className="bg-bg-surface-subtle p-3 rounded-xl border border-border/60 transition-colors">
          <span className="text-[10px] text-txt-muted block uppercase">
            {isVi ? "Mục Tiêu Ngày" : "Daily Target"}
          </span>
          <span className="text-gain font-semibold mt-0.5 block">
            +{formatCurrency(plan.requiredDailyReturnDollars)}
          </span>
        </div>
      </div>

      {/* Daily Tasks Checklist with Progress Bar */}
      <div className="space-y-2.5 pt-2 border-t border-border/60">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="font-semibold text-txt-secondary">
            {isVi ? "Checklist Kỷ Luật Hàng Ngày" : "Daily Execution Checklist"}
          </span>
          <span className="font-bold text-sky-400">
            {completedCount}/{tasks.length} ({progressPercent}%)
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-bg-surface-subtle rounded-full overflow-hidden border border-border/40">
          <div
            className="h-full bg-gradient-to-r from-brand-500 to-gain rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
          {tasks.map((task) => (
            <button
              key={task.id}
              onClick={() => onToggleTask(task.id, !task.completed)}
              className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl text-xs text-left transition-all ${
                task.completed
                  ? "bg-gain-subtle text-txt-muted line-through opacity-75 border border-gain/20"
                  : "bg-bg-surface-subtle hover:border-border text-txt-primary border border-border/40 hover:bg-bg-surface-hover"
              }`}
            >
              {task.completed ? (
                <div className="w-4 h-4 rounded-full bg-gain text-black flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              ) : (
                <Circle className="w-4 h-4 text-txt-muted shrink-0" />
              )}
              <span className="truncate">{task.title}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
