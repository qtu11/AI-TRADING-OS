"use client";

import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { soundFX } from "@/lib/sound/sound-effects";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "success" | "ghost" | "ai" | "outline";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
  enableSound?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, disabled, enableSound = true, onClick, children, ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.97] cursor-pointer";

    const variantStyles = {
      primary: "bg-brand-600 hover:bg-brand-500 text-white shadow-md hover:shadow-brand-500/25 border border-brand-500/30",
      secondary: "bg-bg-surface hover:bg-bg-surface-hover text-txt-primary border border-border hover:border-border-light shadow-sm",
      success: "bg-gain-subtle hover:bg-gain/25 text-gain border border-gain/40 focus:ring-gain",
      danger: "bg-loss-subtle hover:bg-loss/25 text-loss border border-loss/40 focus:ring-loss",
      ghost: "hover:bg-bg-surface-hover text-txt-secondary hover:text-txt-primary",
      ai: "bg-gradient-to-r from-indigo-600 via-sky-600 to-teal-500 hover:from-indigo-500 hover:to-sky-500 text-white shadow-md hover:shadow-sky-500/30 border border-sky-400/30",
      outline: "border border-border text-txt-primary hover:bg-bg-surface-hover hover:border-border-light",
    };

    const sizeStyles = {
      sm: "text-xs px-3 py-1.5 gap-1.5",
      md: "text-sm px-4 py-2 gap-2 font-semibold",
      lg: "text-base px-6 py-3 gap-2.5 font-bold",
      icon: "p-2 aspect-square",
    };

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (enableSound && !disabled && !isLoading) {
        soundFX.playClick(variant === "ai" ? 950 : 800);
      }
      if (onClick) {
        onClick(e);
      }
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        onClick={handleClick}
        className={twMerge(clsx(baseStyles, variantStyles[variant], sizeStyles[size], className))}
        {...props}
      >
        {isLoading ? (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
