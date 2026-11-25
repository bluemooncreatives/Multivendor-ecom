"use client";

import { useLocale } from "next-intl";
import { Tag } from "lucide-react";
import { useBrands } from "@/lib/hooks/useProducts";
import { PageHeader } from "@/components/shared/page-header";
import { CategoryCard } from "@/components/storefront/category-card";
import { CardGridSkeleton } from "@/components/shared/loading-state";
import { EmptyState } from "@/components/shared/empty-state";

export default function AllBrandsPage() {
  const locale = useLocale();
  const { data: brands, isLoading } = useBrands();

  return (
    <div className="container space-y-6 py-6 lg:py-8">
      <PageHeader title="All Brands" description="Discover products from your favorite brands." />

      {isLoading ? (
        <CardGridSkeleton count={12} columns="grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6" />
      ) : !brands || brands.length === 0 ? (
        <EmptyState icon={Tag} title="No brands available yet" description="Brands will appear here once published." />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {brands.map((brand) => (
            <CategoryCard
              key={brand.id}
              href={`/${locale}/products?brandId=${brand.id}`}
              name={brand.name}
              imageUrl={brand.logoUrl}
            />
          ))}
        </div>
      )}
    </div>
  );
}
