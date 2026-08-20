"use client";

import React, { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "next-themes";
import { Trade } from "@/types/trade.types";
import { ShieldAlert } from "lucide-react";

export interface DrawdownAreaChartProps {
  trades: Trade[];
  startingCapital?: number;
}

export const DrawdownAreaChart: React.FC<DrawdownAreaChartProps> = ({
  trades,
  startingCapital = 0,
}) => {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const isVi = language === "vi";
  const isDark = theme !== "light";

  const data = useMemo(() => {
    if (trades.length === 0) {
      return [{ index: 0, drawdown: 0, equity: startingCapital }];
    }

    const sorted = [...trades].sort(
      (a, b) => new Date(a.openTime).getTime() - new Date(b.openTime).getTime()
    );

    let peak = startingCapital;
    let currentEquity = startingCapital;

    const points = [{ index: 0, drawdown: 0, equity: startingCapital }];

    sorted.forEach((t, i) => {
      currentEquity += Number(t.netProfit || 0);
      if (currentEquity > peak) peak = currentEquity;
      const dd = peak > 0 ? Number((((currentEquity - peak) / peak) * 100).toFixed(2)) : 0;
      points.push({
        index: i + 1,
        drawdown: dd <= 0 ? dd : 0,
        equity: Number(currentEquity.toFixed(2)),
      });
    });

    return points;
  }, [trades, startingCapital]);

  const maxDrawdown = useMemo(() => {
    const minVal = Math.min(...data.map((d) => d.drawdown));
    return Math.abs(minVal);
  }, [data]);

  return (
    <div className="bento-card p-5 sm:p-6 space-y-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-loss/50 to-transparent" />
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-loss" />
          <h3 className="text-xs font-bold text-txt-primary uppercase tracking-wider font-mono">
            {isVi ? "Đường Cong Sụt Giảm Tài Khoản (Drawdown %)" : "Underwater Drawdown % (Area Chart)"}
          </h3>
        </div>
        <span className="text-[10px] font-mono text-loss bg-loss-subtle px-2.5 py-0.5 rounded-full border border-loss/40 font-bold">
          Max DD: -{maxDrawdown.toFixed(2)}%
        </span>
      </div>

      <div className="h-60 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="drawdownGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#202A35" : "#E2E8F0"} vertical={false} />
            <XAxis
              dataKey="index"
              stroke={isDark ? "#64748B" : "#94A3B8"}
              fontSize={11}
              fontFamily="var(--font-mono)"
              tickLine={false}
              tickFormatter={(v) => `#${v}`}
            />
            <YAxis
              stroke={isDark ? "#64748B" : "#94A3B8"}
              fontSize={11}
              fontFamily="var(--font-mono)"
              tickFormatter={(v) => `${v}%`}
              tickLine={false}
            />
            <Tooltip
              formatter={(val: any) => [`${val}%`, isVi ? "Sụt Giảm (Drawdown)" : "Drawdown"]}
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
            <Area
              type="monotone"
              dataKey="drawdown"
              stroke="#EF4444"
              strokeWidth={2}
              fill="url(#drawdownGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
