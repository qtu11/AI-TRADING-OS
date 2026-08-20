"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { soundFX } from "@/lib/sound/sound-effects";
import {
  CalendarDays,
  AlertTriangle,
  Filter,
  Globe2,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  Search,
  Clock,
  TrendingUp,
  Activity,
  Flame,
  ChevronRight,
  Sliders,
} from "lucide-react";
import { NewsAnalysisModal, AINewsAnalysisData } from "@/components/calendar/NewsAnalysisModal";

export interface CalendarEvent {
  id: string;
  title: string;
  country: string;
  currency: string;
  date: string;
  time: string;
  impact: "High" | "Medium" | "Low" | "Holiday";
  forecast: string;
  previous: string;
  actual: string;
}

export default function EconomicCalendarPage() {
  const { language } = useLanguage();
  const isVi = language === "vi";

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  // Filters
  const [filterImpact, setFilterImpact] = useState<string>("ALL");
  const [filterCurrency, setFilterCurrency] = useState<string>("ALL");
  const [filterTime, setFilterTime] = useState<"ALL" | "TODAY" | "HIGH_ONLY">("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // AI Modal States
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [aiAnalysis, setAiAnalysis] = useState<AINewsAnalysisData | null>(null);
  const [aiLoading, setAiLoading] = useState<boolean>(false);

  // Fetch live Forex Factory Calendar
  const fetchCalendar = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/news/forex-factory");
      if (res.ok) {
        const data = await res.json();
        if (data.events && Array.isArray(data.events)) {
          setEvents(data.events);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch Forex Factory calendar:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendar();
  }, [refreshKey]);

  // Trigger Deep AI Analysis on an event
  const handleAnalyzeEvent = async (event: CalendarEvent) => {
    soundFX.playClick();
    setSelectedEvent(event);
    setModalOpen(true);
    setAiLoading(true);
    setAiAnalysis(null);

    try {
      const res = await fetch("/api/ai/analyze-news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.analysis) {
          setAiAnalysis(data.analysis);
          soundFX.playSuccess();
        }
      }
    } catch (err) {
      console.warn("AI Analysis Error:", err);
    } finally {
      setAiLoading(false);
    }
  };

  // Filter logic
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      // Impact filter
      if (filterImpact !== "ALL" && ev.impact !== filterImpact) return false;

      // Currency filter
      if (filterCurrency !== "ALL" && ev.currency !== filterCurrency) return false;

      // Time / High Only filter
      if (filterTime === "HIGH_ONLY" && ev.impact !== "High") return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = ev.title.toLowerCase().includes(q);
        const matchCurr = ev.currency.toLowerCase().includes(q);
        if (!matchTitle && !matchCurr) return false;
      }

      return true;
    });
  }, [events, filterImpact, filterCurrency, filterTime, searchQuery]);

  // Statistics
  const highImpactCount = useMemo(() => events.filter((e) => e.impact === "High").length, [events]);
  const mediumImpactCount = useMemo(() => events.filter((e) => e.impact === "Medium").length, [events]);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-bg-surface border border-border shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 via-amber-500 to-rose-500" />

        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-brand-500/15 text-brand-500 border border-brand-500/30">
              <CalendarDays className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-txt-primary font-mono">
                {isVi ? "Lịch Kinh Tế Forex Factory & AI Phân Tích Vĩ Mô" : "Forex Factory Economic Calendar & AI Macro Intelligence"}
              </h1>
              <p className="text-xs text-txt-secondary font-mono">
                {isVi
                  ? "Dữ liệu thời gian thực trực tiếp từ Forex Factory, tích hợp AI phân tích kịch bản đa biến động và chỉ thị quản trị rủi ro."
                  : "Live official feed from ForexFactory.com powered by deep AI scenario modeling & risk directives."}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats Badges */}
        <div className="flex flex-wrap items-center gap-2.5 font-mono text-xs">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-loss-subtle text-loss border border-loss/30 font-bold">
            <Flame className="w-4 h-4 text-loss animate-pulse" />
            <span>{highImpactCount} {isVi ? "Tin Đỏ (High Impact)" : "High Impact News"}</span>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30 font-bold">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>{mediumImpactCount} {isVi ? "Tin Cam (Medium)" : "Medium Impact"}</span>
          </div>

          <button
            onClick={() => {
              soundFX.playClick();
              setRefreshKey((k) => k + 1);
            }}
            className="p-2 rounded-2xl bg-bg-surface-subtle hover:bg-bg-surface-hover border border-border text-txt-secondary hover:text-txt-primary transition-all cursor-pointer"
            title={isVi ? "Làm mới dữ liệu tin tức" : "Refresh news"}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-brand-500" : ""}`} />
          </button>
        </div>
      </div>

      {/* Filter Control Bar */}
      <div className="bento-card p-4 sm:p-5 space-y-3 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 font-mono text-xs">
          {/* Left: Currency Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <span className="text-[10px] text-txt-muted uppercase font-bold mr-1">{isVi ? "Đồng Tiền:" : "Currency:"}</span>
            {["ALL", "USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "NZD"].map((curr) => (
              <button
                key={curr}
                onClick={() => {
                  soundFX.playSwitch();
                  setFilterCurrency(curr);
                }}
                className={`px-3 py-1.5 rounded-xl border font-bold transition-all cursor-pointer ${
                  filterCurrency === curr
                    ? "bg-brand-500 text-white border-brand-500 shadow-sm"
                    : "bg-bg-surface text-txt-secondary border-border/60 hover:bg-bg-surface-hover hover:text-txt-primary"
                }`}
              >
                {curr === "ALL" ? (isVi ? "Tất Cả" : "All") : curr}
              </button>
            ))}
          </div>

          {/* Right: Search & Impact Filter */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Impact Filter Switcher */}
            <div className="flex rounded-xl bg-bg-surface-subtle p-1 border border-border">
              {[
                { id: "ALL", label: isVi ? "Tất Cả Tác Động" : "All Impacts" },
                { id: "High", label: isVi ? "Tin Đỏ (High)" : "High Impact" },
                { id: "Medium", label: isVi ? "Tin Cam (Medium)" : "Medium" },
                { id: "Low", label: isVi ? "Tin Vàng (Low)" : "Low" },
              ].map((imp) => (
                <button
                  key={imp.id}
                  onClick={() => {
                    soundFX.playSwitch();
                    setFilterImpact(imp.id);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    filterImpact === imp.id
                      ? "bg-bg-surface text-brand-500 shadow-sm border border-brand-500/30"
                      : "text-txt-muted hover:text-txt-primary"
                  }`}
                >
                  {imp.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder={isVi ? "Tìm tin (CPI, NFP, Fed, Rate...)" : "Search news (CPI, NFP...)"}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-bg-surface-subtle border border-border rounded-xl pl-8 pr-3 py-1.5 text-xs text-txt-primary placeholder-txt-muted focus:outline-none focus:border-brand-500 font-mono w-48 transition-colors"
              />
              <Search className="w-3.5 h-3.5 text-txt-muted absolute left-2.5 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Economic Events Table */}
      <div className="bento-card overflow-hidden relative">
        <div className="p-4 sm:p-5 border-b border-border/60 flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono text-xs font-bold text-txt-primary">
            <Activity className="w-4 h-4 text-brand-500" />
            <span>{isVi ? "Danh Sách Sự Kiện Kinh Tế Forex Factory" : "Forex Factory Economic Release Schedule"}</span>
            <span className="text-txt-muted">({filteredEvents.length} {isVi ? "sự kiện" : "events"})</span>
          </div>

          <span className="text-[11px] font-mono text-txt-muted flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-brand-500" />
            {isVi ? "Múi giờ: GMT+7 (Việt Nam)" : "Timezone: GMT+7"}
          </span>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3 text-txt-secondary">
            <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
            <p className="text-xs font-mono">
              {isVi ? "Đang đồng bộ dữ liệu thời gian thực từ Forex Factory..." : "Syncing live economic feed from ForexFactory.com..."}
            </p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="py-16 text-center text-xs text-txt-muted font-mono space-y-2">
            <p>{isVi ? "Không tìm thấy sự kiện kinh tế phù hợp với bộ lọc." : "No economic events matching current filter."}</p>
            <button
              onClick={() => {
                setFilterCurrency("ALL");
                setFilterImpact("ALL");
                setSearchQuery("");
              }}
              className="px-3 py-1.5 rounded-xl bg-brand-500/15 text-brand-500 font-bold border border-brand-500/30 cursor-pointer"
            >
              {isVi ? "Đặt Lại Bộ Lọc" : "Reset Filters"}
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-bg-surface-subtle border-b border-border/60 text-[11px] uppercase text-txt-muted">
                <tr>
                  <th className="py-3 px-4 font-bold">{isVi ? "Thời Gian" : "Time"}</th>
                  <th className="py-3 px-3 font-bold">{isVi ? "Đồng Tiền" : "Currency"}</th>
                  <th className="py-3 px-3 font-bold">{isVi ? "Mức Tác Động" : "Impact"}</th>
                  <th className="py-3 px-4 font-bold">{isVi ? "Tên Sự Kiện Kinh Tế" : "Economic Event"}</th>
                  <th className="py-3 px-3 font-bold text-right">{isVi ? "Kỳ Trước" : "Previous"}</th>
                  <th className="py-3 px-3 font-bold text-right">{isVi ? "Dự Báo" : "Forecast"}</th>
                  <th className="py-3 px-3 font-bold text-right">{isVi ? "Thực Tế" : "Actual"}</th>
                  <th className="py-3 px-4 font-bold text-center">{isVi ? "AI Phân Tích" : "AI Deep Audit"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredEvents.map((ev) => {
                  const isHigh = ev.impact === "High";
                  const isMedium = ev.impact === "Medium";

                  return (
                    <tr
                      key={ev.id}
                      className={`hover:bg-bg-surface-hover/80 transition-colors ${
                        isHigh ? "bg-loss-subtle/10" : ""
                      }`}
                    >
                      {/* Time */}
                      <td className="py-3.5 px-4 font-bold text-txt-primary whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-txt-muted" />
                          <span>{ev.time || "All Day"}</span>
                        </div>
                      </td>

                      {/* Currency */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="px-2 py-1 rounded-md bg-bg-surface border border-border font-bold text-txt-primary">
                          {ev.currency}
                        </span>
                      </td>

                      {/* Impact */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isHigh
                              ? "bg-loss-subtle text-loss border border-loss/40"
                              : isMedium
                              ? "bg-amber-500/15 text-amber-400 border border-amber-500/40"
                              : "bg-gain-subtle text-gain border border-gain/40"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isHigh ? "bg-loss animate-ping" : isMedium ? "bg-amber-400" : "bg-gain"
                            }`}
                          />
                          {ev.impact}
                        </span>
                      </td>

                      {/* Event Title */}
                      <td className="py-3.5 px-4 font-bold text-txt-primary min-w-[240px]">
                        <div className="flex items-center gap-2">
                          <span>{ev.title}</span>
                          {isHigh && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-loss/20 text-loss font-bold border border-loss/30">
                              HOT
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Previous */}
                      <td className="py-3.5 px-3 text-right text-txt-secondary whitespace-nowrap">
                        {ev.previous || "—"}
                      </td>

                      {/* Forecast */}
                      <td className="py-3.5 px-3 text-right font-bold text-sky-400 whitespace-nowrap">
                        {ev.forecast || "—"}
                      </td>

                      {/* Actual */}
                      <td className="py-3.5 px-3 text-right font-bold text-txt-primary whitespace-nowrap">
                        {ev.actual ? (
                          <span className="px-2 py-0.5 rounded bg-gain-subtle text-gain border border-gain/30">
                            {ev.actual}
                          </span>
                        ) : (
                          <span className="text-txt-muted text-[11px]">Pending</span>
                        )}
                      </td>

                      {/* AI Deep Analysis Button */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleAnalyzeEvent(ev)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-500/15 hover:bg-brand-500 text-brand-500 hover:text-white font-bold border border-brand-500/30 transition-all cursor-pointer active:scale-95 shadow-sm"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{isVi ? "AI Phân Tích" : "AI Audit"}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* AI Deep News Analysis Modal */}
      {selectedEvent && (
        <NewsAnalysisModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          analysis={aiAnalysis}
          loading={aiLoading}
          eventTitle={selectedEvent.title}
          currency={selectedEvent.currency}
          impact={selectedEvent.impact}
          forecast={selectedEvent.forecast}
          previous={selectedEvent.previous}
          actual={selectedEvent.actual}
          time={selectedEvent.time}
        />
      )}
    </div>
  );
}
