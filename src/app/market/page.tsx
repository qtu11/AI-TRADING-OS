"use client";

import React, { useState } from "react";
import { APP_CONFIG } from "@/config/app.config";
import { useLanguage } from "@/context/LanguageContext";
import { soundFX } from "@/lib/sound/sound-effects";
import { LiveCandlestickChart } from "@/components/charts/LiveCandlestickChart";
import { Globe2, TrendingUp, Sparkles, Sliders, ShieldCheck } from "lucide-react";

export default function MarketPage() {
  const { language } = useLanguage();
  const isVi = language === "vi";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-bg-surface border border-border shadow-sm">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-txt-primary flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-brand-500/15 text-brand-500 border border-brand-500/30">
            <Globe2 className="w-5 h-5" />
          </div>
          <span>{isVi ? "Dữ Liệu Thị Trường & Chart Nến Thời Gian Thực" : "Market Intelligence & Real-Time Candlestick Chart"}</span>
        </h1>
        <p className="text-xs text-txt-secondary mt-1 font-mono">
          {isVi
            ? "Chart nến tương tác hỗ trợ tất cả Symbol (Forex, Crypto, Hàng hóa, Chỉ số), cập nhật tick thời gian thực và tích hợp sẵn các chỉ báo kỹ thuật SMA, EMA, Bollinger Bands, Volume, RSI."
            : "Interactive multi-symbol real-time candlestick chart with live tick engine, supporting SMA, EMA, Bollinger Bands, Volume, and RSI indicators."}
        </p>
      </div>

      {/* Live Candlestick Interactive Terminal */}
      <LiveCandlestickChart initialSymbol="OANDA:XAUUSD" initialTimeframe="15m" />
    </div>
  );
}
