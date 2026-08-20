"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { getUserTrades, getAllJournals, getActiveTradingPlan } from "@/lib/firebase/db-service";
import { calculateTradeMetrics } from "@/lib/math/performance";
import { exportTradesToCSV, exportDataToJSON } from "@/lib/utils/export";
import { soundFX } from "@/lib/sound/sound-effects";
import { FileSpreadsheet, Download, Printer, FileText, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils/currency";

export default function ReportsPage() {
  const { userProfile } = useAuth();
  const { language, t } = useLanguage();
  const userId = userProfile?.id || "dev-trader-01";

  const isVi = language === "vi";

  const [trades, setTrades] = useState<any[]>([]);
  const [journals, setJournals] = useState<any[]>([]);
  const [plan, setPlan] = useState<any>(null);

  useEffect(() => {
    if (userId) {
      Promise.all([
        getUserTrades(userId),
        getAllJournals(userId),
        getActiveTradingPlan(userId),
      ]).then(([t, j, p]) => {
        setTrades(t);
        setJournals(j);
        setPlan(p);
      });
    }
  }, [userId]);

  const metrics = calculateTradeMetrics(trades);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-bg-surface border border-border shadow-sm">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-txt-primary flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-brand-500/15 text-brand-500 border border-brand-500/30">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <span>{isVi ? "Báo Cáo Tài Chính & Trung Tâm Xuất Dữ Liệu" : "Financial Reports & Institutional Export Center"}</span>
        </h1>
        <p className="text-xs text-txt-secondary mt-1 font-mono">
          {isVi
            ? "Xuất lịch sử giao dịch đã xác thực, kho nhật ký và chỉ số hiệu suất sang CSV, JSON hoặc Báo cáo In PDF."
            : "Export verified trade history, journal archives, and performance metrics to CSV, JSON, or Printable statements."}
        </p>
      </div>

      {/* Export Options Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* CSV Export */}
        <div className="bento-card p-6 sm:p-7 space-y-4 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-brand-500/50 to-transparent" />
          <div className="space-y-3">
            <div className="p-3 w-fit rounded-2xl bg-brand-500/15 text-brand-500 border border-brand-500/30">
              <Download className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-txt-primary font-mono">
              {isVi ? "Sổ Lệnh Giao Dịch CSV" : "CSV Trades Ledger"}
            </h3>
            <p className="text-xs text-txt-secondary font-sans leading-relaxed">
              {isVi
                ? "File CSV tương thích Excel/Google Sheets chứa điểm vào, điểm ra, SL, TP, P&L, phí và ghi chú."
                : "Spreadsheet-ready CSV file containing entry, exit, SL, TP, P&L, commissions, swaps, and notes."}
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              soundFX.playSuccess();
              exportTradesToCSV(trades);
            }}
            disabled={trades.length === 0}
            className="w-full"
          >
            {isVi ? `Tải File CSV (${trades.length} Bản Ghi)` : `Download CSV (${trades.length} Records)`}
          </Button>
        </div>

        {/* JSON Full Data Backup */}
        <div className="bento-card p-6 sm:p-7 space-y-4 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-sky-500/50 to-transparent" />
          <div className="space-y-3">
            <div className="p-3 w-fit rounded-2xl bg-sky-500/15 text-sky-400 border border-sky-500/30">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-txt-primary font-mono">
              {isVi ? "Sao Lưu Toàn Bộ Dữ Liệu JSON" : "Complete JSON Backup"}
            </h3>
            <p className="text-xs text-txt-secondary font-sans leading-relaxed">
              {isVi
                ? "Bản sao lưu nguyên gốc toàn bộ lệnh, nhật ký ngày, kế hoạch và nhật ký tâm lý."
                : "Complete raw JSON dump of trades, daily journals, active trading plans, and psychology logs."}
            </p>
          </div>
          <Button
            variant="outline"
            size="md"
            onClick={() => {
              soundFX.playSuccess();
              exportDataToJSON({ trades, journals, plan, metrics }, "ai_trading_os_backup");
            }}
            className="w-full"
          >
            {isVi ? "Xuất Bản Sao Lưu JSON" : "Export Complete JSON Dump"}
          </Button>
        </div>

        {/* Print / PDF View */}
        <div className="bento-card p-6 sm:p-7 space-y-4 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gain/50 to-transparent" />
          <div className="space-y-3">
            <div className="p-3 w-fit rounded-2xl bg-gain-subtle text-gain border border-gain/30">
              <Printer className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-txt-primary font-mono">
              {isVi ? "In Bản Sao Kê Hiệu Suất" : "Print Performance Statement"}
            </h3>
            <p className="text-xs text-txt-secondary font-sans leading-relaxed">
              {isVi
                ? "Định dạng trang in chuẩn mực tổng hợp chỉ số tài khoản, biểu đồ tăng trưởng và tỷ lệ thắng."
                : "Formatted printer-ready summary of your account metrics, equity growth, and win rate."}
            </p>
          </div>
          <Button
            variant="secondary"
            size="md"
            onClick={() => {
              soundFX.playClick();
              window.print();
            }}
            className="w-full"
          >
            {isVi ? "In Báo Cáo / Lưu Dạng PDF" : "Print / Save to PDF"}
          </Button>
        </div>
      </div>
    </div>
  );
}
