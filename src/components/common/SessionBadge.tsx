import React from "react";
import { getForexSessionsStatus } from "@/lib/utils/date";

export const SessionBadge: React.FC = () => {
  const sessions = getForexSessionsStatus();

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {sessions.map((s) => (
        <div
          key={s.key}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-mono border transition-all ${
            s.isOpen
              ? "bg-bg-surface-subtle text-txt-primary border-brand-500/40 shadow-sm font-semibold"
              : "bg-bg-surface text-txt-muted border-border/40 opacity-60"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              s.isOpen ? "animate-ping" : ""
            }`}
            style={{ backgroundColor: s.isOpen ? s.color : "#64748B" }}
          />
          <span>{s.name}</span>
          <span className="text-[10px] text-txt-muted">
            {s.isOpen ? `(${s.hoursUntilClose}h)` : "Closed"}
          </span>
        </div>
      ))}
    </div>
  );
};
