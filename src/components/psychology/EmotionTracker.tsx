"use client";

import React, { useState } from "react";
import { Slider } from "@/components/ui/Slider";
import { Switch } from "@/components/ui/Switch";
import { Button } from "@/components/ui/Button";
import { PsychologyEntry } from "@/types/psychology.types";
import { calculateDisciplineScore } from "@/lib/math/discipline-score";
import { DisciplineGauge } from "@/components/psychology/DisciplineGauge";
import { soundFX } from "@/lib/sound/sound-effects";
import { useLanguage } from "@/context/LanguageContext";
import { Brain, Sparkles, Save, CheckCircle2 } from "lucide-react";
import { getTodayDateString } from "@/lib/utils/date";

export interface EmotionTrackerProps {
  initialEntry?: PsychologyEntry | null;
  onSave: (entry: PsychologyEntry) => Promise<void>;
  userId: string;
}

export const EmotionTracker: React.FC<EmotionTrackerProps> = ({
  initialEntry,
  onSave,
  userId,
}) => {
  const { language } = useLanguage();
  const isVi = language === "vi";
  const todayStr = getTodayDateString();

  // Scales 1 to 10
  const [confidence, setConfidence] = useState(initialEntry?.confidence || 7);
  const [fear, setFear] = useState(initialEntry?.fear || 2);
  const [stress, setStress] = useState(initialEntry?.stress || 3);
  const [fomo, setFomo] = useState(initialEntry?.fomo || 2);
  const [greed, setGreed] = useState(initialEntry?.greed || 2);
  const [calm, setCalm] = useState(initialEntry?.calm || 8);
  const [revengeTendency, setRevengeTendency] = useState(initialEntry?.revengeTendency || 1);

  // Behavioral questions
  const [followedPlan, setFollowedPlan] = useState(initialEntry?.followedPlan ?? true);
  const [movedStopLossPrematurely, setMovedStopLossPrematurely] = useState(
    initialEntry?.movedStopLossPrematurely || false
  );
  const [exitedWinnerEarly, setExitedWinnerEarly] = useState(
    initialEntry?.exitedWinnerEarly || false
  );
  const [overtraded, setOvertraded] = useState(initialEntry?.overtraded || false);
  const [revengeTraded, setRevengeTraded] = useState(initialEntry?.revengeTraded || false);
  const [mentalStateNotes, setMentalStateNotes] = useState(
    initialEntry?.mentalStateNotes || ""
  );
  const [physicalState, setPhysicalState] = useState<"OPTIMAL" | "RESTED" | "TIRED" | "DISTRACTED">(
    initialEntry?.physicalState || "OPTIMAL"
  );
  const [isSaving, setIsSaving] = useState(false);

  // Live Deterministic Discipline Score Calculation
  const discipline = calculateDisciplineScore({
    confidence,
    fear,
    stress,
    fomo,
    greed,
    calm,
    revengeTendency,
    followedPlan,
    movedStopLossPrematurely,
    exitedWinnerEarly,
    overtraded,
    revengeTraded,
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const entry: PsychologyEntry = {
        id: initialEntry?.id || `psych-${todayStr}`,
        userId,
        date: todayStr,
        confidence,
        fear,
        stress,
        fomo,
        greed,
        calm,
        revengeTendency,
        followedPlan,
        movedStopLossPrematurely,
        exitedWinnerEarly,
        overtraded,
        revengeTraded,
        lateEntry: false,
        mentalStateNotes,
        physicalState,
        dailyDisciplineScore: discipline.totalScore,
        createdAt: initialEntry?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await onSave(entry);
      soundFX.playSuccess();
    } catch (err) {
      console.warn("Save psychology entry error:", err);
      soundFX.playWarning();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Live Discipline Gauge Preview */}
      <DisciplineGauge breakdown={discipline} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Col: Emotional State Sliders */}
        <div className="bento-card p-5 sm:p-6 space-y-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-sky-500/50 to-transparent" />
          <div className="flex items-center gap-2 border-b border-border/60 pb-3">
            <Brain className="w-4 h-4 text-sky-400" />
            <h3 className="text-xs font-bold text-txt-primary uppercase tracking-wider font-mono">
              {isVi ? "1. Đánh Giá Trạng Thái Cảm Xúc (Thang 1-10)" : "1. Emotional State Rating (1 to 10 Scale)"}
            </h3>
          </div>

          <div className="space-y-4">
            <Slider
              label={isVi ? "Mức Độ Tự Tin" : "Confidence Level"}
              value={confidence}
              onChange={setConfidence}
              min={1}
              max={10}
            />

            <Slider
              label={isVi ? "Cảm Xúc FOMO (Sợ Bỏ Lỡ)" : "FOMO (Fear of Missing Out)"}
              value={fomo}
              onChange={setFomo}
              min={1}
              max={10}
            />

            <Slider
              label={isVi ? "Sợ Hãi / Do Dự" : "Fear / Hesitation"}
              value={fear}
              onChange={setFear}
              min={1}
              max={10}
            />

            <Slider
              label={isVi ? "Tham Lam / Nóng Vội" : "Greed / Impatience"}
              value={greed}
              onChange={setGreed}
              min={1}
              max={10}
            />

            <Slider
              label={isVi ? "Ý Định Trả Thù Thị Trường" : "Revenge Trading Impulse"}
              value={revengeTendency}
              onChange={setRevengeTendency}
              min={1}
              max={10}
            />

            <Slider
              label={isVi ? "Bình Tĩnh & Tập Trung" : "Calmness & Focus"}
              value={calm}
              onChange={setCalm}
              min={1}
              max={10}
            />
          </div>
        </div>

        {/* Right Col: Behavioral Adherence Checklist */}
        <div className="bento-card p-5 sm:p-6 space-y-4 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gain/50 to-transparent" />
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-border/60 pb-3">
              <CheckCircle2 className="w-4 h-4 text-gain" />
              <h3 className="text-xs font-bold text-txt-primary uppercase tracking-wider font-mono">
                {isVi ? "2. Kiểm Tra Tuân Thủ Kỷ Luật Thực Thi" : "2. Execution Discipline Checks"}
              </h3>
            </div>

            <div className="space-y-3">
              <Switch
                label={isVi ? "Tuân Thủ Kế Hoạch Trước Phiên" : "Followed Pre-Market Trading Plan"}
                description={isVi ? "Chỉ vào lệnh khi thỏa mãn đầy đủ điều kiện chiến lược." : "Only traded setups matching pre-defined strategy rules."}
                checked={followedPlan}
                onChange={setFollowedPlan}
              />

              <Switch
                label={isVi ? "KHÔNG Dời Dừng Lỗ Bừa Bãi" : "Did NOT Move Stop Loss Prematurely"}
                description={isVi ? "Giữ nguyên mức SL ban đầu đã xác định, không nới rộng rủi ro." : "Kept stop loss in original validated position without widening."}
                checked={!movedStopLossPrematurely}
                onChange={(checked) => setMovedStopLossPrematurely(!checked)}
              />

              <Switch
                label={isVi ? "KHÔNG Chốt Lời Non Vì Sợ Hãi" : "Did NOT Exit Winners Early"}
                description={isVi ? "Để lệnh chạy đến đúng mục tiêu TP hoặc điểm vô hiệu hóa." : "Allowed target levels to play out without fear-based early exits."}
                checked={!exitedWinnerEarly}
                onChange={(checked) => setExitedWinnerEarly(!checked)}
              />

              <Switch
                label={isVi ? "Tôn Trọng Giới Hạn Số Lệnh Ngày" : "Respected Daily Max Trade Limit"}
                description={isVi ? "Không vào lệnh quá đà (overtrading) sau các lệnh thắng/thua." : "Avoided overtrading after wins or losses."}
                checked={!overtraded}
                onChange={(checked) => setOvertraded(!checked)}
              />

              <Switch
                label={isVi ? "Tuyệt Đối Không Trade Trả Thù" : "Avoided Revenge Trading"}
                description={isVi ? "Không vào lệnh vội vã để gỡ lại số tiền vừa mất." : "Did not immediately jump into trades to recover losses."}
                checked={!revengeTraded}
                onChange={(checked) => setRevengeTraded(!checked)}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-border/60">
            <Button variant="primary" size="md" onClick={handleSave} isLoading={isSaving} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              {isVi ? "Ghi Nhận Kỷ Luật Ngày" : "Log Daily Discipline Record"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
