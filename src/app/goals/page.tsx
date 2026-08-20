"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { Goal } from "@/types/notification.types";
import { getUserGoals, saveGoal } from "@/lib/firebase/db-service";
import { soundFX } from "@/lib/sound/sound-effects";
import { Award, PlusCircle, CheckCircle2, Target, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { deleteGoal, updateGoalProgress } from "@/lib/firebase/db-service";

export default function GoalsPage() {
  const { userProfile } = useAuth();
  const { language, t } = useLanguage();
  const userId = userProfile?.id || "dev-trader-01";

  const isVi = language === "vi";

  const [goals, setGoals] = useState<Goal[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<"FINANCIAL" | "PERFORMANCE" | "DISCIPLINE" | "PSYCHOLOGY" | "LEARNING">("DISCIPLINE");
  const [targetValue, setTargetValue] = useState(100);
  const [unit, setUnit] = useState<"%" | "$" | "trades" | "days" | "points">("%");

  const loadGoals = async () => {
    try {
      const list = await getUserGoals(userId);
      if (list.length > 0) {
        setGoals(list);
      } else {
        // Defaults
        const defaultGoals: Goal[] = [
          {
            id: "goal-1",
            userId,
            title: isVi ? "Duy Trì Điểm Kỷ Luật Hàng Ngày Trên 90%" : "Maintain 90%+ Daily Discipline Score",
            category: "DISCIPLINE",
            targetMetric: "Discipline",
            targetValue: 90,
            currentValue: 92,
            unit: "%",
            progressPercent: 100,
            isCompleted: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: "goal-2",
            userId,
            title: isVi ? "Hoàn Thành 30 Ngày Viết Nhật Ký Liên Tục" : "Complete 30 Consecutive Daily Journals",
            category: "LEARNING",
            targetMetric: "Journals",
            targetValue: 30,
            currentValue: 12,
            unit: "days",
            progressPercent: 40,
            isCompleted: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ];
        setGoals(defaultGoals);
      }
    } catch (err) {
      console.warn("Load goals error:", err);
    }
  };

  useEffect(() => {
    if (userId) loadGoals();
  }, [userId]);

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const newGoal: Goal = {
      id: `goal-${Date.now()}`,
      userId,
      title,
      category,
      targetMetric: title,
      targetValue: Number(targetValue) || 100,
      currentValue: 0,
      unit,
      progressPercent: 0,
      isCompleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveGoal(newGoal);
    soundFX.playSuccess();
    setIsModalOpen(false);
    loadGoals();
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm(isVi ? "Bạn có chắc chắn muốn xóa mục tiêu này không?" : "Are you sure you want to delete this goal?")) return;
    soundFX.playClick(500);
    await deleteGoal(userId, goalId);
    setGoals((prev) => prev.filter((g) => g.id !== goalId));
  };

  const handleToggleComplete = async (goal: Goal) => {
    const nextCompleted = !goal.isCompleted;
    const nextVal = nextCompleted ? goal.targetValue : Math.max(0, goal.currentValue - 1);
    const nextProg = nextCompleted ? 100 : Math.round((nextVal / goal.targetValue) * 100);

    soundFX.playSuccess();
    await updateGoalProgress(userId, goal.id, nextVal, nextCompleted);
    setGoals((prev) =>
      prev.map((g) =>
        g.id === goal.id
          ? { ...g, isCompleted: nextCompleted, currentValue: nextVal, progressPercent: nextProg }
          : g
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-bg-surface border border-border shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-txt-primary flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-500/15 text-brand-500 border border-brand-500/30">
              <Award className="w-5 h-5" />
            </div>
            <span>{isVi ? "Mục Tiêu Cột Mốc & Theo Dõi Trách Nhiệm" : "Milestone Goals & Accountability Tracker"}</span>
          </h1>
          <p className="text-xs text-txt-secondary mt-1 font-mono">
            {isVi
              ? "Thiết lập và giám sát các chuẩn mực Tài Chính, Kỷ Luật, Hiệu Suất và Tâm Lý."
              : "Set and monitor Financial, Discipline, Performance, and Psychology benchmarks."}
          </p>
        </div>

        <Button variant="primary" size="md" onClick={() => setIsModalOpen(true)}>
          <PlusCircle className="w-4 h-4 mr-2" />
          {isVi ? "Tạo Mục Tiêu Mới" : "Create New Goal"}
        </Button>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {goals.map((g) => (
          <div key={g.id} className="bento-card p-5 sm:p-6 space-y-4 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-brand-500/50 to-transparent" />
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
                <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/30">
                  {g.category}
                </span>
                <span className="text-xs font-mono text-txt-muted">
                  {g.currentValue} / {g.targetValue} {g.unit}
                </span>
              </div>

              <h4 className="text-sm font-bold text-txt-primary flex items-center gap-2 font-sans">
                {g.isCompleted && <CheckCircle2 className="w-4 h-4 text-gain shrink-0" />}
                <span className={g.isCompleted ? "line-through text-txt-muted" : ""}>{g.title}</span>
              </h4>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-mono text-txt-muted">
                  <span>{isVi ? "Tiến độ" : "Progress"}</span>
                  <span className="text-txt-primary font-bold">{g.progressPercent}%</span>
                </div>
                <div className="w-full h-2 bg-bg-surface-subtle rounded-full overflow-hidden border border-border/40">
                  <div
                    className={`h-full rounded-full transition-all ${
                      g.isCompleted ? "bg-gain" : "bg-gradient-to-r from-brand-600 to-sky-500"
                    }`}
                    style={{ width: `${Math.min(100, g.progressPercent)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-border/60">
              <button
                type="button"
                onClick={() => handleToggleComplete(g)}
                className={`text-xs font-mono px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer ${
                  g.isCompleted
                    ? "bg-gain-subtle text-gain border-gain/40 font-bold"
                    : "bg-bg-surface-subtle text-txt-secondary border-border hover:bg-bg-surface-hover hover:text-txt-primary"
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                {g.isCompleted ? (isVi ? "Đã Hoàn Thành" : "Completed") : isVi ? "Đánh Dấu Xong" : "Mark Done"}
              </button>

              <button
                type="button"
                onClick={() => handleDeleteGoal(g.id)}
                className="text-txt-muted hover:text-loss p-1.5 transition-colors cursor-pointer"
                title={isVi ? "Xóa mục tiêu" : "Delete Goal"}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Goal Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isVi ? "Thiết Lập Mục Tiêu Cột Mốc" : "Set Milestone Goal"}
      >
        <form onSubmit={handleSaveGoal} className="space-y-4">
          <Input
            label={isVi ? "Nội Dung Mục Tiêu" : "Goal Objective"}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={isVi ? "vd: Tuyệt đối không trade trả thù tháng này" : "e.g. Zero Revenge Trades This Month"}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label={isVi ? "Danh Mục" : "Goal Category"}
              value={category}
              onChange={(e) => {
                soundFX.playSwitch();
                setCategory(e.target.value as any);
              }}
              options={[
                { value: "DISCIPLINE", label: isVi ? "Kỷ Luật & Tuân Thủ Quy Tắc" : "Discipline & Rule Adherence" },
                { value: "FINANCIAL", label: isVi ? "Tài Chính / Mục Tiêu Lợi Nhuận" : "Financial / Profit Target" },
                { value: "PERFORMANCE", label: isVi ? "Hiệu Suất (Tỷ Lệ Thắng, R:R)" : "Performance (Win Rate, R:R)" },
                { value: "LEARNING", label: isVi ? "Học Hỏi & Thói Quen Viết Nhật Ký" : "Learning & Journaling Habits" },
              ]}
            />

            <Input
              label={isVi ? "Giá Trị Mục Tiêu" : "Target Goal Value"}
              type="number"
              value={targetValue}
              onChange={(e) => setTargetValue(Number(e.target.value))}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="md" type="button" onClick={() => setIsModalOpen(false)}>
              {isVi ? "Hủy" : "Cancel"}
            </Button>
            <Button variant="primary" size="md" type="submit">
              {isVi ? "Lưu Mục Tiêu" : "Save Goal"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
