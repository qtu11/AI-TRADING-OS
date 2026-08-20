"use client";

import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="block text-xs font-semibold text-txt-secondary">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={twMerge(
            clsx(
              "w-full bg-bg-surface dark:bg-bg-surface light:bg-white border border-border rounded-xl px-3.5 py-2.5 text-sm text-txt-primary transition-all duration-200 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:opacity-50",
              error && "border-loss focus:border-loss focus:ring-loss",
              className
            )
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-bg-surface text-txt-primary">
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-loss">{error}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";
