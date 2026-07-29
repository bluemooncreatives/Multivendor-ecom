"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale } from "next-intl";
import { X } from "lucide-react";
import { useCompareStore } from "@/lib/store";
import { useProductsByIds, useCategories, useBrands } from "@/lib/hooks/useProducts";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import type { Product } from "@ecommercemultivendor/types";

// Fields the API adds beyond the shared Product type.
type ComparableProduct = Product & {
  brandId?: string | null;
  unit?: string;
  shippingType?: "free" | "flat_rate";
  refundable?: boolean;
};

export default function ComparePage() {
  const locale = useLocale();
  const productIds = useCompareStore((s) => s.productIds);
  const remove = useCompareStore((s) => s.remove);
  const { data: products, isLoading } = useProductsByIds(productIds);
  const { data: categories } = useCategories();
  const { data: brands } = useBrands();

  if (productIds.length === 0) {
    return <div className="container py-16 text-center text-muted-foreground">You haven't added any products to compare yet.</div>;
  }

  if (isLoading) return <div className="container py-16 text-muted-foreground">Loading…</div>;

  const compared = (products ?? []) as ComparableProduct[];
  const nameById = (list: { id: string; name: string }[] | undefined, id?: string | null) =>
    (id && list?.find((entry) => entry.id === id)?.name) || "—";

  // Every distinct variant attribute across the compared products gets its own
  // row, so "Size" appears once even if only some of them define it.
  const attributeNames = [
    ...new Set(compared.flatMap((p) => p.variants.flatMap((v) => Object.keys(v.attributes ?? {})))),
  ].sort();

  const rows: { label: string; render: (p: ComparableProduct) => React.ReactNode }[] = [
    { label: "Price", render: (p) => formatPrice(p.basePrice, p.currency) },
    { label: "Rating", render: (p) => `${p.ratingAverage.toFixed(1)} (${p.ratingCount})` },
    { label: "Category", render: (p) => nameById(categories, p.categoryId) },
    { label: "Brand", render: (p) => nameById(brands, p.brandId) },
    { label: "Unit", render: (p) => p.unit || "—" },
    ...attributeNames.map((name) => ({
      label: name,
      render: (p: ComparableProduct) => {
        const values = [...new Set(p.variants.map((v) => v.attributes?.[name]).filter(Boolean))];
        return values.length > 0 ? values.join(", ") : "—";
      },
    })),
    { label: "Variants", render: (p) => p.variants.length },
    { label: "Shipping", render: (p) => (p.shippingType === "flat_rate" ? "Charged" : "Free") },
    { label: "Refundable", render: (p) => (p.refundable === false ? "No" : "Yes") },
    { label: "Description", render: (p) => p.description || "—" },
  ];

  return (
    <div className="container space-y-6 py-10">
      <h1 className="text-2xl font-bold">Compare products</h1>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr>
              <th className="w-32" />
              {compared.map((product) => (
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
                {compared.map((product) => (
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
