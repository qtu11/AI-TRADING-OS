"use client";

import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

export interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  changePercent?: number;
  changeLabel?: string;
  trend?: "up" | "down" | "neutral";
  variant?: "default" | "gain" | "loss" | "ai" | "warning";
  icon?: React.ReactNode;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  changePercent,
  changeLabel,
  trend,
  variant = "default",
  icon,
  className,
}) => {
  const getTrendIcon = () => {
    if (trend === "up" || (changePercent && changePercent > 0)) {
      return <ArrowUpRight className="w-3.5 h-3.5 text-gain" />;
    }
    if (trend === "down" || (changePercent && changePercent < 0)) {
      return <ArrowDownRight className="w-3.5 h-3.5 text-loss" />;
    }
    return <Minus className="w-3.5 h-3.5 text-txt-muted" />;
  };

  const getVariantStyles = () => {
    switch (variant) {
      case "gain":
        return "border-gain/30 hover:border-gain/60 shadow-[0_0_20px_-5px_rgba(16,185,129,0.15)]";
      case "loss":
        return "border-loss/30 hover:border-loss/60 shadow-[0_0_20px_-5px_rgba(244,63,94,0.15)]";
      case "ai":
        return "border-sky-500/30 hover:border-sky-500/60 shadow-[0_0_20px_-5px_rgba(56,189,248,0.15)]";
      case "warning":
        return "border-amber-500/30 hover:border-amber-500/60 shadow-[0_0_20px_-5px_rgba(245,158,11,0.15)]";
      default:
        return "border-border hover:border-border-light";
    }
  };

  const getTopGlow = () => {
    switch (variant) {
      case "gain":
        return "bg-gradient-to-r from-transparent via-gain/50 to-transparent";
      case "loss":
        return "bg-gradient-to-r from-transparent via-loss/50 to-transparent";
      case "ai":
        return "bg-gradient-to-r from-transparent via-sky-500/50 to-transparent";
      case "warning":
        return "bg-gradient-to-r from-transparent via-amber-500/50 to-transparent";
      default:
        return "bg-gradient-to-r from-transparent via-border-light to-transparent";
    }
  };

  return (
    <div
      className={twMerge(
        clsx(
          "bento-card p-4 sm:p-5 transition-all duration-250 relative group",
          getVariantStyles(),
          className
        )
      )}
    >
      {/* Top Ambient Glow Line */}
      <div className={clsx("absolute top-0 left-0 right-0 h-[1.5px] opacity-70 group-hover:opacity-100 transition-opacity", getTopGlow())} />

      <div className="flex items-start justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-txt-secondary font-mono">
          {title}
        </span>
        {icon && (
          <div className="p-2 rounded-xl bg-bg-surface-subtle border border-border/60 text-txt-secondary group-hover:text-txt-primary group-hover:scale-105 transition-all duration-200">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-2.5 flex items-baseline gap-2">
        <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-txt-primary">
          {value}
        </span>
      </div>

      {(changePercent !== undefined || subtitle || changeLabel) && (
        <div className="mt-2.5 flex items-center justify-between text-xs font-mono pt-2 border-t border-border/40">
          {changePercent !== undefined && (
            <div className="flex items-center gap-1 font-medium">
              {getTrendIcon()}
              <span
                className={clsx(
                  changePercent > 0 && "text-gain font-bold",
                  changePercent < 0 && "text-loss font-bold",
                  changePercent === 0 && "text-txt-muted"
                )}
              >
                {changePercent > 0 ? `+${changePercent}%` : `${changePercent}%`}
              </span>
            </div>
          )}
          {changeLabel && <span className="text-txt-muted text-[10px]">{changeLabel}</span>}
          {subtitle && <span className="text-txt-secondary text-[11px] ml-auto font-medium">{subtitle}</span>}
        </div>
      )}
    </div>
  );
};
