"use client";

import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "glass" | "subtle" | "interactive";
}

export const Card: React.FC<CardProps> = ({
  className,
  variant = "default",
  children,
  ...props
}) => {
  const variantStyles = {
    default: "bg-bg-surface dark:bg-bg-surface light:bg-white border border-border rounded-2xl shadow-premium-light dark:shadow-premium transition-colors",
    glass: "glass-card rounded-2xl transition-colors",
    subtle: "bg-bg-subtle dark:bg-bg-subtle light:bg-slate-50 border border-border/60 rounded-2xl transition-colors",
    interactive: "bg-bg-surface dark:bg-bg-surface light:bg-white border border-border hover:border-border-light hover:shadow-xl rounded-2xl cursor-pointer transition-all duration-200",
  };

  return (
    <div
      className={twMerge(clsx(variantStyles[variant], "p-5 text-txt-primary", className))}
      {...props}
    >
      {children}
    </div>
  );
};
