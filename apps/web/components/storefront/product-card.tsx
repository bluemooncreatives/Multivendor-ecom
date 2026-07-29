"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Heart, Scale } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useAuthStore, useCompareStore } from "@/lib/store";
import { useWishlist, useAddWishlistItem, useRemoveWishlistItem } from "@/lib/hooks/useWishlist";
import { useDisplayCurrency } from "@/lib/hooks/useDisplayCurrency";
import type { Product } from "@ecommercemultivendor/types";

export function ProductCard({ product }: { product: Product }) {
  const locale = useLocale();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { display } = useDisplayCurrency();
  const { data: wishlist } = useWishlist();
  const addWishlist = useAddWishlistItem();
  const removeWishlist = useRemoveWishlistItem();
  const compareIds = useCompareStore((s) => s.productIds);
  const toggleCompare = useCompareStore((s) => s.toggle);
  const isComparing = compareIds.includes(product.id);

  const image = product.images[0];
  const cheapestVariant = product.variants.length
    ? product.variants.reduce((a, b) => (a.price < b.price ? a : b))
    : null;
  const price = cheapestVariant ? cheapestVariant.price : product.basePrice;
  const comparePrice = cheapestVariant?.comparePrice;
  const hasDiscount = !!comparePrice && comparePrice > price;

  const wishlistItem = wishlist?.find((item) => item.productId.id === product.id);
  const isWishlisted = !!wishlistItem;

  function toggleWishlist(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      router.push(`/${locale}/login`);
      return;
    }
    if (isWishlisted) removeWishlist.mutate(product.id);
    else addWishlist.mutate(product.id);
  }

  return (
    <Link href={`/${locale}/product/${product.slug}`}>
      <Card className="h-full overflow-hidden transition-shadow hover:shadow-md">
        <div className="group relative aspect-square bg-muted">
          {image ? (
            <Image src={image} alt={product.name} fill className="object-cover" sizes="(max-width: 768px) 50vw, 25vw" />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">No image</div>
          )}
          {hasDiscount && (
            <span className="absolute start-2 top-2 rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
              {Math.round(100 - (price / (comparePrice as number)) * 100)}% OFF
            </span>
          )}
          <div className="absolute end-2 top-2 flex flex-col gap-2 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={toggleWishlist}
              aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-background/90 shadow hover:text-primary"
            >
              <Heart className={`h-4 w-4 ${isWishlisted ? "fill-primary text-primary" : ""}`} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleCompare(product.id);
              }}
              aria-label={isComparing ? "Remove from compare" : "Add to compare"}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-background/90 shadow hover:text-primary"
            >
              <Scale className={`h-4 w-4 ${isComparing ? "text-primary" : ""}`} />
            </button>
          </div>
        </div>
        <CardContent className="space-y-1 p-3">
          <div className="flex items-baseline gap-2">
            {hasDiscount && (
              <span className="text-xs text-muted-foreground line-through">
                {display(comparePrice as number, product.currency)}
              </span>
            )}
            <span className="text-sm font-semibold">{display(price, product.currency)}</span>
          </div>
          <p className="line-clamp-2 text-sm font-medium">{product.name}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
