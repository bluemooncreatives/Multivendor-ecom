"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Heart, Scale, ShoppingBag, Zap, ImageOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RatingStars } from "@/components/shared/rating-stars";
import { PriceDisplay } from "@/components/shared/price-display";
import { useAuthStore, useCompareStore } from "@/lib/store";
import { useWishlist, useAddWishlistItem, useRemoveWishlistItem } from "@/lib/hooks/useWishlist";
import { useSetCartItem } from "@/lib/hooks/useCart";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import type { Product } from "@ecommercemultivendor/types";

export function ProductCard({ product, className }: { product: Product; className?: string }) {
  const locale = useLocale();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data: wishlist } = useWishlist();
  const addWishlist = useAddWishlistItem();
  const removeWishlist = useRemoveWishlistItem();
  const compareIds = useCompareStore((s) => s.productIds);
  const toggleCompare = useCompareStore((s) => s.toggle);
  const setCartItem = useSetCartItem();
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

  const defaultVariant = cheapestVariant ?? product.variants[0] ?? null;
  const inStock = (defaultVariant?.stock ?? 0) > 0;

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

  async function quickAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!defaultVariant) return;
    if (!inStock) {
      toast.error("Out of stock");
      return;
    }
    try {
      await setCartItem.mutateAsync({
        productId: product.id,
        variantSku: defaultVariant.sku,
        quantity: 1,
      });
      toast.success("Added to bag");
    } catch {
      toast.error("Could not add to bag");
    }
  }

  return (
    <Link href={`/${locale}/product/${product.slug}`} className={cn("group block h-full", className)}>
      <article className="flex h-full flex-col">
        {/* ── Image ── */}
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-muted">
          {image ? (
            <Image
              src={image}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-[650ms] ease-out group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground/30">
              <ImageOff className="h-9 w-9" />
            </div>
          )}

          {/* Top-left status badges */}
          <div className="absolute start-3 top-3 flex flex-col gap-1.5">
            {onFlashDeal ? (
              <Badge variant="sale" className="gap-1 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide shadow-sm">
                <Zap className="h-3 w-3" />
                Flash
              </Badge>
            ) : hasDiscount ? (
              <Badge variant="ink" className="px-2.5 py-1 text-[10px] font-bold tracking-wide shadow-sm">
                −{percentOff}%
              </Badge>
            ) : null}
            {!inStock && (
              <Badge variant="secondary" className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide">
                Sold out
              </Badge>
            )}
          </div>

          {/* Top-right compare (hover) */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleCompare(product.id);
            }}
            aria-label={isComparing ? "Remove from compare" : "Add to compare"}
            className={cn(
              "absolute end-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-background/90 opacity-0 shadow-sm backdrop-blur-sm transition-all duration-200 hover:scale-105 group-hover:opacity-100",
              isComparing && "border-foreground bg-foreground text-background opacity-100",
            )}
          >
            <Scale className="h-4 w-4" />
          </button>
        </div>

        {/* ── Content ── */}
        <div className="flex flex-1 flex-col gap-1 px-0.5 pt-3.5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-1 text-[15px] font-semibold leading-tight tracking-tight text-foreground">
              {product.name}
            </h3>
            {product.ratingCount > 0 && (
              <span className="mt-0.5 shrink-0">
                <RatingStars value={product.ratingAverage} size="sm" />
              </span>
            )}
          </div>

          <p className="line-clamp-1 text-[13px] text-muted-foreground">
            {product.tags?.[0] || product.description || "Crafted for everyday wear"}
          </p>

          {/* Price pill + actions */}
          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1.5">
              <PriceDisplay
                price={price}
                listPrice={hasDiscount ? listPrice : undefined}
                currency={product.currency}
                size="sm"
              />
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={toggleWishlist}
                aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border border-border transition-all hover:border-foreground/40",
                  isWishlisted && "border-destructive/30 bg-destructive/10",
                )}
              >
                <Heart className={cn("h-4 w-4", isWishlisted ? "fill-destructive text-destructive" : "text-foreground")} />
              </button>
              <button
                type="button"
                onClick={quickAddToCart}
                disabled={!inStock || setCartItem.isPending}
                aria-label="Add to bag"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-background transition-all hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
              >
                <ShoppingBag className="h-4 w-4" />
              </button>
            </div>
          </div>

          {inStock && (defaultVariant?.stock ?? 0) <= 5 && (
            <p className="mt-1.5 text-[11px] font-medium text-destructive">Only {defaultVariant?.stock} left</p>
          )}
        </div>
      </article>
    </Link>
  );
}
