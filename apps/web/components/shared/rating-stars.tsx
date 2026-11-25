"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingStarsProps {
  value: number;
  count?: number;
  onChange?: (rating: number) => void;
  size?: "sm" | "md";
  className?: string;
}

/** Interactive or read-only 5-star rating indicator. */
export function RatingStars({ value, count, onChange, size = "sm", className }: RatingStarsProps) {
  const iconClass = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  return (
    <div className={cn("inline-flex items-center gap-1", className)}>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            disabled={!onChange}
            onClick={() => onChange?.(n)}
            aria-label={onChange ? `Rate ${n} stars` : undefined}
            className={onChange ? "cursor-pointer transition-transform hover:scale-110" : "cursor-default"}
          >
            <Star
              className={cn(
                iconClass,
                n <= Math.round(value) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/35",
              )}
            />
          </button>
        ))}
      </div>
      {count !== undefined && <span className="text-xs text-muted-foreground">({count})</span>}
    </div>
  );
}
