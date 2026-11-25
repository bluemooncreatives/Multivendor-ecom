"use client";

import { useDisplayCurrency } from "@/lib/hooks/useDisplayCurrency";
import { cn } from "@/lib/utils";

interface PriceDisplayProps {
  price: number;
  listPrice?: number;
  currency?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/** Renders active price alongside an optional struck-through comparison price. */
export function PriceDisplay({ price, listPrice, currency, size = "md", className }: PriceDisplayProps) {
  const { display } = useDisplayCurrency();
  const hasDiscount = listPrice !== undefined && listPrice > price;

  const sizeClasses = {
    sm: { current: "text-sm font-bold", list: "text-xs" },
    md: { current: "text-base font-bold", list: "text-xs" },
    lg: { current: "text-2xl font-bold text-primary", list: "text-base" },
  }[size];

  return (
    <div className={cn("flex flex-wrap items-baseline gap-2", className)}>
      <span className={sizeClasses.current}>{display(price, currency)}</span>
      {hasDiscount && (
        <span className={cn("text-muted-foreground line-through", sizeClasses.list)}>
          {display(listPrice, currency)}
        </span>
      )}
    </div>
  );
}
