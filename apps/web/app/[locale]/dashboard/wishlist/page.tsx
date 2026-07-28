"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { useWishlist, useRemoveWishlistItem } from "@/lib/hooks/useWishlist";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice } from "@/lib/format";

export default function WishlistPage() {
  const locale = useLocale();
  const { data: items, isLoading } = useWishlist();
  const removeItem = useRemoveWishlistItem();

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (!items || items.length === 0) return <p className="text-muted-foreground">Your wishlist is empty.</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Wishlist</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((item) => (
          <Card key={item.id}>
            <CardContent className="flex items-center justify-between gap-4 pt-6">
              <div>
                <Link href={`/${locale}/product/${item.productId.slug}`} className="font-medium hover:underline">
                  {item.productId.name}
                </Link>
                <p className="text-sm text-muted-foreground">{formatPrice(item.productId.basePrice, item.productId.currency)}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => removeItem.mutate(item.productId.id)}>
                Remove
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
