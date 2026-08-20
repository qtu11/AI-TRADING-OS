"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  LayoutDashboard,
  Target,
  Calendar,
  TrendingUp,
  ShieldCheck,
  BookOpen,
  Brain,
  Bot,
  BarChart3,
  Globe2,
  FileSpreadsheet,
  Settings,
  PlusCircle,
  Calculator,
  X,
} from "lucide-react";
import { useCommand } from "@/context/CommandContext";

export const CommandPalette: React.FC = () => {
  const { isOpen, closePalette, toggleAICopilot } = useCommand();
  const [query, setQuery] = useState("");
  const router = useRouter();

  if (!isOpen) return null;

  interface CommandItem {
    label: string;
    href?: string;
    action?: () => void;
    icon: React.ComponentType<{ className?: string }>;
    shortcut?: string;
  }

  interface CommandCategory {
    category: string;
    items: CommandItem[];
  }

  const actions: CommandCategory[] = [
    {
      category: "Quick Actions",
      items: [
        { label: "Log New Trade", href: "/trades?action=new", icon: PlusCircle, shortcut: "N" },
        { label: "Open Position Calculator", href: "/risk", icon: Calculator, shortcut: "R" },
        { label: "Open Daily Journal", href: "/journal", icon: BookOpen, shortcut: "J" },
        { label: "Ask AI Trading Copilot", action: () => toggleAICopilot(), icon: Bot, shortcut: "⌘J" },
      ],
    },
    {
      category: "Navigation",
      items: [
        { label: "Dashboard", href: "/", icon: LayoutDashboard },
        { label: "Trading Plan", href: "/plan", icon: Target },
        { label: "Calendar Matrix", href: "/calendar", icon: Calendar },
        { label: "All Trades Log", href: "/trades", icon: TrendingUp },
        { label: "Psychology & Discipline", href: "/psychology", icon: Brain },
        { label: "Analytics & Heatmap", href: "/analytics", icon: BarChart3 },
        { label: "Market Intelligence", href: "/market", icon: Globe2 },
        { label: "Reports & Export", href: "/reports", icon: FileSpreadsheet },
        { label: "Platform Settings", href: "/settings", icon: Settings },
      ],
    },
  ];

  const filteredActions = actions.map((group) => ({
    ...group,
    items: group.items.filter((item) =>
      item.label.toLowerCase().includes(query.toLowerCase())
    ),
  })).filter((group) => group.items.length > 0);

  const handleSelect = (item: any) => {
    closePalette();
    if (item.action) {
      item.action();
    } else if (item.href) {
      router.push(item.href);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-xl bg-[#111820] border border-[#202A35] rounded-2xl shadow-2xl overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-[#202A35] bg-[#0E141B]">
          <Search className="w-4 h-4 text-slate-400 mr-3 shrink-0" />
          <input
            autoFocus
            type="text"
            placeholder="Type a command or search page..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-slate-500 hover:text-white mr-2">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="text-[10px] font-mono bg-[#18222D] text-slate-400 px-1.5 py-0.5 rounded border border-border">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-[360px] overflow-y-auto p-2 space-y-3">
          {filteredActions.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No matching commands or pages found.
            </div>
          ) : (
            filteredActions.map((group) => (
              <div key={group.category} className="space-y-1">
                <span className="px-3 text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400">
                  {group.category}
                </span>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.label}
                        onClick={() => handleSelect(item)}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium text-slate-200 hover:bg-[#18222D] hover:text-white transition-colors group text-left"
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-4 h-4 text-slate-400 group-hover:text-sky-400" />
                          <span>{item.label}</span>
                        </div>
                        {item.shortcut && (
                          <span className="text-[10px] font-mono text-slate-500 bg-[#141C24] px-1.5 py-0.5 rounded border border-border">
                            {item.shortcut}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-[#0E141B] border-t border-[#202A35] flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span>Navigate with arrows</span>
          <span>AI TRADING OS</span>
        </div>
      </div>
    </div>
  );
};
