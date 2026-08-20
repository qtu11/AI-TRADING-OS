"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { DailyJournal } from "@/types/journal.types";
import { Trade } from "@/types/trade.types";
import {
  getDailyJournal,
  saveDailyJournal,
  getUserTrades,
  getAllJournals,
} from "@/lib/firebase/db-service";
import { calculateTradeMetrics } from "@/lib/math/performance";
import { getTodayDateString, formatDateOnly } from "@/lib/utils/date";
import { formatCurrency } from "@/lib/utils/currency";
import { soundFX } from "@/lib/sound/sound-effects";
import {
  BookOpen,
  Calendar,
  Save,
  CheckCircle2,
  TrendingUp,
  Clock,
  TrendingDown,
  Minus,
  Sparkles,
  Bot,
  Eye,
  Edit3,
  ChevronRight,
  X,
} from "lucide-react";

interface JournalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = "today" | "history";

export const JournalModal: React.FC<JournalModalProps> = ({ isOpen, onClose }) => {
  const { userProfile } = useAuth();
  const { language, t } = useLanguage();
  const isVi = language === "vi";
  const userId = userProfile?.id || "dev-trader-01";

  const [activeTab, setActiveTab] = useState<Tab>("today");
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [journal, setJournal] = useState<DailyJournal | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [journalsList, setJournalsList] = useState<DailyJournal[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");

  // Form State
  const [marketBias, setMarketBias] = useState<"BULLISH" | "BEARISH" | "NEUTRAL" | "RANGING">("BULLISH");
  const [volatility, setVolatility] = useState<"LOW" | "NORMAL" | "HIGH" | "EXTREME">("NORMAL");
  const [primarySession, setPrimarySession] = useState("London");
  const [preMarketNotes, setPreMarketNotes] = useState("");
  const [watchedLevels, setWatchedLevels] = useState("");
  const [invalidationCriteria, setInvalidationCriteria] = useState("");
  const [postMarketReview, setPostMarketReview] = useState("");
  const [lessonsLearned, setLessonsLearned] = useState("");
  const [screenshotUrl, setScreenshotUrl] = useState("");

  const metrics = calculateTradeMetrics(trades);

  const loadDateData = async (dStr: string) => {
    setLoading(true);
    try {
      const [j, allTrades, recentJournals] = await Promise.all([
        getDailyJournal(userId, dStr),
        getUserTrades(userId),
        getAllJournals(userId),
      ]);

      setJournalsList(recentJournals);

      // Filter trades for this date
      const dTrades = allTrades.filter((t) => {
        const tDate = t.closeTime ? t.closeTime.split("T")[0] : t.openTime.split("T")[0];
        return tDate === dStr;
      });
      setTrades(dTrades);

      if (j) {
        setJournal(j);
        setMarketBias(j.marketBias || "BULLISH");
        setVolatility(j.volatility || "NORMAL");
        setPrimarySession(j.primarySession || "London");
        setPreMarketNotes(j.preMarketNotes || "");
        setWatchedLevels(j.watchedLevels || "");
        setInvalidationCriteria(j.invalidationCriteria || "");
        setPostMarketReview(j.postMarketReview || "");
        setLessonsLearned(j.lessonsLearned || "");
        setScreenshotUrl(j.chartScreenshotUrls?.[0] || "");
      } else {
        setJournal(null);
        resetForm();
      }
    } catch (err) {
      console.warn("Load journal error:", err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setPreMarketNotes("");
    setWatchedLevels("");
    setInvalidationCriteria("");
    setPostMarketReview("");
    setLessonsLearned("");
    setScreenshotUrl("");
  };

  useEffect(() => {
    if (isOpen && userId) {
      loadDateData(selectedDate);
    }
  }, [isOpen, userId, selectedDate]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus("saving");
    try {
      const jData: DailyJournal = {
        id: selectedDate,
        userId,
        date: selectedDate,
        marketBias,
        marketCondition: "Standard Market",
        primarySession,
        volatility,
        importantNewsEvents: [],
        preMarketNotes,
        watchedLevels,
        invalidationCriteria,
        expectedScenarios: "",
        postMarketReview,
        lessonsLearned,
        chartScreenshotUrls: screenshotUrl ? [screenshotUrl] : [],
        totalTrades: metrics.totalTrades,
        winningTrades: metrics.winningTrades,
        losingTrades: metrics.losingTrades,
        breakevenTrades: metrics.breakevenTrades,
        winRate: metrics.winRate,
        netProfit: metrics.netProfit,
        grossProfit: metrics.grossProfit,
        grossLoss: metrics.grossLoss,
        profitFactor: metrics.profitFactor,
        averageRiskReward: metrics.averageRiskReward,
        disciplineScore: 90,
        followedPlan: true,
        createdAt: journal?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await saveDailyJournal(jData);
      setJournal(jData);
      setSaveStatus("success");
      soundFX.playSuccess();
      
      // Refresh journal list
      const updatedJournals = await getAllJournals(userId);
      setJournalsList(updatedJournals);
    } catch (err) {
      console.error("Failed to save journal:", err);
      setSaveStatus("error");
      soundFX.playWarning();
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectHistoryDate = (date: string) => {
    soundFX.playSwitch();
    setSelectedDate(date);
    setActiveTab("today");
  };

  const getProfitColor = (profit: number) => {
    if (profit > 0) return "text-gain";
    if (profit < 0) return "text-loss";
    return "text-txt-primary";
  };

  const getProfitIcon = (profit: number) => {
    if (profit > 0) return <TrendingUp className="w-3.5 h-3.5" />;
    if (profit < 0) return <TrendingDown className="w-3.5 h-3.5" />;
    return <Minus className="w-3.5 h-3.5" />;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="4xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/80 bg-bg-surface-subtle -m-5 mb-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-brand-500/15 text-brand-500 border border-brand-500/30">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-txt-primary">
              {isVi ? "Nhật Ký Giao Dịch" : "Trading Journal"}
            </h2>
            <p className="text-xs text-txt-secondary font-mono">
              {formatDateOnly(selectedDate)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              soundFX.playSwitch();
              setSelectedDate(e.target.value);
            }}
            className="bg-bg-surface-subtle border border-border rounded-lg px-2 py-1.5 text-xs text-txt-primary font-mono focus:outline-none focus:border-brand-500"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-bg-surface-subtle rounded-xl mt-4 mb-4">
        <button
          onClick={() => {
            soundFX.playClick(500);
            setActiveTab("today");
          }}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "today"
              ? "bg-brand-500 text-white shadow-sm"
              : "text-txt-secondary hover:text-txt-primary hover:bg-bg-surface-hover"
          }`}
        >
          <Edit3 className="w-3.5 h-3.5" />
          {isVi ? "Nhật Ký Hôm Nay" : "Today's Journal"}
        </button>
        <button
          onClick={() => {
            soundFX.playClick(500);
            setActiveTab("history");
          }}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "history"
              ? "bg-brand-500 text-white shadow-sm"
              : "text-txt-secondary hover:text-txt-primary hover:bg-bg-surface-hover"
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          {isVi ? "Lịch Sử Nhật Ký" : "Journal History"}
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "today" ? (
        <div className="space-y-5">
          {/* Quick Stats Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-4 bg-bg-surface-subtle rounded-xl border border-border/60">
            <div className="text-center">
              <span className="text-[10px] text-txt-muted block uppercase font-medium">
                {isVi ? "Lệnh" : "Trades"}
              </span>
              <span className="text-sm font-bold text-txt-primary mt-1 block">
                {metrics.totalTrades}
              </span>
            </div>
            <div className="text-center">
              <span className="text-[10px] text-txt-muted block uppercase font-medium">
                W / L
              </span>
              <span className="text-sm font-bold text-txt-primary mt-1 block">
                {metrics.winningTrades}/{metrics.losingTrades}
              </span>
            </div>
            <div className="text-center">
              <span className="text-[10px] text-txt-muted block uppercase font-medium">
                {isVi ? "Tỷ Lệ" : "Win Rate"}
              </span>
              <span className="text-sm font-bold text-txt-primary mt-1 block">
                {metrics.totalTrades > 0 ? `${metrics.winRate}%` : "—"}
              </span>
            </div>
            <div className="text-center">
              <span className="text-[10px] text-txt-muted block uppercase font-medium">
                PF
              </span>
              <span className="text-sm font-bold text-txt-primary mt-1 block">
                {metrics.totalTrades > 0 ? metrics.profitFactor : "—"}
              </span>
            </div>
            <div className="text-center">
              <span className="text-[10px] text-txt-muted block uppercase font-medium">
                {isVi ? "Lợi Nhuận" : "P&L"}
              </span>
              <span className={`text-sm font-bold mt-1 block flex items-center justify-center gap-1 ${getProfitColor(metrics.netProfit)}`}>
                {getProfitIcon(metrics.netProfit)}
                {formatCurrency(metrics.netProfit, "USD", true)}
              </span>
            </div>
          </div>

          {/* Market Context */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-txt-primary uppercase tracking-wider font-mono flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-brand-500/20 text-brand-500 flex items-center justify-center text-[10px] font-bold">1</span>
              {isVi ? "Bối Cảnh Thị Trường" : "Market Context"}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Select
                label={isVi ? "Thiên Hướng" : "Bias"}
                value={marketBias}
                onChange={(e) => {
                  soundFX.playSwitch();
                  setMarketBias(e.target.value as any);
                }}
                options={[
                  { value: "BULLISH", label: "📈 Bullish" },
                  { value: "BEARISH", label: "📉 Bearish" },
                  { value: "RANGING", label: "↔️ Ranging" },
                  { value: "NEUTRAL", label: "➖ Neutral" },
                ]}
              />
              <Select
                label={isVi ? "Phiên Chính" : "Session"}
                value={primarySession}
                onChange={(e) => {
                  soundFX.playSwitch();
                  setPrimarySession(e.target.value);
                }}
                options={[
                  { value: "London", label: "London" },
                  { value: "New York", label: "New York" },
                  { value: "Asian", label: "Asian" },
                  { value: "London+NY", label: "London/NY" },
                ]}
              />
              <Select
                label={isVi ? "Biến Động" : "Volatility"}
                value={volatility}
                onChange={(e) => {
                  soundFX.playSwitch();
                  setVolatility(e.target.value as any);
                }}
                options={[
                  { value: "LOW", label: isVi ? "Thấp" : "Low" },
                  { value: "NORMAL", label: isVi ? "Bình Thường" : "Normal" },
                  { value: "HIGH", label: isVi ? "Cao" : "High" },
                  { value: "EXTREME", label: isVi ? "Cực Cao" : "Extreme" },
                ]}
              />
            </div>
          </div>

          {/* Pre-Market */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-txt-primary uppercase tracking-wider font-mono flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-sky-500/20 text-sky-400 flex items-center justify-center text-[10px] font-bold">2</span>
              {isVi ? "Chuẩn Bị Trước Phiên" : "Pre-Market Preparation"}
            </h3>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-txt-primary">
                  {isVi ? "Ghi Chú & Kịch Bản" : "Notes & Scenarios"}
                </label>
                <textarea
                  rows={2}
                  value={preMarketNotes}
                  onChange={(e) => setPreMarketNotes(e.target.value)}
                  placeholder={isVi ? "Xu hướng, vùng giá quan sát..." : "Trend, key levels to watch..."}
                  className="w-full bg-bg-surface-subtle border border-border rounded-xl p-3 text-xs text-txt-primary placeholder-txt-muted focus:outline-none focus:border-brand-500 font-sans resize-none"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label={isVi ? "Ngưỡng Kháng Cự/Hỗ Trợ" : "Key S/R Levels"}
                  value={watchedLevels}
                  onChange={(e) => setWatchedLevels(e.target.value)}
                  placeholder="e.g. 1.0850, 1.0810"
                />
                <Input
                  label={isVi ? "Điều Kiện Hủy Bỏ" : "Invalidation"}
                  value={invalidationCriteria}
                  onChange={(e) => setInvalidationCriteria(e.target.value)}
                  placeholder="e.g. H1 close below 1.0780"
                />
              </div>
            </div>
          </div>

          {/* Post-Market */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-txt-primary uppercase tracking-wider font-mono flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-gain/20 text-gain flex items-center justify-center text-[10px] font-bold">3</span>
              {isVi ? "Đánh Giá Sau Phiên" : "Post-Market Review"}
            </h3>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-txt-primary">
                  {isVi ? "Đánh Giá Thực Thi" : "Execution Review"}
                </label>
                <textarea
                  rows={2}
                  value={postMarketReview}
                  onChange={(e) => setPostMarketReview(e.target.value)}
                  placeholder={isVi ? "Kỷ luật, cảm xúc, tuân thủ SL/TP..." : "Discipline, emotions, SL/TP compliance..."}
                  className="w-full bg-bg-surface-subtle border border-border rounded-xl p-3 text-xs text-txt-primary placeholder-txt-muted focus:outline-none focus:border-brand-500 font-sans resize-none"
                />
              </div>
              <Input
                label={isVi ? "Bài Học Quan Trọng" : "Key Lesson"}
                value={lessonsLearned}
                onChange={(e) => setLessonsLearned(e.target.value)}
                placeholder={isVi ? "Bài học rút ra từ ngày hôm nay..." : "Main lesson from today..."}
              />
              <Input
                label={isVi ? "Link Ảnh Chart" : "Chart Screenshot URL"}
                value={screenshotUrl}
                onChange={(e) => setScreenshotUrl(e.target.value)}
                placeholder="https://..."
              />
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
                  {isVi ? "Lỗi khi lưu!" : "Save failed!"}
                </div>
              )}
              {saveStatus === "saving" && (
                <div className="flex items-center gap-1.5 text-brand-400 font-mono">
                  <Save className="w-4 h-4 animate-pulse" />
                  {isVi ? "Đang lưu..." : "Saving..."}
                </div>
              )}
              {saveStatus === "idle" && journal && (
                <div className="flex items-center gap-1.5 text-txt-muted font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5 text-gain" />
                  {isVi ? "Đã có bản lưu" : "Saved version exists"}
                </div>
              )}
            </div>

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
                : (isVi ? "Lưu Nhật Ký" : "Save Journal")
              }
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* History List */}
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-txt-primary uppercase tracking-wider font-mono">
              {isVi ? "Danh Sách Nhật Ký" : "Journal Entries"}
            </h3>
            <span className="text-xs text-txt-muted font-mono">
              {journalsList.length} {isVi ? "bản ghi" : "entries"}
            </span>
          </div>

          {loading ? (
            <div className="text-center py-8 text-xs text-txt-muted">
              {isVi ? "Đang tải..." : "Loading..."}
            </div>
          ) : journalsList.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="w-10 h-10 text-txt-muted mx-auto mb-2 opacity-50" />
              <p className="text-xs text-txt-muted">
                {isVi ? "Chưa có nhật ký nào." : "No journal entries yet."}
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {journalsList.map((j) => (
                <button
                  key={j.id}
                  onClick={() => handleSelectHistoryDate(j.date)}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-xl text-left transition-all ${
                    selectedDate === j.date
                      ? "bg-brand-500/15 text-brand-400 border border-brand-500/40"
                      : "bg-bg-surface-subtle text-txt-secondary hover:bg-bg-surface-hover border border-transparent"
                  }`}
                >
                  <div className={`p-2 rounded-lg ${
                    selectedDate === j.date
                      ? "bg-brand-500/20"
                      : "bg-bg-surface"
                  }`}>
                    {selectedDate === j.date ? (
                      <Eye className="w-4 h-4 text-brand-400" />
                    ) : (
                      <Calendar className="w-4 h-4 text-txt-muted" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-mono">
                        {formatDateOnly(j.date)}
                      </span>
                      {j.marketBias && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-bg-surface border border-border font-mono">
                          {j.marketBias}
                        </span>
                      )}
                    </div>
                    {j.preMarketNotes && (
                      <p className="text-[11px] text-txt-muted mt-0.5 truncate">
                        {j.preMarketNotes.substring(0, 60)}
                        {j.preMarketNotes.length > 60 ? "..." : ""}
                      </p>
                    )}
                    {j.lessonsLearned && (
                      <p className="text-[10px] text-sky-400 mt-0.5 truncate">
                        💡 {j.lessonsLearned.substring(0, 40)}
                        {j.lessonsLearned.length > 40 ? "..." : ""}
                      </p>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <div className={`flex items-center gap-1 text-sm font-bold ${getProfitColor(j.netProfit || 0)}`}>
                      {getProfitIcon(j.netProfit || 0)}
                      {formatCurrency(j.netProfit || 0, "USD", true)}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-txt-muted font-mono">
                      <span>W: {j.winningTrades || 0}</span>
                      <span>L: {j.losingTrades || 0}</span>
                      <span>{j.winRate || 0}%</span>
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-txt-muted shrink-0" />
                </button>
              ))}
            </div>
          )}

          {journalsList.length > 0 && (
            <div className="pt-3 border-t border-border/60">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-lg bg-bg-surface-subtle">
                  <div className="text-[10px] text-txt-muted uppercase">
                    {isVi ? "Tổng Lệnh" : "Total Trades"}
                  </div>
                  <div className="text-sm font-bold text-txt-primary mt-0.5">
                    {journalsList.reduce((acc, j) => acc + (j.totalTrades || 0), 0)}
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-bg-surface-subtle">
                  <div className="text-[10px] text-txt-muted uppercase">
                    {isVi ? "Tổng W/L" : "Total W/L"}
                  </div>
                  <div className="text-sm font-bold text-txt-primary mt-0.5">
                    {journalsList.reduce((acc, j) => acc + (j.winningTrades || 0), 0)} / {journalsList.reduce((acc, j) => acc + (j.losingTrades || 0), 0)}
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-bg-surface-subtle">
                  <div className="text-[10px] text-txt-muted uppercase">
                    {isVi ? "Tổng P&L" : "Total P&L"}
                  </div>
                  <div className={`text-sm font-bold mt-0.5 ${getProfitColor(journalsList.reduce((acc, j) => acc + (j.netProfit || 0), 0))}`}>
                    {formatCurrency(journalsList.reduce((acc, j) => acc + (j.netProfit || 0), 0), "USD", true)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};
