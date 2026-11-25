"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useProducts, useCategories, useBrands, type ProductSearchParams } from "@/lib/hooks/useProducts";
import { CatalogListingView } from "@/components/storefront/catalog-listing-view";

const ALLOWED_SORTS = ["newest", "popular", "price_asc", "price_desc", "rating"] as const;

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? undefined;

  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [brandId, setBrandId] = useState<string | undefined>(searchParams.get("brandId") ?? undefined);
  const [minPrice, setMinPrice] = useState<number | undefined>(undefined);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
  const [page, setPage] = useState(1);

  const sortParam = searchParams.get("sort");
  const [sort, setSort] = useState<NonNullable<ProductSearchParams["sort"]>>(
    ALLOWED_SORTS.includes(sortParam as (typeof ALLOWED_SORTS)[number])
      ? (sortParam as NonNullable<ProductSearchParams["sort"]>)
      : "newest",
  );
  const featured = searchParams.get("featured") === "true" ? true : undefined;
  const todaysDeal = searchParams.get("todaysDeal") === "true" ? true : undefined;

  const { data: categories } = useCategories();
  const { data: brands } = useBrands();
  const { data, isLoading } = useProducts({ q, categoryId, brandId, minPrice, maxPrice, sort, featured, todaysDeal, page });

  return (
    <CatalogListingView
      title={q ? `Results for "${q}"` : featured ? "Featured products" : todaysDeal ? "Today's deals" : "All products"}
      description="Explore verified products from marketplace sellers."
      categories={categories ?? []}
      brands={brands ?? []}
      categoryId={categoryId}
      onCategoryChange={(id) => {
        setCategoryId(id);
        setPage(1);
      }}
      brandId={brandId}
      onBrandChange={(id) => {
        setBrandId(id);
        setPage(1);
      }}
      minPrice={minPrice}
      maxPrice={maxPrice}
      onPriceChange={(min, max) => {
        setMinPrice(min);
        setMaxPrice(max);
        setPage(1);
      }}
      sort={sort}
      onSortChange={(next) => {
        setSort(next);
        setPage(1);
      }}
      page={page}
      onPageChange={setPage}
      onClearFilters={() => {
        setCategoryId(undefined);
        setBrandId(undefined);
        setMinPrice(undefined);
        setMaxPrice(undefined);
        setPage(1);
      }}
      data={data}
      isLoading={isLoading}
    />
  );
}
