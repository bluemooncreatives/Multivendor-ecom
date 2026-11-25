"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowRight,
  ChevronRight,
  Flame,
  Sparkles,
  TrendingUp,
  Clock,
  Grid2X2,
  ShieldCheck,
  Truck,
  RefreshCcw,
  Star,
  Zap,
} from "lucide-react";
import { useProducts, useCategories } from "@/lib/hooks/useProducts";
import { useActiveFlashDeals } from "@/lib/hooks/useStorefront";
import { ProductGrid } from "@/components/storefront/product-grid";
import { StorefrontSection } from "@/components/storefront/section";
import { CategoryCard } from "@/components/storefront/category-card";
import { FlashDealBanner } from "@/components/storefront/flash-deal-banner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const TRUST_BADGES = [
  { icon: Truck, label: "Free Shipping", sub: "Orders over ₹999" },
  { icon: RefreshCcw, label: "Easy Returns", sub: "30-day policy" },
  { icon: ShieldCheck, label: "Secure Pay", sub: "256-bit SSL" },
  { icon: Star, label: "Top Rated", sub: "4.8★ average" },
] as const;

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
    <div className="min-h-screen">
      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-orange-600">
        {/* Background decorations */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-20 left-20 h-60 w-60 rounded-full bg-black/15 blur-3xl" />
          <div className="absolute right-1/3 top-1/2 h-40 w-40 rounded-full bg-orange-400/20 blur-2xl" />
        </div>

        <div className="container relative">
          <div className="grid gap-6 py-14 lg:grid-cols-[260px_1fr] lg:py-20">
            {/* Category sidebar */}
            <div className="hidden overflow-hidden rounded-2xl bg-white/10 backdrop-blur-sm lg:block">
              <div className="border-b border-white/15 px-4 py-3.5">
                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/80">
                  <Grid2X2 className="h-3.5 w-3.5" />
                  All Categories
                </span>
              </div>
              <ul className="p-2">
                {topCategories.slice(0, 12).map((category) => (
                  <li key={category.id}>
                    <Link
                      href={`/${locale}/category/${category.slug}`}
                      className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-white/90 transition-all hover:bg-white/10 hover:text-white"
                    >
                      <span className="truncate">{category.name}</span>
                      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-white/50 rtl:rotate-180" />
                    </Link>
                  </li>
                ))}
                {topCategories.length > 12 && (
                  <li>
                    <Link
                      href={`/${locale}/categories`}
                      className="flex items-center gap-1 rounded-xl px-3 py-2.5 text-xs font-semibold text-white/70 transition-all hover:text-white"
                    >
                      View all categories
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </li>
                )}
              </ul>
            </div>

            {/* Hero content */}
            <div className="flex flex-col justify-center space-y-6">
              <div className="space-y-2">
                <Badge className="inline-flex gap-1.5 rounded-full bg-white/20 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur-sm hover:bg-white/25">
                  <Sparkles className="h-3.5 w-3.5" />
                  Curated Multivendor Marketplace
                </Badge>

                <h1 className="max-w-2xl text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
                  {t("title")}
                </h1>
                <p className="max-w-xl text-base text-white/85 sm:text-lg">
                  {t("subtitle")}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  asChild
                  size="lg"
                  variant="secondary"
                  className="rounded-2xl font-bold shadow-lg hover:shadow-xl"
                >
                  <Link href={`/${locale}/products`}>
                    Shop Now
                    <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="rounded-2xl border-white/30 bg-white/10 font-semibold text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"
                >
                  <Link href={`/${locale}/categories`}>Browse Categories</Link>
                </Button>
              </div>

              {/* Trust badges */}
              <div className="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-4">
                {TRUST_BADGES.map(({ icon: Icon, label, sub }) => (
                  <div
                    key={label}
                    className="flex items-center gap-2.5 rounded-xl bg-white/10 px-3 py-2.5 backdrop-blur-sm"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-white" />
                    <div>
                      <p className="text-xs font-bold text-white">{label}</p>
                      <p className="text-[10px] text-white/70">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Main content ── */}
      <div className="container space-y-8 py-10 lg:py-12">
        {/* Flash deals */}
        {(flashDeals ?? []).length > 0 && (
          <section className="space-y-3">
            {flashDeals!.map((deal) => (
              <FlashDealBanner key={deal.id} deal={deal} locale={locale} />
            ))}
          </section>
        )}

        {/* Category strip */}
        {topCategories.length > 0 && (
          <StorefrontSection
            title={t("categories")}
            href={`/${locale}/categories`}
            icon={<Grid2X2 className="h-4 w-4" />}
          >
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10">
              {topCategories.slice(0, 10).map((category) => (
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

        {/* Today's Deals */}
        {(todaysDeals?.items.length ?? 0) > 0 && (
          <StorefrontSection
            title={t("todaysDeal")}
            href={`/${locale}/products?todaysDeal=true`}
            icon={<Flame className="h-4 w-4" />}
          >
            <ProductGrid
              products={todaysDeals!.items}
              columnsClassName="grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
            />
          </StorefrontSection>
        )}

        {/* Featured */}
        {(featured?.items.length ?? 0) > 0 && (
          <StorefrontSection
            title={t("featured")}
            href={`/${locale}/products?featured=true`}
            icon={<Sparkles className="h-4 w-4" />}
          >
            <ProductGrid
              products={featured!.items}
              columnsClassName="grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
            />
          </StorefrontSection>
        )}

        {/* Best Selling */}
        {(bestSelling?.items.length ?? 0) > 0 && (
          <StorefrontSection
            title={t("bestSelling")}
            href={`/${locale}/products?sort=popular`}
            icon={<TrendingUp className="h-4 w-4" />}
          >
            <ProductGrid
              products={bestSelling!.items}
              columnsClassName="grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
            />
          </StorefrontSection>
        )}

        {/* CTA banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-foreground to-foreground/90 p-8 text-background sm:p-12">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
            <div className="absolute bottom-0 left-1/4 h-32 w-32 rounded-full bg-primary/15 blur-2xl" />
          </div>
          <div className="relative max-w-xl space-y-4">
            <Badge className="rounded-full bg-primary/20 px-4 py-1 text-xs font-bold text-primary">
              <Zap className="h-3 w-3" />
              Sell with us
            </Badge>
            <h2 className="text-3xl font-black sm:text-4xl">
              Start selling on our marketplace
            </h2>
            <p className="text-background/70">
              Join thousands of sellers earning on our platform. Easy setup, powerful tools.
            </p>
            <Button
              asChild
              size="lg"
              className="rounded-2xl"
            >
              <Link href={`/${locale}/become-seller`}>
                Become a Seller
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        {/* New Arrivals */}
        <StorefrontSection
          title={t("newArrivals")}
          href={`/${locale}/products`}
          icon={<Clock className="h-4 w-4" />}
        >
          <ProductGrid
            products={products?.items}
            isLoading={isLoading}
            columnsClassName="grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
            skeletonCount={10}
          />
        </StorefrontSection>
      </div>
    </div>
  );
}
