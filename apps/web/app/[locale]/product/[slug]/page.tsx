"use client";

import { use, useMemo, useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import { useLocale } from "next-intl";
import { useProduct, useProducts } from "@/lib/hooks/useProducts";
import { useSetCartItem } from "@/lib/hooks/useCart";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ProductCard } from "@/components/storefront/product-card";
import { StorefrontSection } from "@/components/storefront/section";
import { formatPrice } from "@/lib/format";

export default function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const locale = useLocale();
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

  if (isLoading) return <div className="container py-10 text-muted-foreground">Loading…</div>;
  if (!product) return <div className="container py-10">Product not found.</div>;

  const available = variant?.stock ?? 0;
  const comparePrice = variant?.comparePrice;
  const price = variant?.price ?? product.basePrice;
  const hasDiscount = !!comparePrice && comparePrice > price;
  const relatedProducts = (related?.items ?? []).filter((p) => p.id !== product.id).slice(0, 5);

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
                {formatPrice(comparePrice as number, product.currency, locale)}
              </span>
            )}
            <span className="text-2xl font-bold text-primary">{formatPrice(price, product.currency, locale)}</span>
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
          </div>
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
            <p className="text-sm text-muted-foreground">No reviews yet.</p>
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
