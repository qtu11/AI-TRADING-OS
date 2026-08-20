"use client";

import React from "react";
import { Trade } from "@/types/trade.types";
import { formatCurrency } from "@/lib/utils/currency";
import { useLanguage } from "@/context/LanguageContext";
import { TrendingUp, ArrowUpRight, ArrowDownRight, ExternalLink, HelpCircle } from "lucide-react";

export interface RecentTradesTableProps {
  trades: Trade[];
  onSelectTrade: (trade: Trade) => void;
  currency?: string;
}

export const RecentTradesTable: React.FC<RecentTradesTableProps> = ({
  trades,
  onSelectTrade,
  currency = "USD",
}) => {
  const { language } = useLanguage();
  const isVi = language === "vi";
  const recent = trades.slice(0, 5);

  return (
    <div className="bento-card p-5 sm:p-6 space-y-4 transition-all relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-brand-500/40 to-transparent" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-brand-500/15 text-brand-400 border border-brand-500/30">
            <TrendingUp className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-txt-primary">
            {isVi ? "Các Lệnh Giao Dịch Gần Nhất" : "Recent Trade Executions"}
          </h3>
        </div>
        <a
          href="/trades"
          className="text-xs text-brand-400 hover:text-brand-300 font-mono font-medium flex items-center gap-1 transition-colors"
        >
          {isVi ? "Xem Tất Cả Lệnh" : "View All Trades"}
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Table Content */}
      {recent.length === 0 ? (
        <div className="py-8 text-center space-y-2 border border-dashed border-border rounded-xl">
          <HelpCircle className="w-6 h-6 text-txt-muted mx-auto" />
          <p className="text-xs text-txt-secondary font-medium">
            {isVi ? "Chưa có lệnh giao dịch nào được ghi nhận" : "No trade executions recorded yet"}
          </p>
          <p className="text-[11px] text-txt-muted max-w-xs mx-auto">
            {isVi
              ? "Ghi nhận lệnh thủ công hoặc kết nối MT5 để bắt đầu theo dõi hiệu suất thực tế."
              : "Log your manual trades or connect MT5 to start recording real execution metrics."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-border text-[10px] uppercase tracking-wider text-txt-muted">
                <th className="pb-2.5 font-semibold">{isVi ? "Cặp Tiền" : "Symbol"}</th>
                <th className="pb-2.5 font-semibold">{isVi ? "Loại" : "Type"}</th>
                <th className="pb-2.5 font-semibold">Lots</th>
                <th className="pb-2.5 font-semibold">{isVi ? "Vào → Ra" : "Entry → Exit"}</th>
                <th className="pb-2.5 font-semibold">{isVi ? "Phiên" : "Session"}</th>
                <th className="pb-2.5 font-semibold">P&L</th>
                <th className="pb-2.5 font-semibold text-right">R:R</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {recent.map((trade) => {
                const isWin = Number(trade.netProfit ?? 0) > 0;
                const isLoss = Number(trade.netProfit ?? 0) < 0;

                return (
                  <tr
                    key={trade.id}
                    onClick={() => onSelectTrade(trade)}
                    className="hover:bg-bg-surface-hover cursor-pointer transition-colors"
                  >
                    <td className="py-3 font-bold text-txt-primary flex items-center gap-1.5">
                      {trade.direction === "BUY" ? (
                        <ArrowUpRight className="w-3.5 h-3.5 text-gain" />
                      ) : (
                        <ArrowDownRight className="w-3.5 h-3.5 text-loss" />
                      )}
                      <span>{trade.symbol}</span>
                    </td>
                    <td className="py-3">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                          trade.direction === "BUY"
                            ? "bg-gain-subtle text-gain border border-gain/30"
                            : "bg-loss-subtle text-loss border border-loss/30"
                        }`}
                      >
                        {trade.direction}
                      </span>
                    </td>
                    <td className="py-3 text-txt-secondary">{trade.lots}L</td>
                    <td className="py-3 text-txt-secondary">
                      {trade.openPrice} → {trade.closePrice || "—"}
                    </td>
                    <td className="py-3 text-txt-muted">{trade.session}</td>
                    <td className="py-3 font-bold">
                      <span className={isWin ? "text-gain" : isLoss ? "text-loss" : "text-txt-muted"}>
                        {formatCurrency(trade.netProfit, currency, true)}
                      </span>
                    </td>
                    <td className="py-3 text-right font-medium">
                      {trade.riskRewardRatio !== undefined ? (
                        <span className={trade.riskRewardRatio >= 1.5 ? "text-gain font-bold" : "text-txt-secondary"}>
                          {trade.riskRewardRatio}R
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
