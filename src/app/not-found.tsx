"use client";

import React from "react";
import { useLanguage } from "@/context/LanguageContext";
import { soundFX } from "@/lib/sound/sound-effects";
import { HelpCircle, ArrowLeft, Home, Compass } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  const { language } = useLanguage();
  const isVi = language === "vi";

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4 sm:p-6 select-none">
      <div className="w-full max-w-lg bento-card p-6 sm:p-8 space-y-6 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-sky-500/50 to-transparent" />

        {/* 404 Badge */}
        <div className="w-16 h-16 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center mx-auto border border-sky-500/30 shadow-lg shadow-sky-500/10">
          <Compass className="w-8 h-8 animate-spin-slow" />
        </div>

        {/* Titles */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-mono uppercase tracking-widest text-sky-400 font-bold">
            HTTP 404 • {isVi ? "Không Tìm Thấy Tài Nguyên" : "Resource Not Found"}
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-txt-primary tracking-tight">
            {isVi ? "Đường Dẫn Không Tồn Tại Trong Terminal" : "Trading Terminal Route Not Found"}
          </h2>
          <p className="text-xs text-txt-secondary max-w-md mx-auto leading-relaxed font-sans">
            {isVi
              ? "Phân hệ, chiến lược hoặc báo cáo bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển sang địa chỉ mới."
              : "The requested module, strategy, or calendar report path does not exist or has been relocated."}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <a href="/" className="w-full sm:w-auto">
            <Button
              variant="primary"
              size="md"
              onClick={() => soundFX.playClick()}
              className="w-full sm:w-auto"
            >
              <Home className="w-4 h-4 mr-2" />
              {isVi ? "Quay Về Tổng Quan" : "Back to Dashboard"}
            </Button>
          </a>

          <button
            onClick={() => {
              soundFX.playClick();
              window.history.back();
            }}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-bg-surface-subtle hover:bg-bg-surface-hover border border-border text-txt-secondary hover:text-txt-primary text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            {isVi ? "Trang Trước Đó" : "Previous Page"}
          </button>
        </div>
      </div>
    </div>
  );
}
