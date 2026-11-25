"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Heart, Scale, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RatingStars } from "@/components/shared/rating-stars";
import { PriceDisplay } from "@/components/shared/price-display";
import { useAuthStore, useCompareStore } from "@/lib/store";
import { useWishlist, useAddWishlistItem, useRemoveWishlistItem } from "@/lib/hooks/useWishlist";
import type { Product } from "@ecommercemultivendor/types";

export function ProductCard({ product }: { product: Product }) {
  const locale = useLocale();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
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
  const listPrice = product.pricing?.listPrice ?? cheapestVariant?.comparePrice ?? product.basePrice;
  const price = product.pricing?.price ?? (cheapestVariant ? cheapestVariant.price : product.basePrice);
  const percentOff = product.pricing
    ? product.pricing.discountPercent
    : listPrice > price
      ? Math.round(100 - (price / listPrice) * 100)
      : 0;
  const hasDiscount = percentOff > 0 && listPrice > price;
  const onFlashDeal = product.pricing?.discountSource === "flash_deal";

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
    <Link href={`/${locale}/product/${product.slug}`} className="group block h-full">
      <Card className="flex h-full flex-col overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
        <div className="relative aspect-square overflow-hidden bg-muted">
          {image ? (
            <Image
              src={image}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No image</div>
          )}

          <div className="absolute start-2 top-2 flex flex-col gap-1">
            {hasDiscount && (
              <Badge className="px-1.5 py-0.5 text-[10px] font-bold shadow-sm">
                {percentOff}% OFF
              </Badge>
            )}
            {onFlashDeal && (
              <Badge variant="destructive" className="gap-0.5 px-1.5 py-0.5 text-[10px] font-bold shadow-sm">
                <Zap className="h-2.5 w-2.5" />
                Flash deal
              </Badge>
            )}
          </div>

          <div className="absolute end-2 top-2 flex flex-col gap-1.5 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
            <button
              type="button"
              onClick={toggleWishlist}
              aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
              className="flex h-8 w-8 items-center justify-center rounded-full border bg-background/95 shadow-sm backdrop-blur transition-colors hover:border-primary hover:text-primary"
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
              className="flex h-8 w-8 items-center justify-center rounded-full border bg-background/95 shadow-sm backdrop-blur transition-colors hover:border-primary hover:text-primary"
            >
              <Scale className={`h-4 w-4 ${isComparing ? "text-primary" : ""}`} />
            </button>
          </div>
        </div>

        <CardContent className="flex flex-1 flex-col justify-between gap-2 p-3.5">
          <div className="space-y-1.5">
            <PriceDisplay price={price} listPrice={hasDiscount ? listPrice : undefined} currency={product.currency} size="sm" />
            <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground transition-colors group-hover:text-primary">
              {product.name}
            </p>
          </div>

          {product.ratingCount > 0 && (
            <RatingStars value={product.ratingAverage} count={product.ratingCount} size="sm" />
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
