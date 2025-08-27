import * as React from "react";
import { cn } from "./utils";

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export function Label({ className, required, children, ...props }: LabelProps) {
  return (
    <label
      className={cn(
        "mb-1 block text-sm font-medium text-gray-700",
        className
      )}
      {...props}
    >
      {children}
      {required ? <span className="ml-0.5 text-rose-600">*</span> : null}
    </label>
  );
}
