"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { DailyJournal } from "@/types/journal.types";
import { Trade } from "@/types/trade.types";
import { DailyTask, TradingPlan } from "@/types/plan.types";
import { formatCurrency, formatDateTime } from "@/lib/utils/currency";
import { formatDateOnly } from "@/lib/utils/date";
import { getDailyJournal, saveDailyJournal, getDailyTasks, saveDailyTask, getAllJournals, getMilestoneJournal } from "@/lib/firebase/db-service";
import { calculateTradeMetrics } from "@/lib/math/performance";
import { useLanguage } from "@/context/LanguageContext";
import { soundFX } from "@/lib/sound/sound-effects";
import {
  Calendar,
  CheckCircle2,
  Circle,
  TrendingUp,
  Brain,
  Bot,
  Sparkles,
  RefreshCw,
  PlusCircle,
  BookOpen,
  Lightbulb,
  Target,
  TrendingDown,
  Award,
} from "lucide-react";

export interface DayDetailModalProps {
  dateStr: string | null;
  trades: Trade[];
  plan: TradingPlan | null;
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onOpenTradeModal?: () => void;
}

export const DayDetailModal: React.FC<DayDetailModalProps> = ({
  dateStr,
  trades,
  plan,
  isOpen,
  onClose,
  userId,
  onOpenTradeModal,
}) => {
  const { language } = useLanguage();
  const isVi = language === "vi";

  const [journal, setJournal] = useState<DailyJournal | null>(null);
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [activeTab, setActiveTab] = useState<"workspace" | "trades" | "psychology" | "ai" | "milestone">("workspace");
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [preMarketNotes, setPreMarketNotes] = useState("");
  const [postMarketReview, setPostMarketReview] = useState("");
  const [marketBias, setMarketBias] = useState<"BULLISH" | "BEARISH" | "NEUTRAL" | "RANGING">("BULLISH");
  const [milestoneContext, setMilestoneContext] = useState<any>(null);

  useEffect(() => {
    if (!dateStr || !userId) return;

    getDailyJournal(userId, dateStr).then((j) => {
      if (j) {
        setJournal(j);
        setPreMarketNotes(j.preMarketNotes || "");
        setPostMarketReview(j.postMarketReview || "");
        setMarketBias(j.marketBias || "BULLISH");
        // Load milestone context if exists
        if (j.milestoneContext) {
          setMilestoneContext(j.milestoneContext);
        }
      } else {
        setJournal(null);
        setPreMarketNotes("");
        setPostMarketReview("");
        setMilestoneContext(null);
      }
    });

    getDailyTasks(userId, dateStr).then(setTasks);
    
    // Also load all journals to find milestone context for this date
    getAllJournals(userId).then((journals) => {
      const dayJournal = journals.find(j => j.date === dateStr);
      if (dayJournal?.milestoneContext) {
        setMilestoneContext(dayJournal.milestoneContext);
      }
    });
  }, [dateStr, userId]);

  if (!dateStr) return null;

  const dayTrades = trades.filter((t) => {
    const tDate = t.closeTime ? t.closeTime.split("T")[0] : t.openTime.split("T")[0];
    return tDate === dateStr;
  });

  const dayMetrics = calculateTradeMetrics(dayTrades);

  const handleToggleTask = async (taskId: string, completed: boolean) => {
    soundFX.playClick();
    const updated = tasks.map((t) => (t.id === taskId ? { ...t, completed } : t));
    setTasks(updated);
    const targetTask = updated.find((t) => t.id === taskId);
    if (targetTask) {
      await saveDailyTask(userId, targetTask).catch(console.warn);
    }
  };

  const handleSaveJournal = async () => {
    const jData: DailyJournal = {
      id: dateStr,
      userId,
      date: dateStr,
      marketBias,
      marketCondition: "Active Session",
      primarySession: "London + NY",
      volatility: "NORMAL",
      importantNewsEvents: [],
      preMarketNotes,
      watchedLevels: "",
      invalidationCriteria: "",
      expectedScenarios: "",
      postMarketReview,
      lessonsLearned: "",
      chartScreenshotUrls: [],
      totalTrades: dayMetrics.totalTrades,
      winningTrades: dayMetrics.winningTrades,
      losingTrades: dayMetrics.losingTrades,
      breakevenTrades: dayMetrics.breakevenTrades,
      winRate: dayMetrics.winRate,
      netProfit: dayMetrics.netProfit,
      grossProfit: dayMetrics.grossProfit,
      grossLoss: dayMetrics.grossLoss,
      profitFactor: dayMetrics.profitFactor,
      averageRiskReward: dayMetrics.averageRiskReward,
      disciplineScore: 90,
      followedPlan: true,
      createdAt: journal?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveDailyJournal(jData);
    soundFX.playSuccess();
    setJournal(jData);
  };

  const handleGenerateAIDailyReview = async () => {
    setIsGeneratingAI(true);
    soundFX.playClick(750);
    try {
      const res = await fetch("/api/ai/analyze-journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          journal: {
            ...journal,
            date: dateStr,
            preMarketNotes,
            postMarketReview,
            trades: dayTrades,
          },
        }),
      });
      if (res.ok) {
        const review = await res.json();
        const updatedJournal: DailyJournal = {
          ...(journal || ({} as any)),
          id: dateStr,
          userId,
          date: dateStr,
          aiDailyReview: review,
          updatedAt: new Date().toISOString(),
        };
        await saveDailyJournal(updatedJournal);
        soundFX.playSuccess();
        setJournal(updatedJournal);
      }
    } catch (err) {
      console.warn("AI review request error:", err);
      soundFX.playWarning();
    } finally {
      setIsGeneratingAI(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isVi ? `Bàn Làm Việc Ngày — ${formatDateOnly(dateStr)}` : `Daily Workspace — ${formatDateOnly(dateStr)}`}
      description={isVi ? "Góc nhìn toàn diện: Chuẩn bị trước phiên, các lệnh thực thi, kiểm tra tâm lý và đánh giá AI." : "Holistic day view: Pre-market preparation, linked trade executions, psychology check, and AI review."}
      maxWidth="4xl"
    >
      <div className="space-y-5">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-border/60 pb-2 font-mono text-xs overflow-x-auto">
          {(["workspace", "trades", "psychology", "ai", "milestone"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                soundFX.playSwitch();
                setActiveTab(tab);
              }}
              className={`px-3 py-1.5 rounded-xl capitalize font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab
                  ? "bg-brand-500 text-white shadow-sm font-bold"
                  : "text-txt-muted hover:text-txt-primary"
              }`}
            >
              {tab === "workspace" 
                ? (isVi ? "📋 Kế Hoạch & Ghi Chú" : "📋 Daily Plan & Notes") 
                : tab === "trades" 
                ? (isVi ? `📊 Sổ Lệnh (${dayTrades.length})` : `📊 Trades (${dayTrades.length})`) 
                : tab === "psychology" 
                ? (isVi ? "🧠 Tâm Lý" : "🧠 Psychology") 
                : tab === "ai"
                ? (isVi ? "🤖 AI Tổng Kết" : "🤖 AI Review")
                : (isVi ? "🏆 Milestone" : "🏆 Milestone")
              }
            </button>
          ))}
        </div>

        {/* TAB 1: WORKSPACE */}
        {activeTab === "workspace" && (
          <div className="space-y-4">
            {/* Daily Performance KPI Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="bg-bg-surface-subtle p-3 rounded-xl border border-border/60">
                <span className="text-[10px] text-txt-muted block uppercase font-medium">{isVi ? "P&L Ròng Ngày" : "Day Net P&L"}</span>
                <span
                  className={`text-base font-bold mt-0.5 block ${
                    dayMetrics.netProfit > 0 ? "text-gain" : dayMetrics.netProfit < 0 ? "text-loss" : "text-txt-primary"
                  }`}
                >
                  {formatCurrency(dayMetrics.netProfit, "USD", true)}
                </span>
              </div>

              <div className="bg-bg-surface-subtle p-3 rounded-xl border border-border/60">
                <span className="text-[10px] text-txt-muted block uppercase font-medium">{isVi ? "Số Lệnh Thực Hiện" : "Trades Count"}</span>
                <span className="text-base font-bold text-txt-primary mt-0.5 block">
                  {dayMetrics.totalTrades} ({dayMetrics.winningTrades}W / {dayMetrics.losingTrades}L)
                </span>
              </div>

              <div className="bg-bg-surface-subtle p-3 rounded-xl border border-border/60">
                <span className="text-[10px] text-txt-muted block uppercase font-medium">{isVi ? "Tỷ Lệ Thắng" : "Win Rate"}</span>
                <span className="text-base font-bold text-txt-primary mt-0.5 block">
                  {dayMetrics.totalTrades > 0 ? `${dayMetrics.winRate}%` : "—"}
                </span>
              </div>

              <div className="bg-bg-surface-subtle p-3 rounded-xl border border-border/60">
                <span className="text-[10px] text-txt-muted block uppercase font-medium">{isVi ? "Hệ Số Lợi Nhuận" : "Profit Factor"}</span>
                <span className="text-base font-bold text-txt-primary mt-0.5 block">
                  {dayMetrics.totalTrades > 0 ? dayMetrics.profitFactor : "—"}
                </span>
              </div>
            </div>

            {/* Market Bias & Pre-market Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3 bg-bg-surface-subtle p-4 rounded-2xl border border-border/60">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-txt-primary uppercase tracking-wider font-mono">
                    {isVi ? "Chuẩn Bị Trước Phiên (Pre-Market)" : "Pre-Market Preparation"}
                  </span>
                  <div className="flex gap-1">
                    {(["BULLISH", "BEARISH", "RANGING"] as const).map((bias) => (
                      <button
                        key={bias}
                        type="button"
                        onClick={() => {
                          soundFX.playClick();
                          setMarketBias(bias);
                        }}
                        className={`text-[10px] px-2 py-0.5 rounded-lg font-mono font-bold transition-all cursor-pointer ${
                          marketBias === bias
                            ? bias === "BULLISH"
                              ? "bg-gain text-white"
                              : bias === "BEARISH"
                              ? "bg-loss text-white"
                              : "bg-sky-600 text-white"
                            : "bg-bg-surface text-txt-muted border border-border/60"
                        }`}
                      >
                        {bias}
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  rows={4}
                  value={preMarketNotes}
                  onChange={(e) => setPreMarketNotes(e.target.value)}
                  placeholder={isVi ? "Xu hướng chủ đạo? Các mức hỗ trợ/kháng cự quan trọng? Điều kiện vô hiệu hóa kế hoạch?" : "Pre-market bias? What key support/resistance levels are you watching? What invalidates your setup today?"}
                  className="w-full bg-bg-surface border border-border rounded-xl p-3 text-xs text-txt-primary placeholder-txt-muted focus:outline-none focus:border-brand-500 font-sans"
                />
              </div>

              {/* Tasks Checklist */}
              <div className="space-y-3 bg-bg-surface-subtle p-4 rounded-2xl border border-border/60">
                <span className="text-xs font-bold text-txt-primary uppercase tracking-wider font-mono block">
                  {isVi ? "Nhiệm Vụ Thực Thi Hàng Ngày" : "Daily Execution Tasks"}
                </span>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {tasks.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => handleToggleTask(t.id, !t.completed)}
                      className="w-full flex items-center gap-2 text-xs text-left p-2 rounded-lg hover:bg-bg-surface transition-colors cursor-pointer"
                    >
                      {t.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-gain shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-txt-muted shrink-0" />
                      )}
                      <span className={t.completed ? "line-through text-txt-muted" : "text-txt-primary font-sans"}>
                        {t.title}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Post Market Review */}
            <div className="space-y-2 bg-bg-surface-subtle p-4 rounded-2xl border border-border/60">
              <span className="text-xs font-bold text-txt-primary uppercase tracking-wider font-mono block">
                {isVi ? "Đánh Giá Cuối Ngày & Bài Học Rút Ra" : "End-of-Day Review & Lessons Learned"}
              </span>
              <textarea
                rows={3}
                value={postMarketReview}
                onChange={(e) => setPostMarketReview(e.target.value)}
                placeholder={isVi ? "Hôm nay bạn thực thi như thế nào? Có tuân thủ giới hạn rủi ro không? Bài học quan trọng nhất là gì?" : "How was your execution today? Did you follow your risk limits? What was your key takeaway?"}
                className="w-full bg-bg-surface border border-border rounded-xl p-3 text-xs text-txt-primary placeholder-txt-muted focus:outline-none focus:border-brand-500 font-sans"
              />
            </div>

            <div className="flex justify-end">
              <Button variant="primary" size="md" onClick={handleSaveJournal}>
                {isVi ? "Lưu Bàn Làm Việc Ngày" : "Save Daily Workspace"}
              </Button>
            </div>
          </div>
        )}

        {/* TAB 2: LINKED TRADES */}
        {activeTab === "trades" && (
          <div className="space-y-3">
            {dayTrades.length === 0 ? (
              <div className="py-8 text-center text-xs text-txt-muted border border-dashed border-border rounded-2xl">
                {isVi ? `Chưa có lệnh nào được ghi nhận cho ngày ${formatDateOnly(dateStr)}.` : `No trades logged for ${formatDateOnly(dateStr)}.`}
              </div>
            ) : (
              <div className="divide-y divide-border/60 border border-border rounded-2xl overflow-hidden">
                {dayTrades.map((trade) => (
                  <div key={trade.id} className="p-3 bg-bg-surface-subtle flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                          trade.direction === "BUY" ? "bg-gain-subtle text-gain border border-gain/30" : "bg-loss-subtle text-loss border border-loss/30"
                        }`}
                      >
                        {trade.direction}
                      </span>
                      <span className="font-bold text-txt-primary">{trade.symbol}</span>
                      <span className="text-txt-muted">({trade.lots} Lots)</span>
                      <span className="text-txt-muted">{trade.session}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-txt-muted">{trade.openPrice} → {trade.closePrice || (isVi ? "Đang mở" : "Open")}</span>
                      <span className={`font-bold ${Number(trade.netProfit ?? 0) >= 0 ? "text-gain" : "text-loss"}`}>
                        {formatCurrency(trade.netProfit, "USD", true)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PSYCHOLOGY */}
        {activeTab === "psychology" && (
          <div className="p-5 bg-bg-surface-subtle rounded-2xl border border-border/60 space-y-3 text-xs">
            <span className="font-bold text-txt-primary font-mono uppercase tracking-wider block">
              {isVi ? "Trạng Thái Tâm Lý & Kiểm Soát Kỷ Luật" : "Psychological State & Discipline"}
            </span>
            <p className="text-txt-secondary leading-relaxed font-sans">
              {isVi
                ? "Ghi nhận trạng thái tâm lý giúp thuật toán AI phát hiện mối tương quan giữa cảm xúc FOMO, ý định trả thù thị trường hoặc sự mệt mỏi với tỷ lệ thắng."
                : "Recording your emotional state helps the AI correlation engine detect whether elevated FOMO, revenge trading, or fatigue degrades your win rate."}
            </p>
            <div className="p-3 bg-bg-surface rounded-xl border border-border/60 text-txt-primary font-mono">
              {isVi ? "Điểm Kỷ Luật Ngày: " : "Discipline Score: "}
              <strong className="text-gain font-bold">90/100 ({isVi ? "Kỷ Luật Tốt" : "Disciplined Execution"})</strong>
            </div>
          </div>
        )}

        {/* TAB 4: AI REVIEW */}
        {activeTab === "ai" && (
          <div className="p-5 rounded-2xl bg-bg-surface border border-sky-500/30 space-y-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-sky-500/50 to-transparent" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/30">
                  <Bot className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-txt-primary uppercase tracking-wider font-mono">
                  {isVi ? "AI Tổng Hợp Hiệu Suất Cuối Ngày" : "AI End-of-Day Performance Synthesis"}
                </h4>
              </div>

              <Button
                variant="ai"
                size="sm"
                onClick={handleGenerateAIDailyReview}
                isLoading={isGeneratingAI}
              >
                <Sparkles className="w-3.5 h-3.5 mr-1" />
                {isVi ? "Tạo Đánh Giá Cuối Ngày" : "Generate AI Daily Review"}
              </Button>
            </div>

            {journal?.aiDailyReview ? (
              <div className="space-y-3 text-xs">
                <p className="text-txt-primary leading-relaxed font-sans">
                  {journal.aiDailyReview.summary}
                </p>

                {journal.aiDailyReview.strengths?.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-gain block font-mono">{isVi ? "Điểm Mạnh Chính:" : "Key Strengths:"}</span>
                    <ul className="list-disc list-inside text-txt-secondary space-y-0.5 font-sans">
                      {journal.aiDailyReview.strengths.map((s, idx) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {journal.aiDailyReview.focusForTomorrow && (
                  <div className="p-3.5 rounded-xl bg-bg-surface-subtle border border-sky-500/30 text-sky-400 font-mono text-xs">
                    <strong>{isVi ? "Trọng Tâm Cho Ngày Mai: " : "Focus for Tomorrow: "}</strong>
                    {journal.aiDailyReview.focusForTomorrow}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-txt-muted italic font-sans">
                {isVi
                  ? "Bấm \"Tạo Đánh Giá Cuối Ngày\" để AI tổng hợp các lệnh thực thi và nhật ký phiên hôm nay."
                  : "Click \"Generate AI Daily Review\" to synthesize today's trade executions and journal notes."}
              </p>
            )}
          </div>
        )}

        {/* TAB 5: MILESTONE CONTEXT */}
        {activeTab === "milestone" && (
          <div className="space-y-4">
            {milestoneContext ? (
              <>
                {/* Milestone Header */}
                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-2xl border border-amber-500/30">
                  <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono font-bold text-amber-400 tracking-wider">
                      {isVi ? "Bối Cảnh Milestone" : "Milestone Context"}
                    </span>
                    <h4 className="text-sm font-bold text-txt-primary mt-0.5">
                      {milestoneContext.milestoneLabel}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Target className="w-3 h-3 text-gain" />
                      <span className="text-xs font-mono text-gain">
                        {isVi ? "Mục tiêu: " : "Target: "}
                        {formatCurrency(milestoneContext.targetProfit, "USD", true)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progress towards milestone */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-txt-muted">{isVi ? "Tiến độ milestone" : "Milestone Progress"}</span>
                    <span className={dayMetrics.netProfit >= milestoneContext.targetProfit ? "text-gain" : "text-txt-primary"}>
                      {formatCurrency(dayMetrics.netProfit, "USD", true)} / {formatCurrency(milestoneContext.targetProfit, "USD", true)}
                    </span>
                  </div>
                  <div className="h-3 bg-bg-surface rounded-full overflow-hidden border border-border/60">
                    <div
                      className={`h-full transition-all ${
                        dayMetrics.netProfit >= milestoneContext.targetProfit
                          ? "bg-gradient-to-r from-gain to-emerald-400"
                          : "bg-gradient-to-r from-amber-500 to-orange-400"
                      }`}
                      style={{ width: `${Math.min(100, (dayMetrics.netProfit / milestoneContext.targetProfit) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Key Wins from Milestone */}
                {milestoneContext.keyWins && (
                  <div className="p-4 bg-gain-subtle/30 rounded-2xl border border-gain/30">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-gain" />
                      <span className="text-xs font-bold text-gain uppercase font-mono tracking-wider">
                        {isVi ? "🏆 Chiến Thắng Chính" : "🏆 Key Wins"}
                      </span>
                    </div>
                    <p className="text-xs text-txt-primary font-sans leading-relaxed">
                      {milestoneContext.keyWins}
                    </p>
                  </div>
                )}

                {/* Challenges from Milestone */}
                {milestoneContext.challenges && (
                  <div className="p-4 bg-loss-subtle/30 rounded-2xl border border-loss/30">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingDown className="w-4 h-4 text-loss" />
                      <span className="text-xs font-bold text-loss uppercase font-mono tracking-wider">
                        {isVi ? "⚠️ Thách Thức" : "⚠️ Challenges"}
                      </span>
                    </div>
                    <p className="text-xs text-txt-primary font-sans leading-relaxed">
                      {milestoneContext.challenges}
                    </p>
                  </div>
                )}

                {/* Next Milestone Focus */}
                {milestoneContext.nextMilestoneFocus && (
                  <div className="p-4 bg-sky-500/10 rounded-2xl border border-sky-500/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="w-4 h-4 text-sky-400" />
                      <span className="text-xs font-bold text-sky-400 uppercase font-mono tracking-wider">
                        {isVi ? "🎯 Trọng Tâm Tiếp Theo" : "🎯 Next Milestone Focus"}
                      </span>
                    </div>
                    <p className="text-xs text-txt-primary font-sans leading-relaxed">
                      {milestoneContext.nextMilestoneFocus}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="py-12 text-center">
                <Award className="w-12 h-12 text-txt-muted mx-auto mb-3 opacity-50" />
                <p className="text-xs text-txt-muted font-mono">
                  {isVi 
                    ? "Ngày này chưa có thông tin milestone. Vui lòng cập nhật từ trang Kế Hoạch."
                    : "This date has no milestone information. Please update from the Plan page."}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
