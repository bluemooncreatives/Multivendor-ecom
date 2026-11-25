"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Heart, Scale, ShoppingCart, Zap, Eye, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  const listPrice =
    product.pricing?.listPrice ?? cheapestVariant?.comparePrice ?? product.basePrice;
  const price =
    product.pricing?.price ?? (cheapestVariant ? cheapestVariant.price : product.basePrice);
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
      toast.success("Added to cart!");
    } catch {
      toast.error("Could not add to cart");
    }
  }

  return (
    <Link
      href={`/${locale}/product/${product.slug}`}
      className={cn("group block h-full", className)}
    >
      <article className="relative flex h-full flex-col overflow-hidden rounded-2xl border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg">
        {/* Image container */}
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {image ? (
            <Image
              src={image}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-108"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="flex flex-col items-center gap-2 text-muted-foreground/40">
                <Eye className="h-8 w-8" />
                <span className="text-xs">No image</span>
              </div>
            </div>
          )}

          {/* Top badges */}
          <div className="absolute start-2.5 top-2.5 flex flex-col gap-1.5">
            {hasDiscount && (
              <Badge className="rounded-lg px-2 py-0.5 text-[10px] font-black shadow-md">
                -{percentOff}%
              </Badge>
            )}
            {onFlashDeal && (
              <Badge
                variant="destructive"
                className="gap-0.5 rounded-lg px-2 py-0.5 text-[10px] font-black shadow-md"
              >
                <Zap className="h-2.5 w-2.5" />
                FLASH
              </Badge>
            )}
            {!inStock && (
              <Badge variant="secondary" className="rounded-lg px-2 py-0.5 text-[10px] font-bold">
                Sold Out
              </Badge>
            )}
          </div>

          {/* Quick action overlay */}
          <div className="absolute inset-0 flex flex-col items-end justify-between p-2 opacity-0 transition-all duration-300 group-hover:opacity-100">
            {/* Top-right wishlist & compare */}
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={toggleWishlist}
                aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl border bg-background/95 shadow-md backdrop-blur-sm transition-all hover:scale-110 hover:border-primary",
                  isWishlisted && "border-primary bg-primary/10",
                )}
              >
                <Heart
                  className={cn(
                    "h-4 w-4 transition-colors",
                    isWishlisted ? "fill-primary text-primary" : "text-foreground",
                  )}
                />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleCompare(product.id);
                }}
                aria-label={isComparing ? "Remove from compare" : "Add to compare"}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl border bg-background/95 shadow-md backdrop-blur-sm transition-all hover:scale-110 hover:border-primary",
                  isComparing && "border-primary bg-primary/10",
                )}
              >
                <Scale className={cn("h-4 w-4", isComparing && "text-primary")} />
              </button>
            </div>

            {/* Bottom: quick add to cart */}
            <Button
              size="sm"
              className="w-full rounded-xl shadow-md"
              onClick={quickAddToCart}
              disabled={!inStock || setCartItem.isPending}
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              {inStock ? "Add to Cart" : "Out of Stock"}
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col gap-2 p-3.5">
          {/* Price */}
          <PriceDisplay
            price={price}
            listPrice={hasDiscount ? listPrice : undefined}
            currency={product.currency}
            size="sm"
          />

          {/* Name */}
          <p className="line-clamp-2 flex-1 text-sm font-medium leading-snug text-foreground transition-colors group-hover:text-primary">
            {product.name}
          </p>

          {/* Rating */}
          {product.ratingCount > 0 && (
            <div className="flex items-center gap-1.5">
              <RatingStars value={product.ratingAverage} count={product.ratingCount} size="sm" />
            </div>
          )}

          {/* Stock warning */}
          {inStock && (defaultVariant?.stock ?? 0) <= 5 && (
            <p className="text-[10px] font-semibold text-warning">
              Only {defaultVariant?.stock} left!
            </p>
          )}
        </div>
      </article>
    </Link>
  );
}
