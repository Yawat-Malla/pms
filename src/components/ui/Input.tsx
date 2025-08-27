import * as React from "react";
import { cn } from "./utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'error';
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          "h-9 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm",
          "shadow-sm outline-none transition",
          "placeholder:text-gray-400",
          "focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30",
          "disabled:cursor-not-allowed disabled:opacity-60",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
