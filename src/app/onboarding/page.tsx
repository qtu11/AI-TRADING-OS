"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { APP_CONFIG } from "@/config/app.config";
import { soundFX } from "@/lib/sound/sound-effects";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Target, CheckCircle2, ArrowRight, Shield, Globe, Cpu } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const { userProfile, updateUserProfileData } = useAuth();
  const { language } = useLanguage();
  const isVi = language === "vi";

  const [step, setStep] = useState(1);
  const [experienceLevel, setExperienceLevel] = useState<"beginner" | "intermediate" | "advanced" | "pro">("intermediate");
  const [startingCapital, setStartingCapital] = useState(userProfile?.startingCapital ?? 0);
  const [tradingStyle, setTradingStyle] = useState<"scalping" | "day_trading" | "swing" | "position">("day_trading");
  const [preferredSymbols, setPreferredSymbols] = useState<string[]>(["EURUSD", "XAUUSD"]);
  const [riskProfile, setRiskProfile] = useState<"conservative" | "moderate" | "aggressive">("moderate");
  const [isLoading, setIsLoading] = useState(false);

  const toggleSymbol = (sym: string) => {
    soundFX.playClick();
    setPreferredSymbols((prev) =>
      prev.includes(sym) ? prev.filter((s) => s !== sym) : [...prev, sym]
    );
  };

  const handleFinish = async () => {
    setIsLoading(true);
    soundFX.playSuccess();
    try {
      await updateUserProfileData({
        experienceLevel,
        startingCapital,
        tradingStyle,
        preferredSymbols,
        riskProfile,
        onboardingCompleted: true,
      });
      router.push("/");
    } catch (err) {
      console.warn("Onboarding save error:", err);
      router.push("/");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-main flex flex-col justify-center items-center p-4 sm:p-6 select-none relative overflow-hidden">
      <div className="w-full max-w-xl bento-card p-6 sm:p-8 space-y-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-brand-500/50 to-transparent" />
        {/* Step Header */}
        <div className="flex items-center justify-between border-b border-border/60 pb-4">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-sky-400 font-bold block">
              {isVi ? `Bước ${step} / 5` : `Step ${step} of 5`}
            </span>
            <h2 className="text-base font-bold text-txt-primary mt-0.5">
              {step === 1 && (isVi ? "Kinh Nghiệm & Phong Cách Giao Dịch" : "Trading Experience & Style")}
              {step === 2 && (isVi ? "Vốn Khởi Điểm & Tiền Tệ" : "Starting Capital & Currency")}
              {step === 3 && (isVi ? "Danh Mục Cặp Tiền Theo Dõi Chính" : "Primary Market Watchlist")}
              {step === 4 && (isVi ? "Hồ Sơ Rủi Ro & Giới Hạn Thua Lỗ" : "Risk Profile & Loss Limits")}
              {step === 5 && (isVi ? "Kích Hoạt Bàn Làm Việc Hoạt Động" : "Activate Operating Workspace")}
            </h2>
          </div>

          <div className="w-10 h-10 rounded-xl bg-brand-500/15 text-brand-500 flex items-center justify-center font-bold font-mono text-sm border border-brand-500/30">
            {step}/5
          </div>
        </div>

        {/* Step 1: Experience & Style */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-txt-primary">{isVi ? "Mức Độ Kinh Nghiệm" : "Experience Level"}</label>
              <div className="grid grid-cols-2 gap-3">
                {(["beginner", "intermediate", "advanced", "pro"] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => {
                      soundFX.playClick();
                      setExperienceLevel(lvl);
                    }}
                    className={`p-3.5 rounded-xl border text-left capitalize text-xs font-bold transition-all cursor-pointer ${
                      experienceLevel === lvl
                        ? "bg-brand-500/20 text-txt-primary border-brand-500 shadow-sm"
                        : "bg-bg-surface-subtle text-txt-muted border-border hover:bg-bg-surface-hover"
                    }`}
                  >
                    {lvl === "beginner" ? (isVi ? "Mới Bắt Đầu (F0)" : "Beginner") : lvl === "intermediate" ? (isVi ? "Trung Cấp (1-3 Năm)" : "Intermediate") : lvl === "advanced" ? (isVi ? "Nâng Cao (3-5 Năm)" : "Advanced") : (isVi ? "Chuyên Nghiệp (5+ Năm)" : "Pro")}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-txt-primary">{isVi ? "Phong Cách Giao Dịch" : "Trading Style"}</label>
              <div className="grid grid-cols-2 gap-3">
                {(["scalping", "day_trading", "swing", "position"] as const).map((stl) => (
                  <button
                    key={stl}
                    type="button"
                    onClick={() => {
                      soundFX.playClick();
                      setTradingStyle(stl);
                    }}
                    className={`p-3.5 rounded-xl border text-left capitalize text-xs font-bold transition-all cursor-pointer ${
                      tradingStyle === stl
                        ? "bg-brand-500/20 text-txt-primary border-brand-500 shadow-sm"
                        : "bg-bg-surface-subtle text-txt-muted border-border hover:bg-bg-surface-hover"
                    }`}
                  >
                    {stl === "scalping" ? (isVi ? "Lướt Sóng Nhanh (Scalping)" : "Scalping") : stl === "day_trading" ? (isVi ? "Giao Dịch Trong Ngày (Day Trading)" : "Day Trading") : stl === "swing" ? (isVi ? "Giao Dịch Sóng (Swing Trading)" : "Swing Trading") : (isVi ? "Giao Dịch Vị Thế (Position)" : "Position")}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  soundFX.playSwitch();
                  setStep(2);
                }}
              >
                {isVi ? "Tiếp Theo: Vốn & Tiền Tệ →" : "Next: Capital & Currency →"}
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Capital */}
        {step === 2 && (
          <div className="space-y-4">
            <Input
              label={isVi ? "Số Dư Vốn Ban Đầu ($)" : "Starting Account Capital ($)"}
              type="number"
              value={startingCapital}
              onChange={(e) => setStartingCapital(Number(e.target.value))}
              required
            />

            <div className="flex justify-between pt-4">
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
                {isVi ? "Tiếp Theo: Danh Mục Cặp Tiền →" : "Next: Market Watchlist →"}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Markets */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-txt-primary">{isVi ? "Chọn Các Cặp Tiền Giao Dịch Chính" : "Select Primary Trading Pairs"}</label>
              <div className="flex flex-wrap gap-2">
                {APP_CONFIG.instruments.map((inst) => (
                  <button
                    key={inst.symbol}
                    type="button"
                    onClick={() => toggleSymbol(inst.symbol)}
                    className={`px-3 py-2 rounded-xl border font-mono text-xs font-bold transition-all cursor-pointer ${
                      preferredSymbols.includes(inst.symbol)
                        ? "bg-brand-500 text-white border-brand-500 shadow-sm"
                        : "bg-bg-surface-subtle text-txt-muted border-border hover:bg-bg-surface-hover hover:text-txt-primary"
                    }`}
                  >
                    {inst.symbol}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between pt-4">
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
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  soundFX.playSwitch();
                  setStep(4);
                }}
              >
                {isVi ? "Tiếp Theo: Hồ Sơ Rủi Ro →" : "Next: Risk Profile →"}
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Risk */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(["conservative", "moderate", "aggressive"] as const).map((prof) => (
                <button
                  key={prof}
                  type="button"
                  onClick={() => {
                    soundFX.playSwitch();
                    setRiskProfile(prof);
                  }}
                  className={`p-3.5 rounded-xl border text-left capitalize transition-all cursor-pointer ${
                    riskProfile === prof
                      ? "bg-brand-500/20 text-txt-primary border-brand-500 shadow-sm"
                      : "bg-bg-surface-subtle text-txt-muted border-border hover:bg-bg-surface-hover"
                  }`}
                >
                  <span className="text-xs font-bold block text-txt-primary font-sans">
                    {prof === "conservative" ? (isVi ? "Thận Trọng" : "Conservative") : prof === "moderate" ? (isVi ? "Cân Bằng" : "Moderate") : (isVi ? "Tấn Công" : "Aggressive")}
                  </span>
                  <span className="text-[10px] text-txt-muted block mt-1 font-mono">
                    {prof === "conservative" ? "0.25% - 0.5% risk" : prof === "moderate" ? "0.5% - 1% risk" : "1% - 2% risk"}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex justify-between pt-4">
              <Button
                variant="secondary"
                size="md"
                onClick={() => {
                  soundFX.playSwitch();
                  setStep(3);
                }}
              >
                {isVi ? "← Quay Lại" : "← Back"}
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  soundFX.playSwitch();
                  setStep(5);
                }}
              >
                {isVi ? "Tiếp Theo: Xem Lại Cuối Cùng →" : "Next: Final Review →"}
              </Button>
            </div>
          </div>
        )}

        {/* Step 5: Final review & launch */}
        {step === 5 && (
          <div className="space-y-4 text-center py-4">
            <div className="w-14 h-14 rounded-2xl bg-gain-subtle text-gain flex items-center justify-center mx-auto border border-gain/40">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <h3 className="text-base font-bold text-txt-primary">
              {isVi ? "Bàn Làm Việc Giao Dịch Đã Sẵn Sàng" : "Your Trading Terminal is Configured"}
            </h3>
            <p className="text-xs text-txt-secondary max-w-sm mx-auto leading-relaxed font-sans">
              {isVi
                ? "Chúng tôi đã cấu hình xong ngưỡng bảo vệ rủi ro, đồng hồ các phiên và cơ sở dữ liệu nhật ký của bạn."
                : "We have set up your risk guard thresholds, session clocks, and journal database."}
            </p>

            <div className="pt-4">
              <Button variant="ai" size="lg" onClick={handleFinish} isLoading={isLoading} className="w-full">
                {isVi ? "Truy Cập Hệ Điều Hành AI Trading OS" : "Enter AI Trading OS Terminal"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
