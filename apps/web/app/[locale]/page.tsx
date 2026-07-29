"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Zap } from "lucide-react";
import { useProducts, useCategories } from "@/lib/hooks/useProducts";
import { useActiveFlashDeals } from "@/lib/hooks/useStorefront";
import { ProductCard } from "@/components/storefront/product-card";
import { StorefrontSection } from "@/components/storefront/section";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const t = useTranslations("home");
  const locale = useLocale();
  const { data: products, isLoading } = useProducts({ sort: "newest" });
  const { data: categories } = useCategories();
  const { data: flashDeals } = useActiveFlashDeals();

  const topCategories = (categories ?? []).filter((c) => c.level === 0);

  return (
    <div className="container space-y-6 py-6">
      {/* Hero: category list + promo panel, mirroring the legacy home-banner-area */}
      <section className="grid gap-4 lg:grid-cols-4">
        <div className="hidden rounded-lg bg-card p-4 shadow-sm lg:block">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground">Categories</h3>
          <ul className="space-y-1">
            {topCategories.slice(0, 11).map((category) => (
              <li key={category.id}>
                <Link
                  href={`/${locale}/category/${category.slug}`}
                  className="block rounded px-2 py-1.5 text-sm hover:bg-accent hover:text-primary"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 p-10 text-primary-foreground shadow-sm lg:col-span-3">
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="mt-2 max-w-lg text-primary-foreground/90">{t("subtitle")}</p>
          <Button asChild variant="secondary" className="mt-6 w-fit">
            <Link href={`/${locale}/products`}>Shop Now</Link>
          </Button>
        </div>
      </section>

      {/* Live flash-deal campaigns. Hidden entirely when none are running, so the
          home page never shows an empty promo band. */}
      {(flashDeals ?? []).length > 0 && (
        <section className="space-y-3">
          {flashDeals!.map((deal) => (
            <Link
              key={deal.id}
              href={`/${locale}/flash-deal/${deal.slug}`}
              className="flex items-center justify-between gap-4 rounded-lg bg-gradient-to-r from-destructive to-destructive/80 p-4 text-destructive-foreground shadow-sm transition hover:opacity-95"
            >
              <div className="flex items-center gap-3">
                <Zap className="h-6 w-6" />
                <div>
                  <p className="font-bold">{deal.title}</p>
                  <p className="text-sm opacity-90">
                    {deal.products.length} deal{deal.products.length === 1 ? "" : "s"} · ends{" "}
                    {new Date(deal.endsAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <span className="shrink-0 text-sm font-semibold underline">Shop the deals</span>
            </Link>
          ))}
        </section>
      )}

      {/* Category strip */}
      {topCategories.length > 0 && (
        <StorefrontSection title={t("categories")} href={`/${locale}/categories`}>
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
            {topCategories.map((category) => (
              <Link
                key={category.id}
                href={`/${locale}/category/${category.slug}`}
                className="flex flex-col items-center gap-2 rounded-md p-2 text-center hover:bg-accent"
              >
                <div className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-secondary">
                  {category.iconUrl ? (
                    <Image src={category.iconUrl} alt={category.name} fill className="object-cover" sizes="56px" />
                  ) : (
                    <span className="text-lg font-semibold text-muted-foreground">{category.name.charAt(0)}</span>
                  )}
                </div>
                <span className="line-clamp-1 text-xs font-medium">{category.name}</span>
              </Link>
            ))}
          </div>
        </StorefrontSection>
      )}

      {/* Featured products */}
      <StorefrontSection title={t("featured")} href={`/${locale}/products`}>
        {isLoading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {products?.items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </StorefrontSection>
    </div>
  );
}
