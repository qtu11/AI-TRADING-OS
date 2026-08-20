"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "next-themes";
import { soundFX } from "@/lib/sound/sound-effects";
import { TradingViewAdvancedWidget, mapToPublicTradingViewSymbol } from "./TradingViewAdvancedWidget";
import { CustomScriptModal } from "./CustomScriptModal";
import {
  executeCustomScript,
  ScriptExecutionResult,
} from "@/lib/indicators/script-engine";
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
  IChartApi,
  CandlestickData,
  LineData,
  HistogramData,
  UTCTimestamp,
  ColorType,
} from "lightweight-charts";
import {
  Activity,
  Search,
  Zap,
  Globe2,
  TrendingUp,
  Sliders,
  Layers,
  Sparkles,
  RefreshCw,
  BarChart2,
  Play,
  Pause,
  Code,
  Columns,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

// Danh mục Symbol thanh khoản cao chuẩn xác
export const MARKET_CATEGORIES = [
  {
    name: "Commodities & Metals",
    nameVi: "Kim Loại & Hàng Hóa",
    symbols: [
      { id: "OANDA:XAUUSD", label: "XAUUSD (Gold)", name: "Gold Spot / US Dollar" },
      { id: "OANDA:XAGUSD", label: "XAGUSD (Silver)", name: "Silver Spot / US Dollar" },
      { id: "TVC:USOIL", label: "USOIL (WTI)", name: "Crude Oil WTI" },
      { id: "TVC:UKOIL", label: "UKOIL (Brent)", name: "Brent Crude Oil" },
      { id: "COMEX:HG1!", label: "COPPER", name: "Copper Futures" },
    ],
  },
  {
    name: "Forex Majors",
    nameVi: "Ngoại Hối Chính",
    symbols: [
      { id: "OANDA:EURUSD", label: "EURUSD", name: "Euro / US Dollar" },
      { id: "OANDA:GBPUSD", label: "GBPUSD", name: "British Pound / US Dollar" },
      { id: "OANDA:USDJPY", label: "USDJPY", name: "US Dollar / Japanese Yen" },
      { id: "OANDA:AUDUSD", label: "AUDUSD", name: "Australian Dollar / US Dollar" },
      { id: "OANDA:USDCAD", label: "USDCAD", name: "US Dollar / Canadian Dollar" },
      { id: "OANDA:USDCHF", label: "USDCHF", name: "US Dollar / Swiss Franc" },
      { id: "OANDA:NZDUSD", label: "NZDUSD", name: "New Zealand Dollar / US Dollar" },
      { id: "OANDA:GBPJPY", label: "GBPJPY", name: "British Pound / Japanese Yen" },
    ],
  },
  {
    name: "Crypto Assets",
    nameVi: "Tiền Mã Hóa",
    symbols: [
      { id: "BINANCE:BTCUSDT", label: "BTCUSDT", name: "Bitcoin / Tether" },
      { id: "BINANCE:ETHUSDT", label: "ETHUSDT", name: "Ethereum / Tether" },
      { id: "BINANCE:SOLUSDT", label: "SOLUSDT", name: "Solana / Tether" },
      { id: "BINANCE:XRPUSDT", label: "XRPUSDT", name: "XRP / Tether" },
      { id: "BINANCE:BNBUSDT", label: "BNBUSDT", name: "BNB / Tether" },
    ],
  },
  {
    name: "Global Indices",
    nameVi: "Chỉ Số Toàn Cầu",
    symbols: [
      { id: "TVC:DJI", label: "US30", name: "Dow Jones Industrial Average" },
      { id: "TVC:SPX", label: "SPX500", name: "S&P 500 Index" },
      { id: "TVC:IXIC", label: "NAS100", name: "Nasdaq 100 Index" },
      { id: "TVC:DEU40", label: "GER40", name: "DAX Index" },
      { id: "TVC:DXY", label: "DXY", name: "US Dollar Currency Index" },
    ],
  },
  {
    name: "Top US Equities",
    nameVi: "Cổ Phiếu Mỹ Nổi Bật",
    symbols: [
      { id: "NASDAQ:NVDA", label: "NVDA", name: "NVIDIA Corporation" },
      { id: "NASDAQ:AAPL", label: "AAPL", name: "Apple Inc." },
      { id: "NASDAQ:TSLA", label: "TSLA", name: "Tesla Inc." },
      { id: "NASDAQ:MSFT", label: "MSFT", name: "Microsoft Corporation" },
      { id: "NASDAQ:AMZN", label: "AMZN", name: "Amazon.com Inc." },
    ],
  },
];

export function resolveCustomSymbol(input: string): string {
  const clean = input.toUpperCase().trim();
  if (!clean) return "OANDA:XAUUSD";

  if (clean.includes(":")) {
    return mapToPublicTradingViewSymbol(clean);
  }

  if (clean === "XAUUSD" || clean === "GOLD" || clean === "VANG" || clean.includes("GOLD")) return "OANDA:XAUUSD";
  if (clean === "XAGUSD" || clean === "SILVER" || clean.includes("SILVER")) return "OANDA:XAGUSD";
  if (clean === "USOIL" || clean === "OIL" || clean === "WTI") return "TVC:USOIL";
  if (clean === "UKOIL" || clean === "BRENT") return "TVC:UKOIL";
  if (clean === "COPPER" || clean === "HG1!") return "COMEX:HG1!";

  if (clean === "BTC" || clean === "BTCUSD" || clean === "BTCUSDT") return "BINANCE:BTCUSDT";
  if (clean === "ETH" || clean === "ETHUSD" || clean === "ETHUSDT") return "BINANCE:ETHUSDT";
  if (clean === "SOL" || clean === "SOLUSD" || clean === "SOLUSDT") return "BINANCE:SOLUSDT";
  if (clean === "XRP" || clean === "XRPUSD" || clean === "XRPUSDT") return "BINANCE:XRPUSDT";
  if (clean === "BNB" || clean === "BNBUSDT" || clean === "BNB") return "BINANCE:BNBUSDT";

  if (clean === "US30" || clean === "DJI" || clean === "DOW") return "TVC:DJI";
  if (clean === "SPX" || clean === "SP500" || clean === "SPX500") return "TVC:SPX";
  if (clean === "NAS100" || clean === "NDX" || clean === "NASDAQ") return "TVC:IXIC";
  if (clean === "GER40" || clean === "DAX" || clean === "DEU40") return "TVC:DEU40";
  if (clean === "DXY" || clean === "USDX") return "TVC:DXY";

  const forexSymbols = [
    "EURUSD", "GBPUSD", "USDJPY", "AUDUSD", "USDCAD", "USDCHF", "NZDUSD",
    "EURGBP", "EURJPY", "GBPJPY", "AUDJPY", "CADJPY", "CHFJPY", "NZDJPY",
    "EURAUD", "EURCAD", "GBPAUD", "GBPCAD"
  ];

  if (forexSymbols.includes(clean)) {
    return `OANDA:${clean}`;
  }

  const usStocks = [
    "NVDA", "AAPL", "TSLA", "MSFT", "AMZN", "META", "GOOGL", "GOOG", "AMD", "NFLX",
  ];

  if (usStocks.includes(clean)) {
    return `NASDAQ:${clean}`;
  }

  return `NASDAQ:${clean}`;
}

export interface IndicatorConfig {
  sma20: boolean;
  sma50: boolean;
  ema200: boolean;
  bollinger: boolean;
  volume: boolean;
  rsi: boolean;
}

function calculateSMA(data: CandlestickData<UTCTimestamp>[], period: number): LineData<UTCTimestamp>[] {
  const result: LineData<UTCTimestamp>[] = [];
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) sum += data[i - j].close;
    result.push({ time: data[i].time, value: Number((sum / period).toFixed(5)) });
  }
  return result;
}

