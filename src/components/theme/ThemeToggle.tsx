"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { soundFX } from "@/lib/sound/sound-effects";

export const ThemeToggle: React.FC = () => {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-8 h-8 rounded-xl bg-bg-surface border border-border animate-pulse" />
    );
  }

  const isDark = resolvedTheme === "dark";

  const handleToggle = () => {
    soundFX.playSwitch();
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <button
      onClick={handleToggle}
      title={isDark ? "Chuyển sang Chế độ Sáng (Light Mode)" : "Chuyển sang Chế độ Tối (Dark Mode)"}
      className="flex items-center justify-center w-8 h-8 rounded-xl bg-bg-surface hover:bg-bg-surface-hover border border-border text-txt-primary transition-all active:scale-90 shadow-sm cursor-pointer group"
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-400 group-hover:rotate-90 transition-transform duration-300" />
      ) : (
        <Moon className="w-4 h-4 text-indigo-600 group-hover:-rotate-45 transition-transform duration-300" />
      )}
    </button>
  );
};
