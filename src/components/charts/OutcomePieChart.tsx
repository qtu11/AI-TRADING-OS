"use client";

import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "next-themes";
import { PerformanceMetrics } from "@/lib/math/performance";
import { PieChart as PieChartIcon } from "lucide-react";

export interface OutcomePieChartProps {
  metrics: PerformanceMetrics;
}

export const OutcomePieChart: React.FC<OutcomePieChartProps> = ({ metrics }) => {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const isVi = language === "vi";
  const isDark = theme !== "light";

  const data = [
    {
      name: isVi ? "Lệnh Thắng (Win)" : "Winning Trades",
      value: metrics.winningTrades,
      color: "#10B981", // gain green
    },
    {
      name: isVi ? "Lệnh Thua (Loss)" : "Losing Trades",
      value: metrics.losingTrades,
      color: "#EF4444", // loss red
    },
    {
      name: isVi ? "Lệnh Hòa (Breakeven)" : "Breakeven Trades",
      value: metrics.breakevenTrades,
      color: "#94A3B8", // slate gray
    },
  ].filter((d) => d.value > 0);

  if (metrics.totalTrades === 0) {
    return (
      <div className="bento-card p-5 sm:p-6 space-y-3 relative overflow-hidden flex flex-col justify-between">
        <div className="flex items-center gap-2 border-b border-border/60 pb-3">
          <PieChartIcon className="w-4 h-4 text-brand-500" />
          <h3 className="text-xs font-bold text-txt-primary uppercase tracking-wider font-mono">
            {isVi ? "Tỷ Lệ Thắng / Thua (Biểu Đồ Tròn)" : "Win / Loss Ratio (Pie Chart)"}
          </h3>
        </div>
        <div className="h-56 flex items-center justify-center text-xs text-txt-muted font-mono">
          {isVi ? "Chưa có dữ liệu lệnh" : "No trade outcome data"}
        </div>
      </div>
    );
  }

  return (
    <div className="bento-card p-5 sm:p-6 space-y-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-brand-500/50 to-transparent" />
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <PieChartIcon className="w-4 h-4 text-brand-500" />
          <h3 className="text-xs font-bold text-txt-primary uppercase tracking-wider font-mono">
            {isVi ? "Tỷ Lệ Kết Quả Lệnh (Biểu Đồ Tròn)" : "Trade Outcome Distribution (Donut)"}
          </h3>
        </div>
        <span className="text-[10px] font-mono text-gain bg-gain-subtle px-2.5 py-0.5 rounded-full border border-gain/40 font-bold">
          {metrics.winRate}% {isVi ? "Thắng" : "Win Rate"}
        </span>
      </div>

      <div className="h-60 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={4}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke={isDark ? "#0E141B" : "#FFFFFF"} strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? "#0E141B" : "#FFFFFF",
                borderColor: isDark ? "#202A35" : "#E2E8F0",
                borderRadius: "12px",
                fontSize: "12px",
                fontFamily: "var(--font-mono)",
                color: isDark ? "#FFFFFF" : "#0F172A",
              }}
            />
            <Legend
              wrapperStyle={{
                fontSize: "11px",
                fontFamily: "var(--font-sans)",
                paddingTop: "8px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
