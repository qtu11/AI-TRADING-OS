import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "gain" | "loss" | "warning" | "ai" | "outline" | "brand";
  size?: "sm" | "md";
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = "default",
  size = "md",
  children,
  ...props
}) => {
  const variantStyles = {
    default: "bg-surface-hover text-slate-300 border-border",
    gain: "bg-gain-subtle text-gain border-gain-border",
    loss: "bg-loss-subtle text-loss border-loss-border",
    warning: "bg-warning-subtle text-warning border-warning-border",
    ai: "bg-ai-subtle text-ai border-ai-border",
    brand: "bg-brand-500/20 text-brand-400 border-brand-500/30",
    outline: "bg-transparent text-slate-400 border-border",
  };

  const sizeStyles = {
    sm: "text-[10px] px-1.5 py-0.5 font-medium",
    md: "text-xs px-2.5 py-1 font-semibold",
  };

  return (
    <span
      className={twMerge(
        clsx(
          "inline-flex items-center rounded-full border tracking-wide select-none",
          variantStyles[variant],
          sizeStyles[size],
          className
        )
      )}
      {...props}
    >
      {children}
    </span>
  );
};
