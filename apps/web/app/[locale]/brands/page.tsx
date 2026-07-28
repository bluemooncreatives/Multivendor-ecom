"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useBrands } from "@/lib/hooks/useProducts";

export default function AllBrandsPage() {
  const locale = useLocale();
  const { data: brands, isLoading } = useBrands();

  return (
    <div className="container space-y-6 py-6">
      <h1 className="text-2xl font-bold">All Brands</h1>
      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : !brands || brands.length === 0 ? (
        <p className="text-muted-foreground">No brands available yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {brands.map((brand) => (
            <Link
              key={brand.id}
              href={`/${locale}/products?brandId=${brand.id}`}
              className="flex flex-col items-center gap-3 rounded-lg bg-card p-4 text-center shadow-sm hover:shadow-md"
            >
              <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-secondary">
                {brand.logoUrl ? (
                  <Image src={brand.logoUrl} alt={brand.name} fill className="object-cover" sizes="64px" />
                ) : (
                  <span className="text-xl font-semibold text-muted-foreground">{brand.name.charAt(0)}</span>
                )}
              </div>
              <span className="text-sm font-medium">{brand.name}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
