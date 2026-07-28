"use client";

import { use, useMemo, useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import { useLocale } from "next-intl";
import { useProduct } from "@/lib/hooks/useProducts";
import { useSetCartItem } from "@/lib/hooks/useCart";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/format";

export default function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const locale = useLocale();
  const { data: product, isLoading } = useProduct(slug);
  const setCartItem = useSetCartItem();
  const [variantSku, setVariantSku] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  const variant = useMemo(
    () => product?.variants.find((v) => v.sku === (variantSku ?? product.variants[0]?.sku)),
    [product, variantSku],
  );

  if (isLoading) return <div className="container py-10 text-muted-foreground">Loading…</div>;
  if (!product) return <div className="container py-10">Product not found.</div>;

  const available = variant?.stock ?? 0;

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
    <div className="container grid gap-8 py-10 md:grid-cols-2">
      <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
        {product.images[0] && <Image src={product.images[0]} alt={product.name} fill className="object-cover" />}
      </div>

      <div className="space-y-4">
        <h1 className="text-2xl font-bold">{product.name}</h1>
        <p className="text-xl font-semibold">{formatPrice(variant?.price ?? product.basePrice, product.currency, locale)}</p>

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

        <Badge variant={available > 0 ? "secondary" : "destructive"}>
          {available > 0 ? `${available} in stock` : "Out of stock"}
        </Badge>

        <div className="flex items-center gap-3">
          <Input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
            className="w-20"
          />
          <Button onClick={handleAddToCart} disabled={available <= 0 || setCartItem.isPending}>
            Add to cart
          </Button>
        </div>

        <p className="whitespace-pre-line text-sm text-muted-foreground">{product.description}</p>
      </div>
    </div>
  );
}
