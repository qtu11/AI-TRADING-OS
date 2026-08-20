"use client";

import React, { useEffect } from "react";
import { ShieldAlert, RefreshCw, Home, Copy, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/context/LanguageContext";
import { soundFX } from "@/lib/sound/sound-effects";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { language } = useLanguage();
  const isVi = language === "vi";
  const [copied, setCopied] = React.useState(false);

  useEffect(() => {
    console.error("System Runtime Error:", error);
  }, [error]);

  const handleCopy = () => {
    soundFX.playClick();
    const errorDetails = `[AI TRADING OS ERROR]\nMessage: ${error.message}\nDigest: ${error.digest || "N/A"}\nTimestamp: ${new Date().toISOString()}`;
    navigator.clipboard.writeText(errorDetails);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4 sm:p-6 select-none">
      <div className="w-full max-w-lg bento-card p-6 sm:p-8 space-y-6 text-center relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-loss/50 to-transparent" />

        {/* Error Icon Badge */}
        <div className="w-16 h-16 rounded-2xl bg-loss-subtle text-loss flex items-center justify-center mx-auto border border-loss/30 shadow-lg shadow-loss/10">
          <ShieldAlert className="w-8 h-8" />
        </div>

        {/* Error Titles */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-mono uppercase tracking-widest text-loss font-bold">
            {isVi ? "Lỗi Thực Thi • Mã Lỗi 500" : "Execution Failure • Error 500"}
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-txt-primary tracking-tight">
            {isVi ? "Phát Sinh Ngoại Lệ Hệ Thống" : "Unexpected System Exception"}
          </h2>
          <p className="text-xs text-txt-secondary max-w-md mx-auto leading-relaxed font-sans">
            {isVi
              ? "Terminal vận hành gặp gián đoạn tạm thời. Dữ liệu tài chính và nhật ký của bạn luôn được bảo vệ an toàn tuyệt đối."
              : "The trading operating terminal encountered an unexpected execution barrier. Your financial data and database records remain protected."}
          </p>
        </div>

        {/* Error Diagnostic Box */}
        <div className="p-3.5 bg-bg-surface-subtle rounded-xl border border-border/60 text-left font-mono text-xs space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-txt-muted border-b border-border/60 pb-1.5">
            <span>{isVi ? "Báo Cáo Chẩn Đoán" : "Diagnostic Report"}</span>
            {error.digest && <span>Digest: {error.digest}</span>}
          </div>
          <p className="text-loss font-bold break-all text-[11px]">
            {error.message || (isVi ? "Xảy ra ngoại lệ không xác định trong chu kỳ render." : "An unknown exception occurred in the rendering lifecycle.")}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              soundFX.playClick();
              reset();
            }}
            className="w-full sm:w-auto"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {isVi ? "Thử Lại / Tải Lại Giao Diện" : "Try Again / Reload View"}
          </Button>

          <a href="/" className="w-full sm:w-auto">
            <Button
              variant="secondary"
              size="md"
              onClick={() => soundFX.playClick()}
              className="w-full sm:w-auto"
            >
              <Home className="w-4 h-4 mr-2" />
              {isVi ? "Về Trang Tổng Quan" : "Return to Dashboard"}
            </Button>
          </a>

          <button
            onClick={handleCopy}
            title={isVi ? "Sao chép chi tiết lỗi để chẩn đoán" : "Copy error details for diagnostics"}
            className="p-2.5 rounded-xl bg-bg-surface-subtle hover:bg-bg-surface-hover border border-border text-txt-secondary hover:text-txt-primary transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {copied ? <CheckCircle2 className="w-4 h-4 text-gain" /> : <Copy className="w-4 h-4 text-txt-muted" />}
            <span className="hidden sm:inline font-mono">{copied ? (isVi ? "Đã chép" : "Copied") : (isVi ? "Sao chép" : "Copy")}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
