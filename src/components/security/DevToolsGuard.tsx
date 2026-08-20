"use client";

import React, { useEffect } from "react";

export const DevToolsGuard: React.FC = () => {
  useEffect(() => {
    // 1. Prevent Inspect Key Combinations
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      const isShift = e.shiftKey;

      // F12 or Shift + F12
      if (key === "F12" || e.keyCode === 123) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl + U / Cmd + U (View Source)
      if (isCtrlOrCmd && key === "U") {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl + Shift + I / Cmd + Option + I (Developer Tools)
      // Ctrl + Shift + J / Cmd + Option + J (Console)
      // Ctrl + Shift + C / Cmd + Option + C (Inspect Element)
      // Ctrl + Shift + K (Firefox Console)
      if (
        isCtrlOrCmd &&
        isShift &&
        (key === "I" || key === "J" || key === "C" || key === "K")
      ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl + S (Save Page)
      if (isCtrlOrCmd && key === "S") {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    // 2. Prevent Right-Click Context Menu (Inspect Element)
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    window.addEventListener("contextmenu", handleContextMenu, { capture: true });

    return () => {
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
      window.removeEventListener("contextmenu", handleContextMenu, { capture: true });
    };
  }, []);

  return null;
};
