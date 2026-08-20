"use client";

import React, { useState, useEffect } from "react";
import { Trade } from "@/types/trade.types";
import { TradingPlan } from "@/types/plan.types";
import { formatCurrency } from "@/lib/utils/currency";
import { DayDetailModal } from "./DayDetailModal";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, BookOpen, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { soundFX } from "@/lib/sound/sound-effects";
import { getAllJournals } from "@/lib/firebase/db-service";
import { DailyJournal } from "@/types/journal.types";

export interface TradingCalendarProps {
  trades: Trade[];
  plan: TradingPlan | null;
}

export const TradingCalendar: React.FC<TradingCalendarProps> = ({ trades, plan }) => {
  const { userProfile } = useAuth();
  const { language } = useLanguage();
  const isVi = language === "vi";
  const userId = userProfile?.id || "dev-trader-01";

  const [currentDate, setCurrentDate] = useState(new Date(2026, 7, 1)); // August 2026 default
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  const [journals, setJournals] = useState<DailyJournal[]>([]);

  // Load all journals for badge display
  useEffect(() => {
    if (userId) {
      getAllJournals(userId).then(setJournals).catch(console.warn);
    }
  }, [userId]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevMonth = () => {
    soundFX.playSwitch();
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    soundFX.playSwitch();
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const monthName = currentDate.toLocaleString(isVi ? "vi-VN" : "en-US", { 
    month: "long", 
    year: "numeric" 
  }).replace(/^\w/, (c) => c.toUpperCase());

  // Map trades by date string YYYY-MM-DD
  const tradesByDate: Record<string, { trades: Trade[]; pnl: number }> = {};
  trades.forEach((trade) => {
    const dStr = trade.closeTime ? trade.closeTime.split("T")[0] : trade.openTime.split("T")[0];
    if (!tradesByDate[dStr]) {
      tradesByDate[dStr] = { trades: [], pnl: 0 };
    }
    tradesByDate[dStr].trades.push(trade);
    tradesByDate[dStr].pnl += Number(trade.netProfit || 0);
  });

  // Calculate days in month
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 is Sun, 1 is Mon
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const daysArray: Array<{ dayNum: number; dateStr: string; isCurrentMonth: boolean }> = [];

  // Previous month trailing days
  const prevMonthDays = new Date(year, month, 0).getDate();
  const offset = (firstDayOfWeek + 6) % 7; // Monday-based offset
  for (let i = offset - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    const m = month === 0 ? 12 : month;
    const y = month === 0 ? year - 1 : year;
    const dateStr = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    daysArray.push({ dayNum: d, dateStr, isCurrentMonth: false });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    daysArray.push({ dayNum: d, dateStr, isCurrentMonth: true });
  }

  // Next month leading days to complete grid (up to 35 or 42)
  const remaining = 35 - daysArray.length;
  if (remaining > 0) {
    for (let d = 1; d <= remaining; d++) {
      const m = month === 11 ? 1 : month + 2;
      const y = month === 11 ? year + 1 : year;
      const dateStr = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      daysArray.push({ dayNum: d, dateStr, isCurrentMonth: false });
    }
  }

  const weekHeaders = isVi
    ? ["T2", "T3", "T4", "T5", "T6", "T7", "CN"]
    : ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

  return (
    <div className="bento-card p-5 sm:p-6 space-y-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-brand-500/50 to-transparent" />
      {/* Calendar Navigation Header */}
      <div className="flex items-center justify-between border-b border-border/60 pb-4">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-brand-400" />
          <h3 className="text-sm font-bold text-txt-primary font-mono">{monthName}</h3>
        </div>

        <div className="flex items-center gap-1 bg-bg-surface-subtle p-1 rounded-xl border border-border/60">
          <button
            onClick={prevMonth}
            className="p-1 rounded-lg text-txt-muted hover:text-txt-primary hover:bg-bg-surface transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              soundFX.playClick();
              setCurrentDate(new Date());
            }}
            className="px-2.5 py-0.5 text-xs font-mono font-bold text-txt-secondary hover:text-txt-primary cursor-pointer"
          >
            {isVi ? "Hôm Nay" : "Today"}
          </button>
          <button
            onClick={nextMonth}
            className="p-1 rounded-lg text-txt-muted hover:text-txt-primary hover:bg-bg-surface transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Week Headers */}
      <div className="grid grid-cols-7 gap-1 text-center font-mono text-[10px] uppercase font-bold text-txt-muted tracking-wider">
        {weekHeaders.map((w) => (
          <div key={w} className="py-1">
            {w}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {daysArray.map((cell, idx) => {
          const dayData = tradesByDate[cell.dateStr];
          const hasTrades = Boolean(dayData && dayData.trades.length > 0);
          const isWin = hasTrades && dayData.pnl > 0;
          const isLoss = hasTrades && dayData.pnl < 0;
          
          // Check if this date has a journal
          const hasJournal = journals.some(j => j.date === cell.dateStr);
          const journalEntry = journals.find(j => j.date === cell.dateStr);

          return (
            <button
              key={idx}
              onClick={() => {
                soundFX.playClick(650);
                setSelectedDateStr(cell.dateStr);
              }}
              className={`min-h-[72px] sm:min-h-[84px] p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all select-none group cursor-pointer relative ${
                cell.isCurrentMonth
                  ? "bg-bg-surface-subtle border-border/60 hover:border-brand-500/50 hover:bg-bg-surface-hover"
                  : "bg-bg-surface-subtle/40 border-border/20 opacity-40 hover:opacity-75"
              } ${isWin ? "border-gain/40 bg-gain-subtle/30" : isLoss ? "border-loss/40 bg-loss-subtle/30" : ""} ${hasJournal && !hasTrades ? "border-sky-500/40 bg-sky-500/10" : ""}`}
            >
              {/* Journal Badge */}
              {hasJournal && (
                <div className="absolute top-1.5 right-1.5">
                  {journalEntry?.milestoneContext ? (
                    <div className="w-4 h-4 rounded-full bg-amber-500/80 flex items-center justify-center" title="Has Milestone Journal">
                      <span className="text-[8px]">🏆</span>
                    </div>
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-sky-500/80 flex items-center justify-center" title="Has Daily Journal">
                      <BookOpen className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex items-center justify-between w-full">
                <span className={`text-xs font-mono font-bold ${
                  cell.isCurrentMonth ? "text-txt-primary" : "text-txt-muted"
                }`}>
                  {cell.dayNum}
                </span>

                {hasTrades && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-bg-surface text-txt-secondary border border-border/60 font-semibold">
                    {dayData.trades.length}T
                  </span>
                )}
              </div>

              {hasTrades ? (
                <div className="mt-1">
                  <span
                    className={`text-xs font-bold font-mono block truncate ${
                      isWin ? "text-gain" : isLoss ? "text-loss" : "text-txt-secondary"
                    }`}
                  >
                    {formatCurrency(dayData.pnl, "USD", true)}
                  </span>
                </div>
              ) : hasJournal ? (
                <div className="mt-1">
                  <span className="text-[10px] text-sky-400 font-mono truncate block">
                    {isVi ? "📝 Đã ghi" : "📝 Logged"}
                  </span>
                </div>
              ) : (
                <span className="text-[10px] text-txt-muted font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                  {isVi ? "Mở ngày" : "Open day"}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Day Detail Workspace Modal */}
      <DayDetailModal
        isOpen={Boolean(selectedDateStr)}
        dateStr={selectedDateStr}
        trades={trades}
        plan={plan}
        onClose={() => setSelectedDateStr(null)}
        userId={userId}
      />
    </div>
  );
};
