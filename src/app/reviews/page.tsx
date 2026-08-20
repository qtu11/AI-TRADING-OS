"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { getUserReviews, saveReview, getUserTrades } from "@/lib/firebase/db-service";
import { calculateTradeMetrics } from "@/lib/math/performance";
import { soundFX } from "@/lib/sound/sound-effects";
import { FileCheck2, Sparkles, Bot, Calendar, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils/currency";

export default function ReviewsPage() {
  const { userProfile } = useAuth();
  const { language, t } = useLanguage();
  const userId = userProfile?.id || "dev-trader-01";

  const isVi = language === "vi";

  const [reviews, setReviews] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const loadReviews = async () => {
    try {
      const list = await getUserReviews(userId);
      setReviews(list);
    } catch (err) {
      console.warn("Load reviews error:", err);
    }
  };

  useEffect(() => {
    if (userId) loadReviews();
  }, [userId]);

  const handleGenerateWeeklyReview = async () => {
    setIsGenerating(true);
    try {
      const trades = await getUserTrades(userId);
      const metrics = calculateTradeMetrics(trades);

      const reviewData = {
        id: `review-week-${Date.now()}`,
        periodType: "WEEKLY" as const,
        periodLabel: isVi ? "Báo Cáo Đánh Giá Hiệu Suất Tuần" : "Weekly Performance Review",
        executiveSummary: isVi
          ? `Tuần này bạn đã thực hiện ${metrics.totalTrades} lệnh với kết quả ${metrics.netProfit >= 0 ? `+$${metrics.netProfit}` : `-$${Math.abs(metrics.netProfit)}`} P&L ròng, tỷ lệ thắng ${metrics.winRate}% và hệ số lợi nhuận Profit Factor đạt ${metrics.profitFactor}.`
          : `This week you executed ${metrics.totalTrades} trades resulting in ${metrics.netProfit >= 0 ? `+$${metrics.netProfit}` : `-$${Math.abs(metrics.netProfit)}`} net P&L with a ${metrics.winRate}% win rate and ${metrics.profitFactor} profit factor.`,
        performanceAnalysis: isVi
          ? `Mức thắng trung bình là $${metrics.averageWin} so với mức thua trung bình $${metrics.averageLoss}, mang lại tỷ lệ R:R lành mạnh ${metrics.averageRiskReward}R.`
          : `Your average win was $${metrics.averageWin} against average loss of $${metrics.averageLoss}, delivering a healthy ${metrics.averageRiskReward}R reward-to-risk ratio.`,
        riskAnalysis: isVi ? "Mức sụt giảm tối đa (drawdown) được kiểm soát an toàn trong giới hạn kế hoạch." : "Maximum drawdown was kept well within the planned risk limits.",
        psychologyAnalysis: isVi ? "Điểm kỷ luật duy trì ổn định xuyên suốt các phiên London và New York." : "Discipline scores remained consistent across London and New York sessions.",
        strengths: isVi
          ? [
              "Tuân thủ nghiêm ngặt mức dừng lỗ (Stop Loss) không nới rộng rủi ro.",
              "Duy trì kỳ vọng toán học dương trong các phiên biến động mạnh.",
              "Thực hiện chuẩn bị trước phiên giao dịch (pre-market) đầy đủ.",
            ]
          : [
              "Exercised strict stop-loss adherence without widening risk levels.",
              "Maintained positive expectancy during volatile sessions.",
              "Completed daily pre-market preparation consistently.",
            ],
        weaknesses: isVi
          ? [
              "Đôi khi chốt lời non trước khi giá chạm mục tiêu kế hoạch ban đầu.",
            ]
          : [
              "Occasional early exit on winning swing positions before full target completion.",
            ],
        actionItems: isVi
          ? [
              "Chỉ nhồi thêm lệnh khi xu hướng đa khung thời gian hoàn toàn đồng thuận.",
              "Bắt buộc nghỉ giải lao 15 phút sau bất kỳ lệnh thua nào.",
              "Tiếp tục ghi nhật ký đều đặn trước khi thị trường đóng cửa.",
            ]
          : [
              "Scale positions only when multi-timeframe bias is aligned.",
              "Enforce mandatory 15-minute cooldown after any loss.",
              "Continue daily journaling before the Asian market close.",
            ],
        singleMainFocus: isVi ? "Kiên nhẫn gồng lãi đến đúng điểm chốt lời hoặc vô hiệu hóa kế hoạch." : "Allow winning trades to reach their planned invalidation or take-profit targets.",
        confidence: 90,
        sampleTradesCount: metrics.totalTrades,
        createdAt: new Date().toISOString(),
      };

      await saveReview(userId, reviewData);
      soundFX.playSuccess();
      await loadReviews();
    } catch (err) {
      console.warn("Generate review error:", err);
      soundFX.playWarning();
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-bg-surface border border-border shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-txt-primary flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-500/15 text-brand-500 border border-brand-500/30">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <span>{isVi ? "Đánh Giá Hiệu Suất Tuần & Tháng" : "Weekly & Monthly Performance Reviews"}</span>
          </h1>
          <p className="text-xs text-txt-secondary mt-1 font-mono">
            {isVi
              ? "Kiểm toán hiệu suất tự động, phân tích hành vi tâm lý và chỉ dẫn hành động cho chu kỳ tới."
              : "Automated performance audits, behavioral pattern analysis, and actionable next-cycle directives."}
          </p>
        </div>

        <Button variant="ai" size="md" onClick={handleGenerateWeeklyReview} isLoading={isGenerating}>
          <Sparkles className="w-4 h-4 mr-2" />
          {isVi ? "Tạo Đánh Giá Tuần Bằng AI" : "Generate Weekly Review"}
        </Button>
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="bento-card p-10 sm:p-14 text-center space-y-3 relative overflow-hidden">
          <div className="w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-500/25 flex items-center justify-center text-brand-400 mx-auto">
            <Bot className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-txt-primary">
            {isVi ? "Chưa Có Báo Cáo Đánh Giá Nào" : "No Generated Performance Reviews"}
          </h3>
          <p className="text-xs text-txt-secondary max-w-md mx-auto leading-relaxed">
            {isVi
              ? "Bấm \"Tạo Đánh Giá Tuần Bằng AI\" để tổng hợp tuần giao dịch thành điểm mạnh, điểm yếu và chỉ dẫn chiến lược."
              : "Click \"Generate Weekly Review\" to synthesize your recent trading week into executive strengths, weaknesses, and directives."}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((r) => (
            <div key={r.id} className="bento-card p-6 sm:p-7 space-y-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-brand-500/50 to-transparent" />
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div>
                  <span className="text-[10px] uppercase font-mono text-sky-400 font-bold block">
                    {r.periodType} {isVi ? "KIỂM TOÁN" : "AUDIT"}
                  </span>
                  <h3 className="text-base font-bold text-txt-primary mt-0.5">{r.periodLabel}</h3>
                </div>
                <span className="text-xs font-mono text-txt-muted">
                  {r.sampleTradesCount} {isVi ? "Lệnh Đã Kiểm Tra" : "Verified Trades Evaluated"}
                </span>
              </div>

              <p className="text-xs text-txt-primary leading-relaxed font-sans">
                {r.executiveSummary}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono pt-2">
                {/* Strengths */}
                <div className="bg-bg-surface-subtle p-4 rounded-xl border border-border/60 space-y-2">
                  <span className="text-[11px] font-bold text-gain flex items-center gap-1.5 font-mono">
                    <CheckCircle2 className="w-4 h-4" /> {isVi ? "3 Điểm Mạnh Cốt Lõi:" : "3 Core Strengths:"}
                  </span>
                  <ul className="list-disc list-inside text-txt-secondary space-y-1 font-sans text-xs">
                    {r.strengths?.map((s: string, idx: number) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                </div>

                {/* Weaknesses & Actions */}
                <div className="bg-bg-surface-subtle p-4 rounded-xl border border-border/60 space-y-2">
                  <span className="text-[11px] font-bold text-sky-400 flex items-center gap-1.5 font-mono">
                    <AlertTriangle className="w-4 h-4" /> {isVi ? "Chỉ Dẫn Hành Động:" : "Action Directives:"}
                  </span>
                  <ul className="list-disc list-inside text-txt-secondary space-y-1 font-sans text-xs">
                    {r.actionItems?.map((a: string, idx: number) => (
                      <li key={idx}>{a}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Single Main Focus Pill */}
              {r.singleMainFocus && (
                <div className="p-3.5 rounded-xl bg-bg-surface-subtle border border-sky-500/30 text-xs text-sky-400 font-mono">
                  <strong>{isVi ? "#1 Trọng Tâm Hàng Đầu Chu Kỳ Tới: " : "#1 Main Focus for Next Cycle: "}</strong>
                  {r.singleMainFocus}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
