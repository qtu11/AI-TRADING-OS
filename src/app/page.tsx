"use client";

import React, { useState } from "react";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { TradeFormModal } from "@/components/trades/TradeFormModal";
import { TradeDetailDrawer } from "@/components/trades/TradeDetailDrawer";
import { PlanBuilderWizard } from "@/components/plan/PlanBuilderWizard";
import { JournalModal } from "@/components/journal/JournalModal";
import { Trade } from "@/types/trade.types";

export default function DashboardPage() {
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [isPlanWizardOpen, setIsPlanWizardOpen] = useState(false);
  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);

  const handleEditTrade = (trade: Trade) => {
    setSelectedTrade(null);
    setEditingTrade(trade);
    setIsTradeModalOpen(true);
  };

  return (
    <div>
      <DashboardOverview
        onOpenTradeModal={() => {
          setEditingTrade(null);
          setIsTradeModalOpen(true);
        }}
        onOpenPlanWizard={() => setIsPlanWizardOpen(true)}
        onSelectTrade={(trade) => setSelectedTrade(trade)}
        onOpenJournal={() => setIsJournalModalOpen(true)}
      />

      {/* Trade Log & Edit Modal */}
      <TradeFormModal
        isOpen={isTradeModalOpen}
        onClose={() => {
          setIsTradeModalOpen(false);
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

      {/* Trading Plan Builder Wizard */}
      <PlanBuilderWizard
        isOpen={isPlanWizardOpen}
        onClose={() => setIsPlanWizardOpen(false)}
      />

      {/* Journal Modal */}
      <JournalModal
        isOpen={isJournalModalOpen}
        onClose={() => setIsJournalModalOpen(false)}
      />
    </div>
  );
}
