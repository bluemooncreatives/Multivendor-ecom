"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PaginationBarProps {
  page: number;
  pageSize?: number;
  total?: number;
  hasNext?: boolean;
  onPageChange: (page: number) => void;
  itemLabel?: string;
  className?: string;
}

/** Unified pagination control across catalog and admin tables. */
export function PaginationBar({
  page,
  pageSize,
  total,
  hasNext,
  onPageChange,
  itemLabel = "items",
  className,
}: PaginationBarProps) {
  const totalPages =
    pageSize && total !== undefined ? Math.max(1, Math.ceil(total / pageSize)) : undefined;
  const canPrev = page > 1;
  const canNext = hasNext ?? (totalPages !== undefined ? page < totalPages : false);

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card px-4 py-3 shadow-xs",
        className,
      )}
    >
      <p className="text-sm text-muted-foreground">
        Page <span className="font-bold text-foreground">{page}</span>
        {totalPages !== undefined && (
          <>
            {" "}
            of <span className="font-bold text-foreground">{totalPages}</span>
          </>
        )}
        {total !== undefined && (
          <>
            {" "}
            · <span className="font-medium">{total}</span> {itemLabel}
          </>
        )}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl"
          disabled={!canPrev}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl"
          disabled={!canNext}
          onClick={() => onPageChange(page + 1)}
        >
          Next
          <ChevronRight className="h-4 w-4 rtl:rotate-180" />
        </Button>
      </div>
    </div>
  );
}
