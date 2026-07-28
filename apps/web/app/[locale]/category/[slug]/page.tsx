"use client";

import { use } from "react";
import { useCategories, useProducts } from "@/lib/hooks/useProducts";
import { ProductCard } from "@/components/storefront/product-card";

export default function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { data: categories } = useCategories();
  const category = categories?.find((c) => c.slug === slug);
  const { data, isLoading } = useProducts({ categoryId: category?.id });

  return (
    <div className="container space-y-6 py-10">
      <h1 className="text-2xl font-bold">{category?.name ?? "Category"}</h1>
      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : data && data.items.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {data.items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">No products in this category yet.</p>
      )}
    </div>
  );
}
