"use client";

import React, { useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { Trade, TradeAIAudit } from "@/types/trade.types";
import { formatCurrency, formatDateTime } from "@/lib/utils/currency";
import { saveTrade, deleteTrade } from "@/lib/firebase/db-service";
import { useLanguage } from "@/context/LanguageContext";
import { soundFX } from "@/lib/sound/sound-effects";
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Image as ImageIcon,
  Bot,
  RefreshCw,
  Trash2,
} from "lucide-react";

export interface TradeDetailDrawerProps {
  trade: Trade | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (trade: Trade) => void;
  onDeleted?: () => void;
}

export const TradeDetailDrawer: React.FC<TradeDetailDrawerProps> = ({
  trade,
  isOpen,
  onClose,
  onEdit,
  onDeleted,
}) => {
  const { language } = useLanguage();
  const isVi = language === "vi";

  const [aiAudit, setAiAudit] = useState<TradeAIAudit | undefined>(trade?.aiAudit);
  const [isAuditing, setIsAuditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!trade) return null;

  const isWin = Number(trade.netProfit ?? 0) > 0;
  const isLoss = Number(trade.netProfit ?? 0) < 0;

  const handleDeleteTrade = async () => {
    if (!confirm(isVi ? "Bạn có chắc chắn muốn xóa vĩnh viễn bản ghi lệnh này không?" : "Are you sure you want to permanently delete this trade record?")) return;
    soundFX.playClick(500);
    setIsDeleting(true);
    try {
      await deleteTrade(trade.userId, trade.id);
      soundFX.playSuccess();
      if (onDeleted) onDeleted();
      onClose();
    } catch (err) {
      console.warn("Delete trade error:", err);
      soundFX.playWarning();
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRunAIAudit = async () => {
    setIsAuditing(true);
    soundFX.playClick(750);
    try {
      const res = await fetch("/api/ai/analyze-trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trade }),
      });
      if (res.ok) {
        const auditResult: TradeAIAudit = await res.json();
        setAiAudit(auditResult);
        await saveTrade(trade.userId, {
          ...trade,
          aiAudit: auditResult,
        });
        soundFX.playSuccess();
      }
    } catch (err) {
      console.warn("AI audit request failed:", err);
      soundFX.playWarning();
    } finally {
      setIsAuditing(false);
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={isVi ? `Chi Tiết Lệnh #${trade.id.slice(-6)} — ${trade.symbol}` : `Trade #${trade.id.slice(-6)} — ${trade.symbol}`}
      width="xl"
    >
      <div className="space-y-6">
        {/* Top Summary Banner */}
        <div className="p-4 rounded-2xl bg-bg-surface border border-border flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold font-mono text-sm ${
                trade.direction === "BUY"
                  ? "bg-gain-subtle text-gain border border-gain/40"
                  : "bg-loss-subtle text-loss border border-loss/40"
              }`}
            >
              {trade.direction === "BUY" ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-txt-primary font-mono">{trade.symbol}</span>
                <span className="text-xs text-txt-muted font-mono">({trade.lots} Lots)</span>
              </div>
              <span className="text-xs text-txt-secondary">
                {trade.session} {isVi ? "Phiên" : "Session"} • {trade.strategyName || "Standard Setup"}
              </span>
            </div>
          </div>

          <div className="text-right">
            <span
              className={`text-xl font-bold font-mono ${
                isWin ? "text-gain" : isLoss ? "text-loss" : "text-txt-muted"
              }`}
            >
              {formatCurrency(trade.netProfit, "USD", true)}
            </span>
            <span className="block text-[11px] text-txt-muted font-mono">
              R:R: {trade.riskRewardRatio !== undefined ? `${trade.riskRewardRatio}R` : "—"}
            </span>
          </div>
        </div>

        {/* Execution Details Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="bg-bg-surface-subtle p-3 rounded-xl border border-border/60">
            <span className="text-[10px] text-txt-muted uppercase block font-medium">{isVi ? "Giá Vào" : "Entry Price"}</span>
            <span className="text-txt-primary font-bold mt-0.5 block">{trade.openPrice}</span>
          </div>

          <div className="bg-bg-surface-subtle p-3 rounded-xl border border-border/60">
            <span className="text-[10px] text-txt-muted uppercase block font-medium">{isVi ? "Giá Đóng" : "Exit Price"}</span>
            <span className="text-txt-primary font-bold mt-0.5 block">{trade.closePrice || (isVi ? "Đang Mở" : "Open")}</span>
          </div>

          <div className="bg-bg-surface-subtle p-3 rounded-xl border border-border/60">
            <span className="text-[10px] text-txt-muted uppercase block font-medium">{isVi ? "Dừng Lỗ" : "Stop Loss"}</span>
            <span className="text-loss font-bold mt-0.5 block">{trade.stopLoss}</span>
          </div>

          <div className="bg-bg-surface-subtle p-3 rounded-xl border border-border/60">
            <span className="text-[10px] text-txt-muted uppercase block font-medium">{isVi ? "Chốt Lời" : "Take Profit"}</span>
            <span className="text-gain font-bold mt-0.5 block">{trade.takeProfit}</span>
          </div>
        </div>

        {/* Timestamps & Source */}
        <div className="p-3.5 bg-bg-surface-subtle rounded-xl border border-border/60 text-xs font-mono space-y-1.5 text-txt-secondary">
          <div className="flex justify-between">
            <span className="text-txt-muted">{isVi ? "Thời gian mở:" : "Open Timestamp:"}</span>
            <span className="text-txt-primary">{formatDateTime(trade.openTime)}</span>
          </div>
          {trade.closeTime && (
            <div className="flex justify-between">
              <span className="text-txt-muted">{isVi ? "Thời gian đóng:" : "Close Timestamp:"}</span>
              <span className="text-txt-primary">{formatDateTime(trade.closeTime)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-txt-muted">{isVi ? "Nguồn nạp dữ liệu:" : "Ingestion Source:"}</span>
            <span className="text-sky-400 font-bold">{trade.source}</span>
          </div>
        </div>

        {/* Psychological Context & Notes */}
        <div className="bg-bg-surface p-4 rounded-2xl border border-border space-y-3">
          <h4 className="text-xs font-bold text-txt-primary uppercase tracking-wider font-mono">
            {isVi ? "Tâm Lý & Ghi Chú Thực Thi" : "Psychology & Execution Notes"}
          </h4>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-bg-surface-subtle p-3 rounded-xl border border-border/60">
              <span className="text-[10px] text-txt-muted block uppercase font-medium">{isVi ? "Cảm Xúc Lúc Vào Lệnh" : "Pre-Trade Emotion"}</span>
              <span className="text-txt-primary font-bold mt-0.5 block">{trade.preTradeEmotion || (isVi ? "Bình Tĩnh" : "Calm")}</span>
            </div>
            <div className="bg-bg-surface-subtle p-3 rounded-xl border border-border/60">
              <span className="text-[10px] text-txt-muted block uppercase font-medium">{isVi ? "Tuân Thủ Kế Hoạch" : "Plan Adherence"}</span>
              <span className={`font-bold mt-0.5 block ${trade.followedPlan !== false ? "text-gain" : "text-loss"}`}>
                {trade.followedPlan !== false ? (isVi ? "✓ Đúng Quy Tắc" : "✓ Followed Rules") : (isVi ? "✕ Vi Phạm Kế Hoạch" : "✕ Plan Violated")}
              </span>
            </div>
          </div>

          {trade.notes && (
            <div className="p-3 rounded-xl bg-bg-surface-subtle border border-border/60 text-xs text-txt-primary whitespace-pre-wrap font-sans">
              {trade.notes}
            </div>
          )}
        </div>

        {/* Screenshot Attachment */}
        {trade.screenshotBeforeUrl && (
          <div className="bg-bg-surface p-4 rounded-2xl border border-border space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-txt-primary">
              <ImageIcon className="w-4 h-4 text-sky-400" />
              <span>{isVi ? "Ảnh Chụp Biểu Đồ Thiết Lập" : "Chart Execution Screenshot"}</span>
            </div>
            <div className="rounded-xl overflow-hidden border border-border bg-black max-h-64 flex items-center justify-center">
              <img
                src={trade.screenshotBeforeUrl}
                alt="Trade setup chart"
                className="w-full object-contain"
              />
            </div>
          </div>
        )}

        {/* AI Trade Audit Section */}
        <div className="p-5 rounded-2xl bg-bg-surface border border-sky-500/30 space-y-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-sky-500/50 to-transparent" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/30">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-txt-primary uppercase tracking-wider font-mono">
                  {isVi ? "Kiểm Toán AI & Điểm Chất Lượng Lệnh" : "AI Trade Audit & Quality Score"}
                </h4>
                <span className="text-[10px] text-txt-muted">
                  {isVi ? "Đánh giá tự động quy tắc & rủi ro" : "Automated rule & execution review"}
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleRunAIAudit}
              isLoading={isAuditing}
              className="border-sky-500/40 text-sky-400 hover:bg-sky-500/10"
            >
              <Sparkles className="w-3 h-3 mr-1 text-sky-400" />
              {aiAudit ? (isVi ? "Kiểm Toán Lại" : "Re-Audit") : (isVi ? "Chạy Kiểm Toán AI" : "Run AI Audit")}
            </Button>
          </div>

          {aiAudit ? (
            <div className="space-y-3 pt-2 text-xs">
              {/* Score Pills */}
              <div className="grid grid-cols-3 gap-2 text-center font-mono">
                <div className="p-2.5 bg-bg-surface-subtle rounded-xl border border-border/60">
                  <span className="text-[10px] text-txt-muted block uppercase font-medium">{isVi ? "Tổng Thể" : "Overall"}</span>
                  <span className="text-base font-bold text-sky-400">{aiAudit.overallScore}/100</span>
                </div>
                <div className="p-2.5 bg-bg-surface-subtle rounded-xl border border-border/60">
                  <span className="text-[10px] text-txt-muted block uppercase font-medium">{isVi ? "Điểm Vào" : "Entry"}</span>
                  <span className="text-base font-bold text-txt-primary">{aiAudit.entryQualityScore}/100</span>
                </div>
                <div className="p-2.5 bg-bg-surface-subtle rounded-xl border border-border/60">
                  <span className="text-[10px] text-txt-muted block uppercase font-medium">{isVi ? "Quản Trị Rủi Ro" : "Risk"}</span>
                  <span className="text-base font-bold text-txt-primary">{aiAudit.riskManagementScore}/100</span>
                </div>
              </div>

              {/* Strengths */}
              {aiAudit.strengths?.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-gain flex items-center gap-1 font-mono">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {isVi ? "Điểm Mạnh:" : "Strengths:"}
                  </span>
                  <ul className="list-disc list-inside text-txt-secondary space-y-0.5 pl-1 font-sans">
                    {aiAudit.strengths.map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Mistakes & Recommendations */}
              {aiAudit.recommendations?.length > 0 && (
                <div className="space-y-1 pt-2 border-t border-border/60">
                  <span className="text-[11px] font-bold text-sky-400 flex items-center gap-1 font-mono">
                    <AlertTriangle className="w-3.5 h-3.5" /> {isVi ? "Khuyến Nghị Cải Thiện:" : "Actionable Recommendations:"}
                  </span>
                  <ul className="list-disc list-inside text-txt-secondary space-y-0.5 pl-1 font-sans">
                    {aiAudit.recommendations.map((r, idx) => (
                      <li key={idx}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-txt-muted italic font-sans">
              {isVi
                ? "Bấm \"Chạy Kiểm Toán AI\" để hệ thống tự động đánh giá mức độ tuân thủ rủi ro, điểm vào và tâm lý giao dịch."
                : "Click \"Run AI Audit\" to perform an automated risk, discipline, and execution audit for this trade."}
            </p>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-border/60 flex items-center justify-between">
          <Button
            variant="danger"
            size="md"
            onClick={handleDeleteTrade}
            isLoading={isDeleting}
          >
            <Trash2 className="w-4 h-4 mr-1.5" />
            {isVi ? "Xóa Bản Ghi Lệnh" : "Delete Trade"}
          </Button>

          {onEdit && (
            <Button
              variant="secondary"
              size="md"
              onClick={() => {
                onClose();
                onEdit(trade);
              }}
            >
              {isVi ? "Chỉnh Sửa Thông Tin" : "Edit Trade Details"}
            </Button>
          )}
        </div>
      </div>
    </Drawer>
  );
};
