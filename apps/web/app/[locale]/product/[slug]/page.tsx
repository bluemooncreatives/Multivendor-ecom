"use client";

import { use, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Heart, Scale, Store, CheckCircle2, ShoppingCart, Minus, Plus, PackageX } from "lucide-react";
import { useProduct, useProducts } from "@/lib/hooks/useProducts";
import { useSetCartItem } from "@/lib/hooks/useCart";
import { useShopBySellerId } from "@/lib/hooks/useSeller";
import { useWishlist, useAddWishlistItem, useRemoveWishlistItem } from "@/lib/hooks/useWishlist";
import { useAuthStore, useCompareStore } from "@/lib/store";
import { useReferralCode } from "@/lib/hooks/useReferralCode";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ProductGrid } from "@/components/storefront/product-grid";
import { ProductReviews } from "@/components/storefront/product-reviews";
import { StorefrontSection } from "@/components/storefront/section";
import { PriceDisplay } from "@/components/shared/price-display";
import { RatingStars } from "@/components/shared/rating-stars";
import { DetailPageSkeleton } from "@/components/shared/loading-state";
import { EmptyState } from "@/components/shared/empty-state";
import { cn, getApiErrorMessage } from "@/lib/utils";

export default function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const locale = useLocale();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data: product, isLoading } = useProduct(slug);
  const setCartItem = useSetCartItem();
  const [variantSku, setVariantSku] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [tab, setTab] = useState<"description" | "reviews">("description");

  const variant = useMemo(
    () => product?.variants.find((v) => v.sku === (variantSku ?? product.variants[0]?.sku)),
    [product, variantSku],
  );

  const { data: related } = useProducts({ categoryId: product?.categoryId, sort: "newest" });
  const { data: sellerTop } = useProducts(product?.sellerId ? { sellerId: product.sellerId, sort: "popular" } : {});
  const { data: shop } = useShopBySellerId(product?.sellerId);
  const { data: wishlist } = useWishlist();
  const addWishlist = useAddWishlistItem();
  const removeWishlist = useRemoveWishlistItem();
  const compareIds = useCompareStore((s) => s.productIds);
  const toggleCompare = useCompareStore((s) => s.toggle);
  const referralCode = useReferralCode(product?.id);

  if (isLoading) return <DetailPageSkeleton />;
  if (!product) {
    return (
      <div className="container py-16">
        <EmptyState
          icon={PackageX}
          title="Product not found"
          description="This listing may have been removed or is unavailable."
          action={
            <Button asChild>
              <Link href={`/${locale}/products`}>Browse products</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const available = variant?.stock ?? 0;
  const variantPricing = product.pricing?.variants.find((v) => v.sku === variant?.sku);
  const listPrice = variantPricing?.listPrice ?? variant?.comparePrice ?? variant?.price ?? product.basePrice;
  const price = variantPricing?.price ?? variant?.price ?? product.basePrice;
  const hasDiscount = listPrice > price;
  const onFlashDeal =
    product.pricing?.discountSource === "flash_deal" &&
    !!variantPricing &&
    variantPricing.price < variantPricing.listPrice;
  const relatedProducts = (related?.items ?? []).filter((p) => p.id !== product.id).slice(0, 5);
  const sellerTopProducts = product.sellerId
    ? (sellerTop?.items ?? []).filter((p) => p.id !== product.id).slice(0, 5)
    : [];
  const isWishlisted = !!wishlist?.find((item) => item.productId.id === product.id);
  const isComparing = compareIds.includes(product.id);

  function toggleWishlist() {
    if (!user) {
      router.push(`/${locale}/login`);
      return;
    }
    if (isWishlisted) removeWishlist.mutate(product!.id);
    else addWishlist.mutate(product!.id);
  }

  async function handleAddToCart() {
    if (!product || !variant) return;
    try {
      await setCartItem.mutateAsync({
        productId: product.id,
        variantSku: variant.sku,
        quantity,
        productReferralCode: referralCode,
      });
      toast.success("Added to cart");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not add to cart"));
    }
  }

  return (
    <div className="container space-y-8 py-6 lg:py-8">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/${locale}`}>Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/${locale}/products`}>Products</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="max-w-xs truncate">{product.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card>
        <CardContent className="grid gap-8 p-5 md:grid-cols-2 md:p-8">
          <div className="space-y-3">
            <div className="relative aspect-square overflow-hidden rounded-xl border bg-muted">
              {product.images[activeImage] ? (
                <Image src={product.images[activeImage]} alt={product.name} fill className="object-cover" priority />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No image</div>
              )}
            </div>
            {product.images.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {product.images.map((img, i) => (
                  <button
                    key={img}
                    type="button"
                    onClick={() => setActiveImage(i)}
                    className={cn(
                      "relative h-16 w-16 overflow-hidden rounded-lg border-2 transition-all",
                      i === activeImage ? "border-primary ring-2 ring-primary/20" : "border-border opacity-75 hover:opacity-100",
                    )}
                  >
                    <Image src={img} alt="" fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={available > 0 ? "success" : "destructive"}>
                  {available > 0 ? `${available} in stock` : "Out of stock"}
                </Badge>
                {onFlashDeal && (
                  <Badge variant="destructive">
                    {product.pricing?.flashDealTitle ?? "Flash deal"} · {product.pricing?.discountPercent}% off
                  </Badge>
                )}
              </div>

              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{product.name}</h1>

              {product.ratingCount > 0 && (
                <RatingStars value={product.ratingAverage} count={product.ratingCount} size="md" />
              )}

              <Separator />

              <PriceDisplay
                price={price}
                listPrice={hasDiscount ? listPrice : undefined}
                currency={product.currency}
                size="lg"
              />

              {product.variants.length > 1 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Options</p>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.map((v) => (
                      <Button
                        key={v.sku}
                        type="button"
                        variant={v.sku === (variantSku ?? product.variants[0]?.sku) ? "default" : "outline"}
                        size="sm"
                        onClick={() => setVariantSku(v.sku)}
                      >
                        {Object.values(v.attributes).join(" / ") || v.sku}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <div className="flex items-center rounded-lg border bg-background">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-e-none"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-10 text-center text-sm font-semibold">{quantity}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-s-none"
                    onClick={() => setQuantity((q) => Math.min(Math.max(1, available), q + 1))}
                    disabled={quantity >= available}
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <Button size="lg" className="flex-1 sm:flex-initial" onClick={handleAddToCart} disabled={available <= 0 || setCartItem.isPending}>
                  <ShoppingCart className="h-4 w-4" />
                  Add to Cart
                </Button>

                <Button variant="outline" size="icon" className="h-11 w-11" onClick={toggleWishlist} aria-label="Toggle wishlist">
                  <Heart className={isWishlisted ? "h-4 w-4 fill-primary text-primary" : "h-4 w-4"} />
                </Button>

                <Button variant="outline" size="icon" className="h-11 w-11" onClick={() => toggleCompare(product.id)} aria-label="Toggle compare">
                  <Scale className={isComparing ? "h-4 w-4 text-primary" : "h-4 w-4"} />
                </Button>
              </div>
            </div>

            {shop && (
              <Link
                href={`/${locale}/store/${shop.slug}`}
                className="flex items-center gap-3.5 rounded-xl border bg-muted/20 p-3.5 transition-colors hover:border-primary/40 hover:bg-accent/50"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full border bg-background">
                  <Store className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 text-sm font-semibold">
                    {shop.name}
                    {shop.verified && <CheckCircle2 className="h-4 w-4 text-primary" />}
                  </p>
                  <p className="text-xs text-muted-foreground">Visit seller storefront</p>
                </div>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 md:p-6">
          <div className="flex gap-2 border-b pb-3">
            <Button
              type="button"
              variant={tab === "description" ? "default" : "ghost"}
              size="sm"
              onClick={() => setTab("description")}
            >
              Description
            </Button>
            <Button
              type="button"
              variant={tab === "reviews" ? "default" : "ghost"}
              size="sm"
              onClick={() => setTab("reviews")}
            >
              Reviews
            </Button>
          </div>
          <div className="pt-5">
            {tab === "description" ? (
              <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {product.description || "No description provided."}
              </p>
            ) : (
              <ProductReviews productId={product.id} />
            )}
          </div>
        </CardContent>
      </Card>

      {relatedProducts.length > 0 && (
        <StorefrontSection title="Related Products">
          <ProductGrid products={relatedProducts} columnsClassName="grid-cols-2 sm:grid-cols-3 lg:grid-cols-5" />
        </StorefrontSection>
      )}

      {sellerTopProducts.length > 0 && (
        <StorefrontSection title={shop?.name ? `More from ${shop.name}` : "More from this shop"}>
          <ProductGrid products={sellerTopProducts} columnsClassName="grid-cols-2 sm:grid-cols-3 lg:grid-cols-5" />
        </StorefrontSection>
      )}
    </div>
  );
}
