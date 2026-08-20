"use client";

import React, { useMemo } from "react";
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
import { Trade } from "@/types/trade.types";
import { Globe2 } from "lucide-react";

export interface SymbolAllocationPieChartProps {
  trades: Trade[];
}

const PALETTE = ["#00E5FF", "#38BDF8", "#818CF8", "#A855F7", "#EC4899", "#F59E0B", "#10B981", "#64748B"];

export const SymbolAllocationPieChart: React.FC<SymbolAllocationPieChartProps> = ({ trades }) => {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const isVi = language === "vi";
  const isDark = theme !== "light";

  const data = useMemo(() => {
    const map: Record<string, number> = {};
    trades.forEach((t) => {
      map[t.symbol] = (map[t.symbol] || 0) + 1;
    });
    return Object.entries(map).map(([name, value], idx) => ({
      name,
      value,
      color: PALETTE[idx % PALETTE.length],
    }));
  }, [trades]);

  if (trades.length === 0) {
    return (
      <div className="bento-card p-5 sm:p-6 space-y-3 relative overflow-hidden flex flex-col justify-between">
        <div className="flex items-center gap-2 border-b border-border/60 pb-3">
          <Globe2 className="w-4 h-4 text-sky-400" />
          <h3 className="text-xs font-bold text-txt-primary uppercase tracking-wider font-mono">
            {isVi ? "Phân Bổ Cặp Tiền (Biểu Đồ Tròn)" : "Symbol Allocation (Pie Chart)"}
          </h3>
        </div>
        <div className="h-56 flex items-center justify-center text-xs text-txt-muted font-mono">
          {isVi ? "Chưa có dữ liệu lệnh" : "No symbol allocation data"}
        </div>
      </div>
    );
  }

  return (
    <div className="bento-card p-5 sm:p-6 space-y-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-sky-500/50 to-transparent" />
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <Globe2 className="w-4 h-4 text-sky-400" />
          <h3 className="text-xs font-bold text-txt-primary uppercase tracking-wider font-mono">
            {isVi ? "Tỷ Trọng Khối Lượng Theo Cặp Tiền (Donut)" : "Instrument Allocation (Donut)"}
          </h3>
        </div>
        <span className="text-[10px] font-mono text-sky-400 bg-sky-500/15 px-2.5 py-0.5 rounded-full border border-sky-500/30 font-bold">
          {data.length} {isVi ? "Cặp Tiền" : "Symbols"}
        </span>
      </div>

      <div className="h-60 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={3}
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
                fontFamily: "var(--font-mono)",
                paddingTop: "8px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
