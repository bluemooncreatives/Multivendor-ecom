"use client";

import Link from "next/link";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowUpRight,
  Sparkles,
  ShieldCheck,
  Truck,
  RefreshCcw,
  Star,
  Asterisk,
} from "lucide-react";
import { useProducts, useCategories } from "@/lib/hooks/useProducts";
import { useActiveFlashDeals } from "@/lib/hooks/useStorefront";
import { ProductGrid } from "@/components/storefront/product-grid";
import { StorefrontSection } from "@/components/storefront/section";
import { CategoryCard } from "@/components/storefront/category-card";
import { FlashDealBanner } from "@/components/storefront/flash-deal-banner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TRUST_BADGES = [
  { icon: Truck, label: "Free shipping", sub: "Orders over ₹999" },
  { icon: RefreshCcw, label: "Easy returns", sub: "30-day policy" },
  { icon: ShieldCheck, label: "Secure pay", sub: "256-bit SSL" },
  { icon: Star, label: "Top rated", sub: "4.8★ average" },
] as const;

const MARQUEE = [
  "New season drop",
  "Free shipping over ₹999",
  "Curated multivendor marketplace",
  "Members get early access",
  "Handpicked by independent sellers",
];

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
  const heroImages = (featured?.items ?? products?.items ?? [])
    .map((p) => p.images[0])
    .filter(Boolean)
    .slice(0, 3) as string[];

  return (
    <div className="min-h-screen">
      {/* ─────────────────────────── HERO ─────────────────────────── */}
      <section className="container pt-6 lg:pt-10">
        <div className="grid items-stretch gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          {/* Left — editorial headline */}
          <div className="flex flex-col justify-between gap-10 rounded-[2rem] border bg-card p-7 shadow-xs sm:p-10">
            <div className="space-y-6">
              <span className="eyebrow">
                <Sparkles className="h-3.5 w-3.5" />
                Curated multivendor marketplace
              </span>
              <h1 className="text-display text-[clamp(2.75rem,7vw,5.25rem)] font-bold text-foreground">
                {t("title")}
              </h1>
              <p className="max-w-md text-base text-muted-foreground sm:text-lg">
                {t("subtitle")}. Discover pieces from independent sellers — picked to match your
                taste, style and season.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button asChild size="lg">
                  <Link href={`/${locale}/products`}>
                    Start shopping
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href={`/${locale}/categories`}>Browse categories</Link>
                </Button>
              </div>
            </div>

            {/* Trust row */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 border-t border-border pt-6 sm:grid-cols-4">
              {TRUST_BADGES.map(({ icon: Icon, label, sub }) => (
                <div key={label} className="flex items-start gap-2.5">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />
                  <div className="leading-tight">
                    <p className="text-[13px] font-semibold text-foreground">{label}</p>
                    <p className="text-[11px] text-muted-foreground">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — product collage */}
          <div className="relative grid grid-cols-2 grid-rows-2 gap-4">
            {heroImages[0] ? (
              <Link
                href={`/${locale}/products`}
                className="group relative col-span-1 row-span-2 overflow-hidden rounded-[2rem] bg-muted"
              >
                <Image
                  src={heroImages[0]}
                  alt="Featured"
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 1024px) 50vw, 25vw"
                  priority
                />
                <div className="absolute inset-x-4 bottom-4 flex items-center justify-between rounded-full bg-background/90 px-4 py-2.5 backdrop-blur-md">
                  <span className="text-sm font-semibold">New arrivals</span>
                  <ArrowUpRight className="h-4 w-4" />
                </div>
              </Link>
            ) : (
              <div className="col-span-1 row-span-2 flex items-center justify-center rounded-[2rem] bg-foreground p-8 text-background">
                <span className="text-display text-3xl font-bold leading-none">
                  Shop the drop
                </span>
              </div>
            )}

            {[heroImages[1], heroImages[2]].map((img, i) => (
              <Link
                key={i}
                href={`/${locale}/products`}
                className={cn(
                  "group relative overflow-hidden rounded-[1.75rem]",
                  img ? "bg-muted" : "bg-secondary",
                )}
              >
                {img ? (
                  <Image
                    src={img}
                    alt="Featured"
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 1024px) 25vw, 15vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center p-4 text-center">
                    <span className="text-display text-xl font-bold leading-tight text-foreground/80">
                      {i === 0 ? "2025" : "Edit"}
                    </span>
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────── MARQUEE ─────────────────────────── */}
      <section className="mt-8 overflow-hidden border-y border-border bg-foreground py-4 text-background">
        <div className="flex w-max animate-marquee items-center gap-8 whitespace-nowrap">
          {[...MARQUEE, ...MARQUEE].map((text, i) => (
            <span key={i} className="flex items-center gap-8 text-sm font-medium uppercase tracking-wide">
              {text}
              <Asterisk className="h-4 w-4 text-background/60" />
            </span>
          ))}
        </div>
      </section>

      {/* ─────────────────────────── BODY ─────────────────────────── */}
      <div className="container space-y-16 py-14 lg:space-y-20 lg:py-20">
        {/* Flash deals */}
        {(flashDeals ?? []).length > 0 && (
          <section className="space-y-3">
            {flashDeals!.map((deal) => (
              <FlashDealBanner key={deal.id} deal={deal} locale={locale} />
            ))}
          </section>
        )}

        {/* Categories */}
        {topCategories.length > 0 && (
          <StorefrontSection
            eyebrow="Explore"
            title="Browse all you need"
            subtitle="Shop by category across every independent store on the marketplace."
            href={`/${locale}/categories`}
          >
            <div className="grid grid-cols-3 gap-x-4 gap-y-6 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
              {topCategories.slice(0, 8).map((category) => (
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
            eyebrow="Limited time"
            title={t("todaysDeal")}
            href={`/${locale}/products?todaysDeal=true`}
          >
            <ProductGrid
              products={todaysDeals!.items}
              columnsClassName="grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
            />
          </StorefrontSection>
        )}

        {/* Featured */}
        {(featured?.items.length ?? 0) > 0 && (
          <StorefrontSection
            eyebrow="Handpicked"
            title={t("featured")}
            href={`/${locale}/products?featured=true`}
          >
            <ProductGrid
              products={featured!.items}
              columnsClassName="grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
            />
          </StorefrontSection>
        )}

        {/* Seller CTA band */}
        <section className="relative overflow-hidden rounded-[2rem] bg-foreground px-7 py-12 text-background sm:px-12 sm:py-16">
          <div className="relative grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-center">
            <div className="space-y-5">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-background/60">
                <Sparkles className="h-3.5 w-3.5" />
                Sell with us
              </span>
              <h2 className="text-display text-[clamp(2rem,5vw,3.5rem)] font-bold leading-[0.95]">
                Start selling on our marketplace
              </h2>
              <p className="max-w-md text-background/70">
                Join thousands of independent sellers. Easy setup, powerful tools, and a storefront
                that looks this good out of the box.
              </p>
              <Button asChild size="lg" variant="inverted">
                <Link href={`/${locale}/become-seller`}>
                  Become a seller
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-4 border-t border-background/15 pt-8 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
              {[
                { k: "10k+", v: "Active sellers" },
                { k: "2M+", v: "Products listed" },
                { k: "4.8★", v: "Avg. rating" },
              ].map(({ k, v }) => (
                <div key={v}>
                  <p className="text-display text-2xl font-bold sm:text-3xl">{k}</p>
                  <p className="mt-1 text-xs text-background/60">{v}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Best Selling */}
        {(bestSelling?.items.length ?? 0) > 0 && (
          <StorefrontSection
            eyebrow="Trending"
            title={t("bestSelling")}
            href={`/${locale}/products?sort=popular`}
          >
            <ProductGrid
              products={bestSelling!.items}
              columnsClassName="grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
            />
          </StorefrontSection>
        )}

        {/* New Arrivals */}
        <StorefrontSection
          eyebrow="Fresh in"
          title={t("newArrivals")}
          href={`/${locale}/products`}
        >
          <ProductGrid
            products={products?.items}
            isLoading={isLoading}
            columnsClassName="grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
            skeletonCount={8}
          />
        </StorefrontSection>
      </div>
    </div>
  );
}
