import type { ReactNode } from "react";
import { PackageOpen } from "lucide-react";
import type { Product } from "@ecommercemultivendor/types";
import { ProductCard } from "@/components/storefront/product-card";
import { ProductGridSkeleton } from "@/components/shared/loading-state";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";

interface ProductGridProps {
  products?: Product[];
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  columnsClassName?: string;
  skeletonCount?: number;
}

/** Unified product grid with built-in loading skeleton and empty state. */
export function ProductGrid({
  products,
  isLoading,
  emptyTitle = "No products found",
  emptyDescription = "Try adjusting your search or filter criteria.",
  emptyAction,
  columnsClassName = "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
  skeletonCount = 8,
}: ProductGridProps) {
  if (isLoading) {
    return <ProductGridSkeleton count={skeletonCount} />;
  }

  if (!products || products.length === 0) {
    return (
      <EmptyState
        icon={PackageOpen}
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    );
  }

  return (
    <div className={cn("grid gap-4", columnsClassName)}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
