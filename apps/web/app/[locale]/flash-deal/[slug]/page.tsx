"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLocale } from "next-intl";
import { useFlashDeal } from "@/lib/hooks/useStorefront";
import { useDisplayCurrency } from "@/lib/hooks/useDisplayCurrency";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default function FlashDealPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const locale = useLocale();
  const { data: deal, isLoading } = useFlashDeal(slug);
  const { display } = useDisplayCurrency();

  if (isLoading) return <div className="container py-10 text-muted-foreground">Loading…</div>;
  if (!deal) return <div className="container py-10">This flash deal is not running right now.</div>;

  return (
    <div className="container space-y-6 py-6">
      {deal.bannerUrl && (
        <div className="relative aspect-[3/1] w-full overflow-hidden rounded-lg">
          <Image src={deal.bannerUrl} alt={deal.title} fill className="object-cover" priority />
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{deal.title}</h1>
        <Countdown endsAt={deal.endsAt} />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {deal.products
          .filter((entry) => entry.productId)
          .map((entry) => {
            const product = entry.productId!;
            const dealPrice = product.basePrice * (1 - entry.discountPercent / 100);

            return (
              <Card key={`${product.id}-${entry.variantSku}`} className="overflow-hidden">
                <Link href={`/${locale}/product/${product.slug}`}>
                  <div className="relative aspect-square bg-muted">
                    {product.images?.[0] && <Image src={product.images[0]} alt={product.name} fill className="object-cover" />}
                    <Badge className="absolute end-2 top-2">-{entry.discountPercent}%</Badge>
                  </div>
                  <CardContent className="space-y-1 p-3">
                    <p className="line-clamp-2 text-sm font-medium">{product.name}</p>
                    <div className="flex items-baseline gap-2">
                      <span className="font-bold text-primary">{display(dealPrice, product.currency)}</span>
                      <span className="text-xs text-muted-foreground line-through">
                        {display(product.basePrice, product.currency)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {entry.dealStock > 0 ? `${entry.dealStock} left at this price` : "Sold out"}
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

/** Live countdown to the campaign's end, ticking once a second. */
function Countdown({ endsAt }: { endsAt: string }) {
  const [remaining, setRemaining] = useState(() => new Date(endsAt).getTime() - Date.now());

  useEffect(() => {
    const timer = setInterval(() => setRemaining(new Date(endsAt).getTime() - Date.now()), 1000);
    return () => clearInterval(timer);
  }, [endsAt]);

  if (remaining <= 0) return <Badge variant="destructive">Ended</Badge>;

  const totalSeconds = Math.floor(remaining / 1000);
  const parts = [
    { value: Math.floor(totalSeconds / 86400), label: "d" },
    { value: Math.floor((totalSeconds % 86400) / 3600), label: "h" },
    { value: Math.floor((totalSeconds % 3600) / 60), label: "m" },
    { value: totalSeconds % 60, label: "s" },
  ];

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Ends in</span>
      {parts.map((part) => (
        <span key={part.label} className="rounded-md bg-primary px-2 py-1 font-mono text-sm text-primary-foreground">
          {String(part.value).padStart(2, "0")}
          {part.label}
        </span>
      ))}
    </div>
  );
}
