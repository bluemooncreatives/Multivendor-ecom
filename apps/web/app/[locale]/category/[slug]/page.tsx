"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useCategories, useBrands, useProducts } from "@/lib/hooks/useProducts";
import { ProductCard } from "@/components/storefront/product-card";
import { ProductFilters } from "@/components/storefront/product-filters";
import type { ProductSearchParams } from "@/lib/hooks/useProducts";

export default function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const locale = useLocale();
  const { data: categories } = useCategories();
  const { data: brands } = useBrands();
  const category = categories?.find((c) => c.slug === slug);

  const [brandId, setBrandId] = useState<string | undefined>(undefined);
  const [minPrice, setMinPrice] = useState<number | undefined>(undefined);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
  const [sort, setSort] = useState<ProductSearchParams["sort"]>("newest");

  const { data, isLoading } = useProducts({ categoryId: category?.id, brandId, minPrice, maxPrice, sort });

  return (
    <div className="container space-y-6 py-6">
      <h1 className="text-2xl font-bold">{category?.name ?? "Category"}</h1>

      <div className="grid gap-6 xl:grid-cols-[260px_1fr]">
        <ProductFilters
          categories={categories ?? []}
          categoryId={category?.id}
          onCategoryChange={(id) => {
            const next = categories?.find((c) => c.id === id);
            router.push(next ? `/${locale}/category/${next.slug}` : `/${locale}/products`);
          }}
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
              <p className="text-muted-foreground">No products in this category yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
