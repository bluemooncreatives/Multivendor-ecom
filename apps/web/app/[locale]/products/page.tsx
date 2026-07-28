"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useProducts, useCategories, useBrands } from "@/lib/hooks/useProducts";
import { ProductCard } from "@/components/storefront/product-card";
import { ProductFilters } from "@/components/storefront/product-filters";
import type { ProductSearchParams } from "@/lib/hooks/useProducts";

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? undefined;

  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [brandId, setBrandId] = useState<string | undefined>(searchParams.get("brandId") ?? undefined);
  const [minPrice, setMinPrice] = useState<number | undefined>(undefined);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
  const [sort, setSort] = useState<ProductSearchParams["sort"]>("newest");

  const { data: categories } = useCategories();
  const { data: brands } = useBrands();
  const { data, isLoading } = useProducts({ q, categoryId, brandId, minPrice, maxPrice, sort });

  return (
    <div className="container space-y-6 py-6">
      <h1 className="text-2xl font-bold">{q ? `Results for "${q}"` : "All products"}</h1>

      <div className="grid gap-6 xl:grid-cols-[260px_1fr]">
        <ProductFilters
          categories={categories ?? []}
          categoryId={categoryId}
          onCategoryChange={setCategoryId}
          brands={brands ?? []}
          brandId={brandId}
          onBrandChange={setBrandId}
          minPrice={minPrice}
          maxPrice={maxPrice}
          onPriceChange={(min, max) => {
            setMinPrice(min);
            setMaxPrice(max);
          }}
        />

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 rounded-lg bg-card p-3 shadow-sm">
            <span className="text-sm text-muted-foreground">
              {data ? `${data.total} products found` : ""}
            </span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as ProductSearchParams["sort"])}
              className="rounded-md border bg-background px-3 py-1.5 text-sm"
            >
              <option value="newest">Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>

          <div className="rounded-lg bg-card p-4 shadow-sm">
            {isLoading ? (
              <p className="text-muted-foreground">Loading…</p>
            ) : data && data.items.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {data.items.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No products found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
