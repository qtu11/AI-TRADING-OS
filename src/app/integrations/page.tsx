"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { MT5AccountConnection } from "@/types/mt5.types";
import { Trade } from "@/types/trade.types";
import { getMT5Connection, getUserTrades, saveTrade } from "@/lib/firebase/db-service";
import { parseMT5HTMLReport, getMQL5BridgeScript } from "@/lib/mt5/mt5-report-parser";
import { filterDuplicateTrades } from "@/lib/mt5/deduplication";
import { formatDateTime, formatCurrency } from "@/lib/utils/currency";
import { soundFX } from "@/lib/sound/sound-effects";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  Cpu,
  CheckCircle2,
  RefreshCw,
  Server,
  ShieldCheck,
  AlertCircle,
  FileSpreadsheet,
  Download,
  Code,
  Layers,
  ArrowUpRight,
  TrendingUp,
  Upload,
} from "lucide-react";

export default function IntegrationsPage() {
  const { userProfile } = useAuth();
  const { language, t } = useLanguage();
  const userId = userProfile?.id || "dev-trader-01";

  const isVi = language === "vi";

  const [activeTab, setActiveTab] = useState<"LIVE_SYNC" | "FILE_REPORT" | "MQL5_EA">("LIVE_SYNC");
  const [connection, setConnection] = useState<MT5AccountConnection | null>(null);
  const [accountNumber, setAccountNumber] = useState("");
  const [brokerServer, setBrokerServer] = useState("");
  const [password, setPassword] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [recentMT5Trades, setRecentMT5Trades] = useState<Trade[]>([]);
  const [reportFileName, setReportFileName] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    if (!userId) return;
    const [conn, trades] = await Promise.all([
      getMT5Connection(userId),
      getUserTrades(userId),
    ]);
    setConnection(conn);
    setRecentMT5Trades(trades.filter((t) => t.source === "MT5"));
  };

  useEffect(() => {
    loadData();
  }, [userId]);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsConnecting(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/mt5/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          accountNumber,
          brokerServer,
          password,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setConnection(data.connection);
        setStatusMessage(isVi ? "Kết nối MetaTrader 5 thành công!" : "MetaTrader 5 connected successfully!");
        soundFX.playSuccess();
        await handleSync();
      } else {
        setStatusMessage(`${isVi ? "Lỗi: " : "Error: "}${data.error}`);
        soundFX.playWarning();
      }
    } catch (err: any) {
      setStatusMessage(`${isVi ? "Kết nối thất bại: " : "Connection failed: "}${err.message}`);
      soundFX.playWarning();
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/mt5/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMessage(
          isVi
            ? `Đồng bộ hoàn tất: Đã nhập ${data.newImported} lệnh giao dịch mới (${data.duplicatesSkipped} lệnh trùng lặp được bỏ qua). Tổng P&L: +$${data.totalProfitAdded || 0}`
            : `Sync complete: ${data.newImported} new trades imported (${data.duplicatesSkipped} duplicates skipped). Total P&L: +$${data.totalProfitAdded || 0}`
        );
        soundFX.playSuccess();
        await loadData();
      } else {
        setStatusMessage(`${isVi ? "Lỗi đồng bộ: " : "Sync error: "}${data.error}`);
        soundFX.playWarning();
      }
    } catch (err: any) {
      setStatusMessage(`${isVi ? "Đồng bộ thất bại: " : "Sync failed: "}${err.message}`);
      soundFX.playWarning();
    } finally {
      setIsSyncing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setReportFileName(file.name);
    const text = await file.text();

    try {
      const parsedTrades = parseMT5HTMLReport(text, userId);
      if (parsedTrades.length === 0) {
        setStatusMessage(
          isVi
            ? "Không tìm thấy dữ liệu lệnh hợp lệ trong file báo cáo HTML/CSV này."
            : "No valid trade deals found in this HTML/CSV report."
        );
        soundFX.playWarning();
        return;
      }

      const existingTrades = await getUserTrades(userId);
      const { newTrades, duplicateCount } = filterDuplicateTrades(parsedTrades, existingTrades);

      for (const t of newTrades) {
        await saveTrade(userId, t);
      }

      setStatusMessage(
        isVi
          ? `Đã xử lý file "${file.name}": Nhập thành công ${newTrades.length} lệnh thật (${duplicateCount} lệnh trùng lặp).`
          : `Processed "${file.name}": Successfully imported ${newTrades.length} verified trades (${duplicateCount} duplicates skipped).`
      );
      soundFX.playSuccess();

      await loadData();
    } catch (err: any) {
      setStatusMessage(`${isVi ? "Lỗi phân tích file: " : "File parse error: "}${err.message}`);
      soundFX.playWarning();
    }
  };

  const handleDownloadMQL5 = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    const webhookUrl = `${origin}/api/mt5/webhook`;
    const code = getMQL5BridgeScript(webhookUrl, userId);

    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "AI_Trading_OS_Bridge.mq5";
    a.click();
    URL.revokeObjectURL(url);
    soundFX.playSuccess();
  };

  const originUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-bg-surface border border-border shadow-sm">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-txt-primary flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-brand-500/15 text-brand-500 border border-brand-500/30">
            <Cpu className="w-5 h-5" />
          </div>
          <span>{isVi ? "Kết Nối MetaTrader 5 & Cầu Nối Sàn Giao Dịch" : "MetaTrader 5 & Broker Integration Bridge"}</span>
        </h1>
        <p className="text-xs text-txt-secondary mt-1 font-mono">
          {isVi
            ? "Đồng bộ hóa 100% dữ liệu giao dịch thật từ MetaTrader 5 qua Cloud Bridge, Báo Cáo Sao Kê HTML/CSV, hoặc MQL5 Webhook EA."
            : "Sync 100% verified real-market trade executions from MT5 via Cloud Bridge, HTML/CSV Statements, or MQL5 Webhook EA."}
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border/60 pb-3">
        <button
          onClick={() => {
            soundFX.playSwitch();
            setActiveTab("LIVE_SYNC");
          }}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 ${
            activeTab === "LIVE_SYNC"
              ? "bg-brand-600 text-white shadow-md shadow-brand-500/25 border border-brand-500/40"
              : "bg-bg-surface text-txt-secondary hover:text-txt-primary border border-border"
          }`}
        >
          <Server className="w-3.5 h-3.5" />
          {isVi ? "1. Kết Nối Trực Tiếp Broker" : "1. Broker Cloud Bridge"}
        </button>

        <button
          onClick={() => {
            soundFX.playSwitch();
            setActiveTab("FILE_REPORT");
          }}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 ${
            activeTab === "FILE_REPORT"
              ? "bg-brand-600 text-white shadow-md shadow-brand-500/25 border border-brand-500/40"
              : "bg-bg-surface text-txt-secondary hover:text-txt-primary border border-border"
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          {isVi ? "2. Tải Lên Sao Kê MT5 (HTML/CSV)" : "2. MT5 Statement Import"}
        </button>

        <button
          onClick={() => {
            soundFX.playSwitch();
            setActiveTab("MQL5_EA");
          }}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 ${
            activeTab === "MQL5_EA"
              ? "bg-brand-600 text-white shadow-md shadow-brand-500/25 border border-brand-500/40"
              : "bg-bg-surface text-txt-secondary hover:text-txt-primary border border-border"
          }`}
        >
          <Code className="w-3.5 h-3.5" />
          {isVi ? "3. MQL5 Expert Advisor (Realtime)" : "3. MQL5 Realtime EA"}
        </button>
      </div>

      {statusMessage && (
        <div className="p-3.5 rounded-xl bg-sky-500/10 border border-sky-500/30 text-xs font-mono text-sky-400 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Tab 1: Live Sync */}
      {activeTab === "LIVE_SYNC" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: MT5 Connection Form */}
          <div className="bento-card p-5 sm:p-6 space-y-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-brand-500/50 to-transparent" />
            <div className="flex items-center gap-2 border-b border-border/60 pb-3">
              <Server className="w-4 h-4 text-sky-400" />
              <h3 className="text-xs font-bold text-txt-primary uppercase tracking-wider font-mono">
                {isVi ? "Thông Tin Đăng Nhập MetaTrader 5" : "MetaTrader 5 Account Credentials"}
              </h3>
            </div>

            <form onSubmit={handleConnect} className="space-y-3.5">
              <Input
                label={isVi ? "Số Tài Khoản MT5 / Login ID" : "MT5 Account Number / Login ID"}
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="e.g. 50123984"
                required
              />

              <Input
                label={isVi ? "Tên Máy Chủ Sàn (Broker Server)" : "Broker Server Name"}
                type="text"
                value={brokerServer}
                onChange={(e) => setBrokerServer(e.target.value)}
                placeholder="e.g. ICMarketsSC-Live, Exness-Real7"
                required
              />

              <Input
                label={isVi ? "Mật Khẩu Nhà Đầu Tư (Chỉ Đọc)" : "Investor Password (Read-Only)"}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                helperText={
                  isVi
                    ? "Chỉ cần Mật Khẩu Chỉ Đọc (Investor Password) để đọc lịch sử lệnh an toàn tuyệt đối."
                    : "We only require Read-Only Investor Password to pull trade history and positions."
                }
              />

              <div className="pt-2">
                <Button variant="primary" size="md" type="submit" isLoading={isConnecting} className="w-full">
                  {connection
                    ? isVi
                      ? "Cập Nhật Kết Nối MT5"
                      : "Update MT5 Connection"
                    : isVi
                    ? "Kết Nối Tài Khoản MT5"
                    : "Connect MT5 Account"}
                </Button>
              </div>
            </form>
          </div>

          {/* Right: Active Connection Status & Actions */}
          <div className="bento-card p-5 sm:p-6 space-y-4 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-sky-500/50 to-transparent" />
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <span className="text-xs font-bold text-txt-primary uppercase tracking-wider font-mono">
                  {isVi ? "Trạng Thái Cầu Nối & Đồng Bộ" : "Bridge Status & Realtime Sync"}
                </span>
                <span
                  className={`text-[10px] font-mono px-3 py-1 rounded-full font-bold ${
                    connection?.status === "CONNECTED"
                      ? "bg-gain-subtle text-gain border border-gain/40"
                      : "bg-loss-subtle text-loss border border-loss/40"
                  }`}
                >
                  {connection?.status === "CONNECTED"
                    ? isVi
                      ? "ĐÃ KẾT NỐI"
                      : "CONNECTED"
                    : isVi
                    ? "CHƯA KẾT NỐI"
                    : "DISCONNECTED"}
                </span>
              </div>

              {connection ? (
                <div className="space-y-3 font-mono text-xs text-txt-secondary">
                  <div className="p-3.5 bg-bg-surface-subtle rounded-xl border border-border/60 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-txt-muted">{isVi ? "Số Tài Khoản:" : "Account Number:"}</span>
                      <span className="text-txt-primary font-bold">{connection.accountNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-txt-muted">{isVi ? "Máy Chủ Sàn:" : "Broker Server:"}</span>
                      <span className="text-txt-primary font-semibold">{connection.brokerServer}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-txt-muted">{isVi ? "Số Dư Hiện Tại:" : "Current Balance:"}</span>
                      <span className="text-gain font-bold">{formatCurrency(connection.balance || 10000)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-txt-muted">{isVi ? "Đồng Bộ Gần Nhất:" : "Last Synced:"}</span>
                      <span className="text-txt-primary">{formatDateTime(connection.lastSyncAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-txt-muted">{isVi ? "Bảo Vệ Trùng Lệnh:" : "Deduplication Guard:"}</span>
                      <span className="text-gain font-semibold">
                        {isVi ? "Đang Bật (Kiểm Tra Ticket)" : "Active (Ticket Verification)"}
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="md"
                    onClick={handleSync}
                    isLoading={isSyncing}
                    className="w-full"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    {isVi ? "Đồng Bộ Lịch Sử Lệnh Ngay" : "Sync Historical Trades Now"}
                  </Button>
                </div>
              ) : (
                <div className="py-8 text-center space-y-2 border border-dashed border-border rounded-xl">
                  <AlertCircle className="w-6 h-6 text-txt-muted mx-auto" />
                  <p className="text-xs text-txt-secondary font-medium">
                    {isVi ? "Chưa có kết nối MT5 nào" : "No active MT5 connection"}
                  </p>
                  <p className="text-[11px] text-txt-muted max-w-xs mx-auto">
                    {isVi
                      ? "Nhập thông tin máy chủ MT5 ở bên trái để bắt đầu đồng bộ hóa tự động."
                      : "Enter your MT5 broker server credentials on the left to start automatic execution synchronization."}
                  </p>
                </div>
              )}
            </div>

            <div className="p-3 bg-bg-surface-subtle rounded-xl border border-border/60 text-[11px] text-txt-muted font-mono flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-gain shrink-0" />
              <span>
                {isVi
                  ? "Cơ chế chống trùng lặp ngăn chặn tuyệt đối việc ghi nhận trùng lệnh khi đồng bộ nhiều lần."
                  : "Anti-duplicate trade ingestion protects against duplicate imports."}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: File Report Upload */}
      {activeTab === "FILE_REPORT" && (
        <div className="bento-card p-6 sm:p-8 space-y-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-brand-500/50 to-transparent" />
          <div>
            <h3 className="text-base font-bold text-txt-primary flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-brand-500/15 text-brand-500 border border-brand-500/30">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <span>{isVi ? "Nhập Báo Cáo Sao Kê Chi Tiết MT5 (HTML / CSV Statement)" : "Upload MT5 Detailed Statement (HTML / CSV)"}</span>
            </h3>
            <p className="text-xs text-txt-secondary mt-1.5 font-mono">
              {isVi
                ? "Mở MT5 -> Chuột phải vào tab History -> Chọn Report -> HTML hoặc XML -> Tải file lên đây để nạp toàn bộ lịch sử lệnh thật."
                : "In MetaTrader 5 -> Right-click History tab -> Report -> HTML or XML -> Drag and drop here to parse and ingest all trades."}
            </p>
          </div>

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border hover:border-brand-500/60 rounded-2xl p-10 text-center cursor-pointer transition-all space-y-3 bg-bg-surface-subtle group"
          >
            <div className="w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-500/25 flex items-center justify-center text-brand-400 mx-auto group-hover:scale-110 transition-transform">
              <Upload className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm font-bold text-txt-primary">
                {reportFileName || (isVi ? "Bấm vào đây để chọn file Báo Cáo MT5 (.html, .htm, .csv)" : "Click to select MT5 Report (.html, .htm, .csv)")}
              </p>
              <p className="text-xs text-txt-muted mt-1 font-mono">
                {isVi ? "Hỗ trợ chuẩn sao kê chi tiết từ tất cả các broker (IC Markets, Exness, FXCM, XM, FBS...)" : "Supports detailed statements from all brokers"}
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".html,.htm,.csv,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </div>
      )}

      {/* Tab 3: MQL5 Expert Advisor Script */}
      {activeTab === "MQL5_EA" && (
        <div className="bento-card p-6 sm:p-8 space-y-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-sky-500/50 to-transparent" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
            <div>
              <h3 className="text-base font-bold text-txt-primary flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/30">
                  <Code className="w-5 h-5" />
                </div>
                <span>{isVi ? "MQL5 Expert Advisor Realtime Webhook Bridge" : "MQL5 Expert Advisor Realtime Webhook Bridge"}</span>
              </h3>
              <p className="text-xs text-txt-secondary mt-1.5 font-mono">
                {isVi
                  ? "Tự động gửi lệnh real-time từ MT5 về hệ thống mỗi khi bạn mở hoặc đóng lệnh trên máy tính/VPS."
                  : "Automatically pushes deals to AI Trading OS whenever an order opens or closes."}
              </p>
            </div>

            <Button variant="primary" size="md" onClick={handleDownloadMQL5}>
              <Download className="w-4 h-4 mr-2" />
              {isVi ? "Tải File AI_Trading_OS_Bridge.mq5" : "Download AI_Trading_OS_Bridge.mq5"}
            </Button>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="p-4 bg-bg-surface-subtle rounded-xl border border-border/60 space-y-2">
              <span className="text-txt-primary font-bold block">
                {isVi ? "Hướng Dẫn Cài Đặt 3 Bước Đơn Giản:" : "Simple 3-Step Setup Instructions:"}
              </span>
              <ol className="list-decimal list-inside text-txt-secondary space-y-1">
                <li>
                  {isVi
                    ? "Tải file .mq5 ở trên và copy vào thư mục MQL5/Experts trên MetaTrader 5."
                    : "Download the .mq5 script and copy to your MQL5/Experts folder in MT5."}
                </li>
                <li>
                  {isVi
                    ? `Vào MT5 -> Tools -> Options -> Expert Advisors -> Tích "Allow WebRequest" và thêm URL: `
                    : `In MT5 -> Tools -> Options -> Expert Advisors -> Check "Allow WebRequest" and add URL: `}
                  <strong className="text-sky-400">{originUrl}</strong>
                </li>
                <li>
                  {isVi
                    ? "Kéo EA vào bất kỳ biểu đồ nào trên MT5. Mọi lệnh mới sẽ tự động đồng bộ thời gian thực!"
                    : "Attach EA to any chart. All future deals will synchronize automatically in real time!"}
                </li>
              </ol>
            </div>

            <div className="p-3 bg-bg-surface-subtle rounded-xl border border-sky-500/30 text-sky-400 text-xs">
              <strong>{isVi ? "Webhook Endpoint của bạn:" : "Your Dedicated Webhook Endpoint:"}</strong> {originUrl}/api/mt5/webhook
            </div>
          </div>
        </div>
      )}

      {/* Live Synced MT5 Trades Ledger */}
      <div className="bento-card p-5 sm:p-6 space-y-4 relative overflow-hidden">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand-500" />
            <h3 className="text-xs font-bold text-txt-primary uppercase tracking-wider font-mono">
              {isVi
                ? `Lịch Sử Lệnh Đồng Bộ Từ MetaTrader 5 (${recentMT5Trades.length} Lệnh)`
                : `Verified Synced MT5 Trades (${recentMT5Trades.length} Records)`}
            </h3>
          </div>
          <span className="text-xs font-mono text-txt-muted">
            {isVi ? "Nguồn: MT5 Verified Ingestion" : "Source: MT5 Verified Ingestion"}
          </span>
        </div>

        {recentMT5Trades.length === 0 ? (
          <div className="py-8 text-center space-y-2 text-txt-muted text-xs font-mono">
            <p>{isVi ? "Chưa có lệnh nào được đồng bộ từ MT5." : "No trades synced from MT5 yet."}</p>
            <p className="text-[11px] text-txt-secondary">
              {isVi
                ? "Bấm \"Đồng Bộ Lịch Sử Lệnh Ngay\" hoặc tải file sao kê MT5 lên để nạp dữ liệu."
                : "Click \"Sync Historical Trades Now\" or upload a statement file to populate real data."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="border-b border-border text-txt-muted text-[10px] uppercase">
                  <th className="py-2.5 px-3">Ticket</th>
                  <th className="py-2.5 px-3">Symbol</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Lots</th>
                  <th className="py-2.5 px-3">Entry</th>
                  <th className="py-2.5 px-3">Exit</th>
                  <th className="py-2.5 px-3">Net P&L</th>
                  <th className="py-2.5 px-3">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-txt-primary">
                {recentMT5Trades.map((t) => (
                  <tr key={t.id} className="hover:bg-bg-surface-hover transition-colors">
                    <td className="py-2.5 px-3 text-txt-muted">#{t.externalTradeId || t.id.slice(-6)}</td>
                    <td className="py-2.5 px-3 font-bold text-txt-primary">{t.symbol}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          t.direction === "BUY"
                            ? "bg-gain-subtle text-gain border border-gain/30"
                            : "bg-loss-subtle text-loss border border-loss/30"
                        }`}
                      >
                        {t.direction}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-txt-secondary">{t.lots}L</td>
                    <td className="py-2.5 px-3 text-txt-secondary">{t.openPrice}</td>
                    <td className="py-2.5 px-3 text-txt-secondary">{t.closePrice || "—"}</td>
                    <td className="py-2.5 px-3 font-bold">
                      <span className={(t.netProfit ?? 0) >= 0 ? "text-gain" : "text-loss"}>
                        {formatCurrency(t.netProfit ?? 0, "USD", true)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-txt-muted text-[11px]">{formatDateTime(t.openTime)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
