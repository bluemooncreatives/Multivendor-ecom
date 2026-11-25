"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useCategories, useBrands, useProducts, type ProductSearchParams } from "@/lib/hooks/useProducts";
import { CatalogListingView } from "@/components/storefront/catalog-listing-view";

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
  const [sort, setSort] = useState<NonNullable<ProductSearchParams["sort"]>>("newest");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useProducts({ categoryId: category?.id, brandId, minPrice, maxPrice, sort, page });

  return (
    <CatalogListingView
      title={category?.name ?? "Category"}
      description="Filter and compare products in this category."
      categories={categories ?? []}
      brands={brands ?? []}
      categoryId={category?.id}
      onCategoryChange={(id) => {
        const next = categories?.find((c) => c.id === id);
        router.push(next ? `/${locale}/category/${next.slug}` : `/${locale}/products`);
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
        setBrandId(undefined);
        setMinPrice(undefined);
        setMaxPrice(undefined);
        setPage(1);
      }}
      data={data}
      isLoading={isLoading}
      emptyTitle="No products in this category yet"
    />
  );
}
