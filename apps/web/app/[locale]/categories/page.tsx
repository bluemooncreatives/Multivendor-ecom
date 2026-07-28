"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useCategories } from "@/lib/hooks/useProducts";

export default function AllCategoriesPage() {
  const locale = useLocale();
  const { data: categories, isLoading } = useCategories();
  const topCategories = (categories ?? []).filter((c) => c.level === 0);

  return (
    <div className="container space-y-6 py-6">
      <h1 className="text-2xl font-bold">All Categories</h1>
      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {topCategories.map((category) => (
            <Link
              key={category.id}
              href={`/${locale}/category/${category.slug}`}
              className="flex flex-col items-center gap-3 rounded-lg bg-card p-4 text-center shadow-sm hover:shadow-md"
            >
              <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-secondary">
                {category.iconUrl ? (
                  <Image src={category.iconUrl} alt={category.name} fill className="object-cover" sizes="64px" />
                ) : (
                  <span className="text-xl font-semibold text-muted-foreground">{category.name.charAt(0)}</span>
                )}
              </div>
              <span className="text-sm font-medium">{category.name}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
