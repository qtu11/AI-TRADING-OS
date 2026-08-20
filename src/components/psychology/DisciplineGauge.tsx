"use client";

import React from "react";
import { DisciplineBreakdown } from "@/lib/math/discipline-score";
import { useLanguage } from "@/context/LanguageContext";
import { ShieldCheck, Award, AlertTriangle, ShieldAlert } from "lucide-react";

export interface DisciplineGaugeProps {
  breakdown: DisciplineBreakdown;
}

export const DisciplineGauge: React.FC<DisciplineGaugeProps> = ({ breakdown }) => {
  const { language } = useLanguage();
  const isVi = language === "vi";

  const getRatingBadge = () => {
    switch (breakdown.rating) {
      case "ELITE":
        return {
          label: isVi ? "Kỷ Luật Xuất Sắc (100% Tuân Thủ)" : "Elite Discipline (100% Rule Adherence)",
          color: "text-gain bg-gain-subtle border-gain/40",
          icon: <Award className="w-4 h-4 text-gain" />,
        };
      case "DISCIPLINED":
        return {
          label: isVi ? "Thực Thi Kỷ Luật Tốt" : "Disciplined Execution",
          color: "text-sky-400 bg-sky-500/15 border-sky-500/30",
          icon: <ShieldCheck className="w-4 h-4 text-sky-400" />,
        };
      case "INCONSISTENT":
        return {
          label: isVi ? "Chưa Nhất Quán — Có Vi Phạm Quy Tắc" : "Inconsistent — Rule Breaches Detected",
          color: "text-amber-400 bg-amber-500/15 border-amber-500/30",
          icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
        };
      default:
        return {
          label: isVi ? "Giao Dịch Bừa Bãi — Vi Phạm Nghiêm Trọng" : "Reckless Trading — Severe Rule Breaches",
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
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
        <span className="text-xs font-bold text-txt-primary uppercase tracking-wider font-mono">
          {isVi ? "Điểm Kỷ Luật Ngày Xác Thực Toán Học" : "Deterministic Daily Discipline Score"}
        </span>
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badge.color}`}>
          {badge.icon}
          <span>{badge.label}</span>
        </div>
      </div>

      {/* Score bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs font-mono">
          <span className="text-txt-muted">{isVi ? "Điểm Thực Thi" : "Execution Score"}</span>
          <span className="font-bold text-txt-primary text-sm">{breakdown.totalScore} / 100 {isVi ? "điểm" : "pts"}</span>
        </div>
        <div className="w-full h-3 bg-bg-surface-subtle rounded-full overflow-hidden p-0.5 border border-border/60">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              breakdown.totalScore >= 80
                ? "bg-gradient-to-r from-sky-500 to-gain"
                : breakdown.totalScore >= 60
                ? "bg-gradient-to-r from-amber-500 to-sky-500"
                : "bg-loss"
            }`}
            style={{ width: `${breakdown.totalScore}%` }}
          />
        </div>
      </div>

      {/* Point breakdown matrix */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-xs font-mono">
        <div className="bg-bg-surface-subtle p-2.5 rounded-xl border border-border/60">
          <span className="text-[10px] text-txt-muted block uppercase font-medium">{isVi ? "Kế Hoạch" : "Plan"}</span>
          <span className="text-txt-primary font-bold">{breakdown.planAdherencePoints}/30</span>
        </div>
        <div className="bg-bg-surface-subtle p-2.5 rounded-xl border border-border/60">
          <span className="text-[10px] text-txt-muted block uppercase font-medium">{isVi ? "Quy Tắc SL" : "SL Rule"}</span>
          <span className="text-txt-primary font-bold">{breakdown.stopLossDisciplinePoints}/15</span>
        </div>
        <div className="bg-bg-surface-subtle p-2.5 rounded-xl border border-border/60">
          <span className="text-[10px] text-txt-muted block uppercase font-medium">{isVi ? "Điểm Thoát" : "Exit Rule"}</span>
          <span className="text-txt-primary font-bold">{breakdown.exitDisciplinePoints}/10</span>
        </div>
        <div className="bg-bg-surface-subtle p-2.5 rounded-xl border border-border/60">
          <span className="text-[10px] text-txt-muted block uppercase font-medium">{isVi ? "Không Quá Số Lệnh" : "No Overtrade"}</span>
          <span className="text-txt-primary font-bold">{breakdown.overtradeDisciplinePoints}/15</span>
        </div>
        <div className="bg-bg-surface-subtle p-2.5 rounded-xl border border-border/60">
          <span className="text-[10px] text-txt-muted block uppercase font-medium">{isVi ? "Không Trả Thù" : "No Revenge"}</span>
          <span className="text-txt-primary font-bold">{breakdown.revengeTradeDisciplinePoints}/15</span>
        </div>
        <div className="bg-bg-surface-subtle p-2.5 rounded-xl border border-border/60">
          <span className="text-[10px] text-txt-muted block uppercase font-medium">{isVi ? "Cảm Xúc" : "Emotions"}</span>
          <span className="text-txt-primary font-bold">{breakdown.emotionalControlPoints}/15</span>
        </div>
      </div>

      {/* Penalties Notice */}
      {breakdown.penalties?.length > 0 && (
        <div className="space-y-1.5 pt-2 border-t border-border/60 text-xs">
          <span className="text-[11px] font-bold text-loss block font-mono">{isVi ? "Điểm Trừ Đang Bị Phạt:" : "Active Penalties:"}</span>
          <ul className="list-disc list-inside text-txt-secondary space-y-0.5 font-mono text-[11px]">
            {breakdown.penalties.map((p, idx) => (
              <li key={idx}>{p}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default DisciplineGauge;
