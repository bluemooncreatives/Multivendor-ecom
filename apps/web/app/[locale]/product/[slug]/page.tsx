"use client";

import { use, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import {
  Heart,
  Scale,
  Store,
  CheckCircle2,
  ShoppingCart,
  Minus,
  Plus,
  PackageX,
  Share2,
  Zap,
  Star,
  Shield,
  Truck,
  RefreshCcw,
  Tag,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const locale = useLocale();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data: product, isLoading } = useProduct(slug);
  const setCartItem = useSetCartItem();
  const [variantSku, setVariantSku] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  const variant = useMemo(
    () => product?.variants.find((v) => v.sku === (variantSku ?? product.variants[0]?.sku)),
    [product, variantSku],
  );

  const { data: related } = useProducts({ categoryId: product?.categoryId, sort: "newest" });
  const { data: sellerTop } = useProducts(
    product?.sellerId ? { sellerId: product.sellerId, sort: "popular" } : {},
  );
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
          size="lg"
        />
      </div>
    );
  }

  const available = variant?.stock ?? 0;
  const variantPricing = product.pricing?.variants.find((v) => v.sku === variant?.sku);
  const listPrice =
    variantPricing?.listPrice ?? variant?.comparePrice ?? variant?.price ?? product.basePrice;
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
      toast.success("Added to cart! 🛒");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not add to cart"));
    }
  }

  return (
    <div className="container space-y-8 py-6 lg:py-8">
      {/* Breadcrumb */}
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

      {/* Main product section */}
      <div className="grid gap-8 md:grid-cols-2">
        {/* Image gallery */}
        <div className="space-y-3">
          {/* Main image */}
          <div className="group relative aspect-square overflow-hidden rounded-3xl border bg-muted">
            {product.images[activeImage] ? (
              <Image
                src={product.images[activeImage]}
                alt={product.name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                No image
              </div>
            )}

            {/* Image nav arrows */}
            {product.images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setActiveImage((i) => (i - 1 + product.images.length) % product.images.length)
                  }
                  className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl border bg-background/90 shadow-md backdrop-blur-sm transition-all hover:scale-110 hover:bg-background"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveImage((i) => (i + 1) % product.images.length)}
                  className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl border bg-background/90 shadow-md backdrop-blur-sm transition-all hover:scale-110 hover:bg-background"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            )}

            {/* Flash deal badge */}
            {onFlashDeal && (
              <div className="absolute left-3 top-3">
                <Badge variant="destructive" className="gap-1 rounded-xl px-3 py-1 text-xs font-black shadow-md">
                  <Zap className="h-3 w-3" />
                  Flash Deal · {product.pricing?.discountPercent}% Off
                </Badge>
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {product.images.map((img, i) => (
                <button
                  key={img}
                  type="button"
                  onClick={() => setActiveImage(i)}
                  className={cn(
                    "relative h-16 w-16 overflow-hidden rounded-xl border-2 transition-all duration-200",
                    i === activeImage
                      ? "border-primary shadow-colored shadow-sm ring-2 ring-primary/20"
                      : "border-transparent opacity-60 hover:border-border hover:opacity-100",
                  )}
                >
                  <Image src={img} alt="" fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product info */}
        <div className="space-y-6">
          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant={available > 0 ? "success" : "destructive"}
              className="rounded-xl px-3 py-1 font-semibold"
            >
              {available > 0 ? `✓ In stock (${available})` : "× Out of stock"}
            </Badge>
            {product.featured && (
              <Badge className="gap-1 rounded-xl px-3 py-1 font-semibold">
                <Star className="h-3 w-3" /> Featured
              </Badge>
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl font-black leading-tight tracking-tight sm:text-3xl">
            {product.name}
          </h1>

          {/* Rating */}
          {product.ratingCount > 0 && (
            <RatingStars value={product.ratingAverage} count={product.ratingCount} size="md" />
          )}

          {/* Price */}
          <div className="rounded-2xl bg-muted/50 px-4 py-4">
            <PriceDisplay
              price={price}
              listPrice={hasDiscount ? listPrice : undefined}
              currency={product.currency}
              size="lg"
            />
          </div>

          {/* Variants */}
          {product.variants.length > 1 && (
            <div className="space-y-2.5">
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                Options
              </p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => (
                  <Button
                    key={v.sku}
                    type="button"
                    variant={
                      v.sku === (variantSku ?? product.variants[0]?.sku) ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setVariantSku(v.sku)}
                    className="rounded-xl"
                    disabled={v.stock <= 0}
                  >
                    {Object.values(v.attributes).join(" / ") || v.sku}
                    {v.stock <= 0 && " (OOS)"}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Add to cart row */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Quantity */}
            <div className="flex items-center overflow-hidden rounded-2xl border bg-background">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-11 w-11 rounded-none rounded-s-2xl"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-12 text-center text-sm font-bold">{quantity}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-11 w-11 rounded-none rounded-e-2xl"
                onClick={() => setQuantity((q) => Math.min(Math.max(1, available), q + 1))}
                disabled={quantity >= available}
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <Button
              size="lg"
              className="flex-1 rounded-2xl font-bold shadow-colored shadow-md sm:flex-initial"
              onClick={handleAddToCart}
              disabled={available <= 0 || setCartItem.isPending}
            >
              <ShoppingCart className="h-5 w-5" />
              {available <= 0 ? "Out of Stock" : "Add to Cart"}
            </Button>

            <Button
              variant="outline"
              size="icon"
              className={cn(
                "h-11 w-11 rounded-2xl transition-all",
                isWishlisted && "border-primary bg-primary/10",
              )}
              onClick={toggleWishlist}
              aria-label="Toggle wishlist"
            >
              <Heart
                className={cn("h-5 w-5", isWishlisted ? "fill-primary text-primary" : "")}
              />
            </Button>

            <Button
              variant="outline"
              size="icon"
              className={cn(
                "h-11 w-11 rounded-2xl",
                isComparing && "border-primary bg-primary/10",
              )}
              onClick={() => toggleCompare(product.id)}
              aria-label="Toggle compare"
            >
              <Scale className={cn("h-5 w-5", isComparing && "text-primary")} />
            </Button>
          </div>

          {/* Trust icons */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Shield, label: "Buyer Protection" },
              { icon: Truck, label: "Fast Delivery" },
              { icon: RefreshCcw, label: "Easy Returns" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-1.5 rounded-2xl bg-muted/40 px-3 py-3 text-center"
              >
                <Icon className="h-5 w-5 text-primary" />
                <span className="text-[11px] font-semibold text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>

          {/* Seller card */}
          {shop && (
            <Link
              href={`/${locale}/store/${shop.slug}`}
              className="flex items-center gap-4 rounded-2xl border bg-muted/20 p-4 transition-all hover:border-primary/40 hover:bg-accent/50"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border bg-background">
                <Store className="h-6 w-6 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-sm font-bold">
                  {shop.name}
                  {shop.verified && <CheckCircle2 className="h-4 w-4 text-primary" />}
                </p>
                <p className="text-xs text-muted-foreground">Visit seller storefront →</p>
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* Description & Reviews tabs */}
      <div className="rounded-3xl border bg-card shadow-xs">
        <Tabs defaultValue="description" className="w-full">
          <TabsList className="w-full justify-start rounded-none rounded-t-3xl border-b bg-muted/30 p-0">
            <TabsTrigger
              value="description"
              className="rounded-none rounded-tl-3xl border-b-2 border-transparent px-6 py-4 text-sm font-semibold data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary"
            >
              <Tag className="mr-2 h-4 w-4" />
              Description
            </TabsTrigger>
            <TabsTrigger
              value="reviews"
              className="rounded-none border-b-2 border-transparent px-6 py-4 text-sm font-semibold data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary"
            >
              <Star className="mr-2 h-4 w-4" />
              Reviews
              {product.ratingCount > 0 && (
                <Badge variant="secondary" className="ml-2 rounded-full px-2 py-0 text-xs">
                  {product.ratingCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="description" className="p-6 md:p-8">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {product.description || "No description provided."}
              </p>
            </div>
          </TabsContent>
          <TabsContent value="reviews" className="p-6 md:p-8">
            <ProductReviews productId={product.id} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Related products */}
      {relatedProducts.length > 0 && (
        <StorefrontSection title="Related Products">
          <ProductGrid
            products={relatedProducts}
            columnsClassName="grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
          />
        </StorefrontSection>
      )}

      {sellerTopProducts.length > 0 && (
        <StorefrontSection
          title={shop?.name ? `More from ${shop.name}` : "More from this shop"}
        >
          <ProductGrid
            products={sellerTopProducts}
            columnsClassName="grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
          />
        </StorefrontSection>
      )}
    </div>
  );
}
