"use client";

import React, { useState, useMemo, useRef } from "react";
import { Trade, TradeDirection, TradeSession, TradeOutcome } from "@/types/trade.types";
import { formatCurrency, formatDateTime } from "@/lib/utils/currency";
import { useLanguage } from "@/context/LanguageContext";
import { soundFX } from "@/lib/sound/sound-effects";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { exportTradesToCSV, parseCSVToTrades } from "@/lib/utils/export";
import { saveTrade } from "@/lib/firebase/db-service";
import { useAuth } from "@/context/AuthContext";
import {
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Filter,
  Download,
  Upload,
  PlusCircle,
  TrendingUp,
  HelpCircle,
} from "lucide-react";

export interface TradesTableProps {
  trades: Trade[];
  onSelectTrade: (trade: Trade) => void;
  onOpenNewTradeModal: () => void;
}

export const TradesTable: React.FC<TradesTableProps> = ({
  trades,
  onSelectTrade,
  onOpenNewTradeModal,
}) => {
  const { userProfile } = useAuth();
  const { language } = useLanguage();
  const isVi = language === "vi";
  const userId = userProfile?.id || "dev-trader-01";

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sessionFilter, setSessionFilter] = useState<string>("ALL");
  const [outcomeFilter, setOutcomeFilter] = useState<string>("ALL");
  const [directionFilter, setDirectionFilter] = useState<string>("ALL");
  const [pageSize, setPageSize] = useState<number>(20);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsedTrades = parseCSVToTrades(text, userId);
        if (parsedTrades.length === 0) {
          alert(isVi ? "Không tìm thấy dữ liệu hợp lệ trong CSV." : "No valid trade records found in CSV.");
          soundFX.playWarning();
          return;
        }

        // Batch save trades
        for (const t of parsedTrades) {
          await saveTrade(userId, t);
        }
        alert(isVi ? `Đã nhập thành công ${parsedTrades.length} lệnh!` : `Successfully imported ${parsedTrades.length} trades!`);
        soundFX.playSuccess();
      } catch (err) {
        console.warn("Import CSV error:", err);
        alert(isVi ? "Lỗi phân tích file CSV." : "Failed to parse CSV file.");
        soundFX.playWarning();
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  // Filtered & Sorted Trades
  const filteredTrades = useMemo(() => {
    return trades.filter((trade) => {
      // Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesSymbol = trade.symbol.toLowerCase().includes(q);
        const matchesNotes = (trade.notes || "").toLowerCase().includes(q);
        const matchesStrategy = (trade.strategyName || "").toLowerCase().includes(q);
        if (!matchesSymbol && !matchesNotes && !matchesStrategy) return false;
      }

      // Session
      if (sessionFilter !== "ALL" && trade.session !== sessionFilter) return false;

      // Outcome
      if (outcomeFilter !== "ALL" && trade.outcome !== outcomeFilter) return false;

      // Direction
      if (directionFilter !== "ALL" && trade.direction !== directionFilter) return false;

      return true;
    });
  }, [trades, searchQuery, sessionFilter, outcomeFilter, directionFilter]);

  // Pagination Slicing
  const totalPages = Math.ceil(filteredTrades.length / pageSize) || 1;
  const paginatedTrades = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTrades.slice(start, start + pageSize);
  }, [filteredTrades, currentPage, pageSize]);

  return (
    <div className="bento-card p-5 sm:p-6 space-y-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-brand-500/50 to-transparent" />

      {/* Hidden File Input for CSV Import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".csv"
        className="hidden"
      />

      {/* Header with Search & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <h3 className="text-base font-bold text-txt-primary flex items-center gap-2 font-mono">
            <TrendingUp className="w-5 h-5 text-brand-500" />
            {isVi ? `Danh Sách Lệnh Thực Thi (${filteredTrades.length})` : `All Executed Trades (${filteredTrades.length})`}
          </h3>
          <p className="text-xs text-txt-secondary mt-0.5 font-sans">
            {isVi
              ? "Lọc lệnh, kiểm tra chất lượng khớp lệnh, đánh giá kỷ luật và xuất dữ liệu."
              : "Filter, inspect execution quality, review AI audit scores, and export records."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
          >
            <Upload className="w-3.5 h-3.5 mr-1.5" />
            {isImporting ? (isVi ? "Đang nhập..." : "Importing...") : (isVi ? "Nhập CSV" : "Import CSV")}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              soundFX.playSuccess();
              exportTradesToCSV(filteredTrades);
            }}
            disabled={filteredTrades.length === 0}
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            {isVi ? "Xuất CSV" : "Export CSV"}
          </Button>

          <Button variant="primary" size="sm" onClick={onOpenNewTradeModal}>
            <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
            {isVi ? "Ghi Nhận Lệnh" : "Log Trade"}
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <Input
          placeholder={isVi ? "Tìm cặp tiền, chiến lược, ghi chú..." : "Search pair, strategy, notes..."}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          leftIcon={<Search className="w-4 h-4" />}
        />

        <Select
          value={sessionFilter}
          onChange={(e) => {
            soundFX.playSwitch();
            setSessionFilter(e.target.value);
            setCurrentPage(1);
          }}
          options={[
            { value: "ALL", label: isVi ? "Tất Cả Phiên" : "All Sessions" },
            { value: "London", label: "London Session" },
            { value: "New York", label: "New York Session" },
            { value: "London+NY", label: "London / NY Overlap" },
            { value: "Asian", label: "Asian Session" },
          ]}
        />

        <Select
          value={outcomeFilter}
          onChange={(e) => {
            soundFX.playSwitch();
            setOutcomeFilter(e.target.value);
            setCurrentPage(1);
          }}
          options={[
            { value: "ALL", label: isVi ? "Tất Cả Kết Quả" : "All Outcomes" },
            { value: "WIN", label: isVi ? "Lệnh Thắng (WIN)" : "Winning Trades (WIN)" },
            { value: "LOSS", label: isVi ? "Lệnh Thua (LOSS)" : "Losing Trades (LOSS)" },
            { value: "BREAKEVEN", label: isVi ? "Hòa Vốn (BE)" : "Breakeven" },
          ]}
        />

        <Select
          value={directionFilter}
          onChange={(e) => {
            soundFX.playSwitch();
            setDirectionFilter(e.target.value);
            setCurrentPage(1);
          }}
          options={[
            { value: "ALL", label: isVi ? "Tất Cả Hướng Lệnh" : "All Directions" },
            { value: "BUY", label: isVi ? "Lệnh MUA (BUY)" : "BUY Orders" },
            { value: "SELL", label: isVi ? "Lệnh BÁN (SELL)" : "SELL Orders" },
          ]}
        />

        <Select
          value={String(pageSize)}
          onChange={(e) => {
            soundFX.playSwitch();
            setPageSize(Number(e.target.value));
            setCurrentPage(1);
          }}
          options={[
            { value: "20", label: isVi ? "20 lệnh / trang" : "20 per page" },
            { value: "50", label: isVi ? "50 lệnh / trang" : "50 per page" },
            { value: "100", label: isVi ? "100 lệnh / trang" : "100 per page" },
          ]}
        />
      </div>

      {/* Trades Table Content */}
      {paginatedTrades.length === 0 ? (
        <div className="py-12 text-center space-y-2 border border-dashed border-border rounded-2xl">
          <HelpCircle className="w-8 h-8 text-txt-muted mx-auto" />
          <h4 className="text-sm font-bold text-txt-primary">
            {isVi ? "Không Tìm Thấy Lệnh Nào Khớp" : "No Matching Trade Records"}
          </h4>
          <p className="text-xs text-txt-secondary max-w-sm mx-auto">
            {isVi
              ? "Hãy thử điều chỉnh bộ lọc hoặc bấm \"Ghi Nhận Lệnh\" để thêm lệnh mới."
              : "Try adjusting your search filters or click \"Log Trade\" to add a new trade record."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-border text-[10px] uppercase tracking-wider text-txt-muted">
                <th className="pb-3 font-semibold">{isVi ? "Thời Gian" : "Date & Time"}</th>
                <th className="pb-3 font-semibold">{isVi ? "Cặp Tiền" : "Symbol"}</th>
                <th className="pb-3 font-semibold">{isVi ? "Loại" : "Type"}</th>
                <th className="pb-3 font-semibold">Lots</th>
                <th className="pb-3 font-semibold">{isVi ? "Vào → Ra" : "Open → Close"}</th>
                <th className="pb-3 font-semibold">SL / TP</th>
                <th className="pb-3 font-semibold">{isVi ? "Phiên" : "Session"}</th>
                <th className="pb-3 font-semibold">P&L ($)</th>
                <th className="pb-3 font-semibold">R:R</th>
                <th className="pb-3 font-semibold text-right">{isVi ? "Hành Động" : "Action"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {paginatedTrades.map((trade) => {
                const isWin = Number(trade.netProfit ?? 0) > 0;
                const isLoss = Number(trade.netProfit ?? 0) < 0;

                return (
                  <tr
                    key={trade.id}
                    onClick={() => {
                      soundFX.playClick(750);
                      onSelectTrade(trade);
                    }}
                    className="hover:bg-bg-surface-hover cursor-pointer transition-colors"
                  >
                    <td className="py-3 text-txt-muted text-[11px]">
                      {formatDateTime(trade.openTime)}
                    </td>
                    <td className="py-3 font-bold text-txt-primary flex items-center gap-1.5">
                      {trade.direction === "BUY" ? (
                        <ArrowUpRight className="w-3.5 h-3.5 text-gain" />
                      ) : (
                        <ArrowDownRight className="w-3.5 h-3.5 text-loss" />
                      )}
                      <span>{trade.symbol}</span>
                    </td>
                    <td className="py-3">
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                          trade.direction === "BUY"
                            ? "bg-gain-subtle text-gain border border-gain/30"
                            : "bg-loss-subtle text-loss border border-loss/30"
                        }`}
                      >
                        {trade.direction}
                      </span>
                    </td>
                    <td className="py-3 text-txt-secondary">{trade.lots}</td>
                    <td className="py-3 text-txt-secondary">
                      {trade.openPrice} → {trade.closePrice || "Open"}
                    </td>
                    <td className="py-3 text-txt-muted">
                      {trade.stopLoss} / {trade.takeProfit}
                    </td>
                    <td className="py-3 text-txt-muted">{trade.session}</td>
                    <td className="py-3 font-bold">
                      <span
                        className={isWin ? "text-gain font-bold" : isLoss ? "text-loss font-bold" : "text-txt-muted"}
                      >
                        {formatCurrency(trade.netProfit, "USD", true)}
                      </span>
                    </td>
                    <td className="py-3 font-medium">
                      {trade.riskRewardRatio !== undefined ? (
                        <span className={trade.riskRewardRatio >= 1.5 ? "text-gain font-bold" : "text-txt-secondary"}>
                          {trade.riskRewardRatio}R
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-3 text-right">
                      <span className="text-[10px] text-sky-400 hover:underline font-semibold">
                        {isVi ? "Chi tiết →" : "View Details →"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-3 border-t border-border/60 text-xs font-mono text-txt-muted">
          <span>
            {isVi ? `Trang ${currentPage} / ${totalPages}` : `Page ${currentPage} of ${totalPages}`}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => {
                soundFX.playSwitch();
                setCurrentPage((p) => Math.max(1, p - 1));
              }}
            >
              {isVi ? "Trước" : "Previous"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => {
                soundFX.playSwitch();
                setCurrentPage((p) => Math.min(totalPages, p + 1));
              }}
            >
              {isVi ? "Sau" : "Next"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
