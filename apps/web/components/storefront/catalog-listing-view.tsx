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
import { Card, CardContent } from "@/components/ui/card";
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
      <PageHeader title={title} description={description} />

      <div className="grid gap-6 xl:grid-cols-[260px_1fr]">
        <div className="hidden xl:block">{filterNode}</div>

        <div className="min-w-0 space-y-4">
          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-3.5">
              <div className="flex items-center gap-3">
                <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="xl:hidden">
                      <SlidersHorizontal className="h-4 w-4" />
                      Filters
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-80 overflow-y-auto p-4">
                    <SheetHeader className="pb-4">
                      <SheetTitle>Filter products</SheetTitle>
                    </SheetHeader>
                    {filterNode}
                  </SheetContent>
                </Sheet>

                <span className="text-sm text-muted-foreground">
                  {data ? `${data.total} product${data.total === 1 ? "" : "s"} found` : "Browse catalog"}
                </span>
              </div>

              <div className="w-48">
                <NativeSelect
                  aria-label="Sort products"
                  value={sort}
                  onChange={(e) => onSortChange(e.target.value as NonNullable<ProductSearchParams["sort"]>)}
                  className="h-9"
                >
                  <option value="newest">Newest</option>
                  <option value="popular">Best Selling</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="rating">Top Rated</option>
                </NativeSelect>
              </div>
            </CardContent>
          </Card>

          <ProductGrid
            products={data?.items}
            isLoading={isLoading}
            emptyTitle={emptyTitle}
            emptyAction={
              <Button variant="outline" size="sm" onClick={onClearFilters}>
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
