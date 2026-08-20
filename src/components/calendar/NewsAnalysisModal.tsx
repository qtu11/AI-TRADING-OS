"use client";

import React from "react";
import { useLanguage } from "@/context/LanguageContext";
import { soundFX } from "@/lib/sound/sound-effects";
import {
  X,
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ShieldAlert,
  Clock,
  Zap,
  Activity,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";

export interface AINewsAnalysisData {
  eventTitle: string;
  currency: string;
  impactLevel: "EXTREME" | "HIGH" | "MODERATE" | "LOW";
  economicEssence: string;
  bullishScenario: {
    condition: string;
    marketReaction: string;
    affectedAssets: string[];
  };
  bearishScenario: {
    condition: string;
    marketReaction: string;
    affectedAssets: string[];
  };
  expectedVolatilityPips: string;
  actionableDirectives: string[];
  dangerTimeWindow: string;
  tradingRecommendation: "AVOID_TRADING" | "REDUCE_LOT_SIZE" | "WAIT_FOR_REACTION" | "NORMAL_RISK";
  confidenceScore: number;
}

export interface NewsAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: AINewsAnalysisData | null;
  loading: boolean;
  eventTitle: string;
  currency: string;
  impact: string;
  forecast?: string;
  previous?: string;
  actual?: string;
  time?: string;
}

