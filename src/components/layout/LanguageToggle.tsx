"use client";

import React from "react";
import { useLanguage } from "@/context/LanguageContext";
import { soundFX } from "@/lib/sound/sound-effects";
import { Globe } from "lucide-react";

export const LanguageToggle: React.FC = () => {
  const { language, toggleLanguage } = useLanguage();

  const handleToggle = () => {
    soundFX.playSwitch();
    toggleLanguage();
  };

  return (
    <button
      onClick={handleToggle}
      title="Chuyển đổi Ngôn ngữ (Switch Language)"
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-bg-surface hover:bg-bg-surface-hover border border-border text-xs font-mono font-bold text-txt-primary transition-all active:scale-95 shadow-sm cursor-pointer"
    >
      <Globe className="w-3.5 h-3.5 text-brand-500" />
      <span className="flex items-center gap-1">
        <span className={language === "vi" ? "text-brand-500 font-extrabold" : "text-txt-muted"}>VI</span>
        <span className="text-txt-muted">/</span>
        <span className={language === "en" ? "text-brand-500 font-extrabold" : "text-txt-muted"}>EN</span>
      </span>
    </button>
  );
};
