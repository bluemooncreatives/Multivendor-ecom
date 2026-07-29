"use client";

import { use, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Heart, Scale, Store, CheckCircle2 } from "lucide-react";
import { useProduct, useProducts } from "@/lib/hooks/useProducts";
import { useSetCartItem } from "@/lib/hooks/useCart";
import { useShopBySellerId } from "@/lib/hooks/useSeller";
import { useWishlist, useAddWishlistItem, useRemoveWishlistItem } from "@/lib/hooks/useWishlist";
import { useAuthStore, useCompareStore } from "@/lib/store";
import { useDisplayCurrency } from "@/lib/hooks/useDisplayCurrency";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ProductCard } from "@/components/storefront/product-card";
import { ProductReviews } from "@/components/storefront/product-reviews";
import { StorefrontSection } from "@/components/storefront/section";

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
  const { data: shop } = useShopBySellerId(product?.sellerId);
  const { data: wishlist } = useWishlist();
  const addWishlist = useAddWishlistItem();
  const removeWishlist = useRemoveWishlistItem();
  const compareIds = useCompareStore((s) => s.productIds);
  const toggleCompare = useCompareStore((s) => s.toggle);
  const { display } = useDisplayCurrency();

  if (isLoading) return <div className="container py-10 text-muted-foreground">Loading…</div>;
  if (!product) return <div className="container py-10">Product not found.</div>;

  const available = variant?.stock ?? 0;
  const comparePrice = variant?.comparePrice;
  const price = variant?.price ?? product.basePrice;
  const hasDiscount = !!comparePrice && comparePrice > price;
  const relatedProducts = (related?.items ?? []).filter((p) => p.id !== product.id).slice(0, 5);
  const isWishlisted = !!wishlist?.find((item) => item.productId.id === product.id);
  const isComparing = compareIds.includes(product.id);

  function toggleWishlist() {
    if (!user) {
      router.push(`/${locale}/login`);
      return;
    }
    if (isWishlisted) removeWishlist.mutate(product.id);
    else addWishlist.mutate(product.id);
  }

  async function handleAddToCart() {
    if (!product || !variant) return;
    try {
      await setCartItem.mutateAsync({ productId: product.id, variantSku: variant.sku, quantity });
      toast.success("Added to cart");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Could not add to cart");
    }
  }

  return (
    <div className="container space-y-8 py-6">
      <div className="grid gap-8 rounded-lg bg-card p-4 shadow-sm md:grid-cols-2 md:p-6">
        <div className="space-y-3">
          <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
            {product.images[activeImage] && (
              <Image src={product.images[activeImage]} alt={product.name} fill className="object-cover" />
            )}
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-2">
              {product.images.map((img, i) => (
                <button
                  key={img}
                  type="button"
                  onClick={() => setActiveImage(i)}
                  className={`relative h-16 w-16 overflow-hidden rounded-md border-2 ${i === activeImage ? "border-primary" : "border-transparent"}`}
                >
                  <Image src={img} alt="" fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h1 className="text-2xl font-bold">{product.name}</h1>

          <Badge variant={available > 0 ? "secondary" : "destructive"}>
            {available > 0 ? `${available} in stock` : "Out of stock"}
          </Badge>

          <div className="flex items-baseline gap-3 border-t pt-4">
            {hasDiscount && (
              <span className="text-lg text-muted-foreground line-through">
                {display(comparePrice as number, product.currency)}
              </span>
            )}
            <span className="text-2xl font-bold text-primary">{display(price, product.currency)}</span>
          </div>

          {product.variants.length > 1 && (
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
          )}

          <div className="flex items-center gap-3">
            <Input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
              className="w-20"
            />
            <Button onClick={handleAddToCart} disabled={available <= 0 || setCartItem.isPending}>
              Add to Cart
            </Button>
            <Button variant="outline" size="icon" onClick={toggleWishlist} aria-label="Toggle wishlist">
              <Heart className={isWishlisted ? "h-4 w-4 fill-primary text-primary" : "h-4 w-4"} />
            </Button>
            <Button variant="outline" size="icon" onClick={() => toggleCompare(product.id)} aria-label="Toggle compare">
              <Scale className={isComparing ? "h-4 w-4 text-primary" : "h-4 w-4"} />
            </Button>
          </div>

          {shop && (
            <Link
              href={`/${locale}/store/${shop.slug}`}
              className="flex items-center gap-3 rounded-md border p-3 hover:bg-accent"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <Store className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="flex items-center gap-1 text-sm font-medium">
                  {shop.name}
                  {shop.verified && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
                </p>
                <p className="text-xs text-muted-foreground">Visit store</p>
              </div>
            </Link>
          )}
        </div>
      </div>

      <div className="rounded-lg bg-card p-4 shadow-sm md:p-6">
        <div className="flex gap-6 border-b">
          <button
            type="button"
            onClick={() => setTab("description")}
            className={`border-b-2 px-1 pb-2 text-sm font-semibold ${tab === "description" ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}
          >
            Description
          </button>
          <button
            type="button"
            onClick={() => setTab("reviews")}
            className={`border-b-2 px-1 pb-2 text-sm font-semibold ${tab === "reviews" ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}
          >
            Reviews
          </button>
        </div>
        <div className="pt-4">
          {tab === "description" ? (
            <p className="whitespace-pre-line text-sm text-muted-foreground">{product.description}</p>
          ) : (
            <ProductReviews productId={product.id} />
          )}
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <StorefrontSection title="Related Products">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </StorefrontSection>
      )}
    </div>
  );
}
