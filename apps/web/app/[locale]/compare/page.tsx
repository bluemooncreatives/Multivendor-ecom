"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale } from "next-intl";
import { Scale, X } from "lucide-react";
import { useCompareStore } from "@/lib/store";
import { useProductsByIds, useCategories, useBrands } from "@/lib/hooks/useProducts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/loading-state";
import { RatingStars } from "@/components/shared/rating-stars";
import { formatPrice } from "@/lib/format";
import type { Product } from "@ecommercemultivendor/types";

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
  const clear = useCompareStore((s) => s.clear);
  const { data: products, isLoading } = useProductsByIds(productIds);
  const { data: categories } = useCategories();
  const { data: brands } = useBrands();

  if (productIds.length === 0) {
    return (
      <div className="container py-16">
        <EmptyState
          icon={Scale}
          title="No products to compare"
          description="You haven't added any products to compare yet."
          action={
            <Button asChild>
              <Link href={`/${locale}/products`}>Browse products</Link>
            </Button>
          }
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container space-y-6 py-8">
        <PageHeader title="Compare products" />
        <TableSkeleton rows={6} />
      </div>
    );
  }

  const compared = (products ?? []) as ComparableProduct[];
  const nameById = (list: { id: string; name: string }[] | undefined, id?: string | null) =>
    (id && list?.find((entry) => entry.id === id)?.name) || "—";

  const attributeNames = [
    ...new Set(compared.flatMap((p) => p.variants.flatMap((v) => Object.keys(v.attributes ?? {})))),
  ].sort();

  const rows: { label: string; render: (p: ComparableProduct) => React.ReactNode }[] = [
    { label: "Price", render: (p) => <span className="font-semibold text-primary">{formatPrice(p.basePrice, p.currency)}</span> },
    { label: "Rating", render: (p) => <RatingStars value={p.ratingAverage} count={p.ratingCount} size="sm" /> },
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
    { label: "Description", render: (p) => <span className="line-clamp-3 text-xs text-muted-foreground">{p.description || "—"}</span> },
  ];

  return (
    <div className="container space-y-6 py-8">
      <PageHeader
        title="Compare products"
        description={`Comparing ${compared.length} product(s) side by side.`}
        actions={
          <Button variant="outline" size="sm" onClick={clear}>
            Clear all
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <Table className="min-w-[640px]">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-36" />
              {compared.map((product) => (
                <TableHead key={product.id} className="p-4 text-center align-top normal-case tracking-normal">
                  <div className="relative mx-auto mb-2 h-24 w-24 overflow-hidden rounded-lg border bg-muted">
                    {product.images[0] && <Image src={product.images[0]} alt={product.name} fill className="object-cover" />}
                  </div>
                  <Link href={`/${locale}/product/${product.slug}`} className="block text-sm font-semibold text-foreground hover:text-primary">
                    {product.name}
                  </Link>
                  <Button variant="ghost" size="sm" className="mt-1.5 text-muted-foreground" onClick={() => remove(product.id)}>
                    <X className="h-3 w-3" /> Remove
                  </Button>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.label}>
                <TableCell className="font-medium text-muted-foreground">{row.label}</TableCell>
                {compared.map((product) => (
                  <TableCell key={product.id} className="text-center">
                    {row.render(product)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
