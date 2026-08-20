"use client";

import React from "react";
import { PlanFeasibilityResult } from "@/lib/math/plan-engine";
import { formatCurrency, formatPercent } from "@/lib/utils/currency";
import { useLanguage } from "@/context/LanguageContext";
import { ShieldCheck, AlertTriangle, ShieldAlert, Sparkles } from "lucide-react";

export interface RealismGaugeProps {
  feasibility: PlanFeasibilityResult;
  startingCapital: number;
  targetProfit: number;
}

export const RealismGauge: React.FC<RealismGaugeProps> = ({
  feasibility,
  startingCapital,
  targetProfit,
}) => {
  const { language } = useLanguage();
  const isVi = language === "vi";

  const getRatingBadge = () => {
    switch (feasibility.feasibilityRating) {
      case "VERY_REALISTIC":
        return {
          label: isVi ? "Rất Thực Tế & Khả Thi Cao" : "Highly Feasible & Realistic",
          color: "text-gain bg-gain-subtle border-gain/40",
          icon: <ShieldCheck className="w-4 h-4 text-gain" />,
        };
      case "REALISTIC":
        return {
          label: isVi ? "Cân Bằng & Khả Thi" : "Balanced & Achievable",
          color: "text-sky-400 bg-sky-500/15 border-sky-500/30",
          icon: <ShieldCheck className="w-4 h-4 text-sky-400" />,
        };
      case "AGGRESSIVE":
        return {
          label: isVi ? "Tấn Công — Rủi Ro Sụt Giảm Cao" : "Aggressive — Elevated Drawdown Risk",
          color: "text-amber-400 bg-amber-500/15 border-amber-500/30",
          icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
        };
      default:
        return {
          label: isVi ? "Kỳ Vọng Quá Cao — Nguy Cơ Cháy Tài Khoản" : "Unrealistic Expectation — High Risk of Ruin",
          color: "text-loss bg-loss-subtle border-loss/40",
          icon: <ShieldAlert className="w-4 h-4 text-loss" />,
        };
    }
  };

  const badge = getRatingBadge();

  return (
    <div className="bento-card p-5 sm:p-6 space-y-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-brand-500/50 to-transparent" />
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <span className="text-xs font-bold text-txt-primary uppercase tracking-wider font-mono">
          {isVi ? "Kiểm Tra Tính Thực Tế Toán Học & Khả Thi" : "Mathematical Realism & Feasibility Check"}
        </span>
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badge.color}`}>
          {badge.icon}
          <span>{badge.label}</span>
        </div>
      </div>

      {/* Progress Bar & Feasibility Score */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs font-mono">
          <span className="text-txt-muted">{isVi ? "Điểm Khả Thi Kế Hoạch" : "Plan Feasibility Score"}</span>
          <span className="font-bold text-txt-primary text-sm">{feasibility.feasibilityScore}/100</span>
        </div>
        <div className="w-full h-3 bg-bg-surface-subtle rounded-full overflow-hidden p-0.5 border border-border/60">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              feasibility.feasibilityScore >= 75
                ? "bg-gradient-to-r from-sky-500 to-gain"
                : feasibility.feasibilityScore >= 50
                ? "bg-gradient-to-r from-amber-500 to-sky-500"
                : "bg-loss"
            }`}
            style={{ width: `${feasibility.feasibilityScore}%` }}
          />
        </div>
      </div>

      {/* Math Metrics Matrix */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
        <div className="bg-bg-surface-subtle p-3 rounded-xl border border-border/60">
          <span className="text-[10px] text-txt-muted block uppercase font-medium">{isVi ? "Lợi Nhuận Tháng Yêu Cầu" : "Req. Monthly Return"}</span>
          <span className="text-txt-primary font-bold text-sm mt-0.5 block">
            +{feasibility.requiredMonthlyReturnPercent}%
          </span>
        </div>

        <div className="bg-bg-surface-subtle p-3 rounded-xl border border-border/60">
          <span className="text-[10px] text-txt-muted block uppercase font-medium">{isVi ? "Mục Tiêu Ngày Yêu Cầu" : "Req. Daily Target"}</span>
          <span className="text-txt-primary font-bold text-sm mt-0.5 block">
            {formatCurrency(feasibility.requiredDailyReturnDollars)}
          </span>
        </div>

        <div className="bg-bg-surface-subtle p-3 rounded-xl border border-border/60">
          <span className="text-[10px] text-txt-muted block uppercase font-medium">{isVi ? "Nguy Cơ Cháy Vốn" : "Risk of Ruin"}</span>
          <span className={`font-bold text-sm mt-0.5 block ${feasibility.riskOfRuinPercent > 10 ? "text-loss" : "text-gain"}`}>
            {feasibility.riskOfRuinPercent}%
          </span>
        </div>

        <div className="bg-bg-surface-subtle p-3 rounded-xl border border-border/60">
          <span className="text-[10px] text-txt-muted block uppercase font-medium">{isVi ? "Sụt Giảm Vốn Tối Đa Dự Kiến" : "Expected Max DD"}</span>
          <span className="text-amber-400 font-bold text-sm mt-0.5 block">
            -{feasibility.maxDrawdownProjectedPercent}%
          </span>
        </div>
      </div>

      {/* Recommendation note */}
      {feasibility.recommendedAdjustment && (
        <div className="p-3.5 rounded-xl bg-bg-surface-subtle border border-sky-500/30 text-xs text-sky-400 flex items-start gap-2 font-mono">
          <Sparkles className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
          <span>{feasibility.recommendedAdjustment}</span>
        </div>
      )}
    </div>
  );
};