function calculateEMA(data: CandlestickData<UTCTimestamp>[], period: number): LineData<UTCTimestamp>[] {
  const result: LineData<UTCTimestamp>[] = [];
  if (data.length < period) return result;
  const k = 2 / (period + 1);
  let initialSum = 0;
  for (let i = 0; i < period; i++) initialSum += data[i].close;
  let prevEMA = initialSum / period;
  result.push({ time: data[period - 1].time, value: Number(prevEMA.toFixed(5)) });
  for (let i = period; i < data.length; i++) {
    const currentEMA = data[i].close * k + prevEMA * (1 - k);
    result.push({ time: data[i].time, value: Number(currentEMA.toFixed(5)) });
    prevEMA = currentEMA;
  }
  return result;
}

function calculateBollinger(data: CandlestickData<UTCTimestamp>[], period: number = 20, stdDevMult: number = 2) {
  const upper: LineData<UTCTimestamp>[] = [];
  const lower: LineData<UTCTimestamp>[] = [];
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) sum += data[i - j].close;
    const sma = sum / period;
    let varianceSum = 0;
    for (let j = 0; j < period; j++) varianceSum += Math.pow(data[i - j].close - sma, 2);
    const stdDev = Math.sqrt(varianceSum / period);
    upper.push({ time: data[i].time, value: Number((sma + stdDev * stdDevMult).toFixed(5)) });
    lower.push({ time: data[i].time, value: Number((sma - stdDev * stdDevMult).toFixed(5)) });
  }
  return { upper, lower };
}

function calculateRSI(data: CandlestickData<UTCTimestamp>[], period: number = 14): LineData<UTCTimestamp>[] {
  const result: LineData<UTCTimestamp>[] = [];
  if (data.length <= period) return result;
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = data[i].close - data[i - 1].close;
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }
  let avgGain = gains / period, avgLoss = losses / period;
  let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  let rsi = 100 - 100 / (1 + rs);
  result.push({ time: data[period].time, value: Number(rsi.toFixed(2)) });
  for (let i = period + 1; i < data.length; i++) {
    const diff = data[i].close - data[i - 1].close;
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? Math.abs(diff) : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi = 100 - 100 / (1 + rs);
    result.push({ time: data[i].time, value: Number(rsi.toFixed(2)) });
  }
  return result;
}

export interface LiveCandlestickChartProps {
  initialSymbol?: string;
  initialTimeframe?: string;
}

