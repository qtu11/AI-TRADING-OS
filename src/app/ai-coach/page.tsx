"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { useCommand } from "@/context/CommandContext";
import { useLanguage } from "@/context/LanguageContext";
import { soundFX } from "@/lib/sound/sound-effects";
import { Bot, Sparkles, Brain, Award, ShieldAlert, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function AICoachPage() {
  const { userProfile } = useAuth();
  const { toggleAICopilot } = useCommand();
  const { language } = useLanguage();
  const isVi = language === "vi";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-bg-surface border border-border shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-txt-primary flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/30">
              <Bot className="w-5 h-5" />
            </div>
            <span>{isVi ? "Huấn Luyện Viên Tâm Lý & AI Trợ Lý Giao Dịch" : "AI Trading Copilot & Executive Behavioral Coach"}</span>
          </h1>
          <p className="text-xs text-txt-secondary mt-1 font-mono">
            {isVi
              ? "Căn cứ trực tiếp từ sổ lệnh thực tế, kho nhật ký cá nhân và các ngưỡng kế hoạch giao dịch."
              : "Directly grounded in your personal trading journals, execution records, and plan parameters."}
          </p>
        </div>

        <Button
          variant="ai"
          size="md"
          onClick={() => {
            soundFX.playClick();
            toggleAICopilot();
          }}
        >
          <Sparkles className="w-4 h-4 mr-2" />
          {isVi ? "Mở Trợ Lý AI Copilot (⌘J)" : "Launch AI Copilot (⌘J)"}
        </Button>
      </div>

      {/* Core Intelligence Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bento-card p-6 sm:p-7 space-y-3 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-sky-500/50 to-transparent" />
          <div className="p-3 w-fit rounded-2xl bg-sky-500/15 text-sky-400 border border-sky-500/30">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-txt-primary font-mono">
            {isVi ? "Dữ Liệu Thực Thi Thời Gian Thực" : "Real-Time Data Grounding"}
          </h3>
          <p className="text-xs text-txt-secondary leading-relaxed font-sans">
            {isVi
              ? "AI truy vấn dữ liệu sổ lệnh thật từ Firestore trước khi phản hồi. Tuyệt đối không bịa đặt tỷ lệ thắng hay kết quả giao dịch."
              : "The AI queries your personal Firestore records before replying. It never fabricates win rates or trade results."}
          </p>
        </div>

        <div className="bento-card p-6 sm:p-7 space-y-3 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
          <div className="p-3 w-fit rounded-2xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
            <Brain className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-txt-primary font-mono">
            {isVi ? "Bộ Nhớ Nhận Diện Hành Vi" : "Behavioral Pattern Memory"}
          </h3>
          <p className="text-xs text-txt-secondary leading-relaxed font-sans">
            {isVi
              ? "Tự động phát hiện các xu hướng lặp lại như: vào lệnh quá đà sau khi thua, FOMO khi phiên Á biến động và chốt lời non vì sợ hãi."
              : "Detects recurring tendencies like overtrading after a loss, FOMO on Asian session breakouts, and early profit taking."}
          </p>
        </div>

        <div className="bento-card p-6 sm:p-7 space-y-3 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gain/50 to-transparent" />
          <div className="p-3 w-fit rounded-2xl bg-gain-subtle text-gain border border-gain/30">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-txt-primary font-mono">
            {isVi ? "Toán Học Bảo Vệ Tài Khoản" : "Deterministic Safety Guard"}
          </h3>
          <p className="text-xs text-txt-secondary leading-relaxed font-sans">
            {isVi
              ? "Mọi phép tính tài chính quan trọng (P&L, Sụt giảm Drawdown, Khối lượng Lot) đều thực thi bằng động cơ TypeScript chuẩn xác."
              : "All math calculations (P&L, Drawdown, Position sizing) are calculated via verified TypeScript math engines."}
          </p>
        </div>
      </div>
    </div>
  );
}
