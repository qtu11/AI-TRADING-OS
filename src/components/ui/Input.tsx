"use client";

import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, leftIcon, rightElement, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="block text-xs font-semibold text-txt-secondary">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 text-txt-muted pointer-events-none flex items-center">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={twMerge(
              clsx(
                "w-full bg-bg-surface dark:bg-bg-surface light:bg-white border border-border rounded-xl px-3.5 py-2.5 text-sm text-txt-primary placeholder:text-txt-muted transition-all duration-200 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:opacity-50 disabled:bg-bg-subtle",
                leftIcon && "pl-9",
                rightElement && "pr-12",
                error && "border-loss focus:border-loss focus:ring-loss",
                className
              )
            )}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-3 text-txt-muted flex items-center text-xs">
              {rightElement}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-loss">{error}</p>}
        {helperText && !error && <p className="text-xs text-txt-muted">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
