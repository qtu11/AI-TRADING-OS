"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { TradingPlan } from "@/types/plan.types";
import { subscribeToActivePlan } from "@/lib/firebase/db-service";
import { PositionCalculator } from "@/components/risk/PositionCalculator";
import { ShieldCheck, AlertTriangle, ShieldAlert, Sliders } from "lucide-react";
import { formatCurrency, formatPercent } from "@/lib/utils/currency";

export default function RiskManagerPage() {
  const { userProfile } = useAuth();
  const { language, t } = useLanguage();
  const userId = userProfile?.id || "dev-trader-01";
  const startingCapital = userProfile?.startingCapital ?? 0;

  const isVi = language === "vi";

  const [plan, setPlan] = useState<TradingPlan | null>(null);

  useEffect(() => {
    if (!userId) return;
    const unsub = subscribeToActivePlan(userId, setPlan);
    return () => {
      if (unsub) unsub();
    };
  }, [userId]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-bg-surface border border-border shadow-sm">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-txt-primary flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-brand-500/15 text-brand-500 border border-brand-500/30">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <span>{isVi ? "Quản Lý Rủi Ro & Động Cơ Tính Size Lệnh" : "Risk Management & Position Sizing Engine"}</span>
        </h1>
        <p className="text-xs text-txt-secondary mt-1 font-mono">
          {isVi
            ? "Tính toán khối lượng lot chuẩn xác, theo dõi ngưỡng bảo vệ vốn và kiểm soát thua lỗ hàng ngày."
            : "Calculate deterministic position sizes, monitor active loss guards, and protect trading capital."}
        </p>
      </div>

      {/* Active Risk Guard Overview Card */}
      <div className="bento-card p-5 sm:p-6 space-y-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-brand-500/50 to-transparent" />
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <span className="text-xs font-bold text-txt-primary uppercase tracking-wider font-mono">
            {isVi ? "Ngưỡng Bảo Vệ Rủi Ro Đang Hoạt Động" : "Active Risk Guard Thresholds"}
          </span>
          <span className="text-xs font-mono px-3 py-1 rounded-full bg-gain-subtle text-gain border border-gain/40 font-bold">
            {isVi ? "Bảo Vệ Đang Bật" : "System Guard Active"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
          <div className="bg-bg-surface-subtle p-3.5 rounded-xl border border-border/60">
            <span className="text-[10px] text-txt-muted block uppercase font-medium">
              {isVi ? "Rủi Ro Tối Đa / Lệnh" : "Max Risk per Trade"}
            </span>
            <span className="text-base font-bold text-amber-400 mt-1 block">
              {formatPercent(plan?.riskPerTradePercent || 0.5, 2)} ({formatCurrency((startingCapital * (plan?.riskPerTradePercent || 0.5)) / 100)})
            </span>
          </div>

          <div className="bg-bg-surface-subtle p-3.5 rounded-xl border border-border/60">
            <span className="text-[10px] text-txt-muted block uppercase font-medium">
              {isVi ? "Giới Hạn Lỗ Tối Đa / Ngày" : "Daily Max Loss Limit"}
            </span>
            <span className="text-base font-bold text-loss mt-1 block">
              {formatPercent(plan?.maxDailyLossPercent || 1.5, 1)} ({formatCurrency((startingCapital * (plan?.maxDailyLossPercent || 1.5)) / 100)})
            </span>
          </div>

          <div className="bg-bg-surface-subtle p-3.5 rounded-xl border border-border/60">
            <span className="text-[10px] text-txt-muted block uppercase font-medium">
              {isVi ? "Số Lệnh Tối Đa / Ngày" : "Max Trades / Day"}
            </span>
            <span className="text-base font-bold text-txt-primary mt-1 block">
              {plan?.maxTradesPerDay || 3} {isVi ? "Lệnh Tối Đa" : "Trades Max"}
            </span>
          </div>
        </div>
      </div>

      {/* Position Sizer Calculator Component */}
      <PositionCalculator initialBalance={startingCapital} />
    </div>
  );
}
