"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale } from "next-intl";
import { X } from "lucide-react";
import { useCompareStore } from "@/lib/store";
import { useProductsByIds } from "@/lib/hooks/useProducts";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import type { Product } from "@ecommercemultivendor/types";

export default function ComparePage() {
  const locale = useLocale();
  const productIds = useCompareStore((s) => s.productIds);
  const remove = useCompareStore((s) => s.remove);
  const { data: products, isLoading } = useProductsByIds(productIds);

  if (productIds.length === 0) {
    return <div className="container py-16 text-center text-muted-foreground">You haven't added any products to compare yet.</div>;
  }

  if (isLoading) return <div className="container py-16 text-muted-foreground">Loading…</div>;

  const rows = [
    { label: "Price", render: (p: Product) => formatPrice(p.basePrice, p.currency) },
    { label: "Rating", render: (p: Product) => `${p.ratingAverage.toFixed(1)} (${p.ratingCount})` },
    { label: "Variants", render: (p: Product) => p.variants.length },
    { label: "Description", render: (p: Product) => p.description || "—" },
  ];

  return (
    <div className="container space-y-6 py-10">
      <h1 className="text-2xl font-bold">Compare products</h1>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr>
              <th className="w-32" />
              {products?.map((product) => (
                <th key={product.id} className="p-3 text-center align-top">
                  <div className="relative mx-auto mb-2 h-24 w-24 overflow-hidden rounded-md bg-muted">
                    {product.images[0] && <Image src={product.images[0]} alt={product.name} fill className="object-cover" />}
                  </div>
                  <Link href={`/${locale}/product/${product.slug}`} className="font-medium hover:underline">
                    {product.name}
                  </Link>
                  <Button variant="ghost" size="sm" className="mt-1" onClick={() => remove(product.id)}>
                    <X className="me-1 h-3 w-3" /> Remove
                  </Button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-t">
                <td className="p-3 font-medium text-muted-foreground">{row.label}</td>
                {products?.map((product) => (
                  <td key={product.id} className="p-3 text-center">
                    {row.render(product)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
