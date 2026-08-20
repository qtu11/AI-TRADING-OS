"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Bot, AlertCircle, RefreshCw, ShieldCheck, ArrowRight } from "lucide-react";
import { AIBriefingResponse } from "@/types/ai.types";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

export interface AIBriefingCardProps {
  onOpenCopilot?: () => void;
}

export const AIBriefingCard: React.FC<AIBriefingCardProps> = ({ onOpenCopilot }) => {
  const { userProfile } = useAuth();
  const { language, t } = useLanguage();
  const [briefing, setBriefing] = useState<AIBriefingResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const isVi = language === "vi";

  const fetchBriefing = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/daily-briefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userProfile?.id || "dev-trader-01" }),
      });
      if (res.ok) {
        const data = await res.json();
        setBriefing(data);
      }
    } catch (err) {
      console.warn("Could not load AI briefing:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBriefing();
  }, [userProfile?.id]);

  return (
    <div className="bento-card p-5 sm:p-6 space-y-4 relative overflow-hidden flex flex-col justify-between transition-all">
      {/* Ambient Top Glow Line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-sky-400/50 to-transparent" />

      {/* Background Radial Glow */}
      <div className="absolute -top-12 -right-12 w-36 h-36 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />

      <div>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 via-sky-500 to-teal-400 text-white shadow-md shadow-sky-500/20">
              <Bot className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-txt-primary">
              {isVi ? "Tóm Tắt Chiến Lược & Cố Vấn Kỷ Luật AI" : "AI Daily Briefing & Discipline Guard"}
            </h3>
          </div>

          <button
            onClick={fetchBriefing}
            disabled={loading}
            className="text-txt-muted hover:text-txt-primary p-1.5 rounded-lg hover:bg-bg-surface-hover transition-colors"
            title={isVi ? "Làm mới phân tích AI" : "Refresh AI briefing"}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-sky-400" : ""}`} />
          </button>
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="py-8 text-center space-y-2">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-sky-400" />
            <p className="text-xs text-txt-muted font-mono">
              {isVi ? "Đang tổng hợp dữ liệu giao dịch & kỷ luật..." : "Synthesizing trading plan & behavioral data..."}
            </p>
          </div>
        ) : briefing ? (
          <div className="space-y-3.5 mt-3">
            <p className="text-xs text-txt-primary leading-relaxed font-sans">
              {briefing.summary}
            </p>

            {/* Focus Points List */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-sky-400 block">
                {isVi ? "Chỉ Dẫn Hành Động Hôm Nay:" : "Today's Core Directives:"}
              </span>
              {briefing.focusPoints?.map((point, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-txt-secondary">
                  <span className="text-sky-400 font-mono font-bold mt-0.5">•</span>
                  <span>{point}</span>
                </div>
              ))}
            </div>

            {/* Confidence & Evidence Footer */}
            <div className="pt-2.5 border-t border-border/60 flex items-center justify-between text-[11px] font-mono text-txt-muted">
              <span className="flex items-center gap-1.5 text-sky-400 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                {isVi ? "Độ Tin Cậy" : "Confidence"}: {briefing.confidenceScore}%
              </span>
              <span>
                {isVi
                  ? `Dựa trên ${briefing.evidenceSampleTrades} lệnh gần nhất`
                  : `Based on ${briefing.evidenceSampleTrades} recent trades`}
              </span>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center space-y-2">
            <AlertCircle className="w-6 h-6 text-txt-muted mx-auto" />
            <p className="text-xs text-txt-muted">
              {isVi
                ? "Cố vấn AI đã sẵn sàng. Ghi nhận thêm lệnh hoặc kết nối MT5 để nhận chỉ dẫn chi tiết."
                : "AI analysis is initialized and ready. Connect your plan or log trades to trigger daily directives."}
            </p>
          </div>
        )}
      </div>

      {onOpenCopilot && (
        <button
          onClick={onOpenCopilot}
          className="w-full mt-3 py-2.5 px-3 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center justify-center gap-2 border border-sky-500/30 transition-all shadow-sm active:scale-[0.99]"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isVi ? "Hỏi Cố Vấn AI Copilot (Cmd+J)" : t("btn_ask_ai")}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
