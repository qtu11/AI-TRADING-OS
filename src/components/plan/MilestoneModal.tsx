"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useNotifications } from "@/context/NotificationContext";
import { PlanMilestone } from "@/types/plan.types";
import { Trade } from "@/types/trade.types";
import {
  getUserTrades,
  saveMilestoneJournal,
  getMilestoneJournal,
} from "@/lib/firebase/db-service";
import { calculateTradeMetrics } from "@/lib/math/performance";
import { formatCurrency, formatPercent } from "@/lib/utils/currency";
import { soundFX } from "@/lib/sound/sound-effects";
import {
  Award,
  Calendar,
  Save,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Target,
  FileText,
  Lightbulb,
  Edit3,
  Eye,
  X,
} from "lucide-react";

interface MilestoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  milestone: PlanMilestone | null;
  onUpdate?: () => void;
}

export const MilestoneModal: React.FC<MilestoneModalProps> = ({
  isOpen,
  onClose,
  milestone,
  onUpdate,
}) => {
  const { userProfile } = useAuth();
  const { language } = useLanguage();
  const { addNotification } = useNotifications();
  const isVi = language === "vi";
  const userId = userProfile?.id || "dev-trader-01";

  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  
  // Form State
  const [achievedProfit, setAchievedProfit] = useState("");
  const [actualTrades, setActualTrades] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");
  const [lessonsLearned, setLessonsLearned] = useState("");
  const [keyWins, setKeyWins] = useState("");
  const [challenges, setChallenges] = useState("");
  const [nextMilestoneFocus, setNextMilestoneFocus] = useState("");
  const [watchedLevels, setWatchedLevels] = useState("");
  const [preMarketNotes, setPreMarketNotes] = useState("");
  const [marketBias, setMarketBias] = useState<"BULLISH" | "BEARISH" | "NEUTRAL" | "RANGING">("BULLISH");
  const [primarySession, setPrimarySession] = useState("London");

  useEffect(() => {
    if (isOpen && milestone && userId) {
      loadMilestoneData();
    } else if (!isOpen) {
      // Reset save status when modal closes
      setSaveStatus("idle");
    }
  }, [isOpen, milestone, userId]);

  const loadMilestoneData = async () => {
    if (!milestone) return;
    setLoading(true);
    try {
      // Load all trades
      const allTrades = await getUserTrades(userId);
      
      // Filter trades within milestone period
      const milestoneTrades = allTrades.filter((t) => {
        const tDate = t.closeTime ? t.closeTime.split("T")[0] : t.openTime.split("T")[0];
        return tDate >= milestone.startDate && tDate <= milestone.endDate;
      });
      setTrades(milestoneTrades);

      // Load saved journal if exists
      const savedJournal = await getMilestoneJournal(userId, milestone.id);
      if (savedJournal) {
        setAchievedProfit(String(savedJournal.achievedProfit || ""));
        setActualTrades(String(savedJournal.actualTrades || ""));
        setReviewNotes(savedJournal.reviewNotes || "");
        setLessonsLearned(savedJournal.lessonsLearned || "");
        setKeyWins(savedJournal.keyWins || "");
        setChallenges(savedJournal.challenges || "");
        setNextMilestoneFocus(savedJournal.nextMilestoneFocus || "");
      } else {
        // Pre-fill from milestone data
        setAchievedProfit(String(milestone.actualProfit || ""));
        setActualTrades(String(milestone.actualTrades || ""));
        setReviewNotes("");
        setLessonsLearned("");
        setKeyWins("");
        setChallenges("");
        setNextMilestoneFocus("");
      }
    } catch (err) {
      console.warn("Load milestone data error:", err);
    } finally {
      setLoading(false);
    }
  };

  const metrics = calculateTradeMetrics(trades);
  const progressPercent = milestone ? Math.min(100, (metrics.netProfit / milestone.targetProfit) * 100) : 0;

  const handleSave = async () => {
    if (!milestone) {
      return;
    }
    setIsSaving(true);
    setSaveStatus("saving");
    try {
      await saveMilestoneJournal(userId, {
        milestoneId: milestone.id,
        achievedProfit: Number(achievedProfit) || 0,
        actualTrades: Number(actualTrades) || trades.length,
        reviewNotes,
        lessonsLearned,
        keyWins,
        challenges,
        nextMilestoneFocus,
        totalTrades: metrics.totalTrades,
        winningTrades: metrics.winningTrades,
        losingTrades: metrics.losingTrades,
        winRate: metrics.winRate,
        netProfit: metrics.netProfit,
        updatedAt: new Date().toISOString(),
      });
      
      // Also sync to DailyJournal for each day in the milestone period
      // This ensures the calendar shows journal data for milestone days
      const { saveDailyJournal } = await import("@/lib/firebase/db-service");
      const startDate = new Date(milestone.startDate);
      const endDate = new Date(milestone.endDate);
      const currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        // Check if this date has any trades
        const dateTrades = trades.filter(t => {
          const tDate = t.closeTime ? t.closeTime.split('T')[0] : t.openTime.split('T')[0];
          return tDate === dateStr;
        });
        
        // Save/update daily journal for this date
        const dayJournal = {
          id: dateStr,
          userId,
          date: dateStr,
          marketBias: marketBias as any,
          marketCondition: "Standard Market",
          primarySession,
          volatility: "NORMAL" as any,
          importantNewsEvents: [],
          preMarketNotes: preMarketNotes,
          watchedLevels: watchedLevels || "",
          invalidationCriteria: "",
          expectedScenarios: "",
          postMarketReview: reviewNotes,
          lessonsLearned: lessonsLearned,
          chartScreenshotUrls: [],
          totalTrades: dateTrades.length,
          winningTrades: dateTrades.filter(t => Number(t.netProfit || 0) > 0).length,
          losingTrades: dateTrades.filter(t => Number(t.netProfit || 0) < 0).length,
          breakevenTrades: dateTrades.filter(t => Number(t.netProfit || 0) === 0).length,
          winRate: dateTrades.length > 0 
            ? Math.round((dateTrades.filter(t => Number(t.netProfit || 0) > 0).length / dateTrades.length) * 100) 
            : 0,
          netProfit: dateTrades.reduce((acc, t) => acc + Number(t.netProfit || 0), 0),
          grossProfit: dateTrades.filter(t => Number(t.netProfit || 0) > 0).reduce((acc, t) => acc + Number(t.netProfit || 0), 0),
          grossLoss: dateTrades.filter(t => Number(t.netProfit || 0) < 0).reduce((acc, t) => acc + Math.abs(Number(t.netProfit || 0)), 0),
          profitFactor: 0,
          averageRiskReward: 0,
          disciplineScore: 90,
          followedPlan: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          // Additional milestone context
          milestoneContext: {
            milestoneId: milestone.id,
            milestoneLabel: milestone.periodLabel,
            targetProfit: milestone.targetProfit,
            keyWins,
            challenges,
            nextMilestoneFocus,
          },
        };
        
        await saveDailyJournal(dayJournal);
        currentDate.setDate(currentDate.getDate() + 1);
      }
      setSaveStatus("success");
      soundFX.playSuccess();
      
      // Show notification
      await addNotification(
        isVi ? "Đã lưu nhật ký" : "Journal Saved",
        isVi 
          ? `Nhật ký cho ${milestone.periodLabel} đã được lưu thành công.`
          : `Journal for ${milestone.periodLabel} has been saved successfully.`,
        "success"
      );
      
      if (onUpdate) onUpdate();
      
      // Auto-close after 1.5s on success
      setTimeout(() => {
        onClose();
        setSaveStatus("idle");
      }, 1500);
    } catch (err) {
      setSaveStatus("error");
      soundFX.playWarning();
      await addNotification(
        isVi ? "Lỗi khi lưu" : "Save Failed",
        isVi ? "Không thể lưu nhật ký. Vui lòng thử lại." : "Could not save journal. Please try again.",
        "error"
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (!milestone) return null;

  const getStatusBadge = () => {
    switch (milestone.status) {
      case "IN_PROGRESS":
        return (
          <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-sky-500/20 text-sky-400 border border-sky-500/40">
            IN_PROGRESS
          </span>
        );
      case "ACHIEVED":
        return (
          <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-gain-subtle text-gain border border-gain/40">
            ACHIEVED
          </span>
        );
      case "PENDING":
        return (
          <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-bg-surface text-txt-muted border border-border">
            PENDING
          </span>
        );
      case "MISSED":
        return (
          <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-loss-subtle text-loss border border-loss/40">
            MISSED
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="4xl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/80 bg-bg-surface-subtle -m-5 mb-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/30">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-txt-primary">
              {milestone.periodLabel}
            </h2>
            <p className="text-xs text-txt-secondary font-mono flex items-center gap-2">
              <Calendar className="w-3 h-3" />
              {milestone.startDate} → {milestone.endDate}
            </p>
          </div>
        </div>
        {getStatusBadge()}
      </div>

      {loading ? (
        <div className="text-center py-8 text-xs text-txt-muted">
          {isVi ? "Đang tải..." : "Loading..."}
        </div>
      ) : (
        <div className="space-y-5 mt-4">
          {/* Stats Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-bg-surface-subtle rounded-xl border border-border/60">
            <div>
              <span className="text-[10px] text-txt-muted block uppercase font-medium">
                {isVi ? "Mục Tiêu LN" : "Target Profit"}
              </span>
              <span className="text-sm font-bold text-gain mt-1 block">
                +{formatCurrency(milestone.targetProfit)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-txt-muted block uppercase font-medium">
                {isVi ? "Thực Tế" : "Actual P&L"}
              </span>
              <span className={`text-sm font-bold mt-1 block ${metrics.netProfit >= 0 ? "text-gain" : "text-loss"}`}>
                {formatCurrency(metrics.netProfit, "USD", true)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-txt-muted block uppercase font-medium">
                {isVi ? "Lệnh" : "Trades"}
              </span>
              <span className="text-sm font-bold text-txt-primary mt-1 block">
                {metrics.totalTrades} ({metrics.winningTrades}W/{metrics.losingTrades}L)
              </span>
            </div>
            <div>
              <span className="text-[10px] text-txt-muted block uppercase font-medium">
                {isVi ? "Tỷ Lệ Thắng" : "Win Rate"}
              </span>
              <span className="text-sm font-bold text-txt-primary mt-1 block">
                {metrics.totalTrades > 0 ? `${metrics.winRate}%` : "—"}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-txt-muted font-mono">
                {isVi ? "Tiến Độ Hoàn Thành" : "Progress to Target"}
              </span>
              <span className={`font-bold font-mono ${progressPercent >= 100 ? "text-gain" : "text-txt-primary"}`}>
                {progressPercent.toFixed(1)}%
              </span>
            </div>
            <div className="h-2 bg-bg-surface-subtle rounded-full overflow-hidden border border-border/60">
              <div
                className={`h-full transition-all ${
                  progressPercent >= 100
                    ? "bg-gradient-to-r from-gain to-emerald-400"
                    : "bg-gradient-to-r from-brand-500 to-sky-400"
                }`}
                style={{ width: `${Math.max(0, Math.min(100, progressPercent))}%` }}
              />
            </div>
          </div>

          {/* Section 1: Numerical Inputs */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-txt-primary uppercase tracking-wider font-mono flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-500 flex items-center justify-center text-[10px] font-bold">1</span>
              {isVi ? "Số Liệu Thực Tế" : "Actual Numbers"}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label={isVi ? "Lợi Nhuận Đạt Được ($)" : "Achieved Profit ($)"}
                value={achievedProfit}
                onChange={(e) => setAchievedProfit(e.target.value)}
                type="number"
                placeholder="0.00"
              />
              <Input
                label={isVi ? "Số Lệnh Thực Tế" : "Actual Trades"}
                value={actualTrades}
                onChange={(e) => setActualTrades(e.target.value)}
                type="number"
                placeholder="0"
              />
              <Input
                label={isVi ? "Ngưỡng Quan Sát" : "Key Levels"}
                value={watchedLevels}
                onChange={(e) => setWatchedLevels(e.target.value)}
                placeholder="e.g. 1.0850, 1.0810"
              />
            </div>
          </div>

          {/* Section 2: Wins & Challenges */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-txt-primary uppercase tracking-wider font-mono flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-gain/20 text-gain flex items-center justify-center text-[10px] font-bold">2</span>
              {isVi ? "Thắng & Thách Thức" : "Wins & Challenges"}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-txt-primary">
                  {isVi ? "Chiến Thắng Chính" : "Key Wins"} 🏆
                </label>
                <textarea
                  rows={2}
                  value={keyWins}
                  onChange={(e) => setKeyWins(e.target.value)}
                  placeholder={isVi ? "Lệnh tốt nhất, bài học áp dụng thành công..." : "Best trades, lessons applied successfully..."}
                  className="w-full bg-bg-surface-subtle border border-border rounded-xl p-3 text-xs text-txt-primary placeholder-txt-muted focus:outline-none focus:border-brand-500 font-sans resize-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-txt-primary">
                  {isVi ? "Thách Thức" : "Challenges"} ⚠️
                </label>
                <textarea
                  rows={2}
                  value={challenges}
                  onChange={(e) => setChallenges(e.target.value)}
                  placeholder={isVi ? "Khó khăn gặp phải, sai lầm..." : "Difficulties faced, mistakes made..."}
                  className="w-full bg-bg-surface-subtle border border-border rounded-xl p-3 text-xs text-txt-primary placeholder-txt-muted focus:outline-none focus:border-brand-500 font-sans resize-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Review & Lessons */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-txt-primary uppercase tracking-wider font-mono flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-sky-500/20 text-sky-400 flex items-center justify-center text-[10px] font-bold">3</span>
              {isVi ? "Đánh Giá & Bài Học" : "Review & Lessons"}
            </h3>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-txt-primary">
                  {isVi ? "Đánh Giá Tổng Quan" : "Overall Review"}
                </label>
                <textarea
                  rows={2}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder={isVi ? "Đánh giá về cả chu kỳ này..." : "Review about this cycle..."}
                  className="w-full bg-bg-surface-subtle border border-border rounded-xl p-3 text-xs text-txt-primary placeholder-txt-muted focus:outline-none focus:border-brand-500 font-sans resize-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-txt-primary">
                  {isVi ? "Bài Học Quan Trọng Nhất" : "Most Important Lesson"} 💡
                </label>
                <textarea
                  rows={2}
                  value={lessonsLearned}
                  onChange={(e) => setLessonsLearned(e.target.value)}
                  placeholder={isVi ? "Bài học rút ra để áp dụng trong tương lai..." : "Lessons learned for future application..."}
                  className="w-full bg-bg-surface-subtle border border-border rounded-xl p-3 text-xs text-txt-primary placeholder-txt-muted focus:outline-none focus:border-brand-500 font-sans resize-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-txt-primary">
                  {isVi ? "Trọng Tâm Chu Kỳ Tiếp Theo" : "Focus for Next Milestone"} 🎯
                </label>
                <textarea
                  rows={2}
                  value={nextMilestoneFocus}
                  onChange={(e) => setNextMilestoneFocus(e.target.value)}
                  placeholder={isVi ? "Mục tiêu và kế hoạch cho tháng sau..." : "Goals and plan for next month..."}
                  className="w-full bg-bg-surface-subtle border border-border rounded-xl p-3 text-xs text-txt-primary placeholder-txt-muted focus:outline-none focus:border-brand-500 font-sans resize-none"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-3 pt-3 mt-3 border-t border-border/60">
            {/* Status Indicator */}
            <div className="flex items-center gap-2 text-xs">
              {saveStatus === "success" && (
                <div className="flex items-center gap-1.5 text-gain font-mono">
                  <CheckCircle2 className="w-4 h-4" />
                  {isVi ? "Đã lưu thành công!" : "Saved successfully!"}
                </div>
              )}
              {saveStatus === "error" && (
                <div className="flex items-center gap-1.5 text-loss font-mono">
                  <X className="w-4 h-4" />
                  {isVi ? "L�i khi lưu!" : "Save failed!"}
                </div>
              )}
              {saveStatus === "saving" && (
                <div className="flex items-center gap-1.5 text-brand-400 font-mono">
                  <Save className="w-4 h-4 animate-pulse" />
                  {isVi ? "Đang lưu..." : "Saving..."}
                </div>
              )}
              {saveStatus === "idle" && (
                <div className="flex items-center gap-1.5 text-txt-muted font-mono">
                  {isVi ? "Sẵn sàng lưu" : "Ready to save"}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={onClose} disabled={isSaving}>
                {isVi ? "Hủy" : "Cancel"}
              </Button>
              <Button 
                variant="primary" 
                size="sm" 
                onClick={handleSave} 
                isLoading={isSaving}
                disabled={isSaving || saveStatus === "success"}
              >
                {!isSaving && saveStatus !== "success" && <Save className="w-3.5 h-3.5 mr-1.5" />}
                {saveStatus === "success" && <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />}
                {isSaving 
                  ? (isVi ? "Đang lưu..." : "Saving...")
                  : saveStatus === "success"
                  ? (isVi ? "Đã lưu" : "Saved")
                  : (isVi ? "Lưu Nhật Ký" : "Save Milestone Journal")
                }
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};
