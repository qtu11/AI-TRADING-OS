"use client";

import React, { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { soundFX } from "@/lib/sound/sound-effects";
import { Button } from "@/components/ui/Button";
import {
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
  Eraser,
  FileCode,
  Tag,
  HelpCircle,
  Upload,
  FileText,
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
    activeIndicatorName || (isVi ? "Chỉ Báo Tùy Biến" : "Custom Indicator")
  );
  const [scriptCode, setScriptCode] = useState<string>(activeScriptCode || "");
  const [executionResult, setExecutionResult] = useState<ScriptExecutionResult | null>(null);
  const [isCompiling, setIsCompiling] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"editor" | "cheatsheet" | "logs">("editor");
  const [logs, setLogs] = useState<string[]>([]);

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

  const handleClearEditor = () => {
    soundFX.playSwitch();
    setScriptCode("");
    setIndicatorName("");
    setExecutionResult(null);
  };

  const handleCodeChange = (newCode: string) => {
    setScriptCode(newCode);
    // Auto-detect title from indicator("...", ...) if user pastes code and hasn't customized name
    const detected = extractIndicatorTitle(newCode, "");
    if (detected && (!indicatorName || indicatorName === "Chỉ Báo Tùy Biến" || indicatorName === "Custom Indicator")) {
      setIndicatorName(detected);
    }
  };

  const handleRunScript = () => {
    if (!scriptCode.trim()) {
      soundFX.playSwitch();
      return;
    }

    setIsCompiling(true);
    setLogs([]);
    soundFX.playClick();

    setTimeout(() => {
      const result = executeCustomScript(scriptCode, candles);
      setExecutionResult(result);
      setLogs(result.logs);
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

  // Handle file upload (.pine, .txt, .js files)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setScriptCode(content);
        soundFX.playClick();
        
        // Auto-detect indicator name from file or content
        const detectedName = file.name.replace(/\.(pine|txt|js)$/i, "");
        const contentName = extractIndicatorTitle(content, "");
        setIndicatorName(contentName || detectedName);
        
        // Show success feedback in logs
        const fileLog = `[INFO] Đã nạp file: ${file.name} (${(content.length / 1024).toFixed(1)}KB)`;
        setLogs([fileLog]);
        setActiveTab("logs");
      }
    };
    reader.onerror = () => {
      soundFX.playWarning();
      setLogs(["[ERROR] Không thể đọc file. Vui lòng thử lại."]);
    };
    reader.readAsText(file);
    
    // Reset input
    e.target.value = "";
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
                <span>{isVi ? "Trình Soạn Thảo & Nạp Chỉ Báo Tùy Biến" : "Custom Indicator Studio"}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-brand-500/15 text-brand-400 border border-brand-500/30">
                  Pine Script v5/v6 & JS
                </span>
              </h2>
              <p className="text-xs text-txt-secondary mt-0.5 font-mono">
                {isVi
                  ? "Dán hoặc viết mã chỉ báo, nhập tên và bấm 'Lưu & Nạp Lên Chart' để hiển thị trực tiếp."
                  : "Write or paste Pine Script code, name your indicator and apply it directly to the chart."}
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

        {/* Indicator Name Input & Controls */}
        <div className="p-3.5 sm:px-5 border-b border-border/60 bg-bg-surface space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Custom Name Field */}
            <div className="flex-1 flex items-center gap-2">
              <span className="text-xs font-mono text-txt-secondary font-bold flex items-center gap-1.5 whitespace-nowrap">
                <Tag className="w-3.5 h-3.5 text-brand-400" />
                {isVi ? "Tên Chỉ Báo:" : "Indicator Name:"}
              </span>
              <input
                type="text"
                value={indicatorName}
                onChange={(e) => setIndicatorName(e.target.value)}
                placeholder={isVi ? "Nhập tên chỉ báo (VD: Sniper SMC, ICT Concepts, EMA Cross...)" : "Enter indicator name (e.g. Sniper SMC, EMA Trend)..."}
                className="flex-1 bg-bg-surface-subtle border border-border focus:border-brand-500 rounded-xl px-3.5 py-2 text-xs text-txt-primary font-mono font-bold focus:outline-none transition-colors"
              />
            </div>

            {/* Clear Editor Button */}
            <button
              onClick={handleClearEditor}
              className="px-3 py-2 rounded-xl border border-border/80 bg-bg-surface-subtle text-txt-secondary hover:text-txt-primary hover:bg-bg-surface text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
              title={isVi ? "Xóa trắng khung soạn thảo" : "Clear editor code"}
            >
              <Eraser className="w-3.5 h-3.5" />
              <span>{isVi ? "Xóa Trắng" : "Clear Editor"}</span>
            </button>

            {/* Upload File Button */}
            <label className="px-3 py-2 rounded-xl border border-brand-500/40 bg-brand-500/10 text-brand-400 hover:bg-brand-500/20 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap">
              <Upload className="w-3.5 h-3.5" />
              <span>{isVi ? "Nạp File .pine" : "Upload .pine"}</span>
              <input
                type="file"
                accept=".pine,.txt,.js"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
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
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "cheatsheet"
                    ? "bg-brand-500 text-white shadow-sm"
                    : "text-txt-muted hover:text-txt-primary"
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>{isVi ? "Hàm Hỗ Trợ (CheatSheet)" : "TA Helpers"}</span>
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
              {isVi ? "Hỗ trợ Pine Script v5/v6, EMA, VWAP, ATR, MACD, RSI, Table HUD" : "Supports Pine v6, EMA, VWAP, Signals, Tables"}
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
                  placeholder={
                    isVi
                      ? "// Dán toàn bộ mã nguồn Pine Script (TradingView) hoặc công thức Javascript vào đây...\n// Ví dụ:\n//@version=6\nindicator(\"My Indicator\", overlay=true)\n\nema9 = ta.ema(close, 9)\nema21 = ta.ema(close, 21)\n\nplot(ema9, \"EMA 9\", { color: \"#10B981\" })\nplot(ema21, \"EMA 21\", { color: \"#EF4444\" })\n\nbuySignal = ta.crossover(ema9, ema21)\nplotshape(buySignal, { title: \"BUY\", text: \"BUY\", style: \"arrowUp\", location: \"belowBar\", color: \"#10B981\" })"
                      : "// Paste your Pine Script or custom formulas here...\n//@version=6\nindicator(\"My Indicator\", overlay=true)\nema9 = ta.ema(close, 9)\nplot(ema9, \"EMA 9\", { color: \"#10B981\" })"
                  }
                  rows={16}
                  spellCheck={false}
                  className="w-full bg-transparent text-[#E6EDF3] p-4 font-mono text-xs leading-relaxed resize-none focus:outline-none scrollbar-thin placeholder:text-txt-muted/60"
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
                          ? `Chỉ báo "${indicatorName || "Tùy Biến"}" đã nạp thành công! Sinh ra ${executionResult.plots.length} đường Plot, ${executionResult.markers.length} điểm Tín Hiệu, ${executionResult.levels.length} Mốc Giá.`
                          : `Indicator "${indicatorName || "Custom"}" compiled! ${executionResult.plots.length} Plots, ${executionResult.markers.length} Markers, ${executionResult.levels.length} Levels.`
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
                    1. Đường Trung Bình & Dải Biên Độ
                  </h4>
                  <ul className="space-y-1.5 font-mono text-[11px] text-txt-secondary">
                    <li><code className="text-txt-primary">ta.ema(close, 9)</code> - Exponential Moving Average</li>
                    <li><code className="text-txt-primary">ta.sma(close, 20)</code> - Simple Moving Average</li>
                    <li><code className="text-txt-primary">ta.vwap(hlc3)</code> - Volume Weighted Average Price</li>
                    <li><code className="text-txt-primary">ta.atr(14)</code> - Average True Range</li>
                    <li><code className="text-txt-primary">ta.supertrend(3, 10)</code> - Supertrend</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-bg-surface-subtle border border-border space-y-2">
                  <h4 className="font-bold text-txt-primary font-mono text-xs text-emerald-400">
                    2. Động Lượng & Tín Hiệu Cắt
                  </h4>
                  <ul className="space-y-1.5 font-mono text-[11px] text-txt-secondary">
                    <li><code className="text-txt-primary">ta.rsi(close, 14)</code> - RSI Oscillator (0-100)</li>
                    <li><code className="text-txt-primary">[m, s, _] = ta.macd(close, 12, 26, 9)</code> - MACD & Signal</li>
                    <li><code className="text-txt-primary">[_, _, adx] = ta.dmi(14, 14)</code> - ADX Directional Index</li>
                    <li><code className="text-txt-primary">ta.crossover(a, b)</code> - Đường nhanh cắt lên đường chậm</li>
                    <li><code className="text-txt-primary">ta.crossunder(a, b)</code> - Đường nhanh cắt xuống đường chậm</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-bg-surface-subtle border border-border space-y-2">
                  <h4 className="font-bold text-txt-primary font-mono text-xs text-amber-400">
                    3. Vẽ Đường, Tín Hiệu & Mốc Giá
                  </h4>
                  <ul className="space-y-1.5 font-mono text-[11px] text-txt-secondary">
                    <li><code className="text-txt-primary">plot(series, &quot;Tên Đường&quot;, &#123; color: &quot;#10B981&quot; &#125;)</code></li>
                    <li><code className="text-txt-primary">plotshape(condition, &#123; text: &quot;BUY&quot;, style: &quot;arrowUp&quot; &#125;)</code></li>
                    <li><code className="text-txt-primary">hline(price, &quot;TP / SL Level&quot;, &#123; color: &quot;#EF4444&quot; &#125;)</code></li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-bg-surface-subtle border border-border space-y-2">
                  <h4 className="font-bold text-txt-primary font-mono text-xs text-purple-400">
                    4. Bảng HUD Scoreboard Đo Lực
                  </h4>
                  <p className="text-[11px] text-txt-secondary font-mono">
                    <code className="text-txt-primary">_table = table.new(&quot;top_right&quot;, 2, 4)</code>
                    <br />
                    <code className="text-txt-primary">table.cell(_table, 0, 0, &quot;BULL SCORE&quot;, &quot;85%&quot;)</code>
                  </p>
                  <p className="text-[11px] text-txt-muted">
                    Tự động chuyển đổi các ô trong bảng thành các thẻ HUD đo lực nến hiển thị trên Canvas.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "logs" && (
            <div className="p-4 rounded-2xl bg-[#0A0E14] border border-border text-[11px] font-mono text-[#E6EDF3] space-y-1.5 min-h-[220px]">
              {logs.length > 0 ? (
                logs.map((log, idx) => (
                  <div
                    key={idx}
                    className={
                      log.includes("[ERROR]") || log.includes("SYNTAX")
                        ? "text-loss font-bold"
                        : log.includes("[WARN]") || log.includes("[INFO]")
                        ? "text-amber-400"
                        : log.includes("Compiled successfully")
                        ? "text-gain"
                        : "text-txt-secondary"
                    }
                  >
                    &gt; {log}
                  </div>
                ))
              ) : (
                <div className="text-txt-muted italic">
                  {isVi ? "Chưa có log thực thi. Bấm 'Lưu & Nạp Lên Chart' để bắt đầu." : "No execution logs yet. Click 'Save & Apply to Chart' to execute."}
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
              disabled={isCompiling || !scriptCode.trim()}
              className="w-full sm:w-auto font-bold"
            >
              <Zap className="w-4 h-4 mr-2 text-brand-300" />
              {isCompiling ? (isVi ? "Đang Biên Dịch..." : "Compiling...") : (isVi ? "Lưu & Nạp Lên Chart" : "Save & Apply to Chart")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
