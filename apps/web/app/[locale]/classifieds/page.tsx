"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLocale } from "next-intl";
import { MapPin, Tag } from "lucide-react";
import { useClassifieds, type ClassifiedFilters } from "@/lib/hooks/useStorefront";
import { useCategories } from "@/lib/hooks/useProducts";
import { useDisplayCurrency } from "@/lib/hooks/useDisplayCurrency";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { NativeSelect } from "@/components/ui/native-select";
import { PageHeader } from "@/components/shared/page-header";
import { FormField } from "@/components/shared/form-field";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { ProductGridSkeleton } from "@/components/shared/loading-state";
import { EmptyState } from "@/components/shared/empty-state";

export default function ClassifiedsPage() {
  const locale = useLocale();
  const [filters, setFilters] = useState<ClassifiedFilters>({ page: 1 });
  const { data, isLoading } = useClassifieds(filters);
  const { data: categories } = useCategories();
  const { display } = useDisplayCurrency();

  const patch = (next: Partial<ClassifiedFilters>) => setFilters({ ...filters, ...next, page: 1 });

  return (
    <div className="container space-y-6 py-6 lg:py-8">
      <PageHeader title="Classifieds" description="Items listed directly by other customers." />

      <Card>
        <CardContent className="grid gap-4 p-4 sm:grid-cols-3 md:p-5">
          <FormField label="Search" htmlFor="q">
            <Input
              id="q"
              placeholder="What are you looking for?"
              value={filters.q ?? ""}
              onChange={(e) => patch({ q: e.target.value })}
            />
          </FormField>
          <FormField label="Category" htmlFor="category">
            <NativeSelect
              id="category"
              value={filters.categoryId ?? ""}
              onChange={(e) => patch({ categoryId: e.target.value || undefined })}
            >
              <option value="">All categories</option>
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </NativeSelect>
          </FormField>
          <FormField label="City" htmlFor="location">
            <Input
              id="location"
              placeholder="Any city"
              value={filters.location ?? ""}
              onChange={(e) => patch({ location: e.target.value })}
            />
          </FormField>
          <FormField label="Condition" htmlFor="condition">
            <NativeSelect
              id="condition"
              value={filters.condition ?? ""}
              onChange={(e) => patch({ condition: (e.target.value || undefined) as ClassifiedFilters["condition"] })}
            >
              <option value="">New and used</option>
              <option value="new">New only</option>
              <option value="used">Used only</option>
            </NativeSelect>
          </FormField>
          <FormField label="Price range" htmlFor="price-range">
            <div className="flex items-center gap-2">
              <Input
                id="price-range"
                type="number"
                min={0}
                placeholder="Min"
                value={filters.minPrice ?? ""}
                onChange={(e) => patch({ minPrice: e.target.value ? Number(e.target.value) : undefined })}
              />
              <Input
                type="number"
                min={0}
                placeholder="Max"
                aria-label="Maximum price"
                value={filters.maxPrice ?? ""}
                onChange={(e) => patch({ maxPrice: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>
          </FormField>
          <FormField label="Sort by" htmlFor="sort">
            <NativeSelect
              id="sort"
              value={filters.sort ?? "newest"}
              onChange={(e) => patch({ sort: e.target.value as ClassifiedFilters["sort"] })}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="price_asc">Price: low to high</option>
              <option value="price_desc">Price: high to low</option>
            </NativeSelect>
          </FormField>
        </CardContent>
      </Card>

      {isLoading ? (
        <ProductGridSkeleton count={8} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState icon={Tag} title="No listings match those filters" description="Try widening your price or location filter." />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {data.items.map((item) => (
              <Card key={item.id} className="group overflow-hidden transition-all hover:border-primary/40 hover:shadow-md">
                <Link href={`/${locale}/classifieds/${item.slug}`}>
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    {item.images?.[0] && (
                      <Image
                        src={item.images[0]}
                        alt={item.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    )}
                    <Badge variant="secondary" className="absolute start-2 top-2 capitalize">
                      {item.condition}
                    </Badge>
                  </div>
                  <CardContent className="space-y-1.5 p-3.5">
                    <p className="line-clamp-2 text-sm font-medium group-hover:text-primary">{item.title}</p>
                    <p className="font-bold text-primary">{display(item.price, item.currency)}</p>
                    {item.location && (
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {item.location}
                      </p>
                    )}
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>

          <PaginationBar
            page={data.page}
            pageSize={data.pageSize}
            total={data.total}
            onPageChange={(nextPage) => setFilters({ ...filters, page: nextPage })}
            itemLabel="listings"
          />
        </>
      )}
    </div>
  );
}
