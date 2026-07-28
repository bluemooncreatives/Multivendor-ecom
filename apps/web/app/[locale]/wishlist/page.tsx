"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale } from "next-intl";
import { X } from "lucide-react";
import { useWishlist, useRemoveWishlistItem } from "@/lib/hooks/useWishlist";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";

export default function WishlistPage() {
  const locale = useLocale();
  const { data: items, isLoading } = useWishlist();
  const removeItem = useRemoveWishlistItem();

  return (
    <div className="container space-y-6 py-6">
      <h1 className="text-2xl font-bold">My Wishlist</h1>

      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : !items || items.length === 0 ? (
        <div className="rounded-lg bg-card p-10 text-center shadow-sm">
          <p className="mb-4 text-muted-foreground">Your wishlist is empty.</p>
          <Button asChild>
            <Link href={`/${locale}/products`}>Browse Products</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 rounded-lg bg-card p-4 shadow-sm sm:grid-cols-2 md:p-6 lg:grid-cols-3">
          {items.map((item) => (
            <div key={item.id} className="relative flex items-center gap-3 rounded-md border p-3">
              <button
                type="button"
                onClick={() => removeItem.mutate(item.productId.id)}
                aria-label="Remove from wishlist"
                className="absolute end-2 top-2 text-muted-foreground hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </button>
              <Link href={`/${locale}/product/${item.productId.slug}`} className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                {item.productId.images[0] && (
                  <Image src={item.productId.images[0]} alt={item.productId.name} fill className="object-cover" />
                )}
              </Link>
              <div>
                <Link href={`/${locale}/product/${item.productId.slug}`} className="font-medium hover:text-primary">
                  {item.productId.name}
                </Link>
                <p className="text-sm text-muted-foreground">
                  {formatPrice(item.productId.basePrice, item.productId.currency, locale)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
