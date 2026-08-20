"use client";

import React from "react";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import { formatCurrency, formatPercent } from "@/lib/utils/currency";

export interface RiskGuardBannerProps {
  currentDailyLoss: number;
  dailyLossLimit: number;
  isBreached: boolean;
  consecutiveLosses: number;
  onOpenSettings?: () => void;
}

export const RiskGuardBanner: React.FC<RiskGuardBannerProps> = ({
  currentDailyLoss,
  dailyLossLimit,
  isBreached,
  consecutiveLosses,
  onOpenSettings,
}) => {
  if (!isBreached && currentDailyLoss < dailyLossLimit * 0.75 && consecutiveLosses < 3) {
    return null;
  }

  const lossPercentUsed = dailyLossLimit > 0 ? (currentDailyLoss / dailyLossLimit) * 100 : 0;

  return (
    <div
      className={`w-full p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg ${
        isBreached
          ? "bg-loss/15 border-loss/50 text-loss"
          : "bg-warning/15 border-warning/50 text-warning"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`p-2 rounded-lg ${
            isBreached ? "bg-loss/20 text-loss" : "bg-warning/20 text-warning"
          }`}
        >
          {isBreached ? <ShieldAlert className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
        </div>
        <div>
          <h4 className="text-sm font-bold tracking-tight">
            {isBreached
              ? "DAILY RISK LIMIT REACHED — STOP TRADING FOR TODAY"
              : "CAUTION: APPROACHING DAILY RISK LIMIT"}
          </h4>
          <p className="text-xs opacity-90 mt-0.5">
            {isBreached
              ? `Daily loss threshold of ${formatCurrency(dailyLossLimit)} has been reached. Protecting your capital is rule #1.`
              : `Current loss is ${formatCurrency(currentDailyLoss)} (${formatPercent(lossPercentUsed, 0)} of max ${formatCurrency(dailyLossLimit)}).`}
            {consecutiveLosses >= 3 ? ` Consecutive losing streak: ${consecutiveLosses}. Enforce cooldown.` : ""}
          </p>
        </div>
      </div>

      {onOpenSettings && (
        <button
          onClick={onOpenSettings}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-surface-card border border-border/80 text-white hover:bg-surface-hover transition-colors shrink-0"
        >
          View Risk Guard
        </button>
      )}
    </div>
  );
};
