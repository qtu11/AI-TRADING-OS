"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Target, TrendingUp, BookOpen, Menu } from "lucide-react";
import { useCommand } from "@/context/CommandContext";
import { useLanguage } from "@/context/LanguageContext";

export const MobileNav: React.FC = () => {
  const pathname = usePathname();
  const { openPalette } = useCommand();
  const { t } = useLanguage();

  const navItems = [
    { label: t("nav_dashboard"), href: "/", icon: LayoutDashboard },
    { label: t("nav_plan"), href: "/plan", icon: Target },
    { label: t("nav_trades"), href: "/trades", icon: TrendingUp },
    { label: t("nav_journal"), href: "/journal", icon: BookOpen },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-bg-surface/95 dark:bg-bg-surface/95 light:bg-white/95 backdrop-blur-md border-t border-border px-2 py-2 flex items-center justify-around z-30 shadow-2xl transition-colors">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        return (
          <a
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl text-[10px] font-medium transition-all ${
              isActive ? "text-brand-500 font-bold" : "text-txt-muted hover:text-txt-primary"
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? "text-brand-500" : "text-txt-muted"}`} />
            <span className="truncate max-w-[60px]">{item.label}</span>
          </a>
        );
      })}

      <button
        onClick={openPalette}
        className="flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl text-[10px] font-medium text-txt-muted hover:text-txt-primary"
      >
        <Menu className="w-5 h-5 text-txt-muted" />
        <span>Menu</span>
      </button>
    </nav>
  );
};
