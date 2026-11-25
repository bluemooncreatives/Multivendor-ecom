"use client";

import { use } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLocale } from "next-intl";
import { Zap } from "lucide-react";
import { useFlashDeal } from "@/lib/hooks/useStorefront";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CountdownTimer } from "@/components/storefront/flash-deal-banner";
import { PriceDisplay } from "@/components/shared/price-display";
import { ProductGridSkeleton } from "@/components/shared/loading-state";
import { EmptyState } from "@/components/shared/empty-state";

export default function FlashDealPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const locale = useLocale();
  const { data: deal, isLoading } = useFlashDeal(slug);

  if (isLoading) {
    return (
      <div className="container space-y-6 py-8">
        <ProductGridSkeleton count={8} />
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="container py-16">
        <EmptyState
          icon={Zap}
          title="Flash deal unavailable"
          description="This flash deal is not running right now."
          action={
            <Button asChild>
              <Link href={`/${locale}/products`}>Browse all products</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="container space-y-6 py-6 lg:py-8">
      {deal.bannerUrl && (
        <div className="relative aspect-[3/1] w-full overflow-hidden rounded-xl border shadow-sm">
          <Image src={deal.bannerUrl} alt={deal.title} fill className="object-cover" priority />
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{deal.title}</h1>
            <p className="text-xs text-muted-foreground">{deal.products.length} campaign item(s)</p>
          </div>
        </div>
        <CountdownTimer endsAt={deal.endsAt} />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {deal.products
          .filter((entry) => entry.productId)
          .map((entry) => {
            const product = entry.productId!;
            const dealPrice = entry.dealPrice ?? product.basePrice;
            const listPrice = entry.listPrice ?? product.basePrice;

            return (
              <Card key={`${product.id}-${entry.variantSku}`} className="group overflow-hidden transition-all hover:border-primary/40 hover:shadow-md">
                <Link href={`/${locale}/product/${product.slug}`}>
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    {product.images?.[0] && (
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    )}
                    <Badge className="absolute end-2 top-2">-{entry.discountPercent}%</Badge>
                  </div>
                  <CardContent className="space-y-1.5 p-3.5">
                    <p className="line-clamp-2 text-sm font-medium group-hover:text-primary">{product.name}</p>
                    <PriceDisplay
                      price={dealPrice}
                      listPrice={listPrice > dealPrice ? listPrice : undefined}
                      currency={product.currency}
                      size="sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      {entry.soldOut
                        ? "Sold out"
                        : entry.remaining === null
                          ? "Available now"
                          : `${entry.available} left at this price`}
                    </p>
                  </CardContent>
                </Link>
              </Card>
            );
          })}
      </div>
    </div>
  );
}
