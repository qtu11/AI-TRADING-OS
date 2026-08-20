"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Trade, TradeDirection, TradeSession } from "@/types/trade.types";
import { APP_CONFIG } from "@/config/app.config";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { saveTrade } from "@/lib/firebase/db-service";
import { formatCurrency } from "@/lib/utils/currency";
import { soundFX } from "@/lib/sound/sound-effects";
import { ArrowUpRight, ArrowDownRight, Sparkles, Check, X } from "lucide-react";

export interface TradeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTrade?: Trade | null;
  onSaved?: () => void;
}

export const TradeFormModal: React.FC<TradeFormModalProps> = ({
  isOpen,
  onClose,
  initialTrade,
  onSaved,
}) => {
  const { userProfile } = useAuth();
  const { language } = useLanguage();
  const isVi = language === "vi";
  const userId = userProfile?.id || "dev-trader-01";

  const [symbol, setSymbol] = useState("EURUSD");
  const [direction, setDirection] = useState<TradeDirection>("BUY");
  const [lots, setLots] = useState("1.0");
  const [openPrice, setOpenPrice] = useState("1.0800");
  const [closePrice, setClosePrice] = useState("1.0850");
  const [stopLoss, setStopLoss] = useState("1.0770");
  const [takeProfit, setTakeProfit] = useState("1.0860");
  const [session, setSession] = useState<TradeSession>("London");
  const [strategyName, setStrategyName] = useState("Day Trading");
  const [netProfit, setNetProfit] = useState("500");
  const [notes, setNotes] = useState("");
  const [preTradeEmotion, setPreTradeEmotion] = useState("Calm");
  const [followedPlan, setFollowedPlan] = useState(true);
  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialTrade) {
      setSymbol(initialTrade.symbol);
      setDirection(initialTrade.direction);
      setLots(String(initialTrade.lots));
      setOpenPrice(String(initialTrade.openPrice));
      setClosePrice(initialTrade.closePrice ? String(initialTrade.closePrice) : "");
      setStopLoss(String(initialTrade.stopLoss));
      setTakeProfit(String(initialTrade.takeProfit));
      setSession(initialTrade.session);
      setStrategyName(initialTrade.strategyName || "Day Trading");
      setNetProfit(initialTrade.netProfit !== undefined ? String(initialTrade.netProfit) : "0");
      setNotes(initialTrade.notes || "");
      setPreTradeEmotion(initialTrade.preTradeEmotion || "Calm");
      setFollowedPlan(initialTrade.followedPlan ?? true);
      setScreenshotUrl(initialTrade.screenshotBeforeUrl || "");
    } else {
      // Default reset
      setSymbol("EURUSD");
      setDirection("BUY");
      setLots("1.0");
      setOpenPrice("1.0800");
      setClosePrice("1.0850");
      setStopLoss("1.0770");
      setTakeProfit("1.0860");
      setSession("London");
      setStrategyName("Day Trading");
      setNetProfit("500");
      setNotes("");
      setPreTradeEmotion("Calm");
      setFollowedPlan(true);
      setScreenshotUrl("");
    }
  }, [initialTrade, isOpen]);

  // Auto calculate R:R
  const numOpen = Number(openPrice);
  const numSL = Number(stopLoss);
  const numTP = Number(takeProfit);
  const numClose = Number(closePrice);

  const slDistance = Math.abs(numOpen - numSL);
  const tpDistance = Math.abs(numTP - numOpen);
  const plannedRR = slDistance > 0 && tpDistance > 0 ? Number((tpDistance / slDistance).toFixed(2)) : 1.5;

  let achievedRR = plannedRR;
  if (numClose && numClose !== numOpen && slDistance > 0) {
    const actualDistance = Math.abs(numClose - numOpen);
    const isProfit = (direction === "BUY" && numClose > numOpen) || (direction === "SELL" && numClose < numOpen);
    achievedRR = isProfit ? Number((actualDistance / slDistance).toFixed(2)) : -1.0;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const nowIso = new Date().toISOString();
      const pnlNum = Number(netProfit);

      const tradeData: Trade = {
        id: initialTrade?.id || `trade-${Date.now()}`,
        userId,
        symbol: symbol.toUpperCase(),
        direction,
        status: closePrice ? "CLOSED" : "OPEN",
        lots: Number(lots) || 0.1,
        openPrice: Number(openPrice) || 0,
        closePrice: closePrice ? Number(closePrice) : undefined,
        stopLoss: Number(stopLoss) || 0,
        takeProfit: Number(takeProfit) || 0,
        openTime: initialTrade?.openTime || nowIso,
        closeTime: closePrice ? (initialTrade?.closeTime || nowIso) : undefined,
        netProfit: pnlNum,
        grossProfit: pnlNum > 0 ? pnlNum : 0,
        riskRewardRatio: achievedRR,
        plannedRiskReward: plannedRR,
        outcome: pnlNum > 0 ? "WIN" : pnlNum < 0 ? "LOSS" : "BREAKEVEN",
        session,
        strategyName,
        notes,
        preTradeEmotion,
        followedPlan,
        screenshotBeforeUrl: screenshotUrl || undefined,
        source: "MANUAL",
        createdAt: initialTrade?.createdAt || nowIso,
        updatedAt: nowIso,
      };

      await saveTrade(userId, tradeData);
      soundFX.playSuccess();
      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      console.error("Save trade error:", err);
      soundFX.playWarning();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialTrade ? (isVi ? `Chỉnh Sửa Lệnh #${initialTrade.id.slice(-6)}` : `Edit Trade #${initialTrade.id.slice(-6)}`) : (isVi ? "Ghi Nhận Lệnh Giao Dịch Mới" : "Log New Trade Execution")}
      description={isVi ? "Ghi nhận thông số lệnh, giá vào/ra, tâm lý và kết quả thực thi." : "Record authentic trade parameters, execution prices, psychology, and risk outcome."}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Symbol, Direction, Session */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label={isVi ? "Cặp Tiền / Công Cụ" : "Symbol / Pair"}
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            placeholder="EURUSD, XAUUSD..."
            required
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-txt-primary">
              {isVi ? "Hướng Lệnh" : "Direction"}
            </label>
            <div className="flex rounded-xl bg-bg-surface-subtle p-1 border border-border">
              <button
                type="button"
                onClick={() => {
                  soundFX.playClick(850);
                  setDirection("BUY");
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  direction === "BUY" ? "bg-gain text-white shadow-sm" : "text-txt-muted hover:text-txt-primary"
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                MUA (BUY)
              </button>
              <button
                type="button"
                onClick={() => {
                  soundFX.playClick(650);
                  setDirection("SELL");
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  direction === "SELL" ? "bg-loss text-white shadow-sm" : "text-txt-muted hover:text-txt-primary"
                }`}
              >
                <ArrowDownRight className="w-3.5 h-3.5" />
                BÁN (SELL)
              </button>
            </div>
          </div>

          <Select
            label={isVi ? "Phiên Giao Dịch" : "Trading Session"}
            value={session}
            onChange={(e) => {
              soundFX.playSwitch();
              setSession(e.target.value as TradeSession);
            }}
            options={[
              { value: "London", label: "London Session" },
              { value: "New York", label: "New York Session" },
              { value: "London+NY", label: "London / NY Overlap" },
              { value: "Asian", label: "Asian (Tokyo/Sydney)" },
            ]}
          />
        </div>

        {/* Lots, Open, Close */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label={isVi ? "Khối Lượng (Lots)" : "Position Size (Lots)"}
            type="number"
            step="0.01"
            value={lots}
            onChange={(e) => setLots(e.target.value)}
            placeholder="1.0"
            required
          />

          <Input
            label={isVi ? "Giá Vào Lệnh (Entry)" : "Entry Open Price"}
            type="number"
            step="0.00001"
            value={openPrice}
            onChange={(e) => setOpenPrice(e.target.value)}
            placeholder="1.0800"
            required
          />

          <Input
            label={isVi ? "Giá Đóng Lệnh (Nếu Đã Đóng)" : "Exit Close Price (Optional)"}
            type="number"
            step="0.00001"
            value={closePrice}
            onChange={(e) => setClosePrice(e.target.value)}
            placeholder={isVi ? "Để trống nếu lệnh đang mở" : "Leave empty if open"}
          />
        </div>

        {/* SL, TP, Net P&L */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label={isVi ? "Dừng Lỗ (SL)" : "Stop Loss (SL)"}
            type="number"
            step="0.00001"
            value={stopLoss}
            onChange={(e) => setStopLoss(e.target.value)}
            placeholder="1.0770"
            required
          />

          <Input
            label={isVi ? "Chốt Lời (TP)" : "Take Profit (TP)"}
            type="number"
            step="0.00001"
            value={takeProfit}
            onChange={(e) => setTakeProfit(e.target.value)}
            placeholder="1.0860"
            required
          />

          <Input
            label={isVi ? "Lợi Nhuận / Lỗ ($)" : "Net Profit / Loss ($)"}
            type="number"
            step="0.01"
            value={netProfit}
            onChange={(e) => setNetProfit(e.target.value)}
            placeholder="+500 or -200"
            required
          />
        </div>

        {/* Strategy, Emotion, Plan Followed */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label={isVi ? "Chiến Lược Giao Dịch" : "Strategy Setup"}
            value={strategyName}
            onChange={(e) => setStrategyName(e.target.value)}
            placeholder="SMC, ICT, Breakout..."
          />

          <Select
            label={isVi ? "Cảm Xúc Trước Vào Lệnh" : "Pre-Trade Emotion"}
            value={preTradeEmotion}
            onChange={(e) => {
              soundFX.playSwitch();
              setPreTradeEmotion(e.target.value);
            }}
            options={[
              { value: "Calm", label: isVi ? "Bình Tĩnh & Tập Trung" : "Calm & Focused" },
              { value: "Confident", label: isVi ? "Rất Tự Tin" : "Highly Confident" },
              { value: "FOMO", label: isVi ? "Cảm Thấy FOMO / Vội Vã" : "FOMO / Anxious" },
              { value: "Greedy", label: isVi ? "Tham Lam / Nóng Vội" : "Greedy / Impatient" },
              { value: "Revenge", label: isVi ? "Tâm Lý Trả Thù" : "Revenge Mindset" },
            ]}
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-txt-primary">
              {isVi ? "Tuân Thủ Kế Hoạch" : "Plan Adherence"}
            </label>
            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                setFollowedPlan(!followedPlan);
              }}
              className={`w-full py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                followedPlan
                  ? "bg-gain-subtle text-gain border-gain/40"
                  : "bg-loss-subtle text-loss border-loss/40"
              }`}
            >
              {followedPlan ? (isVi ? "✓ Tuân Thủ Kế Hoạch" : "✓ Followed Plan Rules") : (isVi ? "✕ Vi Phạm Quy Tắc" : "✕ Violated Plan Rules")}
            </button>
          </div>
        </div>

        {/* Screenshot URL & Notes */}
        <Input
          label={isVi ? "Đường Dẫn Ảnh Biểu Đồ (Screenshot URL)" : "Chart Screenshot URL"}
          value={screenshotUrl}
          onChange={(e) => setScreenshotUrl(e.target.value)}
          placeholder="https://... or image link"
        />

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-txt-primary">
            {isVi ? "Ghi Chú Thực Thi & Lý Do Vào Lệnh" : "Execution & Strategy Notes"}
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={isVi ? "Tại sao bạn vào lệnh? Khung thời gian nào xác nhận? Vùng thanh khoản nào?" : "Why did you enter? Key confluence? Support/Resistance levels watched?"}
            className="w-full bg-bg-surface-subtle border border-border rounded-xl p-3 text-xs text-txt-primary placeholder-txt-muted focus:outline-none focus:border-brand-500 font-sans"
          />
        </div>

        {/* Calculated Preview Footer */}
        <div className="p-3 bg-bg-surface-subtle rounded-xl border border-border/60 flex items-center justify-between text-xs font-mono">
          <span className="text-txt-muted">{isVi ? "Kế hoạch R:R: " : "Planned R:R: "}<strong className="text-txt-primary">{plannedRR}R</strong></span>
          <span className="text-txt-muted">{isVi ? "Thực tế R:R: " : "Achieved R:R: "}<strong className={achievedRR >= 1 ? "text-gain" : "text-loss"}>{achievedRR}R</strong></span>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/60">
          <Button variant="ghost" size="md" type="button" onClick={onClose}>
            {isVi ? "Hủy Bỏ" : "Cancel"}
          </Button>
          <Button variant="primary" size="md" type="submit" isLoading={isLoading}>
            {initialTrade ? (isVi ? "Cập Nhật Lệnh" : "Update Trade") : (isVi ? "Lưu Lệnh Giao Dịch" : "Save Trade Record")}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
