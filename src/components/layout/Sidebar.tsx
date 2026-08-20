"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Target,
  Calendar,
  Award,
  TrendingUp,
  Layers,
  ShieldCheck,
  BookOpen,
  Brain,
  FileCheck2,
  Bot,
  BarChart3,
  Globe2,
  CalendarDays,
  FileSpreadsheet,
  Bell,
  Cpu,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Sparkles,
} from "lucide-react";
import { APP_CONFIG } from "@/config/app.config";
import { useAuth } from "@/context/AuthContext";
import { useCommand } from "@/context/CommandContext";
import { useLanguage } from "@/context/LanguageContext";

export const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { userProfile, isAdmin, logout } = useAuth();
  const { toggleAICopilot } = useCommand();
  const { t } = useLanguage();

  const navGroups = [
    {
      group: "COMMAND",
      items: [
        { label: t("nav_dashboard"), href: "/", icon: LayoutDashboard },
      ],
    },
    {
      group: "PLAN",
      items: [
        { label: t("nav_plan"), href: "/plan", icon: Target },
        { label: t("nav_calendar"), href: "/calendar", icon: Calendar },
        { label: t("nav_goals"), href: "/goals", icon: Award },
      ],
    },
    {
      group: "TRADING",
      items: [
        { label: t("nav_trades"), href: "/trades", icon: TrendingUp },
        { label: t("nav_strategies"), href: "/strategies", icon: Layers },
        { label: t("nav_risk"), href: "/risk", icon: ShieldCheck },
      ],
    },
    {
      group: "JOURNAL",
      items: [
        { label: t("nav_journal"), href: "/journal", icon: BookOpen },
        { label: t("nav_psychology"), href: "/psychology", icon: Brain },
        { label: t("nav_reviews"), href: "/reviews", icon: FileCheck2 },
      ],
    },
    {
      group: "INTELLIGENCE",
      items: [
        { label: t("nav_ai_coach"), href: "/ai-coach", icon: Bot, isAi: true },
        { label: t("nav_analytics"), href: "/analytics", icon: BarChart3 },
        { label: t("nav_market"), href: "/market", icon: Globe2 },
        { label: t("nav_economic_calendar"), href: "/economic-calendar", icon: CalendarDays },
      ],
    },
    {
      group: "SYSTEM",
      items: [
        { label: t("nav_reports"), href: "/reports", icon: FileSpreadsheet },
        { label: t("nav_notifications"), href: "/notifications", icon: Bell },
        { label: t("nav_integrations"), href: "/integrations", icon: Cpu },
        { label: t("nav_settings"), href: "/settings", icon: Settings },
      ],
    },
  ];

  return (
    <aside
      className={`hidden md:flex flex-col bg-bg-surface-subtle border-r border-border transition-all duration-300 z-30 shrink-0 select-none ${
        collapsed ? "w-[72px]" : "w-[250px]"
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-border bg-bg-surface transition-colors">
        {!collapsed ? (
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-500 to-sky-400 flex items-center justify-center text-white shadow-lg shadow-brand-500/25 shrink-0 font-bold font-mono text-sm">
              OS
            </div>
            <div className="flex flex-col truncate">
              <span className="text-sm font-bold tracking-tight text-txt-primary font-mono truncate">
                {APP_CONFIG.name}
              </span>
              <span className="text-[10px] text-sky-400 font-mono tracking-wide font-semibold">
                v{APP_CONFIG.version} PRO
              </span>
            </div>
          </div>
        ) : (
          <div className="w-8 h-8 mx-auto rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-500 to-sky-400 flex items-center justify-center text-white font-bold font-mono text-xs shadow-lg shadow-brand-500/25">
            OS
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-txt-muted hover:text-txt-primary hover:bg-bg-surface-hover transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* AI Copilot Quick Launcher Button */}
      <div className="p-3 border-b border-border/50">
        <button
          onClick={toggleAICopilot}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-950/60 to-sky-950/60 border border-sky-500/40 text-sky-400 hover:border-sky-300 hover:text-sky-300 transition-all group shadow-md shadow-sky-500/10 ${
            collapsed ? "justify-center px-0" : ""
          }`}
          title="Open AI Copilot (Cmd+J)"
        >
          <Sparkles className="w-4 h-4 text-sky-400 group-hover:rotate-12 transition-transform shrink-0" />
          {!collapsed && (
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-bold text-white">AI Copilot</span>
              <span className="text-[10px] bg-sky-500/20 text-sky-300 font-mono px-1.5 py-0.5 rounded-md border border-sky-500/40 font-bold">
                ⌘J
              </span>
            </div>
          )}
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-3 px-2.5 space-y-4">
        {navGroups.map((group) => (
          <div key={group.group} className="space-y-1">
            {!collapsed && (
              <span className="px-3 text-[10px] font-mono font-bold uppercase tracking-wider text-txt-muted">
                {group.group}
              </span>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <a
                    key={item.href}
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all relative ${
                      isActive
                        ? "bg-bg-surface-hover text-txt-primary font-bold border border-brand-500/40 shadow-sm"
                        : "text-txt-secondary hover:text-txt-primary hover:bg-bg-surface-hover"
                    } ${collapsed ? "justify-center px-0" : ""}`}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-brand-500" />
                    )}
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive
                          ? item.isAi
                            ? "text-sky-400"
                            : "text-brand-400"
                          : "text-txt-muted"
                      }`}
                    />
                    {!collapsed && <span>{item.label}</span>}
                  </a>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* User Footer Profile */}
      <div className="p-3 border-t border-border bg-bg-surface transition-colors">
        {!collapsed ? (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-brand-500/20 border border-brand-500/40 flex items-center justify-center font-bold text-xs text-brand-400 shrink-0 font-mono">
                {userProfile?.displayName?.charAt(0) || "T"}
              </div>
              <div className="truncate flex flex-col">
                <span className="text-xs font-semibold text-txt-primary truncate">
                  {userProfile?.displayName || "Trader"}
                </span>
                <span className="text-[10px] text-txt-muted font-mono truncate">
                  {userProfile?.currency || "USD"} • {userProfile?.riskProfile || "Moderate"}
                </span>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-txt-muted hover:text-loss hover:bg-loss-subtle transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={logout}
            className="w-full flex items-center justify-center p-2 rounded-lg text-txt-muted hover:text-loss hover:bg-loss-subtle transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
};
