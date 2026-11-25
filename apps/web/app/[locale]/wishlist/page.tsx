"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale } from "next-intl";
import { Heart, X } from "lucide-react";
import { useWishlist, useRemoveWishlistItem } from "@/lib/hooks/useWishlist";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { CardGridSkeleton } from "@/components/shared/loading-state";
import { formatPrice } from "@/lib/format";

export default function WishlistPage() {
  const locale = useLocale();
  const { data: items, isLoading } = useWishlist();
  const removeItem = useRemoveWishlistItem();

  return (
    <div className="container space-y-6 py-6 lg:py-8">
      <PageHeader title="My Wishlist" description="Products you saved for later." />

      {isLoading ? (
        <CardGridSkeleton count={6} columns="sm:grid-cols-2 lg:grid-cols-3" />
      ) : !items || items.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Your wishlist is empty"
          description="Save items you love while browsing to keep track of them here."
          action={
            <Button asChild>
              <Link href={`/${locale}/products`}>Browse Products</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Card key={item.id} className="relative overflow-hidden transition-shadow hover:shadow-md">
              <CardContent className="flex items-center gap-3.5 p-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem.mutate(item.productId.id)}
                  aria-label="Remove from wishlist"
                  className="absolute end-2 top-2 h-8 w-8 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
                <Link
                  href={`/${locale}/product/${item.productId.slug}`}
                  className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border bg-muted"
                >
                  {item.productId.images[0] && (
                    <Image src={item.productId.images[0]} alt={item.productId.name} fill className="object-cover" />
                  )}
                </Link>
                <div className="min-w-0 flex-1 pe-6">
                  <Link href={`/${locale}/product/${item.productId.slug}`} className="line-clamp-2 font-semibold hover:text-primary">
                    {item.productId.name}
                  </Link>
                  <p className="mt-1 text-sm font-bold text-primary">
                    {formatPrice(item.productId.basePrice, item.productId.currency, locale)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
