"use client";

import React, { useEffect, useRef, memo } from "react";
import { useTheme } from "next-themes";
import { useLanguage } from "@/context/LanguageContext";

export interface TradingViewAdvancedWidgetProps {
  symbol: string;
  timeframe?: string;
  height?: number;
}

// Convert symbol to official TradingView broker feed
export function mapToPublicTradingViewSymbol(sym: string): string {
  const clean = sym.toUpperCase().trim();

  // If already has broker prefix, keep it directly
  if (
    clean.startsWith("OANDA:") ||
    clean.startsWith("BINANCE:") ||
    clean.startsWith("TVC:") ||
    clean.startsWith("NASDAQ:") ||
    clean.startsWith("FX:") ||
    clean.startsWith("FX_IDC:") ||
    clean.startsWith("COMEX:")
  ) {
    return clean;
  }

  const bare = clean.replace(/^[^:]+:/, "");

  // Commodities & Metals
  if (bare === "XAUUSD" || bare === "GOLD") return "OANDA:XAUUSD";
  if (bare === "XAGUSD" || bare === "SILVER") return "OANDA:XAGUSD";
  if (bare === "USOIL" || bare === "WTI" || bare === "OIL") return "TVC:USOIL";
  if (bare === "UKOIL" || bare === "BRENT") return "TVC:UKOIL";
  if (bare === "COPPER" || bare === "HG1!") return "COMEX:HG1!";

  // Indices
  if (bare === "US30" || bare === "DJI" || bare === "DOW") return "TVC:DJI";
  if (bare === "SPX500" || bare === "SPX" || bare === "SP500") return "TVC:SPX";
  if (bare === "NAS100" || bare === "NDX" || bare === "NASDAQ") return "TVC:IXIC";
  if (bare === "GER40" || bare === "DAX") return "TVC:DEU40";
  if (bare === "DXY" || bare === "USDX") return "TVC:DXY";

  // Crypto
  if (bare === "BTCUSD" || bare === "BTCUSDT" || bare === "BTC") return "BINANCE:BTCUSDT";
  if (bare === "ETHUSD" || bare === "ETHUSDT" || bare === "ETH") return "BINANCE:ETHUSDT";
  if (bare === "SOLUSD" || bare === "SOLUSDT" || bare === "SOL") return "BINANCE:SOLUSDT";
  if (bare === "XRPUSD" || bare === "XRPUSDT" || bare === "XRP") return "BINANCE:XRPUSDT";
  if (bare === "BNBUSD" || bare === "BNBUSDT" || bare === "BNB") return "BINANCE:BNBUSDT";

  // Forex Majors & Minors
  const forexPairs = [
    "EURUSD", "GBPUSD", "USDJPY", "AUDUSD", "USDCAD", "USDCHF", "NZDUSD",
    "EURGBP", "EURJPY", "GBPJPY", "AUDJPY", "CADJPY", "CHFJPY", "NZDJPY",
    "EURAUD", "EURCAD", "GBPAUD", "GBPCAD"
  ];
  if (forexPairs.includes(bare)) {
    return `OANDA:${bare}`;
  }

  return `NASDAQ:${bare}`;
}

export const TradingViewAdvancedWidget: React.FC<TradingViewAdvancedWidgetProps> = memo(({
  symbol,
  timeframe = "15",
  height = 700,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const { language } = useLanguage();
  const isDark = theme !== "light";
  const isVi = language === "vi";

  const publicSymbol = mapToPublicTradingViewSymbol(symbol);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";

    const widgetContainer = document.createElement("div");
    widgetContainer.className = "tradingview-widget-container";
    widgetContainer.style.height = "100%";
    widgetContainer.style.width = "100%";

    const widgetInner = document.createElement("div");
    widgetInner.className = "tradingview-widget-container__widget";
    widgetInner.style.height = "calc(100% - 32px)";
    widgetInner.style.width = "100%";
    widgetContainer.appendChild(widgetInner);

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: publicSymbol,
      interval: timeframe,
      timezone: "Asia/Ho_Chi_Minh",
      theme: isDark ? "dark" : "light",
      style: "1",
      locale: isVi ? "vi_VN" : "en",
      allow_symbol_change: true,
      calendar: false,
      support_host: "https://www.tradingview.com",
    });

    widgetContainer.appendChild(script);
    containerRef.current.appendChild(widgetContainer);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [publicSymbol, timeframe, isDark, isVi]);

  return (
    <div
      ref={containerRef}
      style={{ height: `${height}px` }}
      className="w-full rounded-2xl overflow-hidden bg-bg-surface border border-border"
    />
  );
});

TradingViewAdvancedWidget.displayName = "TradingViewAdvancedWidget";
