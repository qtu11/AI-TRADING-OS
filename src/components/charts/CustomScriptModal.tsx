"use client";

import React, { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { soundFX } from "@/lib/sound/sound-effects";
import { Button } from "@/components/ui/Button";
import {
  DEFAULT_SCRIPT_TEMPLATES,
  executeCustomScript,
  ScriptExecutionResult,
} from "@/lib/indicators/script-engine";
import { CandlestickData, UTCTimestamp } from "lightweight-charts";
import {
  Code,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  Terminal,
  Zap,
  PlusCircle,
  FileCode,
  Tag,
  Sparkles,
} from "lucide-react";

export interface CustomScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  candles: CandlestickData<UTCTimestamp>[];
  activeScriptCode: string;
  activeIndicatorName?: string;
  onApplyScript: (code: string, result: ScriptExecutionResult, name: string) => void;
  onClearScript: () => void;
}

export function extractIndicatorTitle(code: string, fallback: string = "Chỉ Báo Tùy Biến"): string {
  const match = code.match(/indicator\s*\(\s*["']([^"']+)["']/i) || code.match(/strategy\s*\(\s*["']([^"']+)["']/i);
  if (match && match[1] && match[1].trim()) {
    return match[1].trim();
  }
  return fallback;
}

export const CustomScriptModal: React.FC<CustomScriptModalProps> = ({
  isOpen,
  onClose,
  candles,
  activeScriptCode,
  activeIndicatorName,
  onApplyScript,
  onClearScript,
}) => {
  const { language } = useLanguage();
  const isVi = language === "vi";

  const [indicatorName, setIndicatorName] = useState<string>(
    activeIndicatorName || DEFAULT_SCRIPT_TEMPLATES[0].nameVi
  );
  const [scriptCode, setScriptCode] = useState<string>(
    activeScriptCode || DEFAULT_SCRIPT_TEMPLATES[0].code
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(DEFAULT_SCRIPT_TEMPLATES[0].id);
  const [executionResult, setExecutionResult] = useState<ScriptExecutionResult | null>(null);
  const [isCompiling, setIsCompiling] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"editor" | "cheatsheet" | "logs">("editor");

  // Sync scriptCode and name when modal opens
  useEffect(() => {
    if (activeScriptCode) {
      setScriptCode(activeScriptCode);
      if (activeIndicatorName) {
        setIndicatorName(activeIndicatorName);
      } else {
        setIndicatorName(extractIndicatorTitle(activeScriptCode, isVi ? "Chỉ Báo Tùy Biến" : "Custom Indicator"));
      }
    }
  }, [activeScriptCode, activeIndicatorName, isOpen, isVi]);

  if (!isOpen) return null;

  const handleSelectTemplate = (templateId: string) => {
    soundFX.playSwitch();
    setSelectedTemplateId(templateId);
    const tmpl = DEFAULT_SCRIPT_TEMPLATES.find((t) => t.id === templateId);
    if (tmpl) {
      setScriptCode(tmpl.code);
      setIndicatorName(isVi ? tmpl.nameVi : tmpl.name);
    }
  };

  const handleCreateBlank = () => {
    soundFX.playSwitch();
    setSelectedTemplateId("custom");
    setIndicatorName(isVi ? "Chỉ Báo Của Tôi" : "My Custom Indicator");
    setScriptCode(`//@version=6
indicator("My Custom Indicator", overlay=true)

// 1. Calculate Technical Indicators
ema20 = ta.ema(close, 20)
rsi14 = ta.rsi(close, 14)

// 2. Plot Lines on Canvas
plot(ema20, "EMA 20 Trend", { color: "#38BDF8", lineWidth: 2 })

// 3. Buy/Sell Signal Markers
buyCondition = ta.crossover(close, ema20)
sellCondition = ta.crossunder(close, ema20)

plotshape(buyCondition, { title: "BUY Entry", text: "BUY", style: "arrowUp", location: "belowBar", color: "#10B981" })
plotshape(sellCondition, { title: "SELL Entry", text: "SELL", style: "arrowDown", location: "aboveBar", color: "#EF4444" })

// 4. Scorecard HUD Table
_table = table.new("top_right", 2, 2)
table.cell(_table, 0, 0, "RSI STATUS", color.black)
table.cell(_table, 1, 0, rsi14 > 50 ? "BULLISH" : "BEARISH", rsi14 > 50 ? color.green : color.red)
`);
    setActiveTab("editor");
  };

  const handleCodeChange = (newCode: string) => {
    setScriptCode(newCode);
    // Auto detect title from indicator(...) if user edits
    const detected = extractIndicatorTitle(newCode, "");
    if (detected && detected !== indicatorName && selectedTemplateId === "custom") {
      setIndicatorName(detected);
    }
  };

  const handleRunScript = () => {
    setIsCompiling(true);
    soundFX.playClick();

    setTimeout(() => {
      const result = executeCustomScript(scriptCode, candles);
      setExecutionResult(result);
      setIsCompiling(false);

      if (result.success) {
        soundFX.playSuccess();
        const finalName = indicatorName.trim() || extractIndicatorTitle(scriptCode, isVi ? "Chỉ Báo Tùy Biến" : "Custom Indicator");
        onApplyScript(scriptCode, result, finalName);
        try {
          localStorage.setItem("ai_trading_os_custom_script", scriptCode);
          localStorage.setItem("ai_trading_os_custom_indicator_name", finalName);
        } catch (e) {
          console.warn("Script storage error:", e);
        }
      } else {
        soundFX.playSwitch();
        setActiveTab("logs");
      }
    }, 50);
  };

  const handleClear = () => {
    soundFX.playSwitch();
    onClearScript();
    setExecutionResult(null);
    try {
      localStorage.removeItem("ai_trading_os_custom_script");
      localStorage.removeItem("ai_trading_os_custom_indicator_name");
    } catch (e) {}
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div
        className="bg-bg-surface border border-border rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border/80 flex items-center justify-between bg-bg-surface-subtle">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-brand-500/15 text-brand-500 border border-brand-500/30">
              <Code className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-txt-primary flex items-center gap-2">
                <span>{isVi ? "Trình Soạn Thảo & Nạp Chỉ Báo Tùy Biến" : "Custom Indicator & Pine Script Studio"}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-brand-500/15 text-brand-400 border border-brand-500/30">
                  Pine v6 & JS
                </span>
              </h2>
              <p className="text-xs text-txt-secondary mt-0.5 font-mono">
                {isVi
                  ? "Tự đặt tên chỉ báo, nhập mã Pine Script hoặc Javascript công thức toán học và vẽ trực tiếp lên Canvas."
                  : "Name your indicator, write or paste Pine Script code, and render directly onto the fast canvas."}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-txt-muted hover:text-txt-primary hover:bg-bg-surface border border-transparent hover:border-border transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Custom Indicator Name Input & Template Selector */}
        <div className="p-3.5 sm:px-5 border-b border-border/60 bg-bg-surface space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            {/* 1. Custom Name Field */}
            <div className="sm:col-span-6 flex items-center gap-2">
              <span className="text-xs font-mono text-txt-secondary font-bold flex items-center gap-1.5 whitespace-nowrap">
                <Tag className="w-3.5 h-3.5 text-brand-400" />
                {isVi ? "Tên Chỉ Báo:" : "Indicator Name:"}
              </span>
              <input
                type="text"
                value={indicatorName}
                onChange={(e) => setIndicatorName(e.target.value)}
                placeholder={isVi ? "Nhập tên chỉ báo của bạn..." : "Enter indicator title..."}
                className="flex-1 bg-bg-surface-subtle border border-border focus:border-brand-500 rounded-xl px-3 py-1.5 text-xs text-txt-primary font-mono font-bold focus:outline-none transition-colors"
              />
            </div>

            {/* 2. Preset Template Picker */}
            <div className="sm:col-span-6 flex items-center justify-end gap-2">
              <span className="text-xs font-mono text-txt-secondary font-bold whitespace-nowrap hidden sm:inline">
                {isVi ? "Chọn Mẫu:" : "Presets:"}
              </span>
              <select
                value={selectedTemplateId}
                onChange={(e) => handleSelectTemplate(e.target.value)}
                className="bg-bg-surface-subtle border border-border rounded-xl px-3 py-1.5 text-xs text-txt-primary font-mono focus:outline-none focus:border-brand-500 cursor-pointer max-w-[200px] truncate"
              >
                {DEFAULT_SCRIPT_TEMPLATES.map((tmpl) => (
                  <option key={tmpl.id} value={tmpl.id}>
                    {isVi ? tmpl.nameVi : tmpl.name}
                  </option>
                ))}
                <option value="custom">{isVi ? "Tùy Biến Riêng" : "Custom Script"}</option>
              </select>

              <button
                onClick={handleCreateBlank}
                className="px-2.5 py-1.5 rounded-xl border border-brand-500/30 bg-brand-500/10 text-brand-400 hover:bg-brand-500/20 text-xs font-mono font-bold flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap"
                title={isVi ? "Tạo mã trắng mới" : "New blank script"}
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isVi ? "Tạo Mới" : "New Blank"}</span>
              </button>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center justify-between border-t border-border/40 pt-2.5">
            <div className="flex rounded-xl bg-bg-surface-subtle p-1 border border-border text-xs font-mono">
              <button
                onClick={() => setActiveTab("editor")}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "editor"
                    ? "bg-brand-500 text-white shadow-sm"
                    : "text-txt-muted hover:text-txt-primary"
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>{isVi ? "Mã Nguồn (Pine/JS)" : "Script Code"}</span>
              </button>
              <button
                onClick={() => setActiveTab("cheatsheet")}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  activeTab === "cheatsheet"
                    ? "bg-brand-500 text-white shadow-sm"
                    : "text-txt-muted hover:text-txt-primary"
                }`}
              >
                {isVi ? "Hàm Hỗ Trợ (CheatSheet)" : "TA Helpers"}
              </button>
              <button
                onClick={() => setActiveTab("logs")}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "logs"
                    ? "bg-brand-500 text-white shadow-sm"
                    : "text-txt-muted hover:text-txt-primary"
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Console Logs</span>
                {executionResult && (
                  <span
                    className={`w-2 h-2 rounded-full ${
                      executionResult.success ? "bg-gain" : "bg-loss"
                    }`}
                  />
                )}
              </button>
            </div>

            <div className="text-[11px] font-mono text-txt-muted hidden sm:block">
              {isVi ? "Hỗ trợ Pine Script v5/v6, EMA, VWAP, ATR, MACD, RSI, Tables" : "Supports Pine v6, Indicators & Table HUD"}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 font-mono text-xs space-y-4">
          {activeTab === "editor" && (
            <div className="space-y-3">
              <div className="relative rounded-2xl border border-border overflow-hidden bg-[#0A0E14] focus-within:border-brand-500 transition-colors">
                <textarea
                  value={scriptCode}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  placeholder="// Paste your Pine Script or Custom Indicator formulas here..."
                  rows={16}
                  spellCheck={false}
                  className="w-full bg-transparent text-[#E6EDF3] p-4 font-mono text-xs leading-relaxed resize-none focus:outline-none scrollbar-thin"
                />
              </div>

              {/* Status Bar */}
              {executionResult && (
                <div
                  className={`p-3 rounded-2xl border flex items-center justify-between gap-3 text-xs ${
                    executionResult.success
                      ? "bg-gain-subtle/50 text-gain border-gain/30"
                      : "bg-loss-subtle/50 text-loss border-loss/30"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {executionResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-gain" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-loss" />
                    )}
                    <span>
                      {executionResult.success
                        ? isVi
                          ? `Chỉ báo "${indicatorName}" biên dịch thành công! Đã nạp ${executionResult.plots.length} đường Plot, ${executionResult.markers.length} điểm Tín Hiệu, ${executionResult.levels.length} Mốc Giá.`
                          : `Indicator "${indicatorName}" compiled! ${executionResult.plots.length} Plots, ${executionResult.markers.length} Markers, ${executionResult.levels.length} Levels.`
                        : executionResult.error}
                    </span>
                  </div>

                  <span className="text-[10px] opacity-75 font-mono">
                    {executionResult.executionTimeMs}ms
                  </span>
                </div>
              )}
            </div>
          )}

          {activeTab === "cheatsheet" && (
            <div className="space-y-4 text-xs font-sans">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-bg-surface-subtle border border-border space-y-2">
                  <h4 className="font-bold text-txt-primary font-mono text-xs text-sky-400">
                    1. Moving Averages & Bands
                  </h4>
                  <ul className="space-y-1.5 font-mono text-[11px] text-txt-secondary">
                    <li><code className="text-txt-primary">ta.ema(close, 9)</code> - Exponential MA</li>
                    <li><code className="text-txt-primary">ta.sma(close, 20)</code> - Simple MA</li>
                    <li><code className="text-txt-primary">ta.vwap(hlc3)</code> - Volume Weighted Average Price</li>
                    <li><code className="text-txt-primary">ta.atr(14)</code> - Average True Range</li>
                    <li><code className="text-txt-primary">ta.supertrend(3, 10)</code> - Supertrend</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-bg-surface-subtle border border-border space-y-2">
                  <h4 className="font-bold text-txt-primary font-mono text-xs text-emerald-400">
                    2. Momentum & Extremes
                  </h4>
                  <ul className="space-y-1.5 font-mono text-[11px] text-txt-secondary">
                    <li><code className="text-txt-primary">ta.rsi(close, 14)</code> - RSI Oscillator (0-100)</li>
                    <li><code className="text-txt-primary">[m, s, _] = ta.macd(close, 12, 26, 9)</code> - MACD & Signal</li>
                    <li><code className="text-txt-primary">[_, _, adx] = ta.dmi(14, 14)</code> - ADX Directional Index</li>
                    <li><code className="text-txt-primary">ta.crossover(a, b)</code> - Fast crosses above slow</li>
                    <li><code className="text-txt-primary">ta.crossunder(a, b)</code> - Fast crosses below slow</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-bg-surface-subtle border border-border space-y-2">
                  <h4 className="font-bold text-txt-primary font-mono text-xs text-amber-400">
                    3. Plotting & Signal Overlay
                  </h4>
                  <ul className="space-y-1.5 font-mono text-[11px] text-txt-secondary">
                    <li><code className="text-txt-primary">plot(series, &quot;Title&quot;, &#123; color: &quot;#10B981&quot; &#125;)</code></li>
                    <li><code className="text-txt-primary">plotshape(condition, &#123; text: &quot;BUY&quot;, style: &quot;arrowUp&quot; &#125;)</code></li>
                    <li><code className="text-txt-primary">hline(price, &quot;TP / SL Level&quot;, &#123; color: &quot;#EF4444&quot; &#125;)</code></li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-bg-surface-subtle border border-border space-y-2">
                  <h4 className="font-bold text-txt-primary font-mono text-xs text-purple-400">
                    4. Table HUD & Scorecard
                  </h4>
                  <p className="text-[11px] text-txt-secondary font-mono">
                    <code className="text-txt-primary">_table = table.new(&quot;top_right&quot;, 2, 4)</code>
                    <br />
                    <code className="text-txt-primary">table.cell(_table, 0, 0, &quot;BULL SCORE&quot;, &quot;85%&quot;)</code>
                  </p>
                  <p className="text-[11px] text-txt-muted">
                    Tự động chuyển đổi các ô trong table thành các thẻ HUD đo lực nến hiển thị trên Canvas.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "logs" && (
            <div className="p-4 rounded-2xl bg-[#0A0E14] border border-border text-[11px] font-mono text-[#E6EDF3] space-y-1.5 min-h-[220px]">
              {executionResult && executionResult.logs.length > 0 ? (
                executionResult.logs.map((log, idx) => (
                  <div
                    key={idx}
                    className={
                      log.includes("[ERROR]")
                        ? "text-loss font-bold"
                        : log.includes("[WARN]")
                        ? "text-amber-400"
                        : "text-txt-secondary"
                    }
                  >
                    &gt; {log}
                  </div>
                ))
              ) : (
                <div className="text-txt-muted italic">
                  {isVi ? "Chưa có log thực thi. Bấm 'Biên Dịch & Nạp Lên Chart' để bắt đầu." : "No execution logs yet. Click 'Compile & Apply' to execute."}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-border/80 flex flex-col sm:flex-row items-center justify-between gap-3 bg-bg-surface-subtle">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="text-loss hover:bg-loss-subtle w-full sm:w-auto"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {isVi ? "Xóa Script & Tắt Chỉ Báo" : "Remove & Disable Script"}
          </Button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              variant="secondary"
              size="md"
              onClick={onClose}
              className="w-full sm:w-auto"
            >
              {isVi ? "Đóng" : "Close"}
            </Button>

            <Button
              variant="primary"
              size="md"
              onClick={handleRunScript}
              disabled={isCompiling}
              className="w-full sm:w-auto font-bold"
            >
              <Zap className="w-4 h-4 mr-2 text-brand-300" />
              {isCompiling ? (isVi ? "Đang Biên Dịch..." : "Compiling...") : (isVi ? `Biên Dịch & Nạp Lên Chart` : `Compile & Apply to Canvas`)}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
