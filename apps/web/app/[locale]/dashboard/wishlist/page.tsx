"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { Heart, Trash2 } from "lucide-react";
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
    <div className="space-y-6">
      <PageHeader title="Wishlist" description="Products you have saved to revisit later." />

      {isLoading ? (
        <CardGridSkeleton count={4} columns="sm:grid-cols-2" />
      ) : !items || items.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Your wishlist is empty"
          description="Tap the heart icon on any product to save it here."
          action={
            <Button asChild>
              <Link href={`/${locale}/products`}>Browse products</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="flex items-center justify-between gap-4 p-5">
                <div className="min-w-0">
                  <Link href={`/${locale}/product/${item.productId.slug}`} className="block truncate font-semibold hover:text-primary">
                    {item.productId.name}
                  </Link>
                  <p className="mt-0.5 text-sm font-bold text-primary">
                    {formatPrice(item.productId.basePrice, item.productId.currency)}
                  </p>
                </div>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive" onClick={() => removeItem.mutate(item.productId.id)}>
                  <Trash2 className="h-4 w-4" />
                  Remove
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
