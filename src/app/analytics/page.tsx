"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { Trade } from "@/types/trade.types";
import { subscribeToTrades } from "@/lib/firebase/db-service";
import { calculateTradeMetrics } from "@/lib/math/performance";
import { formatCurrency, formatPercent } from "@/lib/utils/currency";
import { BarChart3, TrendingUp, Award, Layers, Globe2, Calendar, PieChart } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { OutcomePieChart } from "@/components/charts/OutcomePieChart";
import { SymbolAllocationPieChart } from "@/components/charts/SymbolAllocationPieChart";
import { DailyPnLBarChart } from "@/components/charts/DailyPnLBarChart";
import { WinRateBySymbolBarChart } from "@/components/charts/WinRateBySymbolBarChart";
import { DrawdownAreaChart } from "@/components/charts/DrawdownAreaChart";

export default function AnalyticsPage() {
  const { userProfile } = useAuth();
  const { language } = useLanguage();
  const isVi = language === "vi";
  const userId = userProfile?.id || "dev-trader-01";

  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const unsub = subscribeToTrades(userId, (liveTrades) => {
      setTrades(liveTrades);
      setLoading(false);
    });
    return () => {
      if (unsub) unsub();
    };
  }, [userId]);

  const metrics = calculateTradeMetrics(trades);

  // Group by Symbol
  const symbolBreakdown = useMemo(() => {
    const map: Record<string, { trades: number; wins: number; pnl: number }> = {};
    trades.forEach((t) => {
      if (!map[t.symbol]) map[t.symbol] = { trades: 0, wins: 0, pnl: 0 };
      map[t.symbol].trades += 1;
      if (Number(t.netProfit || 0) > 0) map[t.symbol].wins += 1;
      map[t.symbol].pnl += Number(t.netProfit || 0);
    });
    return Object.entries(map).map(([symbol, data]) => ({
      symbol,
      trades: data.trades,
      winRate: ((data.wins / data.trades) * 100).toFixed(1),
      pnl: data.pnl,
    }));
  }, [trades]);

  // Group by Session
  const sessionBreakdown = useMemo(() => {
    const map: Record<string, { trades: number; wins: number; pnl: number }> = {};
    trades.forEach((t) => {
      const sess = t.session || "Other";
      if (!map[sess]) map[sess] = { trades: 0, wins: 0, pnl: 0 };
      map[sess].trades += 1;
      if (Number(t.netProfit || 0) > 0) map[sess].wins += 1;
      map[sess].pnl += Number(t.netProfit || 0);
    });
    return Object.entries(map).map(([session, data]) => ({
      session,
      trades: data.trades,
      winRate: ((data.wins / data.trades) * 100).toFixed(1),
      pnl: data.pnl,
    }));
  }, [trades]);

  // Day of Week Performance Heatmap
  const daysOfWeek = [
    { en: "Monday", vi: "Thứ Hai" },
    { en: "Tuesday", vi: "Thứ Ba" },
    { en: "Wednesday", vi: "Thứ Tư" },
    { en: "Thursday", vi: "Thứ Năm" },
    { en: "Friday", vi: "Thứ Sáu" },
  ];

  const dayBreakdown = useMemo(() => {
    const map: Record<string, { trades: number; wins: number; pnl: number }> = {};
    ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].forEach((d) => (map[d] = { trades: 0, wins: 0, pnl: 0 }));

    trades.forEach((t) => {
      const d = new Date(t.openTime);
      const dayName = d.toLocaleDateString("en-US", { weekday: "long" });
      if (map[dayName]) {
        map[dayName].trades += 1;
        if (Number(t.netProfit || 0) > 0) map[dayName].wins += 1;
        map[dayName].pnl += Number(t.netProfit || 0);
      }
    });

    return daysOfWeek.map((dayObj) => ({
      day: isVi ? dayObj.vi : dayObj.en,
      trades: map[dayObj.en].trades,
      winRate: map[dayObj.en].trades > 0 ? ((map[dayObj.en].wins / map[dayObj.en].trades) * 100).toFixed(0) : "—",
      pnl: map[dayObj.en].pnl,
    }));
  }, [trades, isVi]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-bg-surface border border-border shadow-sm">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-txt-primary flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-brand-500/15 text-brand-500 border border-brand-500/30">
            <BarChart3 className="w-5 h-5" />
          </div>
          <span>{isVi ? "Phân Tích Hiệu Suất Nâng Cao & Hệ Thống Biểu Đồ Trực Quan" : "Advanced Quantitative Analytics & Visual Chart System"}</span>
        </h1>
        <p className="text-xs text-txt-secondary mt-1 font-mono">
          {isVi
            ? "Hệ thống phân tích toàn diện với đầy đủ Biểu đồ Tròn (Pie/Donut), Biểu đồ Cột (Bar), Biểu đồ Đường/Vùng (Line/Area), bản đồ nhiệt ngày và phân bổ định lượng."
            : "Comprehensive quantitative system with Pie, Bar, Area/Line charts, day-of-week heatmaps, and multi-dimensional segmentation."}
        </p>
      </div>

      {trades.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title={isVi ? "Chưa Có Dữ Liệu Giao Dịch" : "No Trading Data Available"}
          description={isVi ? "Hãy ghi nhận lệnh hoặc đồng bộ từ MetaTrader 5 để tạo hệ thống biểu đồ phân tích trực quan." : "Log trades or sync MetaTrader 5 to generate your live visual analytics system."}
        />
      ) : (
        <div className="space-y-6">
          {/* Section 1: Biểu đồ Tròn (Pie / Donut Charts) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <OutcomePieChart metrics={metrics} />
            <SymbolAllocationPieChart trades={trades} />
          </div>

          {/* Section 2: Biểu đồ Cột (Bar Charts) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DailyPnLBarChart trades={trades} />
            <WinRateBySymbolBarChart trades={trades} />
          </div>

          {/* Section 3: Biểu đồ Đường / Vùng (Drawdown Area & Equity Line) */}
          <div className="grid grid-cols-1 gap-6">
            <DrawdownAreaChart trades={trades} startingCapital={userProfile?.startingCapital ?? 0} />
          </div>

          {/* Section 4: Day of Week Heatmap Grid */}
          <div className="bento-card p-5 sm:p-6 space-y-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-brand-500/50 to-transparent" />
            <div className="flex items-center gap-2 border-b border-border/60 pb-3">
              <Calendar className="w-4 h-4 text-sky-400" />
              <h3 className="text-xs font-bold text-txt-primary uppercase tracking-wider font-mono">
                {isVi ? "Bản Đồ Nhiệt Hiệu Suất Theo Ngày Trong Tuần" : "Day-of-Week Performance Heatmap"}
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 font-mono text-xs">
              {dayBreakdown.map((d) => (
                <div
                  key={d.day}
                  className={`p-4 rounded-2xl border text-center space-y-1.5 transition-all ${
                    d.pnl > 0
                      ? "bg-gain-subtle/30 border-gain/40 text-gain"
                      : d.pnl < 0
                      ? "bg-loss-subtle/30 border-loss/40 text-loss"
                      : "bg-bg-surface-subtle border-border/60 text-txt-secondary"
                  }`}
                >
                  <span className="font-bold text-txt-primary block font-sans">{d.day}</span>
                  <span className="text-base font-bold block font-mono">
                    {d.trades > 0 ? formatCurrency(d.pnl, "USD", true) : "—"}
                  </span>
                  <span className="text-[10px] text-txt-muted block font-mono">
                    {d.trades} {isVi ? "Lệnh" : "Trades"} • {d.winRate}% {isVi ? "Thắng" : "Win"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 5: Breakdown Matrices: Symbols & Sessions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Symbol Matrix */}
            <div className="bento-card p-5 sm:p-6 space-y-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-brand-500/50 to-transparent" />
              <div className="flex items-center gap-2 border-b border-border/60 pb-3">
                <Globe2 className="w-4 h-4 text-brand-500" />
                <h3 className="text-xs font-bold text-txt-primary uppercase tracking-wider font-mono">
                  {isVi ? "Chi Tiết Hiệu Suất Cặp Tiền" : "Instrument Detail Matrix"}
                </h3>
              </div>

              <div className="divide-y divide-border/60 font-mono text-xs">
                {symbolBreakdown.map((s) => (
                  <div key={s.symbol} className="py-3 flex items-center justify-between">
                    <span className="font-bold text-txt-primary">{s.symbol}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-txt-muted">{s.trades} {isVi ? "Lệnh" : "Trades"} ({s.winRate}% {isVi ? "Thắng" : "Win"})</span>
                      <span className={`font-bold ${s.pnl >= 0 ? "text-gain" : "text-loss"}`}>
                        {formatCurrency(s.pnl, "USD", true)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Session Matrix */}
            <div className="bento-card p-5 sm:p-6 space-y-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-sky-500/50 to-transparent" />
              <div className="flex items-center gap-2 border-b border-border/60 pb-3">
                <Layers className="w-4 h-4 text-sky-400" />
                <h3 className="text-xs font-bold text-txt-primary uppercase tracking-wider font-mono">
                  {isVi ? "Chi Tiết Hiệu Suất Phiên Giao Dịch" : "Trading Session Detail Matrix"}
                </h3>
              </div>

              <div className="divide-y divide-border/60 font-mono text-xs">
                {sessionBreakdown.map((sess) => (
                  <div key={sess.session} className="py-3 flex items-center justify-between">
                    <span className="font-bold text-txt-primary">{sess.session} {isVi ? "Phiên" : ""}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-txt-muted">{sess.trades} {isVi ? "Lệnh" : "Trades"} ({sess.winRate}% {isVi ? "Thắng" : "Win"})</span>
                      <span className={`font-bold ${sess.pnl >= 0 ? "text-gain" : "text-loss"}`}>
                        {formatCurrency(sess.pnl, "USD", true)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
