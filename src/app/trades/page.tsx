"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { Trade } from "@/types/trade.types";
import { subscribeToTrades } from "@/lib/firebase/db-service";
import { TradesTable } from "@/components/trades/TradesTable";
import { TradeFormModal } from "@/components/trades/TradeFormModal";
import { TradeDetailDrawer } from "@/components/trades/TradeDetailDrawer";
import { TrendingUp, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function TradesPage() {
  const { userProfile } = useAuth();
  const { language, t } = useLanguage();
  const userId = userProfile?.id || "dev-trader-01";

  const [trades, setTrades] = useState<Trade[]>([]);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);

  useEffect(() => {
    if (!userId) return;
    const unsub = subscribeToTrades(userId, setTrades);
    return () => {
      if (unsub) unsub();
    };
  }, [userId]);

  const handleEditTrade = (trade: Trade) => {
    setSelectedTrade(null);
    setEditingTrade(trade);
    setIsFormModalOpen(true);
  };

  const isVi = language === "vi";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-bg-surface border border-border shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-txt-primary flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-500/15 text-brand-500 border border-brand-500/30">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span>{isVi ? "Sổ Lệnh Giao Dịch & Phân Tích Thực Thi" : "Trade Log & Performance Analytics"}</span>
          </h1>
          <p className="text-xs text-txt-secondary mt-1 font-mono">
            {isVi
              ? `${trades.length} Tổng số lệnh thực thi • Đồng bộ thời gian thực`
              : `${trades.length} Total Executed Trades • Verified Realtime Sync`}
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => {
            setEditingTrade(null);
            setIsFormModalOpen(true);
          }}
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          {t("btn_new_trade")}
        </Button>
      </div>

      {/* Trades Table */}
      <TradesTable
        trades={trades}
        onSelectTrade={(t) => setSelectedTrade(t)}
        onOpenNewTradeModal={() => {
          setEditingTrade(null);
          setIsFormModalOpen(true);
        }}
      />

      {/* Trade Form Modal */}
      <TradeFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingTrade(null);
        }}
        initialTrade={editingTrade}
      />

      {/* Trade Detail Drawer */}
      <TradeDetailDrawer
        isOpen={Boolean(selectedTrade)}
        trade={selectedTrade}
        onClose={() => setSelectedTrade(null)}
        onEdit={handleEditTrade}
      />
    </div>
  );
}
