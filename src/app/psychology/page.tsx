"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { PsychologyEntry } from "@/types/psychology.types";
import { Trade } from "@/types/trade.types";
import {
  getPsychologyEntries,
  savePsychologyEntry,
  getUserTrades,
} from "@/lib/firebase/db-service";
import { EmotionTracker } from "@/components/psychology/EmotionTracker";
import { PsychologyInsights } from "@/components/psychology/PsychologyInsights";
import { Brain, Sparkles, CheckCircle2 } from "lucide-react";

export default function PsychologyPage() {
  const { userProfile } = useAuth();
  const { language, t } = useLanguage();
  const userId = userProfile?.id || "dev-trader-01";

  const isVi = language === "vi";

  const [entries, setEntries] = useState<PsychologyEntry[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [psychList, tradeList] = await Promise.all([
        getPsychologyEntries(userId),
        getUserTrades(userId),
      ]);
      setEntries(psychList);
      setTrades(tradeList);
    } catch (err) {
      console.warn("Error loading psychology entries:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) loadData();
  }, [userId]);

  const handleSaveEntry = async (entry: PsychologyEntry) => {
    await savePsychologyEntry(entry);
    await loadData();
  };

  const todayEntry = entries.length > 0 ? entries[0] : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-bg-surface border border-border shadow-sm">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-txt-primary flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-brand-500/15 text-brand-500 border border-brand-500/30">
            <Brain className="w-5 h-5" />
          </div>
          <span>{isVi ? "Tâm Lý Giao Dịch & Theo Dõi Kỷ Luật" : "Trading Psychology & Discipline Habit Tracker"}</span>
        </h1>
        <p className="text-xs text-txt-secondary mt-1 font-mono">
          {isVi
            ? "Giám sát trạng thái cảm xúc (FOMO, Tham lam, Sợ hãi), thực thi quy tắc kỷ luật và ngăn chặn trả thù thị trường."
            : "Monitor emotional states (FOMO, Greed, Fear), enforce deterministic discipline rules, and prevent revenge trading."}
        </p>
      </div>

      {/* Psychology Correlation Insights */}
      <PsychologyInsights trades={trades} entries={entries} />

      {/* Main Emotion & Discipline Tracker Form */}
      <EmotionTracker
        initialEntry={todayEntry}
        onSave={handleSaveEntry}
        userId={userId}
      />
    </div>
  );
}
