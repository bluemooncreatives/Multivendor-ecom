"use client";

import { use } from "react";
import Image from "next/image";
import { CheckCircle2, Store } from "lucide-react";
import { usePublicShop } from "@/lib/hooks/useSeller";
import { useProducts } from "@/lib/hooks/useProducts";
import { ProductCard } from "@/components/storefront/product-card";

export default function PublicShopPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { data: shop, isLoading } = usePublicShop(slug);
  const { data: products } = useProducts({ sellerId: shop?.id, sort: "newest" });

  if (isLoading) return <div className="container py-10 text-muted-foreground">Loading…</div>;
  if (!shop) return <div className="container py-10">Shop not found.</div>;

  return (
    <div className="container space-y-6 py-6">
      <div className="overflow-hidden rounded-lg bg-card shadow-sm">
        <div className="relative h-40 bg-secondary sm:h-56">
          {shop.bannerUrl && <Image src={shop.bannerUrl} alt="" fill className="object-cover" />}
        </div>
        <div className="flex flex-col items-center gap-3 p-6 sm:flex-row">
          <div className="relative -mt-16 h-24 w-24 shrink-0 overflow-hidden rounded-full border-4 border-card bg-muted">
            {shop.logoUrl ? (
              <Image src={shop.logoUrl} alt={shop.name} fill className="object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Store className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="text-center sm:text-left">
            <h1 className="flex items-center justify-center gap-2 text-xl font-bold sm:justify-start">
              {shop.name}
              {shop.verified && <CheckCircle2 className="h-5 w-5 text-primary" />}
            </h1>
            {shop.description && <p className="mt-1 text-sm text-muted-foreground">{shop.description}</p>}
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-card p-4 shadow-sm md:p-6">
        <h2 className="mb-4 border-b pb-3 text-lg font-bold">Products from this seller</h2>
        {products && products.items.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No products listed yet.</p>
        )}
      </div>
    </div>
  );
}
