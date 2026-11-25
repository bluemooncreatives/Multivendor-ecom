"use client";

import { useLocale } from "next-intl";
import { FolderTree } from "lucide-react";
import { useCategories } from "@/lib/hooks/useProducts";
import { PageHeader } from "@/components/shared/page-header";
import { CategoryCard } from "@/components/storefront/category-card";
import { CardGridSkeleton } from "@/components/shared/loading-state";
import { EmptyState } from "@/components/shared/empty-state";

export default function AllCategoriesPage() {
  const locale = useLocale();
  const { data: categories, isLoading } = useCategories();
  const topCategories = (categories ?? []).filter((c) => c.level === 0);

  return (
    <div className="container space-y-6 py-6 lg:py-8">
      <PageHeader title="All Categories" description="Browse marketplace collections by category." />

      {isLoading ? (
        <CardGridSkeleton count={12} columns="grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6" />
      ) : topCategories.length === 0 ? (
        <EmptyState icon={FolderTree} title="No categories available" description="Categories will appear here once added." />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {topCategories.map((category) => (
            <CategoryCard
              key={category.id}
              href={`/${locale}/category/${category.slug}`}
              name={category.name}
              imageUrl={category.iconUrl}
            />
          ))}
        </div>
      )}
    </div>
  );
}
