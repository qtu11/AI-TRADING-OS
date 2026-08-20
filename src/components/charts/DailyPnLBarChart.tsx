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
import { formatCurrency } from "@/lib/utils/currency";
import { BarChart3 } from "lucide-react";

export interface DailyPnLBarChartProps {
  trades: Trade[];
}

export const DailyPnLBarChart: React.FC<DailyPnLBarChartProps> = ({ trades }) => {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const isVi = language === "vi";
  const isDark = theme !== "light";

  const data = useMemo(() => {
    const days = isVi
      ? [
          { key: "Monday", label: "T2 (Hai)" },
          { key: "Tuesday", label: "T3 (Ba)" },
          { key: "Wednesday", label: "T4 (Tư)" },
          { key: "Thursday", label: "T5 (Năm)" },
          { key: "Friday", label: "T6 (Sáu)" },
        ]
      : [
          { key: "Monday", label: "Mon" },
          { key: "Tuesday", label: "Tue" },
          { key: "Wednesday", label: "Wed" },
          { key: "Thursday", label: "Thu" },
          { key: "Friday", label: "Fri" },
        ];

    const map: Record<string, { pnl: number; count: number }> = {
      Monday: { pnl: 0, count: 0 },
      Tuesday: { pnl: 0, count: 0 },
      Wednesday: { pnl: 0, count: 0 },
      Thursday: { pnl: 0, count: 0 },
      Friday: { pnl: 0, count: 0 },
    };

    trades.forEach((t) => {
      const d = new Date(t.openTime);
      const dayName = d.toLocaleDateString("en-US", { weekday: "long" });
      if (map[dayName]) {
        map[dayName].pnl += Number(t.netProfit || 0);
        map[dayName].count += 1;
      }
    });

    return days.map((d) => ({
      day: d.label,
      pnl: Number(map[d.key].pnl.toFixed(2)),
      count: map[d.key].count,
    }));
  }, [trades, isVi]);

  return (
    <div className="bento-card p-5 sm:p-6 space-y-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-brand-500/50 to-transparent" />
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-brand-500" />
          <h3 className="text-xs font-bold text-txt-primary uppercase tracking-wider font-mono">
            {isVi ? "Lợi Nhuận Theo Ngày Trong Tuần (Biểu Đồ Cột)" : "P&L by Day of Week (Bar Chart)"}
          </h3>
        </div>
        <span className="text-[10px] font-mono text-txt-muted">
          {isVi ? "Xanh: Lãi • Đỏ: Lỗ" : "Green: Profit • Red: Loss"}
        </span>
      </div>

      <div className="h-60 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#202A35" : "#E2E8F0"} vertical={false} />
            <XAxis
              dataKey="day"
              stroke={isDark ? "#64748B" : "#94A3B8"}
              fontSize={11}
              fontFamily="var(--font-mono)"
              tickLine={false}
            />
            <YAxis
              stroke={isDark ? "#64748B" : "#94A3B8"}
              fontSize={11}
              fontFamily="var(--font-mono)"
              tickFormatter={(v) => `$${v}`}
              tickLine={false}
            />
            <Tooltip
              formatter={(val: any) => [formatCurrency(Number(val)), isVi ? "Lợi Nhuận Ròng" : "Net P&L"]}
              contentStyle={{
                backgroundColor: isDark ? "#0E141B" : "#FFFFFF",
                borderColor: isDark ? "#202A35" : "#E2E8F0",
                borderRadius: "12px",
                fontSize: "12px",
                fontFamily: "var(--font-mono)",
                color: isDark ? "#FFFFFF" : "#0F172A",
              }}
            />
            <ReferenceLine y={0} stroke={isDark ? "#475569" : "#CBD5E1"} />
            <Bar dataKey="pnl" radius={[6, 6, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? "#10B981" : "#EF4444"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
