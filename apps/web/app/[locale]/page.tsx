"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useProducts, useCategories } from "@/lib/hooks/useProducts";
import { ProductCard } from "@/components/storefront/product-card";

export default function HomePage() {
  const t = useTranslations("home");
  const locale = useLocale();
  const { data: products, isLoading } = useProducts({ sort: "newest" });
  const { data: categories } = useCategories();

  return (
    <div className="container space-y-12 py-10">
      <section className="rounded-lg bg-secondary p-10 text-center">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      </section>

      {categories && categories.filter((c) => c.level === 0).length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-semibold">{t("categories")}</h2>
          <div className="flex flex-wrap gap-3">
            {categories
              .filter((c) => c.level === 0)
              .map((category) => (
                <Link
                  key={category.id}
                  href={`/${locale}/category/${category.slug}`}
                  className="rounded-full border px-4 py-2 text-sm hover:bg-accent"
                >
                  {category.name}
                </Link>
              ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-4 text-xl font-semibold">{t("featured")}</h2>
        {isLoading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {products?.items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
