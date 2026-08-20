"use client";

import React from "react";
import { MetricCard } from "@/components/common/MetricCard";
import { PerformanceMetrics } from "@/lib/math/performance";
import { DrawdownResult } from "@/lib/math/drawdown";
import { formatCurrency, formatPercent } from "@/lib/utils/currency";
import { Wallet, TrendingUp, Percent, ShieldAlert, Award } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export interface AccountKPIGridProps {
  startingCapital: number;
  currentBalance: number;
  equity: number;
  todayProfit: number;
  metrics: PerformanceMetrics;
  drawdown: DrawdownResult;
  currency?: string;
}

export const AccountKPIGrid: React.FC<AccountKPIGridProps> = ({
  startingCapital,
  currentBalance,
  equity,
  todayProfit,
  metrics,
  drawdown,
  currency = "USD",
}) => {
  const { language, t } = useLanguage();
  const isVi = language === "vi";

  const netGrowthPercent = startingCapital > 0
    ? Number((((currentBalance - startingCapital) / startingCapital) * 100).toFixed(1))
    : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
      {/* Account Balance */}
      <MetricCard
        title={t("kpi_balance")}
        value={formatCurrency(currentBalance, currency)}
        changePercent={netGrowthPercent}
        changeLabel={isVi ? "Tăng Trưởng" : "Total Growth"}
        variant="default"
        icon={<Wallet className="w-4 h-4" />}
      />

      {/* Equity */}
      <MetricCard
        title={t("kpi_equity")}
        value={formatCurrency(equity, currency)}
        subtitle={drawdown.currentDrawdownPercent > 0 ? `-${formatPercent(drawdown.currentDrawdownPercent, 1)} DD` : (isVi ? "Đỉnh Vốn Cao Nhất" : "At Peak")}
        variant={equity >= currentBalance ? "gain" : "warning"}
        icon={<TrendingUp className="w-4 h-4" />}
      />

      {/* Today P&L */}
      <MetricCard
        title={t("kpi_net_profit")}
        value={formatCurrency(todayProfit, currency, true)}
        subtitle={isVi ? "Phiên Hôm Nay" : "Today's Session"}
        variant={todayProfit > 0 ? "gain" : todayProfit < 0 ? "loss" : "default"}
        icon={<Award className="w-4 h-4" />}
      />

      {/* Win Rate */}
      <MetricCard
        title={t("kpi_winrate")}
        value={metrics.totalTrades > 0 ? `${metrics.winRate}%` : "—"}
        subtitle={metrics.totalTrades > 0 ? `${metrics.winningTrades}W / ${metrics.losingTrades}L` : (isVi ? "Chưa có lệnh" : "No trades")}
        variant={metrics.winRate >= 50 ? "gain" : metrics.totalTrades > 0 ? "loss" : "default"}
        icon={<Percent className="w-4 h-4" />}
      />

      {/* Profit Factor */}
      <MetricCard
        title={t("kpi_profit_factor")}
        value={metrics.totalTrades > 0 ? metrics.profitFactor : "—"}
        subtitle={metrics.expectancy !== 0 ? `${isVi ? "Kỳ vọng: " : "Exp: "}${formatCurrency(metrics.expectancy, currency)}/T` : "—"}
        variant={metrics.profitFactor >= 1.5 ? "gain" : metrics.totalTrades > 0 ? "warning" : "default"}
        icon={<Award className="w-4 h-4" />}
      />

      {/* Max Drawdown */}
      <MetricCard
        title={t("kpi_max_drawdown")}
        value={drawdown.maxDrawdownPercent > 0 ? `-${drawdown.maxDrawdownPercent}%` : "0.0%"}
        subtitle={drawdown.maxDrawdownDollars > 0 ? `-${formatCurrency(drawdown.maxDrawdownDollars, currency)}` : (isVi ? "An Toàn" : "Protected")}
        variant={drawdown.maxDrawdownPercent > 10 ? "loss" : drawdown.maxDrawdownPercent > 5 ? "warning" : "gain"}
        icon={<ShieldAlert className="w-4 h-4" />}
      />
    </div>
  );
};
