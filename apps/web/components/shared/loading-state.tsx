import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Product grid loading skeleton — matches ProductCard layout */
export function ProductGridSkeleton({ count = 8, columnsClassName = "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" }: { count?: number; columnsClassName?: string }) {
  return (
    <div className={cn("grid gap-4", columnsClassName)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col">
          <Skeleton className="aspect-[4/5] w-full rounded-2xl" />
          <div className="space-y-2.5 pt-3.5">
            <Skeleton className="h-4 w-3/4 rounded-lg" />
            <Skeleton className="h-3.5 w-1/2 rounded-lg" />
            <div className="mt-3 flex items-center justify-between">
              <Skeleton className="h-8 w-20 rounded-full" />
              <div className="flex gap-1.5">
                <Skeleton className="h-9 w-9 rounded-full" />
                <Skeleton className="h-9 w-9 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Generic card-grid skeleton */
export function CardGridSkeleton({
  count = 4,
  columns = "sm:grid-cols-2",
}: {
  count?: number;
  columns?: string;
}) {
  return (
    <div className={cn("grid gap-4", columns)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-3 rounded-2xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-1/3 rounded-lg" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-9 w-2/3 rounded-lg" />
          <Skeleton className="h-3.5 w-24 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

/** Table/list skeleton */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <Skeleton className="h-12 w-full rounded-none" />
      <div className="divide-y">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-none" />
        ))}
      </div>
    </div>
  );
}

/** PDP loading skeleton */
export function DetailPageSkeleton() {
  return (
    <div className="container space-y-6 py-6">
      <Skeleton className="h-5 w-72 rounded-lg" />
      <div className="grid gap-8 rounded-2xl border bg-card p-6 md:grid-cols-2">
        <div className="space-y-3">
          <Skeleton className="aspect-square w-full rounded-xl" />
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 w-16 rounded-xl" />
            ))}
          </div>
        </div>
        <div className="space-y-5">
          <Skeleton className="h-6 w-40 rounded-full" />
          <Skeleton className="h-9 w-5/6 rounded-xl" />
          <Skeleton className="h-9 w-5/6 rounded-xl" />
          <Skeleton className="h-5 w-24 rounded-lg" />
          <Skeleton className="h-12 w-40 rounded-xl" />
          <div className="flex gap-2">
            <Skeleton className="h-11 w-11 rounded-xl" />
            <Skeleton className="h-11 w-11 rounded-xl" />
            <Skeleton className="h-11 flex-1 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** General page skeleton (used by overview pages) */
export function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48 rounded-xl" />
        <Skeleton className="h-4 w-72 rounded-lg" />
      </div>
      <CardGridSkeleton count={4} columns="grid-cols-2 sm:grid-cols-4" />
      <TableSkeleton rows={5} />
    </div>
  );
}

/** Inline spinner */
export function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary",
        className,
      )}
    />
  );
}
