"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Slider } from "@/components/ui/Slider";
import { RealismGauge } from "./RealismGauge";
import { TradingPlan, PlanDurationMonths } from "@/types/plan.types";
import { APP_CONFIG } from "@/config/app.config";
import { calculatePlanFeasibility, generatePlanMilestones } from "@/lib/math/plan-engine";
import { saveTradingPlan } from "@/lib/firebase/db-service";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { soundFX } from "@/lib/sound/sound-effects";
import { Target, CheckCircle2, Shield, Calendar, Layers } from "lucide-react";

export interface PlanBuilderWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onPlanCreated?: () => void;
}

export const PlanBuilderWizard: React.FC<PlanBuilderWizardProps> = ({
  isOpen,
  onClose,
  onPlanCreated,
}) => {
  const { userProfile } = useAuth();
  const { language } = useLanguage();
  const isVi = language === "vi";
  const userId = userProfile?.id || "dev-trader-01";

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [planName, setPlanName] = useState(isVi ? "Chu Kỳ Giao Dịch Tăng Trưởng Vốn" : "Trading Growth Cycle");
  const [durationMonths, setDurationMonths] = useState<PlanDurationMonths>(3);
  const [startingCapital, setStartingCapital] = useState(userProfile?.startingCapital ?? 0);
  const [targetProfit, setTargetProfit] = useState(0);

  // Risk profile & limits
  const [riskProfile, setRiskProfile] = useState<"conservative" | "moderate" | "aggressive">("moderate");
  const [riskPerTradePercent, setRiskPerTradePercent] = useState(0.5);
  const [maxDailyLossPercent, setMaxDailyLossPercent] = useState(1.5);
  const [maxTradesPerDay, setMaxTradesPerDay] = useState(3);

  // Sessions & Instruments
  const [allowedSessions, setAllowedSessions] = useState<Array<"Asian" | "London" | "New York" | "Sydney">>([
    "London",
    "New York",
  ]);
  const [allowedSymbols, setAllowedSymbols] = useState<string[]>(["EURUSD", "GBPUSD", "XAUUSD"]);
  const [strategyName, setStrategyName] = useState("Smart Money Concepts (SMC)");
  const [isLoading, setIsLoading] = useState(false);

  // Live Realism Calculation
  const feasibility = calculatePlanFeasibility({
    startingCapital,
    targetProfit,
    durationMonths,
    riskPerTradePercent,
    maxDailyLossPercent,
    maxTradesPerDay,
  });

  const toggleSession = (sess: "Asian" | "London" | "New York" | "Sydney") => {
    soundFX.playClick();
    setAllowedSessions((prev) =>
      prev.includes(sess) ? prev.filter((s) => s !== sess) : [...prev, sess]
    );
  };

  const toggleSymbol = (sym: string) => {
    soundFX.playClick();
    setAllowedSymbols((prev) =>
      prev.includes(sym) ? prev.filter((s) => s !== sym) : [...prev, sym]
    );
  };

  const handleCreatePlan = async () => {
    setIsLoading(true);
    try {
      const nowIso = new Date().toISOString();
      const planId = `plan-${Date.now()}`;
      const startDate = nowIso.split("T")[0];

      const endDateObj = new Date();
      endDateObj.setMonth(endDateObj.getMonth() + durationMonths);
      const endDate = endDateObj.toISOString().split("T")[0];

      const milestones = generatePlanMilestones(planId, targetProfit, durationMonths, startDate, language);

      const newPlan: TradingPlan = {
        id: planId,
        userId,
        name: planName,
        status: "ACTIVE",
        startingCapital,
        targetCapital: startingCapital + targetProfit,
        targetProfit,
        durationMonths,
        startDate,
        endDate,
        riskProfile,
        riskPerTradePercent,
        maxDailyLossPercent,
        maxTradesPerDay,
        allowedSessions,
        allowedTradingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        allowedSymbols,
        strategyIds: [strategyName],
        requiredTotalReturnPercent: feasibility.requiredTotalReturnPercent,
        requiredMonthlyReturnPercent: feasibility.requiredMonthlyReturnPercent,
        requiredWeeklyReturnPercent: feasibility.requiredWeeklyReturnPercent,
        requiredDailyReturnDollars: feasibility.requiredDailyReturnDollars,
        feasibilityScore: feasibility.feasibilityScore,
        feasibilityRating: feasibility.feasibilityRating,
        riskOfRuinPercent: feasibility.riskOfRuinPercent,
        maxDrawdownProjectedPercent: feasibility.maxDrawdownProjectedPercent,
        expectedLosingStreak: feasibility.expectedLosingStreak,
        aiRecommendation: feasibility.recommendedAdjustment,
        milestones,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      await saveTradingPlan(newPlan);
      soundFX.playSuccess();
      if (onPlanCreated) onPlanCreated();
      onClose();
    } catch (err) {
      console.error("Failed to create plan:", err);
      soundFX.playWarning();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isVi ? "Thiết Lập Kế Hoạch Giao Dịch & Chu Kỳ Chiến Lược" : "Create Trading Plan & Strategy Cycle"}
      description={isVi ? "Thiết kế kế hoạch toán học có căn cứ, mục tiêu thực tế và cột mốc tự động." : "Design a mathematically grounded trading framework with realistic targets and automated milestones."}
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Step Indicator */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
          <button
            onClick={() => {
              soundFX.playSwitch();
              setStep(1);
            }}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              step === 1
                ? "bg-brand-500/20 text-brand-400 border-brand-500/50 font-bold"
                : "bg-bg-surface-subtle text-txt-muted border-border"
            }`}
          >
            {isVi ? "1. Vốn & Mục Tiêu" : "1. Capital & Targets"}
          </button>
          <button
            onClick={() => {
              soundFX.playSwitch();
              setStep(2);
            }}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              step === 2
                ? "bg-brand-500/20 text-brand-400 border-brand-500/50 font-bold"
                : "bg-bg-surface-subtle text-txt-muted border-border"
            }`}
          >
            {isVi ? "2. Rủi Ro & Ràng Buộc" : "2. Risk & Constraints"}
          </button>
          <button
            onClick={() => {
              soundFX.playSwitch();
              setStep(3);
            }}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              step === 3
                ? "bg-brand-500/20 text-brand-400 border-brand-500/50 font-bold"
                : "bg-bg-surface-subtle text-txt-muted border-border"
            }`}
          >
            {isVi ? "3. Kiểm Tra Khả Thi" : "3. Feasibility Review"}
          </button>
        </div>

        {/* STEP 1: Capital & Targets */}
        {step === 1 && (
          <div className="space-y-4">
            <Input
              label={isVi ? "Tên Chu Kỳ Kế Hoạch" : "Plan Cycle Name"}
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              placeholder={isVi ? "vd: Kế hoạch Tăng Trưởng Q3" : "e.g. Q3 Compounding Cycle"}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label={isVi ? "Vốn Khởi Điểm ($)" : "Starting Capital ($)"}
                type="number"
                value={startingCapital}
                onChange={(e) => setStartingCapital(Number(e.target.value))}
                required
              />

              <Input
                label={isVi ? "Mục Tiêu Lợi Nhuận Ròng ($)" : "Target Net Profit ($)"}
                type="number"
                value={targetProfit}
                onChange={(e) => setTargetProfit(Number(e.target.value))}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-txt-primary">
                {isVi ? "Thời Gian Chu Kỳ Kế Hoạch" : "Plan Duration"}
              </label>
              <div className="grid grid-cols-5 gap-2 font-mono text-xs">
                {([1, 3, 6, 9, 12] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      soundFX.playSwitch();
                      setDurationMonths(m);
                    }}
                    className={`py-2 rounded-xl border font-bold transition-all cursor-pointer ${
                      durationMonths === m
                        ? "bg-brand-500 text-white border-brand-500 shadow-sm"
                        : "bg-bg-surface-subtle text-txt-secondary border-border hover:bg-bg-surface-hover"
                    }`}
                  >
                    {m} {isVi ? "Tháng" : `Month${m > 1 ? "s" : ""}`}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  soundFX.playSwitch();
                  setStep(2);
                }}
              >
                {isVi ? "Tiếp Theo: Tham Số Rủi Ro →" : "Next: Risk Parameters →"}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: Risk & Execution Rules */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {(["conservative", "moderate", "aggressive"] as const).map((prof) => (
                <button
                  key={prof}
                  type="button"
                  onClick={() => {
                    soundFX.playSwitch();
                    setRiskProfile(prof);
                    if (prof === "conservative") {
                      setRiskPerTradePercent(0.25);
                      setMaxDailyLossPercent(1.0);
                      setMaxTradesPerDay(2);
                    } else if (prof === "moderate") {
                      setRiskPerTradePercent(0.5);
                      setMaxDailyLossPercent(1.5);
                      setMaxTradesPerDay(3);
                    } else {
                      setRiskPerTradePercent(1.0);
                      setMaxDailyLossPercent(3.0);
                      setMaxTradesPerDay(5);
                    }
                  }}
                  className={`p-3.5 rounded-xl border text-left capitalize transition-all cursor-pointer ${
                    riskProfile === prof
                      ? "bg-brand-500/20 text-txt-primary border-brand-500/60 shadow-sm"
                      : "bg-bg-surface-subtle text-txt-muted border-border hover:bg-bg-surface-hover"
                  }`}
                >
                  <span className="text-xs font-bold block text-txt-primary">
                    {prof === "conservative" ? (isVi ? "Thận Trọng" : "Conservative") : prof === "moderate" ? (isVi ? "Cân Bằng" : "Moderate") : (isVi ? "Tấn Công" : "Aggressive")}
                  </span>
                  <span className="text-[10px] text-txt-muted block mt-0.5 font-mono">
                    {prof === "conservative" ? "0.25% risk / trade" : prof === "moderate" ? "0.5% risk / trade" : "1.0% risk / trade"}
                  </span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <Slider
                label={isVi ? "Rủi Ro Mỗi Lệnh (%)" : "Risk per Trade (%)"}
                min={0.1}
                max={2.5}
                step={0.05}
                value={riskPerTradePercent}
                onChange={setRiskPerTradePercent}
                valueSuffix="%"
              />

              <Slider
                label={isVi ? "Giới Hạn Lỗ Ngày Tối Đa (%)" : "Daily Max Loss Limit (%)"}
                min={0.5}
                max={5.0}
                step={0.1}
                value={maxDailyLossPercent}
                onChange={setMaxDailyLossPercent}
                valueSuffix="%"
              />
            </div>

            {/* Allowed Sessions */}
            <div className="space-y-1.5 pt-2">
              <label className="block text-xs font-semibold text-txt-primary">
                {isVi ? "Các Phiên Được Phép Giao Dịch" : "Permitted Sessions"}
              </label>
              <div className="flex flex-wrap gap-2">
                {(["Asian", "London", "New York", "Sydney"] as const).map((sess) => (
                  <button
                    key={sess}
                    type="button"
                    onClick={() => toggleSession(sess)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      allowedSessions.includes(sess)
                        ? "bg-sky-500/20 text-sky-400 border-sky-500/50"
                        : "bg-bg-surface-subtle text-txt-muted border-border hover:text-txt-primary"
                    }`}
                  >
                    {allowedSessions.includes(sess) ? "✓ " : "+ "}
                    {sess} {isVi ? "Phiên" : ""}
                  </button>
                ))}
              </div>
            </div>

            {/* Permitted Symbols */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-txt-primary">
                {isVi ? "Các Cặp Tiền / Công Cụ Cho Phép" : "Permitted Instruments"}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {APP_CONFIG.instruments.map((inst) => (
                  <button
                    key={inst.symbol}
                    type="button"
                    onClick={() => toggleSymbol(inst.symbol)}
                    className={`px-3 py-1 rounded-lg border text-xs font-mono font-bold transition-all cursor-pointer ${
                      allowedSymbols.includes(inst.symbol)
                        ? "bg-brand-500/20 text-brand-400 border-brand-500/50"
                        : "bg-bg-surface-subtle text-txt-muted border-border hover:text-txt-primary"
                    }`}
                  >
                    {inst.symbol}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <Button
                variant="secondary"
                size="md"
                onClick={() => {
                  soundFX.playSwitch();
                  setStep(1);
                }}
              >
                {isVi ? "← Quay Lại" : "← Back"}
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  soundFX.playSwitch();
                  setStep(3);
                }}
              >
                {isVi ? "Tiếp Theo: Xem Đánh Giá Khả Thi →" : "Next: Review Feasibility →"}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Realism & Feasibility Review */}
        {step === 3 && (
          <div className="space-y-4">
            <RealismGauge
              feasibility={feasibility}
              startingCapital={startingCapital}
              targetProfit={targetProfit}
            />

            <div className="p-4 bg-bg-surface-subtle rounded-xl border border-border/60 text-xs font-mono space-y-1.5 text-txt-secondary">
              <div className="flex justify-between">
                <span className="text-txt-muted">{isVi ? "Tổng thời gian:" : "Total Duration:"}</span>
                <span className="text-txt-primary">{durationMonths} {isVi ? "Tháng" : "Months"} (~{feasibility.totalTradingDaysEstimated} {isVi ? "Ngày Giao Dịch" : "Trading Days"})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-txt-muted">{isVi ? "Vốn Mục Tiêu Cuối Chu Kỳ:" : "Target Capital:"}</span>
                <span className="text-gain font-bold">${(startingCapital + targetProfit).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-txt-muted">{isVi ? "Cột mốc chia nhỏ hàng tháng:" : "Monthly Milestones:"}</span>
                <span className="text-txt-primary">{durationMonths} {isVi ? "Cột Mốc Hàng Tháng" : "Monthly Target Slices"}</span>
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <Button
                variant="secondary"
                size="md"
                onClick={() => {
                  soundFX.playSwitch();
                  setStep(2);
                }}
              >
                {isVi ? "← Quay Lại" : "← Back"}
              </Button>
              <Button variant="ai" size="md" onClick={handleCreatePlan} isLoading={isLoading}>
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                {isVi ? "Kích Hoạt Kế Hoạch Giao Dịch" : "Activate Trading Plan"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
