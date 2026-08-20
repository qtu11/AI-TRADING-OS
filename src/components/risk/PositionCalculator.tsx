"use client";

import React, { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { soundFX } from "@/lib/sound/sound-effects";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { APP_CONFIG } from "@/config/app.config";
import { calculatePositionSize } from "@/lib/math/position-sizer";
import { formatCurrency, formatPercent } from "@/lib/utils/currency";
import { Calculator, ShieldCheck, ArrowRight, Sparkles } from "lucide-react";

export interface PositionCalculatorProps {
  initialBalance?: number;
}

export const PositionCalculator: React.FC<PositionCalculatorProps> = ({
  initialBalance = 0,
}) => {
  const { language } = useLanguage();
  const isVi = language === "vi";

  const [accountBalance, setAccountBalance] = useState(initialBalance);
  const [riskPercent, setRiskPercent] = useState(1.0);
  const [symbol, setSymbol] = useState("EURUSD");
  const [entryPrice, setEntryPrice] = useState("1.0850");
  const [stopLossPrice, setStopLossPrice] = useState("1.0830");
  const [takeProfitPrice, setTakeProfitPrice] = useState("1.0890");

  const result = calculatePositionSize({
    accountBalance,
    riskPercent,
    symbol,
    entryPrice: Number(entryPrice) || 0,
    stopLossPrice: Number(stopLossPrice) || 0,
    takeProfitPrice: Number(takeProfitPrice) || 0,
  });

  return (
    <div className="bento-card p-5 sm:p-6 space-y-5 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-brand-500/50 to-transparent" />
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-brand-500" />
          <h3 className="text-sm font-bold text-txt-primary">
            {isVi ? "Động Cơ Tính Toán Khối Lượng Vị Thế (Lot Size)" : "Forex & Multi-Asset Position Sizing Engine"}
          </h3>
        </div>
        <span className="text-[10px] font-mono text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded-full border border-sky-500/30 font-bold">
          {isVi ? "Toán Học Xác Thực" : "Deterministic Math"}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Col: Inputs */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={isVi ? "Số Dư Tài Khoản ($)" : "Account Balance ($)"}
              type="number"
              value={accountBalance}
              onChange={(e) => setAccountBalance(Number(e.target.value))}
              required
            />

            <Input
              label={isVi ? "Phần Trăm Rủi Ro (%)" : "Risk Percentage (%)"}
              type="number"
              step="0.1"
              value={riskPercent}
              onChange={(e) => setRiskPercent(Number(e.target.value))}
              required
            />
          </div>

          <Select
            label={isVi ? "Cặp Tiền / Công Cụ Giao Dịch" : "Trading Instrument / Pair"}
            value={symbol}
            onChange={(e) => {
              soundFX.playSwitch();
              setSymbol(e.target.value);
            }}
            options={APP_CONFIG.instruments.map((i) => ({
              value: i.symbol,
              label: `${i.symbol} (${i.name})`,
            }))}
          />

          <div className="grid grid-cols-3 gap-3">
            <Input
              label={isVi ? "Giá Vào (Entry)" : "Entry Price"}
              type="number"
              step="0.00001"
              value={entryPrice}
              onChange={(e) => setEntryPrice(e.target.value)}
              placeholder="1.0850"
              required
            />

            <Input
              label={isVi ? "Dừng Lỗ (SL)" : "Stop Loss (SL)"}
              type="number"
              step="0.00001"
              value={stopLossPrice}
              onChange={(e) => setStopLossPrice(e.target.value)}
              placeholder="1.0830"
              required
            />

            <Input
              label={isVi ? "Chốt Lời (TP)" : "Take Profit (TP)"}
              type="number"
              step="0.00001"
              value={takeProfitPrice}
              onChange={(e) => setTakeProfitPrice(e.target.value)}
              placeholder="1.0890"
            />
          </div>
        </div>

        {/* Right Col: Mathematical Output */}
        <div className="bg-bg-surface-subtle p-5 rounded-2xl border border-border/60 flex flex-col justify-between space-y-4">
          <div>
            <span className="text-xs font-bold text-txt-primary uppercase tracking-wider font-mono block mb-3">
              {isVi ? "Thông Số Kỹ Thuật Tính Toán" : "Calculated Execution Specifications"}
            </span>

            {result.isValid ? (
              <div className="space-y-3 font-mono text-xs">
                {/* Highlighted Lot Size */}
                <div className="p-4 bg-bg-surface rounded-xl border border-brand-500/40 flex items-center justify-between shadow-sm">
                  <div>
                    <span className="text-[10px] text-txt-muted block uppercase font-medium">
                      {isVi ? "Khối Lượng Khuyến Nghị (Lot)" : "Recommended Lot Size"}
                    </span>
                    <span className="text-2xl font-bold text-txt-primary mt-1 block">
                      {result.positionSizeLots} <span className="text-xs text-brand-500 font-normal">Lots</span>
                    </span>
                  </div>
                  <span className="text-xs text-txt-muted">
                    {result.positionUnits.toLocaleString()} {isVi ? "Đơn vị" : "Units"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 bg-bg-surface rounded-xl border border-border/60">
                    <span className="text-[10px] text-txt-muted block">
                      {isVi ? "Tổng Tiền Rủi Ro" : "Total Risk Amount"}
                    </span>
                    <span className="text-loss font-bold block mt-0.5">
                      -{formatCurrency(result.riskAmount)}
                    </span>
                  </div>

                  <div className="p-3 bg-bg-surface rounded-xl border border-border/60">
                    <span className="text-[10px] text-txt-muted block">
                      {isVi ? "Khoảng Cách Dừng Lỗ" : "Stop Loss Distance"}
                    </span>
                    <span className="text-txt-primary font-bold block mt-0.5">
                      {result.stopLossPips} Pips
                    </span>
                  </div>

                  {result.potentialProfit && (
                    <div className="p-3 bg-bg-surface rounded-xl border border-border/60">
                      <span className="text-[10px] text-txt-muted block">
                        {isVi ? "Lợi Nhuận Tiềm Năng" : "Potential Profit"}
                      </span>
                      <span className="text-gain font-bold block mt-0.5">
                        +{formatCurrency(result.potentialProfit)}
                      </span>
                    </div>
                  )}

                  {result.riskRewardRatio && (
                    <div className="p-3 bg-bg-surface rounded-xl border border-border/60">
                      <span className="text-[10px] text-txt-muted block">
                        {isVi ? "Tỷ Lệ Rủi Ro : Lợi Nhuận" : "Risk : Reward"}
                      </span>
                      <span className="text-sky-400 font-bold block mt-0.5">
                        1 : {result.riskRewardRatio}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-loss-subtle border border-loss/30 text-loss text-xs font-mono">
                {result.errorMessage || (isVi ? "Vui lòng nhập giá vào và dừng lỗ hợp lệ." : "Please enter valid entry and stop loss numbers.")}
              </div>
            )}
          </div>

          <div className="pt-2 text-[11px] text-txt-muted font-mono flex items-center gap-1.5 border-t border-border/60">
            <ShieldCheck className="w-3.5 h-3.5 text-gain" />
            <span>
              {isVi
                ? "Chuẩn quy đổi: 1 Lot Forex = 100,000 đơn vị ($10/pip cho cặp USD định giá)"
                : "Formula standard: 1 Lot Forex = 100,000 units ($10/pip quote)"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
