"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, ChevronRight, Flame, Sparkles, TrendingUp, Clock, Grid2X2 } from "lucide-react";
import { useProducts, useCategories } from "@/lib/hooks/useProducts";
import { useActiveFlashDeals } from "@/lib/hooks/useStorefront";
import { ProductGrid } from "@/components/storefront/product-grid";
import { StorefrontSection } from "@/components/storefront/section";
import { CategoryCard } from "@/components/storefront/category-card";
import { FlashDealBanner } from "@/components/storefront/flash-deal-banner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  const t = useTranslations("home");
  const locale = useLocale();
  const { data: products, isLoading } = useProducts({ sort: "newest" });
  const { data: featured } = useProducts({ featured: true });
  const { data: bestSelling } = useProducts({ sort: "popular" });
  const { data: todaysDeals } = useProducts({ todaysDeal: true });
  const { data: categories } = useCategories();
  const { data: flashDeals } = useActiveFlashDeals();

  const topCategories = (categories ?? []).filter((c) => c.level === 0);

  return (
    <div className="container space-y-8 py-6 lg:py-8">
      {/* Hero: category sidebar + promo banner */}
      <section className="grid gap-5 lg:grid-cols-4">
        <Card className="hidden overflow-hidden lg:flex lg:flex-col">
          <CardHeader className="border-b bg-muted/30 px-4 py-3">
            <CardTitle className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <Grid2X2 className="h-3.5 w-3.5 text-primary" />
              Categories
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-2">
            <ul className="space-y-0.5">
              {topCategories.slice(0, 10).map((category) => (
                <li key={category.id}>
                  <Link
                    href={`/${locale}/category/${category.slug}`}
                    className="flex items-center justify-between rounded-md px-2.5 py-2 text-sm text-foreground/90 transition-colors hover:bg-accent hover:text-primary"
                  >
                    <span className="truncate">{category.name}</span>
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground rtl:rotate-180" />
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <div className="relative flex flex-col justify-center overflow-hidden rounded-xl bg-gradient-to-br from-primary via-primary/90 to-orange-600 p-8 text-primary-foreground shadow-md sm:p-12 lg:col-span-3">
          <div className="pointer-events-none absolute -end-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-20 end-20 h-48 w-48 rounded-full bg-black/10 blur-2xl" />
          <div className="relative max-w-xl space-y-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              Curated Multivendor Marketplace
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{t("title")}</h1>
            <p className="text-sm text-primary-foreground/90 sm:text-base">{t("subtitle")}</p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button asChild size="lg" variant="secondary" className="font-semibold shadow-sm">
                <Link href={`/${locale}/products`}>
                  Shop Now
                  <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white">
                <Link href={`/${locale}/categories`}>Browse Categories</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Live flash-deal campaigns */}
      {(flashDeals ?? []).length > 0 && (
        <section className="space-y-3">
          {flashDeals!.map((deal) => (
            <FlashDealBanner key={deal.id} deal={deal} locale={locale} />
          ))}
        </section>
      )}

      {/* Category strip */}
      {topCategories.length > 0 && (
        <StorefrontSection title={t("categories")} href={`/${locale}/categories`}>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
            {topCategories.map((category) => (
              <CategoryCard
                key={category.id}
                href={`/${locale}/category/${category.slug}`}
                name={category.name}
                imageUrl={category.iconUrl}
                compact
              />
            ))}
          </div>
        </StorefrontSection>
      )}

      {/* Today's deals */}
      {(todaysDeals?.items.length ?? 0) > 0 && (
        <StorefrontSection
          title={t("todaysDeal")}
          href={`/${locale}/products?todaysDeal=true`}
          icon={<Flame className="h-5 w-5 text-primary" />}
        >
          <ProductGrid
            products={todaysDeals!.items}
            columnsClassName="grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
          />
        </StorefrontSection>
      )}

      {/* Featured products */}
      {(featured?.items.length ?? 0) > 0 && (
        <StorefrontSection
          title={t("featured")}
          href={`/${locale}/products?featured=true`}
          icon={<Sparkles className="h-5 w-5 text-primary" />}
        >
          <ProductGrid
            products={featured!.items}
            columnsClassName="grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
          />
        </StorefrontSection>
      )}

      {/* Best selling */}
      {(bestSelling?.items.length ?? 0) > 0 && (
        <StorefrontSection
          title={t("bestSelling")}
          href={`/${locale}/products?sort=popular`}
          icon={<TrendingUp className="h-5 w-5 text-primary" />}
        >
          <ProductGrid
            products={bestSelling!.items}
            columnsClassName="grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
          />
        </StorefrontSection>
      )}

      {/* New arrivals */}
      <StorefrontSection
        title={t("newArrivals")}
        href={`/${locale}/products`}
        icon={<Clock className="h-5 w-5 text-primary" />}
      >
        <ProductGrid
          products={products?.items}
          isLoading={isLoading}
          columnsClassName="grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
          skeletonCount={5}
        />
      </StorefrontSection>
    </div>
  );
}
