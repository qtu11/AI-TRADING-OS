"use client";

import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
  CartesianGrid,
} from "recharts";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "next-themes";
import { Trade } from "@/types/trade.types";
import { Award } from "lucide-react";

export interface WinRateBySymbolBarChartProps {
  trades: Trade[];
}

export const WinRateBySymbolBarChart: React.FC<WinRateBySymbolBarChartProps> = ({ trades }) => {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const isVi = language === "vi";
  const isDark = theme !== "light";

  const data = useMemo(() => {
    const map: Record<string, { wins: number; total: number }> = {};
    trades.forEach((t) => {
      if (!map[t.symbol]) map[t.symbol] = { wins: 0, total: 0 };
      map[t.symbol].total += 1;
      if (t.outcome === "WIN" || Number(t.netProfit || 0) > 0) {
        map[t.symbol].wins += 1;
      }
    });

    return Object.entries(map).map(([sym, stats]) => ({
      symbol: sym,
      winRate: Math.round((stats.wins / stats.total) * 100),
      total: stats.total,
    })).sort((a, b) => b.winRate - a.winRate);
  }, [trades]);

  if (trades.length === 0) {
    return (
      <div className="bento-card p-5 sm:p-6 space-y-3 relative overflow-hidden flex flex-col justify-between">
        <div className="flex items-center gap-2 border-b border-border/60 pb-3">
          <Award className="w-4 h-4 text-brand-500" />
          <h3 className="text-xs font-bold text-txt-primary uppercase tracking-wider font-mono">
            {isVi ? "Tỷ Lệ Thắng Theo Cặp Tiền (Biểu Đồ Cột)" : "Win Rate by Symbol (Bar Chart)"}
          </h3>
        </div>
        <div className="h-56 flex items-center justify-center text-xs text-txt-muted font-mono">
          {isVi ? "Chưa có dữ liệu lệnh" : "No symbol win rate data"}
        </div>
      </div>
    );
  }

  return (
    <div className="bento-card p-5 sm:p-6 space-y-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-brand-500/50 to-transparent" />
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-brand-500" />
          <h3 className="text-xs font-bold text-txt-primary uppercase tracking-wider font-mono">
            {isVi ? "Tỷ Lệ Thắng (%) Theo Từng Cặp Tiền (Biểu Đồ Cột)" : "Symbol Win Rate % (Bar Chart)"}
          </h3>
        </div>
        <span className="text-[10px] font-mono text-txt-muted">
          {isVi ? "Mục tiêu tối thiểu: 50%" : "Baseline target: 50%"}
        </span>
      </div>

      <div className="h-60 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#202A35" : "#E2E8F0"} horizontal={false} />
            <XAxis
              type="number"
              domain={[0, 100]}
              stroke={isDark ? "#64748B" : "#94A3B8"}
              fontSize={11}
              fontFamily="var(--font-mono)"
              tickFormatter={(v) => `${v}%`}
            />
            <YAxis
              type="category"
              dataKey="symbol"
              stroke={isDark ? "#64748B" : "#94A3B8"}
              fontSize={11}
              fontFamily="var(--font-mono)"
              tickLine={false}
            />
            <Tooltip
              formatter={(val: any) => [`${val}%`, isVi ? "Tỷ Lệ Thắng" : "Win Rate"]}
              contentStyle={{
                backgroundColor: isDark ? "#0E141B" : "#FFFFFF",
                borderColor: isDark ? "#202A35" : "#E2E8F0",
                borderRadius: "12px",
                fontSize: "12px",
                fontFamily: "var(--font-mono)",
                color: isDark ? "#FFFFFF" : "#0F172A",
              }}
            />
            <ReferenceLine x={50} stroke="#F59E0B" strokeDasharray="3 3" />
            <Bar dataKey="winRate" radius={[0, 6, 6, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.winRate >= 50 ? "#10B981" : "#EF4444"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
