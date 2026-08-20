"use client";

import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { EquityPoint } from "@/lib/math/drawdown";
import { formatCurrency } from "@/lib/utils/currency";
import { useLanguage } from "@/context/LanguageContext";
import { TrendingUp, HelpCircle } from "lucide-react";

export interface EquityChartProps {
  equityPoints: EquityPoint[];
  currency?: string;
}

export const EquityChart: React.FC<EquityChartProps> = ({
  equityPoints,
  currency = "USD",
}) => {
  const { language } = useLanguage();
  const isVi = language === "vi";

  const [filter, setFilter] = useState<"1D" | "7D" | "1M" | "3M" | "6M" | "1Y" | "ALL">("ALL");

  const filteredPoints = useMemo(() => {
    if (equityPoints.length <= 1) return equityPoints;

    const now = new Date().getTime();
    const daysMap = {
      "1D": 1,
      "7D": 7,
      "1M": 30,
      "3M": 90,
      "6M": 180,
      "1Y": 365,
      "ALL": 9999,
    };

    const days = daysMap[filter];
    if (days === 9999) return equityPoints;

    const cutoff = now - days * 24 * 60 * 60 * 1000;
    const filtered = equityPoints.filter(
      (p) => new Date(p.timestamp).getTime() >= cutoff
    );

    return filtered.length > 0 ? filtered : equityPoints;
  }, [equityPoints, filter]);

  if (equityPoints.length <= 1) {
    return (
      <div className="bento-card p-5 sm:p-6 transition-all relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />
        <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-bold text-txt-primary">
              {isVi ? "Đường Cong Vốn & Hiệu Suất Tăng Trưởng" : "Equity & Performance Curve"}
            </h3>
          </div>
        </div>
        <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-border rounded-xl">
          <HelpCircle className="w-8 h-8 text-txt-muted mb-2" />
          <p className="text-xs text-txt-secondary font-medium">
            {isVi ? "Chưa có lệnh đã đóng nào" : "No closed trade records found yet"}
          </p>
          <p className="text-[11px] text-txt-muted mt-1 max-w-xs">
            {isVi
              ? "Ghi nhận lệnh đầu tiên hoặc kết nối MT5 để khởi tạo biểu đồ tăng trưởng vốn trực tiếp."
              : "Log your first trade or sync MT5 account to generate your live deterministic equity curve."}
          </p>
        </div>
      </div>
    );
  }

  const minBalance = Math.min(...filteredPoints.map((p) => p.balance));
  const maxBalance = Math.max(...filteredPoints.map((p) => p.balance));
  const yDomain = [
    Math.floor(minBalance * 0.98),
    Math.ceil(maxBalance * 1.02),
  ];

  return (
    <div className="bento-card p-5 sm:p-6 transition-all relative overflow-hidden">
      {/* Ambient Top Glow Line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />

      {/* Header with Timeframe filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
            <TrendingUp className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-txt-primary">
            {isVi ? "Đường Cong Vốn & Hiệu Suất Tăng Trưởng (Equity Curve)" : "Equity & Performance Curve"}
          </h3>
        </div>

        <div className="flex items-center gap-1 bg-bg-surface-subtle p-1 rounded-xl border border-border/60 transition-colors">
          {(["1D", "7D", "1M", "3M", "6M", "1Y", "ALL"] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setFilter(tf)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium transition-all ${
                filter === tf
                  ? "bg-brand-600 text-white shadow-sm font-bold"
                  : "text-txt-muted hover:text-txt-primary"
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-64 sm:h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={filteredPoints} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-main)" vertical={false} />
            <XAxis
              dataKey="index"
              stroke="#64748B"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: "var(--border-main)" }}
              tickFormatter={(idx) => `#${idx}`}
            />
            <YAxis
              stroke="#64748B"
              fontSize={10}
              domain={yDomain}
              tickLine={false}
              axisLine={{ stroke: "var(--border-main)" }}
              tickFormatter={(val) => `$${val.toLocaleString()}`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as EquityPoint;
                  return (
                    <div className="bg-[#0C1117]/95 backdrop-blur-md border border-[#263548] p-3.5 rounded-xl shadow-2xl text-xs font-mono text-white space-y-1">
                      <p className="text-slate-400">{isVi ? "Lệnh #" : "Trade #"}{data.index}</p>
                      <p className="text-white font-bold text-sm">
                        {isVi ? "Số Dư: " : "Balance: "}{formatCurrency(data.balance, currency)}
                      </p>
                      <p className={data.pnl >= 0 ? "text-gain font-semibold" : "text-loss font-semibold"}>
                        P&L: {data.pnl >= 0 ? `+${formatCurrency(data.pnl, currency)}` : formatCurrency(data.pnl, currency)}
                      </p>
                      {data.drawdownPercent > 0 && (
                        <p className="text-loss text-[11px] font-semibold">
                          Drawdown: -{data.drawdownPercent}% (-{formatCurrency(data.drawdownDollars, currency)})
                        </p>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="balance"
              stroke="#6366F1"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#equityGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
