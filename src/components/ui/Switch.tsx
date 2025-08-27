"use client";

import * as React from "react";
import { cn } from "./utils";

export interface SwitchProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  size?: "sm" | "md";
}

export function Switch({
  checked = false,
  onCheckedChange,
  className,
  size = "md",
  disabled,
  ...props
}: SwitchProps) {
  const dims = size === "sm"
    ? { track: "h-5 w-9", thumb: "h-4 w-4 translate-x-0.5", thumbOn: "translate-x-4.5" }
    : { track: "h-6 w-11", thumb: "h-5 w-5 translate-x-0.5", thumbOn: "translate-x-5.5" };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-disabled={disabled}
      disabled={disabled}
      onClick={() => !disabled && onCheckedChange?.(!checked)}
      className={cn(
        "relative inline-flex items-center rounded-full border transition",
        dims.track,
        checked ? "bg-indigo-600 border-indigo-600" : "bg-gray-300 border-gray-300",
        "shadow-inner outline-none",
        "focus-visible:ring-2 focus-visible:ring-indigo-500/40",
        "disabled:opacity-60 disabled:cursor-not-allowed",
        className
      )}
      {...props}
    >
      <span
        className={cn(
          "pointer-events-none absolute left-0.5 top-1/2 -translate-y-1/2 rounded-full bg-white shadow",
          "transition-transform",
          dims.thumb,
          checked && dims.thumbOn
        )}
      />
    </button>
  );
}
