"use client";

import React, { useState, useEffect } from "react";
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
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useNotifications } from "@/context/NotificationContext";
import {
  BookOpen,
  Calendar,
  Sparkles,
  Bot,
  Save,
  CheckCircle2,
  TrendingUp,
  Image as ImageIcon,
  Clock,
  Download,
  Trash2,
  Plus,
  Edit,
} from "lucide-react";

export default function JournalPage() {
  const { userProfile } = useAuth();
  const { language, t } = useLanguage();
  const { addNotification } = useNotifications();
  const userId = userProfile?.id || "dev-trader-01";

  const isVi = language === "vi";

  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [journal, setJournal] = useState<DailyJournal | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [journalsList, setJournalsList] = useState<DailyJournal[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAIAnalyzing, setIsAIAnalyzing] = useState(false);

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
        setPreMarketNotes("");
        setWatchedLevels("");
        setInvalidationCriteria("");
        setPostMarketReview("");
        setLessonsLearned("");
        setScreenshotUrl("");
      }
    } catch (err) {
      console.warn("Load journal error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      loadDateData(selectedDate);
    }
  }, [userId, selectedDate]);

  const metrics = calculateTradeMetrics(trades);

  const handleSave = async () => {
    setIsSaving(true);
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
      soundFX.playSuccess();
    } catch (err) {
      console.error("Failed to save journal:", err);
      soundFX.playWarning();
    } finally {
      setIsSaving(false);
    }
  };

  const handleRunAIAnalysis = async () => {
    setIsAIAnalyzing(true);
    try {
      const res = await fetch("/api/ai/analyze-journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          journal: {
            ...journal,
            date: selectedDate,
            marketBias,
            preMarketNotes,
            postMarketReview,
            lessonsLearned,
            trades,
          },
        }),
      });

      if (res.ok) {
        const review = await res.json();
        const updatedJournal: DailyJournal = {
          ...(journal || ({} as any)),
          id: selectedDate,
          userId,
          date: selectedDate,
          aiDailyReview: review,
          updatedAt: new Date().toISOString(),
        };
        await saveDailyJournal(updatedJournal);
        setJournal(updatedJournal);
        soundFX.playSuccess();
      } else {
        soundFX.playWarning();
      }
    } catch (err) {
      console.warn("AI analysis error:", err);
      soundFX.playWarning();
    } finally {
      setIsAIAnalyzing(false);
    }
  };

  // Export to Excel (CSV format)
  const handleExportExcel = () => {
    const headers = [
      "#", "Ngày Mở", "Ngày Đóng", "Cặp Tiền", "Lot", "Vị Thế", "Điểm Vào", "Dừng Lỗ", "Chốt Lời", "Điểm Thoát",
      "R:R Plan", "R Thực Tế", "Kết Quả", "P&L ($)", "% P&L", "Số Dư ($)", "Tín Hiệu", "Phiên GD", "Chất Lượng", "Tâm Lý", "Thời Gian"
    ];
    
    // Export trades with related journal context
    const rows = trades.map((t, idx) => {
      const tDate = t.closeTime ? t.closeTime.split("T")[0] : t.openTime.split("T")[0];
      const balance = (userProfile?.startingCapital ?? 0) + trades.slice(0, idx + 1).reduce((sum, tr) => sum + Number(tr.netProfit || 0), 0);
      const pnl = Number(t.netProfit || 0);
      const pnlPercent = balance > 0 ? ((pnl / balance) * 100).toFixed(2) : "0.00";
      
      return [
        idx + 1,
        t.openTime.split("T")[0],
        tDate,
        t.symbol,
        t.lots,
        t.direction === "BUY" ? "Mua" : "Bán",
        t.openPrice,
        t.stopLoss || "—",
        t.takeProfit || "—",
        t.closePrice || "—",
        t.plannedRiskReward || "—",
        t.riskRewardRatio || "—",
        pnl > 0 ? "Thắng" : pnl < 0 ? "Thua" : "Hòa",
        pnl.toFixed(2),
        pnlPercent + "%",
        balance.toFixed(2),
        t.strategyName || "—",
        t.session || "—",
        t.outcome || "—",
        t.preTradeEmotion || "—",
        t.timeframe || "—",
      ];
    });
    
    // Convert to CSV with BOM for Excel Vietnamese support
    const csvContent = "\uFEFF" + [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `NhatKy_${selectedDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    soundFX.playSuccess();
    
    addNotification(
      isVi ? "Đã xuất Excel" : "Excel Exported",
      isVi ? `Đã xuất ${trades.length} lệnh trong ngày ${selectedDate}` : `Exported ${trades.length} trades for ${selectedDate}`,
      "success"
    );
  };

  // Reset all form fields
  const handleResetAll = () => {
    if (window.confirm(isVi ? "Bạn có chắc muốn xóa tất cả nội dung nhật ký hôm nay?" : "Are you sure you want to clear all journal entries?")) {
      setMarketBias("BULLISH");
      setVolatility("NORMAL");
      setPrimarySession("London");
      setPreMarketNotes("");
      setWatchedLevels("");
      setInvalidationCriteria("");
      setPostMarketReview("");
      setLessonsLearned("");
      setScreenshotUrl("");
      soundFX.playClick();
    }
  };

  // New entry button (reset to default state)
  const handleNewEntry = () => {
    setSelectedDate(getTodayDateString());
    setJournal(null);
    setMarketBias("BULLISH");
    setVolatility("NORMAL");
    setPrimarySession("London");
    setPreMarketNotes("");
    setWatchedLevels("");
    setInvalidationCriteria("");
    setPostMarketReview("");
    setLessonsLearned("");
    setScreenshotUrl("");
    soundFX.playClick();
  };

  // Delete a journal entry
  const handleDeleteJournal = async (dateToDelete: string) => {
    if (window.confirm(isVi ? `Xóa nhật ký ngày ${dateToDelete}?` : `Delete journal for ${dateToDelete}?`)) {
      const { saveDailyJournal } = await import("@/lib/firebase/db-service");
      // Save empty journal to "delete"
      await saveDailyJournal({
        id: dateToDelete,
        userId,
        date: dateToDelete,
        marketBias: "NEUTRAL",
        marketCondition: "",
        primarySession: "",
        volatility: "NORMAL",
        importantNewsEvents: [],
        preMarketNotes: "",
        watchedLevels: "",
        invalidationCriteria: "",
        expectedScenarios: "",
        postMarketReview: "",
        lessonsLearned: "",
        chartScreenshotUrls: [],
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        breakevenTrades: 0,
        winRate: 0,
        netProfit: 0,
        grossProfit: 0,
        grossLoss: 0,
        profitFactor: 0,
        averageRiskReward: 0,
        disciplineScore: 0,
        followedPlan: false,
        deletedAt: new Date().toISOString(),
        createdAt: "",
        updatedAt: new Date().toISOString(),
      } as any);
      const updatedJournals = await getAllJournals(userId);
      setJournalsList(updatedJournals.filter(j => !j.deletedAt));
      soundFX.playWarning();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-bg-surface border border-border shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-txt-primary flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-500/15 text-brand-500 border border-brand-500/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <span>{isVi ? "Nhật Ký Giao Dịch Hàng Ngày" : "Daily Trading Journal"}</span>
          </h1>
          <p className="text-xs text-txt-secondary mt-1 font-mono">
            {formatDateOnly(selectedDate)} • {isVi ? "Tự động đồng bộ lệnh thực thi và tính toán hiệu suất." : "Automatically syncs linked trades and performance calculations."}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              soundFX.playSwitch();
              setSelectedDate(e.target.value);
            }}
            className="bg-bg-surface-subtle border border-border rounded-xl px-3 py-2 text-xs text-txt-primary font-mono focus:outline-none focus:border-brand-500"
          />

          <Button variant="success" size="sm" onClick={handleNewEntry}>
            <Plus className="w-4 h-4 mr-1.5" />
            {isVi ? "Mới" : "New"}
          </Button>

          <Button variant="outline" size="sm" onClick={handleResetAll}>
            <Trash2 className="w-4 h-4 mr-1.5" />
            {isVi ? "Reset" : "Reset"}
          </Button>

          <Button variant="outline" size="sm" onClick={handleExportExcel} disabled={trades.length === 0}>
            <Download className="w-4 h-4 mr-1.5" />
            {isVi ? "Xuất Excel" : "Export Excel"}
          </Button>

          <Button variant="primary" size="sm" onClick={handleSave} isLoading={isSaving}>
            <Save className="w-4 h-4 mr-1.5" />
            {isVi ? "Lưu Nhật Ký" : "Save Journal"}
          </Button>
        </div>
      </div>

      {/* Daily Performance Banner (Auto Synced) */}
      <div className="bento-card p-5 sm:p-6 space-y-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-brand-500/50 to-transparent" />
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <span className="text-xs font-bold text-txt-primary uppercase tracking-wider font-mono">
            {isVi ? `Đồng Bộ Lệnh Tự Động (${trades.length} Lệnh)` : `Auto-Synced Trade Executions (${trades.length} Trades)`}
          </span>
          <span className="text-xs font-mono text-txt-muted">
            {isVi ? "Nguồn: Đồng Bộ Thời Gian Thực Firestore" : "Source: Firestore Realtime Sync"}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs font-mono">
          <div className="bg-bg-surface-subtle p-3.5 rounded-xl border border-border/60">
            <span className="text-[10px] text-txt-muted block uppercase font-medium">
              {isVi ? "Lợi Nhuận Ròng" : "Net P&L"}
            </span>
            <span
              className={`text-base font-bold mt-1 block ${
                metrics.netProfit > 0 ? "text-gain" : metrics.netProfit < 0 ? "text-loss" : "text-txt-primary"
              }`}
            >
              {formatCurrency(metrics.netProfit, "USD", true)}
            </span>
          </div>

          <div className="bg-bg-surface-subtle p-3.5 rounded-xl border border-border/60">
            <span className="text-[10px] text-txt-muted block uppercase font-medium">
              {isVi ? "Tỷ Lệ Thắng" : "Win Rate"}
            </span>
            <span className="text-base font-bold text-txt-primary mt-1 block">
              {metrics.totalTrades > 0 ? `${metrics.winRate}%` : "—"}
            </span>
          </div>

          <div className="bg-bg-surface-subtle p-3.5 rounded-xl border border-border/60">
            <span className="text-[10px] text-txt-muted block uppercase font-medium">W / L / BE</span>
            <span className="text-base font-bold text-txt-primary mt-1 block">
              {metrics.winningTrades} / {metrics.losingTrades} / {metrics.breakevenTrades}
            </span>
          </div>

          <div className="bg-bg-surface-subtle p-3.5 rounded-xl border border-border/60">
            <span className="text-[10px] text-txt-muted block uppercase font-medium">
              {isVi ? "Hệ Số Lời (PF)" : "Profit Factor"}
            </span>
            <span className="text-base font-bold text-txt-primary mt-1 block">
              {metrics.totalTrades > 0 ? metrics.profitFactor : "—"}
            </span>
          </div>

          <div className="bg-bg-surface-subtle p-3.5 rounded-xl border border-border/60">
            <span className="text-[10px] text-txt-muted block uppercase font-medium">
              {isVi ? "R:R Trung Bình" : "Avg R:R"}
            </span>
            <span className="text-base font-bold text-txt-primary mt-1 block">
              {metrics.averageRiskReward > 0 ? `${metrics.averageRiskReward}R` : "—"}
            </span>
          </div>
        </div>
      </div>

      {/* Main Journal Form Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Context, Pre-Market & Post-Market */}
        <div className="lg:col-span-2 space-y-6">
          {/* Market Context */}
          <div className="bento-card p-5 sm:p-6 space-y-4 relative overflow-hidden">
            <h3 className="text-xs font-bold text-txt-primary uppercase tracking-wider font-mono">
              {isVi ? "1. Bối Cảnh Thị Trường & Phiên Giao Dịch" : "1. Market Context & Session Setup"}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Select
                label={isVi ? "Thiên Hướng Thị Trường" : "Market Bias"}
                value={marketBias}
                onChange={(e) => {
                  soundFX.playSwitch();
                  setMarketBias(e.target.value as any);
                }}
                options={[
                  { value: "BULLISH", label: isVi ? "Tăng Giá (Bullish)" : "Bullish Trend" },
                  { value: "BEARISH", label: isVi ? "Giảm Giá (Bearish)" : "Bearish Trend" },
                  { value: "RANGING", label: isVi ? "Đi Ngang (Ranging)" : "Consolidation / Range" },
                  { value: "NEUTRAL", label: isVi ? "Trung Lập (Neutral)" : "Neutral / Indecision" },
                ]}
              />

              <Select
                label={isVi ? "Phiên Chính" : "Primary Session"}
                value={primarySession}
                onChange={(e) => {
                  soundFX.playSwitch();
                  setPrimarySession(e.target.value);
                }}
                options={[
                  { value: "London", label: "London Session" },
                  { value: "New York", label: "New York Session" },
                  { value: "Asian", label: "Asian Session" },
                  { value: "London+NY", label: "London/NY Overlap" },
                ]}
              />

              <Select
                label={isVi ? "Biến Động Dự Kiến" : "Expected Volatility"}
                value={volatility}
                onChange={(e) => {
                  soundFX.playSwitch();
                  setVolatility(e.target.value as any);
                }}
                options={[
                  { value: "LOW", label: isVi ? "Thấp" : "Low Volatility" },
                  { value: "NORMAL", label: isVi ? "Bình Thường" : "Normal Volatility" },
                  { value: "HIGH", label: isVi ? "Cao" : "High Volatility" },
                  { value: "EXTREME", label: isVi ? "Cực Cao / Tin Tức" : "Extreme / News Event" },
                ]}
              />
            </div>
          </div>

          {/* Pre-Market Analysis */}
          <div className="bento-card p-5 sm:p-6 space-y-4 relative overflow-hidden">
            <h3 className="text-xs font-bold text-txt-primary uppercase tracking-wider font-mono">
              {isVi ? "2. Chuẩn Bị Trước Phiên & Ngưỡng Hủy Bỏ (Pre-Market)" : "2. Pre-Market Preparation & Invalidation Levels"}
            </h3>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-txt-primary">
                  {isVi ? "Ghi Chú Kỹ Thuật & Kịch Bản Đầu Phiên" : "Pre-Market Bias & Technical Narrative"}
                </label>
                <textarea
                  rows={3}
                  value={preMarketNotes}
                  onChange={(e) => setPreMarketNotes(e.target.value)}
                  placeholder={isVi ? "Xu hướng khung lớn thế nào? Vùng giá nào cần quan sát?" : "What is your directional bias today? Why? Higher timeframe order flow?"}
                  className="w-full bg-bg-surface-subtle border border-border rounded-xl p-3 text-xs text-txt-primary placeholder-txt-muted focus:outline-none focus:border-brand-500 font-sans"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label={isVi ? "Các Mức Giá Kháng Cự / Hỗ Trợ Chính" : "Key Support/Resistance Levels"}
                  value={watchedLevels}
                  onChange={(e) => setWatchedLevels(e.target.value)}
                  placeholder="e.g. 1.0850, 1.0810, 2415 Gold"
                />
                <Input
                  label={isVi ? "Điều Kiện Hủy Bỏ Kế Hoạch Vào Lệnh" : "What Invalidates the Setup?"}
                  value={invalidationCriteria}
                  onChange={(e) => setInvalidationCriteria(e.target.value)}
                  placeholder="e.g. H1 close below 1.0780"
                />
              </div>
            </div>
          </div>

          {/* Post-Market Review */}
          <div className="bento-card p-5 sm:p-6 space-y-4 relative overflow-hidden">
            <h3 className="text-xs font-bold text-txt-primary uppercase tracking-wider font-mono">
              {isVi ? "3. Đánh Giá Thực Thi Sau Phiên (Post-Market)" : "3. Post-Market Execution Evaluation"}
            </h3>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-txt-primary">
                  {isVi ? "Đánh Giá Thực Thi (Kỷ luật, cảm xúc FOMO, tuân thủ SL/TP?)" : "Execution Review (How well did you trade?)"}
                </label>
                <textarea
                  rows={3}
                  value={postMarketReview}
                  onChange={(e) => setPostMarketReview(e.target.value)}
                  placeholder={isVi ? "Bạn có kiên nhẫn chờ setup không? Có bị dời SL không?" : "Did you enter with patience? Did you manage risk properly? Did you experience FOMO or move stops?"}
                  className="w-full bg-bg-surface-subtle border border-border rounded-xl p-3 text-xs text-txt-primary placeholder-txt-muted focus:outline-none focus:border-brand-500 font-sans"
                />
              </div>

              <Input
                label={isVi ? "Bài Học Quan Trọng Nhất Trong Ngày" : "Primary Lesson / Rule to Remember"}
                value={lessonsLearned}
                onChange={(e) => setLessonsLearned(e.target.value)}
                placeholder={isVi ? "Ví dụ: Tuyệt đối không đuổi nến sau khi London vừa mở cửa" : "e.g. Never chase market after London open breakout"}
              />

              <Input
                label={isVi ? "Đường Dẫn Ảnh Chụp Biểu Đồ (Screenshot URL)" : "Chart Screenshot URL"}
                value={screenshotUrl}
                onChange={(e) => setScreenshotUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>
        </div>

        {/* Right 1 Col: AI Daily Review & History */}
        <div className="space-y-6">
          {/* AI Daily Analysis Card */}
          <div className="bento-card p-5 sm:p-6 space-y-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-sky-500/50 to-transparent" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/30">
                  <Bot className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-txt-primary uppercase tracking-wider font-mono">
                  {isVi ? "Cố Vấn Kỷ Luật AI" : "AI Journal Coach"}
                </h3>
              </div>

              <Button
                variant="ai"
                size="sm"
                onClick={handleRunAIAnalysis}
                isLoading={isAIAnalyzing}
              >
                <Sparkles className="w-3.5 h-3.5 mr-1" />
                {isVi ? "Phân Tích AI" : "Analyze Journal"}
              </Button>
            </div>

            {journal?.aiDailyReview ? (
              <div className="space-y-3 text-xs">
                <p className="text-txt-primary leading-relaxed font-sans">
                  {journal.aiDailyReview.summary}
                </p>

                {journal.aiDailyReview.strengths?.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-gain block font-mono">
                      {isVi ? "Điểm Tốt:" : "Strengths:"}
                    </span>
                    <ul className="list-disc list-inside text-txt-secondary space-y-0.5 font-sans">
                      {journal.aiDailyReview.strengths.map((s, idx) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {journal.aiDailyReview.focusForTomorrow && (
                  <div className="p-3.5 rounded-xl bg-bg-surface-subtle border border-sky-500/30 text-sky-400 font-mono text-xs">
                    <strong>{isVi ? "Trọng Tâm Phiên Tiếp Theo: " : "Focus for Next Session: "}</strong>
                    {journal.aiDailyReview.focusForTomorrow}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-txt-muted italic font-sans">
                {isVi
                  ? "Bấm \"Phân Tích AI\" để nhận phản hồi hành vi và rủi ro có cấu trúc từ AI."
                  : "Click \"Analyze Journal\" to receive structured AI behavioral and risk feedback for this day."}
              </p>
            )}
          </div>

          {/* Recent Journals Archive */}
          <div className="bento-card p-5 sm:p-6 space-y-3 relative overflow-hidden">
            <h3 className="text-xs font-bold text-txt-primary uppercase tracking-wider font-mono">
              {isVi ? "Kho Lưu Trữ Nhật Ký Gần Đây" : "Recent Journals Archive"}
            </h3>

            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
              {journalsList.length === 0 ? (
                <p className="text-xs text-txt-muted">{isVi ? "Chưa có nhật ký nào trước đó." : "No previous journal entries."}</p>
              ) : (
                journalsList.map((j) => (
                  <div
                    key={j.id}
                    className={`group w-full flex items-center justify-between p-3 rounded-xl text-xs font-mono transition-all ${
                      selectedDate === j.date
                        ? "bg-brand-500/15 text-brand-400 border border-brand-500/40 font-bold"
                        : "bg-bg-surface-subtle text-txt-secondary hover:bg-bg-surface-hover border border-transparent"
                    }`}
                  >
                    <button
                      onClick={() => {
                        soundFX.playSwitch();
                        setSelectedDate(j.date);
                      }}
                      className="flex-1 text-left"
                    >
                      <div className="flex items-center gap-2">
                        <span>{j.date}</span>
                        <span className={Number(j.netProfit ?? 0) >= 0 ? "text-gain font-bold" : "text-loss font-bold"}>
                          {formatCurrency(j.netProfit, "USD", true)}
                        </span>
                      </div>
                      <div className="text-[10px] text-txt-muted mt-0.5">
                        {j.marketBias} • {j.primarySession}
                      </div>
                    </button>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          soundFX.playClick();
                          setSelectedDate(j.date);
                        }}
                        className="p-1.5 rounded-lg hover:bg-brand-500/20 text-brand-400 transition-colors"
                        title={isVi ? "Chỉnh sửa" : "Edit"}
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteJournal(j.date)}
                        className="p-1.5 rounded-lg hover:bg-loss/20 text-loss transition-colors"
                        title={isVi ? "Xóa" : "Delete"}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
