"use client";

import { useSearchParams } from "next/navigation";
import { useProducts } from "@/lib/hooks/useProducts";
import { ProductCard } from "@/components/storefront/product-card";

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? undefined;
  const { data, isLoading } = useProducts({ q, sort: "newest" });

  return (
    <div className="container space-y-6 py-10">
      <h1 className="text-2xl font-bold">{q ? `Results for "${q}"` : "All products"}</h1>
      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : data && data.items.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {data.items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">No products found.</p>
      )}
    </div>
  );
}
