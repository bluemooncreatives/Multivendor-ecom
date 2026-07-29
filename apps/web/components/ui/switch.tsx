"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  className?: string;
}

// Built on a native checkbox rather than @radix-ui/react-switch: the settings
// screens need dozens of these, and the checkbox already gives us the correct
// role, keyboard behaviour and form semantics for free.
export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ checked, onCheckedChange, disabled, id, className }, ref) => (
    <label
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors",
        checked ? "bg-primary" : "bg-input",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      <input
        ref={ref}
        id={id}
        type="checkbox"
        role="switch"
        className="peer sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onCheckedChange(e.target.checked)}
      />
      <span
        aria-hidden
        className={cn(
          "pointer-events-none ms-0.5 block h-5 w-5 rounded-full bg-background shadow transition-transform peer-focus-visible:ring-2 peer-focus-visible:ring-ring",
          checked && "translate-x-5 rtl:-translate-x-5",
        )}
      />
    </label>
  ),
);
Switch.displayName = "Switch";