export const LiveCandlestickChart: React.FC<LiveCandlestickChartProps> = ({
  initialSymbol = "OANDA:XAUUSD",
  initialTimeframe = "15m",
}) => {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const isVi = language === "vi";
  const isDark = theme !== "light";

  const [activeSymbol, setActiveSymbol] = useState<string>(initialSymbol);
  const [activeTimeframe, setActiveTimeframe] = useState<string>("15m");
  const [selectedCategory, setSelectedCategory] = useState<number>(0);
  const [customInput, setCustomInput] = useState<string>("");
  const [chartMode, setChartMode] = useState<"canvas" | "tradingview" | "dual">("canvas");
  const [lastTickDir, setLastTickDir] = useState<"up" | "down" | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  const [indicators, setIndicators] = useState<IndicatorConfig>({
    sma20: true,
    sma50: true,
    ema200: false,
    bollinger: false,
    volume: true,
    rsi: false,
  });

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const rsiContainerRef = useRef<HTMLDivElement>(null);

  // References to Chart & Series APIs for hardware-accelerated updates without DOM teardown
  const chartRef = useRef<IChartApi | null>(null);
  const rsiChartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);
  const sma20SeriesRef = useRef<any>(null);
  const sma50SeriesRef = useRef<any>(null);
  const ema200SeriesRef = useRef<any>(null);
  const bbUpperSeriesRef = useRef<any>(null);
  const bbLowerSeriesRef = useRef<any>(null);
  const rsiSeriesRef = useRef<any>(null);
  const rsiOverboughtRef = useRef<any>(null);
  const rsiOversoldRef = useRef<any>(null);

  // Custom Pine Script / Indicator Execution State & Series Registry
  const [isScriptModalOpen, setIsScriptModalOpen] = useState<boolean>(false);
  const [activeScriptCode, setActiveScriptCode] = useState<string>("");
  const [activeIndicatorName, setActiveIndicatorName] = useState<string>("");
  const [scriptResult, setScriptResult] = useState<ScriptExecutionResult | null>(null);
  const customPlotSeriesRef = useRef<Record<string, any>>({});
  const customPriceLinesRef = useRef<any[]>([]);

  const [candlesData, setCandlesData] = useState<CandlestickData<UTCTimestamp>[]>([]);
  const candlesRef = useRef<CandlestickData<UTCTimestamp>[]>([]);
  const [livePrice, setLivePrice] = useState<number>(0);
  const [priceChange, setPriceChange] = useState<{ diff: number; pct: number }>({ diff: 0, pct: 0 });

  // Load saved custom script on initial mount
  useEffect(() => {
    try {
      const savedCode = localStorage.getItem("ai_trading_os_custom_script");
      const savedName = localStorage.getItem("ai_trading_os_custom_indicator_name");
      if (savedCode) {
        setActiveScriptCode(savedCode);
        setActiveIndicatorName(savedName || "Chỉ Báo Tùy Biến");
      }
    } catch (e) {}
  }, []);

  const handleSelectSymbol = (symId: string) => {
    soundFX.playSwitch();
    setActiveSymbol(symId);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;
    soundFX.playSuccess();
    const resolved = resolveCustomSymbol(customInput);
    setActiveSymbol(resolved);
    setCustomInput("");
  };

  const currentDisplayLabel = useMemo(() => {
    for (const cat of MARKET_CATEGORIES) {
      const match = cat.symbols.find((s) => s.id === activeSymbol);
      if (match) return match.label;
    }
    return activeSymbol.includes(":") ? activeSymbol.split(":")[1] : activeSymbol;
  }, [activeSymbol]);

  // Clean up all custom series and price lines
  const clearCustomSeries = () => {
    if (chartRef.current) {
      Object.values(customPlotSeriesRef.current).forEach((series) => {
        try {
          chartRef.current?.removeSeries(series);
        } catch (e) {}
      });
    }
    customPlotSeriesRef.current = {};

    if (candleSeriesRef.current) {
      customPriceLinesRef.current.forEach((pl) => {
        try {
          candleSeriesRef.current?.removePriceLine(pl);
        } catch (e) {}
      });
      customPriceLinesRef.current = [];
      try {
        candleSeriesRef.current?.setMarkers([]);
      } catch (e) {}
    }
  };

  // Helper to populate all standard and custom series with current dataset
  const populateSeriesData = (list: CandlestickData<UTCTimestamp>[]) => {
    if (!list || list.length === 0) return;
    if (candleSeriesRef.current) {
      candleSeriesRef.current.setData(list);
    }
    if (volumeSeriesRef.current && indicators.volume) {
      const volumeData: HistogramData<UTCTimestamp>[] = list.map((c) => ({
        time: c.time,
        value: Math.floor(Math.random() * 1000 + 200),
        color: c.close >= c.open ? "rgba(16, 185, 129, 0.35)" : "rgba(239, 68, 68, 0.35)",
      }));
      volumeSeriesRef.current.setData(volumeData);
    }
    if (sma20SeriesRef.current && indicators.sma20) {
      sma20SeriesRef.current.setData(calculateSMA(list, 20));
    }
    if (sma50SeriesRef.current && indicators.sma50) {
      sma50SeriesRef.current.setData(calculateSMA(list, 50));
    }
    if (ema200SeriesRef.current && indicators.ema200) {
      ema200SeriesRef.current.setData(calculateEMA(list, 50));
    }
    if (indicators.bollinger && bbUpperSeriesRef.current && bbLowerSeriesRef.current) {
      const { upper, lower } = calculateBollinger(list, 20, 2);
      bbUpperSeriesRef.current.setData(upper);
      bbLowerSeriesRef.current.setData(lower);
    }
    if (rsiSeriesRef.current && indicators.rsi) {
      rsiSeriesRef.current.setData(calculateRSI(list, 14));
      if (rsiOverboughtRef.current) rsiOverboughtRef.current.setData(list.map((c) => ({ time: c.time, value: 70 })));
      if (rsiOversoldRef.current) rsiOversoldRef.current.setData(list.map((c) => ({ time: c.time, value: 30 })));
    }

    // Custom Pine Script Engine Execution & Rendering
    if (activeScriptCode && chartRef.current && candleSeriesRef.current) {
      const res = executeCustomScript(activeScriptCode, list);
      setScriptResult(res);

      if (res.success) {
        // Update/create custom line plots
        res.plots.forEach((p) => {
          if (!customPlotSeriesRef.current[p.id]) {
            const series = chartRef.current?.addSeries(LineSeries, {
              color: p.color,
              lineWidth: (p.lineWidth || 2) as any,
              title: p.title,
            });
            customPlotSeriesRef.current[p.id] = series;
          }
          customPlotSeriesRef.current[p.id]?.setData(p.data);
        });

        // Set Buy/Sell markers
        if (res.markers && res.markers.length > 0) {
          candleSeriesRef.current.setMarkers(res.markers);
        } else {
          candleSeriesRef.current.setMarkers([]);
        }

        // Apply Price Levels (SL / TP / Key Levels)
        customPriceLinesRef.current.forEach((pl) => {
          try {
            candleSeriesRef.current?.removePriceLine(pl);
          } catch (e) {}
        });
        customPriceLinesRef.current = [];

        res.levels.forEach((lvl) => {
          const pl = candleSeriesRef.current?.createPriceLine({
            price: lvl.price,
            color: lvl.color,
            lineWidth: 1,
            lineStyle: lvl.lineStyle ?? 2,
            axisLabelVisible: true,
            title: lvl.title,
          });
          if (pl) customPriceLinesRef.current.push(pl);
        });
      }
    }

    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }
    if (rsiChartRef.current) {
      rsiChartRef.current.timeScale().fitContent();
    }
  };

  const handleApplyScript = (code: string, result: ScriptExecutionResult, name: string) => {
    setActiveScriptCode(code);
    setActiveIndicatorName(name);
    setScriptResult(result);
    clearCustomSeries();
    if (candlesRef.current.length > 0) {
      populateSeriesData(candlesRef.current);
    }
    setIsScriptModalOpen(false);
  };

  const handleClearScript = () => {
    setActiveScriptCode("");
    setActiveIndicatorName("");
    setScriptResult(null);
    clearCustomSeries();
  };

  // 1. Chart Instance Lifecycle Setup (Run ONLY when chart structure / theme / indicators change)
  useEffect(() => {
    if (chartMode !== "canvas" || !chartContainerRef.current) return;

    chartContainerRef.current.innerHTML = "";
    if (rsiContainerRef.current) rsiContainerRef.current.innerHTML = "";

    const bgColor = isDark ? "#0E141B" : "#FFFFFF";
    const textColor = isDark ? "#94A3B8" : "#475569";
    const gridColor = isDark ? "rgba(32, 42, 53, 0.4)" : "rgba(226, 232, 240, 0.8)";
    const upColor = "#10B981";
    const downColor = "#EF4444";

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: bgColor },
        textColor,
        fontFamily: "var(--font-mono), monospace",
      },
      grid: {
        vertLines: { color: gridColor },
        horzLines: { color: gridColor },
      },
      width: chartContainerRef.current.clientWidth,
      height: indicators.rsi ? 440 : 540,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: isDark ? "#202A35" : "#E2E8F0",
        barSpacing: 7,
        minBarSpacing: 2,
        rightOffset: 5,
      },
      rightPriceScale: {
        borderColor: isDark ? "#202A35" : "#E2E8F0",
      },
      crosshair: {
        vertLine: { color: "#00E5FF", width: 1, style: 2 },
        horzLine: { color: "#00E5FF", width: 1, style: 2 },
      },
    });
    chartRef.current = chart;

    // Candlestick Series
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor,
      downColor,
      borderVisible: false,
      wickUpColor: upColor,
      wickDownColor: downColor,
    });
    candleSeriesRef.current = candleSeries;

    // Volume Series
    if (indicators.volume) {
      const volumeSeries = chart.addSeries(HistogramSeries, {
        color: "#26a69a",
        priceFormat: { type: "volume" },
        priceScaleId: "",
      });
      volumeSeries.priceScale().applyOptions({
        scaleMargins: { top: 0.8, bottom: 0 },
      });
      volumeSeriesRef.current = volumeSeries;
    } else {
      volumeSeriesRef.current = null;
    }

    // SMA 20
    if (indicators.sma20) {
      const sma20 = chart.addSeries(LineSeries, { color: "#38BDF8", lineWidth: 2, title: "SMA 20" });
      sma20SeriesRef.current = sma20;
    } else {
      sma20SeriesRef.current = null;
    }

    // SMA 50
    if (indicators.sma50) {
      const sma50 = chart.addSeries(LineSeries, { color: "#F59E0B", lineWidth: 2, title: "SMA 50" });
      sma50SeriesRef.current = sma50;
    } else {
      sma50SeriesRef.current = null;
    }

    // EMA 200
    if (indicators.ema200) {
      const ema200 = chart.addSeries(LineSeries, { color: "#EC4899", lineWidth: 2, title: "EMA 200" });
      ema200SeriesRef.current = ema200;
    } else {
      ema200SeriesRef.current = null;
    }

    // Bollinger Bands
    if (indicators.bollinger) {
      const upperSeries = chart.addSeries(LineSeries, { color: "rgba(168, 85, 247, 0.8)", lineWidth: 1, title: "BB Upper" });
      const lowerSeries = chart.addSeries(LineSeries, { color: "rgba(168, 85, 247, 0.8)", lineWidth: 1, title: "BB Lower" });
      bbUpperSeriesRef.current = upperSeries;
      bbLowerSeriesRef.current = lowerSeries;
    } else {
      bbUpperSeriesRef.current = null;
      bbLowerSeriesRef.current = null;
    }

    // RSI Sub-chart
    let rsiChart: IChartApi | null = null;
    if (indicators.rsi && rsiContainerRef.current) {
      rsiChart = createChart(rsiContainerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: bgColor },
          textColor,
          fontFamily: "var(--font-mono), monospace",
        },
        grid: {
          vertLines: { color: gridColor },
          horzLines: { color: gridColor },
        },
        width: rsiContainerRef.current.clientWidth,
        height: 140,
        timeScale: {
          timeVisible: true,
          borderColor: isDark ? "#202A35" : "#E2E8F0",
          barSpacing: 7,
          minBarSpacing: 2,
        },
      });
      rsiChartRef.current = rsiChart;

      const rsiSeries = rsiChart.addSeries(LineSeries, {
        color: "#8B5CF6",
        lineWidth: 2,
        title: "RSI (14)",
      });
      rsiSeriesRef.current = rsiSeries;

      const overbought = rsiChart.addSeries(LineSeries, { color: "rgba(239, 68, 68, 0.5)", lineWidth: 1, lineStyle: 2 });
      const oversold = rsiChart.addSeries(LineSeries, { color: "rgba(16, 185, 129, 0.5)", lineWidth: 1, lineStyle: 2 });
      rsiOverboughtRef.current = overbought;
      rsiOversoldRef.current = oversold;
    } else {
      rsiChartRef.current = null;
      rsiSeriesRef.current = null;
      rsiOverboughtRef.current = null;
      rsiOversoldRef.current = null;
    }

    // If we already have candles loaded, populate the newly built series immediately
    if (candlesRef.current.length > 0) {
      populateSeriesData(candlesRef.current);
    }

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
      if (rsiContainerRef.current && rsiChartRef.current) {
        rsiChartRef.current.applyOptions({ width: rsiContainerRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
      if (rsiChart) rsiChart.remove();
      chartRef.current = null;
      rsiChartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
      sma20SeriesRef.current = null;
      sma50SeriesRef.current = null;
      ema200SeriesRef.current = null;
      bbUpperSeriesRef.current = null;
      bbLowerSeriesRef.current = null;
      rsiSeriesRef.current = null;
    };
  }, [chartMode, indicators, isDark]);

  // 2. Fetch Historical Candles for Canvas Mode (Runs on Symbol, Timeframe, or Manual Refresh)
  useEffect(() => {
    const bareSym = activeSymbol.includes(":") ? activeSymbol.split(":")[1] : activeSymbol;
    fetch(`/api/market/klines?symbol=${bareSym}&timeframe=${activeTimeframe}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.candles && data.candles.length > 0) {
          const list: CandlestickData<UTCTimestamp>[] = data.candles.map((c: any) => ({
            time: c.time as UTCTimestamp,
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
          }));

          candlesRef.current = list;
          setCandlesData(list);
          populateSeriesData(list);

          const last = list[list.length - 1];
          const first = list[0];
          setLivePrice(last.close);
          const diff = last.close - first.open;
          const decimals = last.close > 50 ? 2 : 5;
          setPriceChange({
            diff: Number(diff.toFixed(decimals)),
            pct: Number(((diff / first.open) * 100).toFixed(2)),
          });
        }
      })
      .catch((err) => console.warn("Canvas fetch error:", err));
  }, [activeSymbol, activeTimeframe, refreshKey]);

  // 3. Smooth Hardware-Accelerated Live Tick Engine (Zero DOM Re-creation, Ultra-Responsive 450ms)
  useEffect(() => {
    if (!isPlaying || (chartMode !== "canvas" && chartMode !== "dual")) return;
    const interval = setInterval(() => {
      const currentList = candlesRef.current;
      if (!currentList || currentList.length === 0) return;

      const lastIdx = currentList.length - 1;
      const last = { ...currentList[lastIdx] };
      const base = last.close;
      const volatility = base > 1000 ? base * 0.00018 : base > 50 ? 0.05 : 0.0001;
      const delta = (Math.random() - 0.495) * volatility;
      const decimals = base > 50 ? 2 : 5;
      const newClose = Number((last.close + delta).toFixed(decimals));
      const newHigh = Number(Math.max(last.high, newClose).toFixed(decimals));
      const newLow = Number(Math.min(last.low, newClose).toFixed(decimals));

      const isUp = newClose >= last.close;
      setLastTickDir(isUp ? "up" : "down");

      last.close = newClose;
      last.high = newHigh;
      last.low = newLow;

      currentList[lastIdx] = last;

      // Update series directly via lightweight-charts optimized update()
      if (candleSeriesRef.current) {
        candleSeriesRef.current.update(last);
      }

      setLivePrice(newClose);
      const first = currentList[0];
      const diff = newClose - first.open;
      setPriceChange({
        diff: Number(diff.toFixed(decimals)),
        pct: Number(((diff / first.open) * 100).toFixed(2)),
      });
    }, 450);

    return () => clearInterval(interval);
  }, [isPlaying, chartMode]);

  const toggleIndicator = (key: keyof IndicatorConfig) => {
    soundFX.playClick();
    setIndicators((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="bento-card p-4 sm:p-6 space-y-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-brand-500/60 to-transparent" />

      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border/60 pb-4">
        {/* Left: Active Symbol Badge */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-brand-500/15 text-brand-500 border border-brand-500/30">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-txt-primary font-mono tracking-tight">
                {currentDisplayLabel}
              </h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-bg-surface-subtle border border-border text-txt-secondary font-mono font-bold">
                {activeTimeframe.toUpperCase()}
              </span>
              <span className="flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-gain-subtle text-gain border border-gain/40 font-bold">
                <span className="w-2 h-2 rounded-full bg-gain animate-ping" />
                {isVi ? "DỮ LIỆU THỜI GIAN THỰC" : "REAL-TIME FEED"}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1 font-mono">
              <span
                className={`text-2xl font-bold font-mono tracking-tight px-2.5 py-0.5 rounded-xl transition-all duration-200 ${
                  lastTickDir === "up"
                    ? "text-gain bg-gain-subtle/60 ring-1 ring-gain/50 scale-105"
                    : lastTickDir === "down"
                    ? "text-loss bg-loss-subtle/60 ring-1 ring-loss/50 scale-105"
                    : "text-txt-primary"
                }`}
              >
                {livePrice > 0
                  ? livePrice.toLocaleString("en-US", { minimumFractionDigits: livePrice > 50 ? 2 : 5 })
                  : "—"}
              </span>
              <div
                className={`flex items-center gap-1 text-xs font-mono font-bold px-2 py-1 rounded-lg ${
                  priceChange.diff >= 0 ? "bg-gain-subtle text-gain" : "bg-loss-subtle text-loss"
                }`}
              >
                {priceChange.diff >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                <span>
                  {priceChange.diff >= 0 ? "+" : ""}{priceChange.diff} ({priceChange.pct >= 0 ? "+" : ""}{priceChange.pct}%)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Search & Mode Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Custom Symbol Search Form */}
          <form onSubmit={handleCustomSubmit} className="relative flex items-center">
            <input
              type="text"
              placeholder={isVi ? "Tìm symbol (vd: XAUUSD, BTC, US30...)" : "Search symbol (e.g. XAUUSD, BTC...)"}
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              className="bg-bg-surface-subtle border border-border rounded-xl pl-9 pr-3 py-2 text-xs text-txt-primary placeholder-txt-muted focus:outline-none focus:border-brand-500 font-mono w-52 transition-colors"
            />
            <Search className="w-4 h-4 text-txt-muted absolute left-3 pointer-events-none" />
          </form>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              setRefreshKey((k) => k + 1);
            }}
            className="p-2 rounded-xl bg-bg-surface-subtle hover:bg-bg-surface-hover border border-border text-txt-secondary hover:text-txt-primary transition-all cursor-pointer"
            title={isVi ? "Làm mới biểu đồ" : "Refresh chart"}
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* 2 Chart Modes + Dual Split Switcher */}
          <div className="flex rounded-xl bg-bg-surface-subtle p-1 border border-border">
            <button
              onClick={() => {
                soundFX.playSwitch();
                setChartMode("canvas");
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                chartMode === "canvas"
                  ? "bg-brand-500 text-white shadow-sm"
                  : "text-txt-muted hover:text-txt-primary"
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{isVi ? "Canvas Siêu Tốc" : "Fast Canvas"}</span>
            </button>
            <button
              onClick={() => {
                soundFX.playSwitch();
                setChartMode("tradingview");
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                chartMode === "tradingview"
                  ? "bg-brand-500 text-white shadow-sm"
                  : "text-txt-muted hover:text-txt-primary"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>TradingView</span>
            </button>
            <button
              onClick={() => {
                soundFX.playSwitch();
                setChartMode("dual");
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                chartMode === "dual"
                  ? "bg-brand-500 text-white shadow-sm"
                  : "text-txt-muted hover:text-txt-primary"
              }`}
              title={isVi ? "Hiển thị đồng thời cả 2 loại giao diện biểu đồ" : "Display both chart modes side-by-side"}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>{isVi ? "Song Song (Dual 2 Loại)" : "Dual Split"}</span>
            </button>
          </div>

          {/* Play/Pause Button for Canvas */}
          {(chartMode === "canvas" || chartMode === "dual") && (
            <button
              onClick={() => {
                soundFX.playClick();
                setIsPlaying(!isPlaying);
              }}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isPlaying
                  ? "bg-gain-subtle text-gain border-gain/40"
                  : "bg-amber-500/15 text-amber-400 border-amber-500/40"
              }`}
              title={isPlaying ? (isVi ? "Tạm dừng" : "Pause") : (isVi ? "Tiếp tục" : "Play")}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar font-mono text-xs">
        {MARKET_CATEGORIES.map((cat, idx) => (
          <button
            key={cat.name}
            onClick={() => {
              soundFX.playSwitch();
              setSelectedCategory(idx);
            }}
            className={`px-3.5 py-2 rounded-xl border whitespace-nowrap font-bold transition-all cursor-pointer ${
              selectedCategory === idx
                ? "bg-brand-500/20 text-txt-primary border-brand-500 shadow-sm"
                : "bg-bg-surface-subtle text-txt-muted border-border/60 hover:bg-bg-surface-hover hover:text-txt-primary"
            }`}
          >
            {isVi ? cat.nameVi : cat.name}
          </button>
        ))}
      </div>

      {/* Symbol Quick Pills for Active Category */}
      <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-xs">
        {MARKET_CATEGORIES[selectedCategory].symbols.map((sym) => (
          <button
            key={sym.id}
            onClick={() => handleSelectSymbol(sym.id)}
            className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeSymbol === sym.id
                ? "bg-brand-500 text-white border-brand-500 shadow-sm"
                : "bg-bg-surface text-txt-secondary border-border/60 hover:bg-bg-surface-hover hover:text-txt-primary"
            }`}
          >
            <span>{sym.label}</span>
            <span className="text-[10px] opacity-75 font-normal truncate max-w-[120px] hidden sm:inline">
              ({sym.name})
            </span>
          </button>
        ))}
      </div>

      {/* Timeframe & Indicators Toolbar (Canvas & Dual Modes) */}
      {(chartMode === "canvas" || chartMode === "dual") && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-bg-surface-subtle p-2.5 rounded-2xl border border-border/60 font-mono text-xs">
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-txt-muted uppercase font-bold mr-1.5">{isVi ? "Khung:" : "TF:"}</span>
            {(["1m", "5m", "15m", "1h", "4h", "1D"] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => {
                  soundFX.playSwitch();
                  setActiveTimeframe(tf);
                }}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  activeTimeframe === tf
                    ? "bg-bg-surface text-brand-500 border border-brand-500/40 shadow-sm"
                    : "text-txt-muted hover:text-txt-primary"
                }`}
              >
                {tf.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] text-txt-muted uppercase font-bold mr-1">{isVi ? "Chỉ Báo:" : "Indicators:"}</span>
            <button
              onClick={() => toggleIndicator("sma20")}
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all cursor-pointer ${
                indicators.sma20 ? "bg-sky-500/20 text-sky-400 border-sky-500/50" : "bg-bg-surface text-txt-muted border-border"
              }`}
            >
              SMA 20
            </button>
            <button
              onClick={() => toggleIndicator("sma50")}
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all cursor-pointer ${
                indicators.sma50 ? "bg-amber-500/20 text-amber-400 border-amber-500/50" : "bg-bg-surface text-txt-muted border-border"
              }`}
            >
              SMA 50
            </button>
            <button
              onClick={() => toggleIndicator("ema200")}
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all cursor-pointer ${
                indicators.ema200 ? "bg-pink-500/20 text-pink-400 border-pink-500/50" : "bg-bg-surface text-txt-muted border-border"
              }`}
            >
              EMA 200
            </button>
            <button
              onClick={() => toggleIndicator("bollinger")}
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all cursor-pointer ${
                indicators.bollinger ? "bg-purple-500/20 text-purple-400 border-purple-500/50" : "bg-bg-surface text-txt-muted border-border"
              }`}
            >
              Bollinger Bands
            </button>
            <button
              onClick={() => toggleIndicator("volume")}
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all cursor-pointer ${
                indicators.volume ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50" : "bg-bg-surface text-txt-muted border-border"
              }`}
            >
              Volume
            </button>
            <button
              onClick={() => toggleIndicator("rsi")}
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all cursor-pointer ${
                indicators.rsi ? "bg-violet-500/20 text-violet-400 border-violet-500/50" : "bg-bg-surface text-txt-muted border-border"
              }`}
            >
              RSI (14)
            </button>

            {/* Custom Script Pine Engine Trigger Button */}
            <button
              onClick={() => {
                soundFX.playClick();
                setIsScriptModalOpen(true);
              }}
              className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm ${
                activeScriptCode
                  ? "bg-brand-500 text-white border-brand-400 shadow-brand-500/25"
                  : "bg-brand-500/10 text-brand-400 border-brand-500/40 hover:bg-brand-500/20 hover:text-white"
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span className="truncate max-w-[180px]">
                {activeIndicatorName ? activeIndicatorName : isVi ? "Nạp Script (Pine)" : "Custom Script"}
              </span>
              {activeScriptCode && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Chart View Container */}
      <div className="pt-2">
        {chartMode === "dual" ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* Column 1: Canvas Siêu Tốc */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-mono font-bold text-txt-primary flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-500" />
                  <span>{isVi ? "1. Giao Diện Canvas (Nạp Script Tùy Biến)" : "1. Fast Canvas (Script Studio)"}</span>
                </span>
                {activeIndicatorName && (
                  <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-brand-500/15 text-brand-400 border border-brand-500/30 font-bold">
                    ⚡ {activeIndicatorName}
                  </span>
                )}
              </div>

              {/* Floating HUD Scoreboard from Custom Script */}
              {scriptResult && scriptResult.dashboard && scriptResult.dashboard.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 rounded-2xl bg-bg-surface/90 border border-brand-500/30 backdrop-blur-md font-mono text-xs">
                  {scriptResult.dashboard.map((card, idx) => (
                    <div
                      key={idx}
                      className={`p-2 rounded-xl border flex flex-col justify-between ${
                        card.variant === "gain"
                          ? "bg-gain-subtle/40 text-gain border-gain/30"
                          : card.variant === "loss"
                          ? "bg-loss-subtle/40 text-loss border-loss/30"
                          : card.variant === "brand"
                          ? "bg-brand-500/10 text-brand-400 border-brand-500/30"
                          : "bg-bg-surface-subtle text-txt-primary border-border/60"
                      }`}
                    >
                      <span className="text-[9px] text-txt-muted uppercase font-bold tracking-wider truncate">
                        {card.title}
                      </span>
                      <span className="text-sm font-bold my-0.5 truncate">{card.value}</span>
                      {card.subtitle && (
                        <span className="text-[9px] opacity-80 truncate">{card.subtitle}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div
                ref={chartContainerRef}
                style={{ minHeight: "580px" }}
                className="w-full rounded-2xl overflow-hidden border border-border bg-bg-surface shadow-sm"
              />
            </div>

            {/* Column 2: TradingView Pro Advanced Widget */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-mono font-bold text-txt-primary flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>{isVi ? "2. Giao Diện TradingView Pro (Chuẩn Quốc Tế)" : "2. TradingView Pro (Official)"}</span>
                </span>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold">
                  {activeSymbol}
                </span>
              </div>

              <TradingViewAdvancedWidget
                key={`tv-dual-${activeSymbol}-${refreshKey}`}
                symbol={activeSymbol}
                timeframe={
                  activeTimeframe === "1D" ? "D" :
                  activeTimeframe === "4h" ? "240" :
                  activeTimeframe === "1h" ? "60" :
                  activeTimeframe === "15m" ? "15" :
                  activeTimeframe === "5m" ? "5" :
                  activeTimeframe === "1m" ? "1" : "15"
                }
                height={580}
              />
            </div>
          </div>
        ) : chartMode === "canvas" ? (
          <div className="space-y-2">
            {/* Floating HUD Scoreboard from Custom Script */}
            {scriptResult && scriptResult.dashboard && scriptResult.dashboard.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-2xl bg-bg-surface/90 border border-brand-500/30 backdrop-blur-md font-mono text-xs animate-fadeIn">
                {scriptResult.dashboard.map((card, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-xl border flex flex-col justify-between ${
                      card.variant === "gain"
                        ? "bg-gain-subtle/40 text-gain border-gain/30"
                        : card.variant === "loss"
                        ? "bg-loss-subtle/40 text-loss border-loss/30"
                        : card.variant === "brand"
                        ? "bg-brand-500/10 text-brand-400 border-brand-500/30"
                        : "bg-bg-surface-subtle text-txt-primary border-border/60"
                    }`}
                  >
                    <span className="text-[10px] text-txt-muted uppercase font-bold tracking-wider truncate">
                      {card.title}
                    </span>
                    <span className="text-base font-bold my-0.5 truncate">{card.value}</span>
                    {card.subtitle && (
                      <span className="text-[10px] opacity-80 truncate">{card.subtitle}</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div
              ref={chartContainerRef}
              style={{ minHeight: indicators.rsi ? "440px" : "540px" }}
              className="w-full rounded-2xl overflow-hidden border border-border bg-bg-surface"
            />
            {indicators.rsi && (
              <div
                ref={rsiContainerRef}
                style={{ minHeight: "140px" }}
                className="w-full rounded-2xl overflow-hidden border border-border bg-bg-surface"
              />
            )}
          </div>
        ) : (
          <TradingViewAdvancedWidget
            key={`${activeSymbol}-${refreshKey}`}
            symbol={activeSymbol}
            timeframe={
              activeTimeframe === "1D" ? "D" :
              activeTimeframe === "4h" ? "240" :
              activeTimeframe === "1h" ? "60" :
              activeTimeframe === "15m" ? "15" :
              activeTimeframe === "5m" ? "5" :
              activeTimeframe === "1m" ? "1" : "15"
            }
            height={700}
          />
        )}
      </div>

      {/* Custom Script Pine Editor Modal */}
      <CustomScriptModal
        isOpen={isScriptModalOpen}
        onClose={() => setIsScriptModalOpen(false)}
        candles={candlesData.length > 0 ? candlesData : candlesRef.current}
        activeScriptCode={activeScriptCode}
        activeIndicatorName={activeIndicatorName}
        onApplyScript={handleApplyScript}
        onClearScript={handleClearScript}
      />
    </div>
  );
};
