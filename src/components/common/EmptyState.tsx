"use client";

import React from "react";
import { LucideIcon, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = HelpCircle,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = "",
}) => {
  return (
    <div
      className={`bento-card flex flex-col items-center justify-center p-8 sm:p-14 text-center rounded-2xl relative overflow-hidden group ${className}`}
    >
      {/* Ambient Top Glow Line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-brand-500/50 to-transparent" />

      {/* Ambient Center Aura */}
      <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-32 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Floating Modern Icon Box */}
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600/20 via-indigo-500/20 to-sky-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400 mb-5 shadow-xl shadow-brand-500/10 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
        <Icon className="w-8 h-8 text-brand-400 stroke-[1.75]" />
      </div>

      <h4 className="text-lg sm:text-xl font-bold text-txt-primary tracking-tight font-sans">
        {title}
      </h4>

      <p className="text-xs sm:text-sm text-txt-secondary max-w-md mt-2 leading-relaxed font-sans">
        {description}
      </p>
      
      {(actionLabel || secondaryActionLabel) && (
        <div className="flex flex-wrap items-center justify-center gap-3 mt-7">
          {actionLabel && onAction && (
            <Button variant="primary" size="md" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <Button variant="outline" size="md" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
