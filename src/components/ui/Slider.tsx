import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  label?: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (val: number) => void;
  showValue?: boolean;
  valueSuffix?: string;
}

export const Slider: React.FC<SliderProps> = ({
  label,
  value,
  min = 1,
  max = 10,
  step = 1,
  onChange,
  showValue = true,
  valueSuffix = "",
  className,
  ...props
}) => {
  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between">
        {label && <label className="text-xs font-medium text-slate-300">{label}</label>}
        {showValue && (
          <span className="text-xs font-mono font-bold text-sky-400 bg-[#18222D] px-2 py-0.5 rounded border border-border">
            {value}
            {valueSuffix}
          </span>
        )}
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={twMerge(
          clsx(
            "w-full h-2 bg-[#18222D] rounded-lg appearance-none cursor-pointer accent-brand-500 focus:outline-none",
            className
          )
        )}
        {...props}
      />
      <div className="flex justify-between text-[10px] text-slate-500 font-mono px-0.5">
        <span>{min}{valueSuffix}</span>
        <span>{max}{valueSuffix}</span>
      </div>
    </div>
  );
};
