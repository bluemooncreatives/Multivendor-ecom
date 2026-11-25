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
export function PriceDisplay({
  price,
  listPrice,
  currency,
  size = "md",
  className,
}: PriceDisplayProps) {
  const { display } = useDisplayCurrency();
  const hasDiscount = listPrice !== undefined && listPrice > price;
  const savingsPercent = hasDiscount ? Math.round(100 - (price / listPrice) * 100) : 0;

  const sizeClasses = {
    sm: { current: "text-sm font-black tabular-nums", list: "text-xs tabular-nums" },
    md: { current: "text-base font-black tabular-nums", list: "text-xs tabular-nums" },
    lg: {
      current: "text-3xl font-black tracking-tight text-primary tabular-nums",
      list: "text-base tabular-nums",
    },
  }[size];

  return (
    <div className={cn("flex flex-wrap items-baseline gap-2", className)}>
      <span className={sizeClasses.current}>{display(price, currency)}</span>
      {hasDiscount && (
        <>
          <span className={cn("text-muted-foreground line-through", sizeClasses.list)}>
            {display(listPrice, currency)}
          </span>
          {size === "lg" && savingsPercent > 0 && (
            <span className="rounded-lg bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
              Save {savingsPercent}%
            </span>
          )}
        </>
      )}
    </div>
  );
}