export const NewsAnalysisModal: React.FC<NewsAnalysisModalProps> = ({
  isOpen,
  onClose,
  analysis,
  loading,
  eventTitle,
  currency,
  impact,
  forecast,
  previous,
  actual,
  time,
}) => {
  const { language } = useLanguage();
  const isVi = language === "vi";

  if (!isOpen) return null;

  const getRecommendationBadge = (rec: string) => {
    switch (rec) {
      case "AVOID_TRADING":
        return {
          bg: "bg-loss-subtle text-loss border-loss/40",
          text: isVi ? "CẤM GIAO DỊCH TRƯỚC TIN" : "AVOID PRE-NEWS TRADING",
        };
      case "WAIT_FOR_REACTION":
        return {
          bg: "bg-amber-500/15 text-amber-400 border-amber-500/40",
          text: isVi ? "CHỜ NẾN 15M ĐÓNG CỬA" : "WAIT FOR 15M CANDLE CONFIRMATION",
        };
      case "REDUCE_LOT_SIZE":
        return {
          bg: "bg-sky-500/15 text-sky-400 border-sky-500/40",
          text: isVi ? "HẠ 50% KHỐI LƯỢNG LỆNH" : "REDUCE LOT SIZE BY 50%",
        };
      default:
        return {
          bg: "bg-gain-subtle text-gain border-gain/40",
          text: isVi ? "RỦI RO BÌNH THƯỜNG" : "NORMAL RISK EXECUTION",
        };
    }
  };

  const badge = analysis ? getRecommendationBadge(analysis.tradingRecommendation) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-bg-surface border border-border shadow-2xl overflow-hidden font-sans">
        {/* Glow Header Border */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 via-sky-400 to-amber-500" />

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border/60 bg-bg-surface-subtle/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-brand-500/15 text-brand-500 border border-brand-500/30">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-bg-surface border border-border text-txt-primary">
                  {currency}
                </span>
                <span
                  className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md uppercase ${
                    impact === "High"
                      ? "bg-loss-subtle text-loss border border-loss/30"
                      : impact === "Medium"
                      ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                      : "bg-gain-subtle text-gain border border-gain/30"
                  }`}
                >
                  {impact} Impact
                </span>
                {time && (
                  <span className="text-xs font-mono text-txt-secondary flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {time}
                  </span>
                )}
              </div>
              <h2 className="text-lg font-bold text-txt-primary mt-1 font-mono">{eventTitle}</h2>
            </div>
          </div>

          <button
            onClick={() => {
              soundFX.playClick();
              onClose();
            }}
            className="p-2 rounded-xl text-txt-muted hover:text-txt-primary hover:bg-bg-surface border border-transparent hover:border-border transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 no-scrollbar">
          {/* Key Figures Snapshot */}
          <div className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-bg-surface-subtle border border-border/60 text-center font-mono">
            <div>
              <div className="text-[11px] text-txt-muted uppercase font-bold">{isVi ? "Kỳ Trước" : "Previous"}</div>
              <div className="text-sm font-bold text-txt-secondary mt-0.5">{previous || "—"}</div>
            </div>
            <div>
              <div className="text-[11px] text-txt-muted uppercase font-bold">{isVi ? "Dự Báo" : "Forecast"}</div>
              <div className="text-sm font-bold text-sky-400 mt-0.5">{forecast || "—"}</div>
            </div>
            <div>
              <div className="text-[11px] text-txt-muted uppercase font-bold">{isVi ? "Thực Tế" : "Actual"}</div>
              <div className="text-sm font-bold text-txt-primary mt-0.5">{actual || (isVi ? "Đang chờ" : "Pending")}</div>
            </div>
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3 text-txt-secondary">
              <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
              <p className="text-xs font-mono">
                {isVi ? "AI đang phân tích tác động vĩ mô & mô phỏng kịch bản..." : "AI is crunching macroeconomic impact & scenario models..."}
              </p>
            </div>
          ) : analysis ? (
            <>
              {/* Directive Recommendation Badge */}
              {badge && (
                <div className={`p-4 rounded-2xl border flex items-center justify-between ${badge.bg}`}>
                  <div className="flex items-center gap-2.5">
                    <ShieldAlert className="w-5 h-5 flex-shrink-0" />
                    <div>
                      <div className="text-xs font-mono font-bold uppercase tracking-wider">{badge.text}</div>
                      <div className="text-[11px] opacity-85 mt-0.5">
                        {isVi ? "Khung giờ nguy hiểm:" : "Danger window:"} {analysis.dangerTimeWindow}
                      </div>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-[10px] uppercase opacity-75">{isVi ? "Biến động dự kiến" : "Expected move"}</span>
                    <div className="text-sm font-bold">{analysis.expectedVolatilityPips}</div>
                  </div>
                </div>
              )}

              {/* Economic Essence */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-txt-primary uppercase font-mono tracking-wider">
                  <Activity className="w-4 h-4 text-brand-500" />
                  <span>{isVi ? "Bản Chất & Ý Nghĩa Kinh Tế" : "Economic Essence"}</span>
                </div>
                <p className="text-xs text-txt-secondary leading-relaxed p-3.5 rounded-2xl bg-bg-surface-subtle border border-border/50">
                  {analysis.economicEssence}
                </p>
              </div>

              {/* Scenarios Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Bullish Scenario */}
                <div className="p-4 rounded-2xl bg-gain-subtle/50 border border-gain/30 space-y-2">
                  <div className="flex items-center gap-2 text-gain font-mono font-bold text-xs">
                    <TrendingUp className="w-4 h-4" />
                    <span>{isVi ? "Kịch Bản 1: Thực Tế > Dự Báo" : "Scenario 1: Actual > Forecast"}</span>
                  </div>
                  <p className="text-xs text-txt-secondary">{analysis.bullishScenario.marketReaction}</p>
                  <div className="pt-1">
                    <div className="text-[10px] font-mono text-txt-muted uppercase font-bold">{isVi ? "Tài sản bị ảnh hưởng:" : "Affected assets:"}</div>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {analysis.bullishScenario.affectedAssets.map((asset, idx) => (
                        <span key={idx} className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-gain/10 text-gain font-bold border border-gain/20">
                          {asset}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bearish Scenario */}
                <div className="p-4 rounded-2xl bg-loss-subtle/50 border border-loss/30 space-y-2">
                  <div className="flex items-center gap-2 text-loss font-mono font-bold text-xs">
                    <TrendingDown className="w-4 h-4" />
                    <span>{isVi ? "Kịch Bản 2: Thực Tế < Dự Báo" : "Scenario 2: Actual < Forecast"}</span>
                  </div>
                  <p className="text-xs text-txt-secondary">{analysis.bearishScenario.marketReaction}</p>
                  <div className="pt-1">
                    <div className="text-[10px] font-mono text-txt-muted uppercase font-bold">{isVi ? "Tài sản bị ảnh hưởng:" : "Affected assets:"}</div>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {analysis.bearishScenario.affectedAssets.map((asset, idx) => (
                        <span key={idx} className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-loss/10 text-loss font-bold border border-loss/20">
                          {asset}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actionable Directives */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-txt-primary uppercase font-mono tracking-wider">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>{isVi ? "Chỉ Thị Giao Dịch & Quản Trị Rủi Ro Của AI" : "AI Actionable Risk Directives"}</span>
                </div>
                <div className="space-y-1.5">
                  {analysis.actionableDirectives.map((dir, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-bg-surface-subtle border border-border/40 text-xs text-txt-secondary">
                      <CheckCircle2 className="w-4 h-4 text-brand-500 mt-0.5 flex-shrink-0" />
                      <span>{dir}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-xs text-txt-muted font-mono">
              {isVi ? "Không có dữ liệu phân tích." : "No analysis data available."}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/60 bg-bg-surface-subtle/50 flex items-center justify-between font-mono text-xs text-txt-muted">
          <span>{isVi ? "Độ tin cậy mô hình:" : "Confidence score:"} {analysis?.confidenceScore || 90}%</span>
          <button
            onClick={() => {
              soundFX.playClick();
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold transition-all cursor-pointer shadow-sm active:scale-95"
          >
            {isVi ? "Đã Hiểu & Đóng" : "Got It, Close"}
          </button>
        </div>
      </div>
    </div>
  );
};
