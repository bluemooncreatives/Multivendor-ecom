"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import type { Brand, Category, Paginated, Product } from "@ecommercemultivendor/types";
import type { ProductSearchParams } from "@/lib/hooks/useProducts";
import { ProductFilters } from "@/components/storefront/product-filters";
import { ProductGrid } from "@/components/storefront/product-grid";
import { PageHeader } from "@/components/shared/page-header";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NativeSelect } from "@/components/ui/native-select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

interface CatalogListingViewProps {
  title: string;
  description?: string;
  categories: Category[];
  brands: Brand[];
  categoryId?: string;
  onCategoryChange: (id?: string) => void;
  brandId?: string;
  onBrandChange: (id?: string) => void;
  minPrice?: number;
  maxPrice?: number;
  onPriceChange: (min?: number, max?: number) => void;
  sort: NonNullable<ProductSearchParams["sort"]>;
  onSortChange: (sort: NonNullable<ProductSearchParams["sort"]>) => void;
  page: number;
  onPageChange: (page: number) => void;
  onClearFilters: () => void;
  data?: Paginated<Product>;
  isLoading: boolean;
  emptyTitle?: string;
}

/** Shared catalog shell for `/products` and `/category/[slug]` with responsive mobile filter drawer. */
export function CatalogListingView({
  title,
  description,
  categories,
  brands,
  categoryId,
  onCategoryChange,
  brandId,
  onBrandChange,
  minPrice,
  maxPrice,
  onPriceChange,
  sort,
  onSortChange,
  page,
  onPageChange,
  onClearFilters,
  data,
  isLoading,
  emptyTitle = "No products found",
}: CatalogListingViewProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);

  const activeCount = [
    categoryId,
    brandId,
    minPrice !== undefined || maxPrice !== undefined,
  ].filter(Boolean).length;

  const filterNode = (
    <ProductFilters
      categories={categories}
      categoryId={categoryId}
      onCategoryChange={(id) => {
        onCategoryChange(id);
        setFiltersOpen(false);
      }}
      brands={brands}
      brandId={brandId}
      onBrandChange={(id) => {
        onBrandChange(id);
        setFiltersOpen(false);
      }}
      minPrice={minPrice}
      maxPrice={maxPrice}
      onPriceChange={onPriceChange}
      onClear={onClearFilters}
    />
  );

  return (
    <div className="container space-y-6 py-6 lg:py-8">
      <PageHeader
        title={title}
        description={description}
        badge={
          data ? (
            <Badge variant="secondary" className="rounded-full px-3 py-0.5 text-xs font-semibold">
              {data.total} {data.total === 1 ? "item" : "items"}
            </Badge>
          ) : undefined
        }
      />

      <div className="grid gap-6 xl:grid-cols-[272px_1fr]">
        <div className="hidden xl:block">{filterNode}</div>

        <div className="min-w-0 space-y-5">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-full border bg-card px-4 py-2.5 shadow-xs">
            <div className="flex items-center gap-3">
              <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5 rounded-xl xl:hidden">
                    <SlidersHorizontal className="h-4 w-4" />
                    Filters
                    {activeCount > 0 && (
                      <Badge className="ml-0.5 rounded-full px-1.5 py-0 text-[10px]">
                        {activeCount}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 overflow-y-auto p-5">
                  <SheetHeader className="pb-4">
                    <SheetTitle>Filter products</SheetTitle>
                  </SheetHeader>
                  {filterNode}
                </SheetContent>
              </Sheet>

              <span className="text-sm font-medium text-muted-foreground">
                {data
                  ? `Showing ${data.items.length} of ${data.total} product${data.total === 1 ? "" : "s"}`
                  : "Browse catalog"}
              </span>
            </div>

            <div className="w-48">
              <NativeSelect
                aria-label="Sort products"
                value={sort}
                onChange={(e) =>
                  onSortChange(e.target.value as NonNullable<ProductSearchParams["sort"]>)
                }
                className="h-9 rounded-full"
              >
                <option value="newest">Newest</option>
                <option value="popular">Best Selling</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </NativeSelect>
            </div>
          </div>

          <ProductGrid
            products={data?.items}
            isLoading={isLoading}
            emptyTitle={emptyTitle}
            emptyAction={
              <Button variant="outline" size="sm" className="rounded-xl" onClick={onClearFilters}>
                Reset filters
              </Button>
            }
          />

          {data && data.total > data.pageSize && (
            <PaginationBar
              page={data.page}
              pageSize={data.pageSize}
              total={data.total}
              onPageChange={onPageChange}
              itemLabel="products"
            />
          )}
        </div>
      </div>
    </div>
  );
}
