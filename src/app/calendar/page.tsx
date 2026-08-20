"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { Trade } from "@/types/trade.types";
import { TradingPlan } from "@/types/plan.types";
import { subscribeToTrades, subscribeToActivePlan } from "@/lib/firebase/db-service";
import { TradingCalendar } from "@/components/calendar/TradingCalendar";
import { Calendar as CalendarIcon, Sparkles } from "lucide-react";

export default function CalendarPage() {
  const { userProfile } = useAuth();
  const { language } = useLanguage();
  const userId = userProfile?.id || "dev-trader-01";

  const isVi = language === "vi";

  const [trades, setTrades] = useState<Trade[]>([]);
  const [plan, setPlan] = useState<TradingPlan | null>(null);

  useEffect(() => {
    if (!userId) return;
    const unsubTrades = subscribeToTrades(userId, setTrades);
    const unsubPlan = subscribeToActivePlan(userId, setPlan);

    return () => {
      if (unsubTrades) unsubTrades();
      if (unsubPlan) unsubPlan();
    };
  }, [userId]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="p-5 rounded-2xl bg-bg-surface border border-border shadow-sm">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-txt-primary flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-brand-500/15 text-brand-500 border border-brand-500/30">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <span>{isVi ? "Lịch Giao Dịch & Ma Trận Không Gian Làm Việc" : "Trading Calendar & Daily Workspace Matrix"}</span>
        </h1>
        <p className="text-xs text-txt-secondary mt-1 font-mono">
          {isVi
            ? "Bấm vào bất kỳ ngày giao dịch nào để xem ghi chú pre-market, lịch sử lệnh và nhận xét hàng ngày từ AI."
            : "Click any trading day to view pre-market notes, linked trade records, and automated AI daily reviews."}
        </p>
      </div>

      {/* Calendar Matrix View */}
      <TradingCalendar trades={trades} plan={plan} />
    </div>
  );
}
