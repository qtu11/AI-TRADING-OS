"use client";

import React, { useState, useEffect } from "react";
import { Search, Bell, Sparkles, User as UserIcon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationContext";
import { useCommand } from "@/context/CommandContext";
import { useLanguage } from "@/context/LanguageContext";
import { SessionBadge } from "@/components/common/SessionBadge";
import { LanguageToggle } from "./LanguageToggle";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { formatDateOnly } from "@/lib/utils/date";

export const Header: React.FC = () => {
  const { userProfile, isAdmin } = useAuth();
  const { unreadCount } = useNotifications();
  const { openPalette, toggleAICopilot } = useCommand();
  const { t, language } = useLanguage();
  const isVi = language === "vi";
  const [currentDateStr, setCurrentDateStr] = useState("");

  useEffect(() => {
    setCurrentDateStr(formatDateOnly(new Date().toISOString(), language));
  }, [language]);

  return (
    <header className="h-16 px-4 sm:px-6 bg-bg-surface/90 backdrop-blur-md border-b border-border flex items-center justify-between gap-4 sticky top-0 z-20 transition-colors">
      {/* Left: Today & Forex Sessions */}
      <div className="flex items-center gap-4 overflow-hidden">
        <div className="hidden lg:flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-gain animate-pulse" />
            <span className="text-[10px] uppercase tracking-wider text-txt-muted font-mono font-bold">
              {t("dash_market_status")}
            </span>
          </div>
          <span className="text-xs font-semibold text-txt-primary font-mono mt-0.5">
            {currentDateStr || "Monday, August 16"}
          </span>
        </div>

        <div className="h-6 w-px bg-border/80 hidden lg:block" />

        {/* Forex Live Sessions */}
        <div className="hidden sm:block">
          <SessionBadge />
        </div>
      </div>

      {/* Right: Quick Action buttons & Controls */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Light / Dark Mode Toggle */}
        <ThemeToggle />

        {/* Language Switcher */}
        <LanguageToggle />

        {/* Global Search / Command Launcher */}
        <button
          onClick={openPalette}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-bg-surface-subtle hover:bg-bg-surface-hover border border-border text-txt-secondary hover:text-txt-primary transition-all text-xs shadow-sm"
        >
          <Search className="w-3.5 h-3.5 text-txt-muted" />
          <span className="hidden md:inline">{isVi ? "Tìm kiếm..." : "Search..."}</span>
          <kbd className="hidden md:inline font-mono text-[10px] bg-bg-surface px-1.5 py-0.5 rounded-md border border-border text-txt-muted">
            ⌘K
          </kbd>
        </button>

        {/* AI Copilot Toggle */}
        <button
          onClick={toggleAICopilot}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-400 hover:text-sky-300 transition-all text-xs font-semibold shadow-sm active:scale-95"
        >
          <Sparkles className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden sm:inline">{isVi ? "AI Copilot" : "AI Copilot"}</span>
        </button>

        {/* Notification Bell */}
        <a
          href="/notifications"
          className="relative p-2 rounded-xl bg-bg-surface-subtle hover:bg-bg-surface-hover border border-border text-txt-secondary hover:text-txt-primary transition-colors shadow-sm"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-loss text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
              {unreadCount}
            </span>
          )}
        </a>

        {/* Settings / Profile link + Role Badge */}
        <a
          href="/settings"
          className="flex items-center gap-2 p-1.5 rounded-xl bg-bg-surface-subtle hover:bg-bg-surface-hover border border-border transition-colors shadow-sm"
        >
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-mono ${
            isAdmin
              ? "bg-amber-500/20 border border-amber-500/40 text-amber-400"
              : "bg-brand-500/20 border border-brand-500/40 text-brand-400"
          }`}>
            {isAdmin ? "A" : (userProfile?.displayName?.charAt(0) || <UserIcon className="w-3.5 h-3.5" />)}
          </div>
          <div className="hidden xl:flex flex-col text-left">
            <span className="text-xs font-medium text-txt-primary truncate max-w-[120px]">
              {userProfile?.displayName || "Profile"}
            </span>
            {isAdmin && (
              <span className="text-[9px] font-mono font-bold text-amber-400 leading-none">
                {t("role_admin")}
              </span>
            )}
          </div>
        </a>
      </div>
    </header>
  );
};
