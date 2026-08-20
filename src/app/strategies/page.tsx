"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { Strategy } from "@/types/strategy.types";
import { getUserStrategies, saveStrategy } from "@/lib/firebase/db-service";
import { soundFX } from "@/lib/sound/sound-effects";
import { Layers, PlusCircle, Award, CheckCircle2, Shield, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { deleteStrategy } from "@/lib/firebase/db-service";

export default function StrategiesPage() {
  const { userProfile } = useAuth();
  const { language, t } = useLanguage();
  const userId = userProfile?.id || "dev-trader-01";

  const isVi = language === "vi";

  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [timeframe, setTimeframe] = useState("15m");
  const [entryRules, setEntryRules] = useState("");
  const [stopLossRules, setStopLossRules] = useState("");

  const loadStrategies = async () => {
    try {
      const list = await getUserStrategies(userId);
      setStrategies(list);
    } catch (err) {
      console.warn("Load strategies error:", err);
    }
  };

  useEffect(() => {
    if (userId) loadStrategies();
  }, [userId]);

  const handleDeleteStrategy = async (strategyId: string) => {
    if (!confirm(isVi ? "Bạn có chắc chắn muốn xóa chiến lược này không?" : "Are you sure you want to delete this strategy setup?")) return;
    soundFX.playClick(500);
    await deleteStrategy(userId, strategyId);
    setStrategies((prev) => prev.filter((s) => s.id !== strategyId));
  };

  const handleSaveStrategy = async (e: React.FormEvent) => {
    e.preventDefault();
    const strat: Strategy = {
      id: `strat-${Date.now()}`,
      userId,
      name,
      description,
      marketType: "FOREX",
      timeframe,
      entryConditions: entryRules.split("\n").filter(Boolean),
      exitConditions: [],
      stopLossRules,
      takeProfitRules: "1:2 R:R target",
      riskRules: "0.5% per trade",
      invalidationConditions: [],
      exampleChartUrls: [],
      totalTrades: 0,
      winRate: 0,
      profitFactor: 0,
      expectancy: 0,
      netProfit: 0,
      averageRiskReward: 0,
      maxDrawdown: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveStrategy(strat);
    soundFX.playSuccess();
    setIsModalOpen(false);
    loadStrategies();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-bg-surface border border-border shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-txt-primary flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-500/15 text-brand-500 border border-brand-500/30">
              <Layers className="w-5 h-5" />
            </div>
            <span>{isVi ? "Sổ Tay Chiến Lược & Quy Tắc Thực Thi" : "Strategy Playbook & Execution Rules"}</span>
          </h1>
          <p className="text-xs text-txt-secondary mt-1 font-mono">
            {isVi
              ? "Định nghĩa tiêu chuẩn vào lệnh, điểm vô hiệu hóa và theo dõi kỳ vọng toán học của từng chiến lược."
              : "Define edge criteria, entry/exit invalidation triggers, and track per-strategy mathematical expectancy."}
          </p>
        </div>

        <Button variant="primary" size="md" onClick={() => setIsModalOpen(true)}>
          <PlusCircle className="w-4 h-4 mr-2" />
          {isVi ? "Tạo Chiến Lược Mới" : "Create New Strategy"}
        </Button>
      </div>

      {strategies.length === 0 ? (
        <div className="bento-card p-10 sm:p-14 text-center space-y-3 relative overflow-hidden">
          <div className="w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-500/25 flex items-center justify-center text-brand-400 mx-auto">
            <Layers className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-txt-primary">
            {isVi ? "Chưa Có Chiến Lược Tùy Chỉnh Nào" : "No Custom Strategies Defined"}
          </h3>
          <p className="text-xs text-txt-secondary max-w-md mx-auto leading-relaxed">
            {isVi
              ? "Xây dựng các hệ thống giao dịch có tính lặp lại (vd: SMC Order Blocks, Phá vỡ London, ICT FVG) để theo dõi tỷ lệ thắng chính xác."
              : "Build your systematic trading setups (e.g. SMC Order Blocks, London Breakouts, ICT FVG) to track specific win rates."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {strategies.map((s) => (
            <div key={s.id} className="bento-card p-5 sm:p-6 space-y-3 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-brand-500/50 to-transparent" />
              <div className="space-y-2.5">
                <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
                  <span className="text-sm font-bold text-txt-primary">{s.name}</span>
                  <span className="text-[10px] font-mono bg-bg-surface-subtle text-txt-secondary px-2.5 py-0.5 rounded-md border border-border font-semibold">
                    {s.timeframe}
                  </span>
                </div>
                <p className="text-xs text-txt-secondary font-sans leading-relaxed">{s.description}</p>
                <div className="text-xs font-mono space-y-1 pt-2 border-t border-border/60">
                  <span className="text-[10px] text-txt-muted block uppercase font-medium">
                    {isVi ? "Quy Tắc Dừng Lỗ" : "Stop Loss Criteria"}
                  </span>
                  <span className="text-txt-primary">{s.stopLossRules}</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end border-t border-border/60">
                <button
                  type="button"
                  onClick={() => handleDeleteStrategy(s.id)}
                  className="text-txt-muted hover:text-loss text-xs font-mono flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {isVi ? "Xóa" : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal create strategy */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isVi ? "Định Nghĩa Quy Tắc Chiến Lược Mới" : "Define Strategy Playbook Rule"}
      >
        <form onSubmit={handleSaveStrategy} className="space-y-4">
          <Input
            label={isVi ? "Tên Chiến Lược" : "Strategy Name"}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={isVi ? "vd: Quét thanh khoản phiên London" : "e.g. London Session Liquidity Sweep"}
            required
          />

          <Input
            label={isVi ? "Mô Tả" : "Description"}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={isVi ? "vd: Kết hợp Order Block 15m cùng thanh khoản mở cửa London" : "e.g. 15m order block confluence with London open volatility"}
            required
          />

          <Select
            label={isVi ? "Khung Thời Gian Cơ Sở" : "Base Timeframe"}
            value={timeframe}
            onChange={(e) => {
              soundFX.playSwitch();
              setTimeframe(e.target.value);
            }}
            options={[
              { value: "5m", label: "5-Minute (M5)" },
              { value: "15m", label: "15-Minute (M15)" },
              { value: "1h", label: "1-Hour (H1)" },
              { value: "4h", label: "4-Hour (H4)" },
              { value: "Daily", label: "Daily (D1)" },
            ]}
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-txt-primary">
              {isVi ? "Điều Kiện Vào Lệnh (Mỗi dòng 1 điều kiện)" : "Entry Conditions (One per line)"}
            </label>
            <textarea
              rows={3}
              value={entryRules}
              onChange={(e) => setEntryRules(e.target.value)}
              placeholder={isVi ? "1. Đỉnh/đáy phiên Á bị quét\n2. Nến đảo chiều mạnh trên M5\n3. Retest vùng FVG" : "1. Asian range high/low swept\n2. M5 displacement candle\n3. Fair Value Gap retest"}
              className="w-full bg-bg-surface-subtle border border-border rounded-xl p-3 text-xs text-txt-primary placeholder-txt-muted focus:outline-none focus:border-brand-500 font-sans"
            />
          </div>

          <Input
            label={isVi ? "Quy Tắc Dừng Lỗ & Vô Hiệu Hóa" : "Stop Loss & Invalidation Rules"}
            value={stopLossRules}
            onChange={(e) => setStopLossRules(e.target.value)}
            placeholder={isVi ? "vd: Sau đỉnh/đáy đảo chiều cộng thêm 2 pip" : "e.g. Beyond swing high/low with 2 pip buffer"}
            required
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="md" type="button" onClick={() => setIsModalOpen(false)}>
              {isVi ? "Hủy" : "Cancel"}
            </Button>
            <Button variant="primary" size="md" type="submit">
              {isVi ? "Lưu Chiến Lược" : "Save Strategy"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
