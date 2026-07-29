"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLocale } from "next-intl";
import { MapPin } from "lucide-react";
import { useClassifieds, type ClassifiedFilters } from "@/lib/hooks/useStorefront";
import { useCategories } from "@/lib/hooks/useProducts";
import { useDisplayCurrency } from "@/lib/hooks/useDisplayCurrency";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ClassifiedsPage() {
  const locale = useLocale();
  const [filters, setFilters] = useState<ClassifiedFilters>({ page: 1 });
  const { data, isLoading } = useClassifieds(filters);
  const { data: categories } = useCategories();
  const { display } = useDisplayCurrency();

  // Every filter change resets to page 1 — staying on page 4 of a narrower
  // result set would show an empty list.
  const patch = (next: Partial<ClassifiedFilters>) => setFilters({ ...filters, ...next, page: 1 });

  return (
    <div className="container space-y-6 py-6">
      <div>
        <h1 className="text-2xl font-bold">Classifieds</h1>
        <p className="text-sm text-muted-foreground">Items listed directly by other customers.</p>
      </div>

      <div className="grid gap-3 rounded-lg bg-card p-4 shadow-sm sm:grid-cols-3">
        <div className="space-y-1">
          <Label htmlFor="q">Search</Label>
          <Input id="q" placeholder="What are you looking for?" value={filters.q ?? ""} onChange={(e) => patch({ q: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="category">Category</Label>
          <select
            id="category"
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            value={filters.categoryId ?? ""}
            onChange={(e) => patch({ categoryId: e.target.value || undefined })}
          >
            <option value="">All categories</option>
            {categories?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="location">City</Label>
          <Input id="location" placeholder="Any city" value={filters.location ?? ""} onChange={(e) => patch({ location: e.target.value })} />
        </div>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : !data || data.items.length === 0 ? (
        <p className="text-muted-foreground">No listings match those filters.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {data.items.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <Link href={`/${locale}/classifieds/${item.slug}`}>
                  <div className="relative aspect-square bg-muted">
                    {item.images?.[0] && <Image src={item.images[0]} alt={item.title} fill className="object-cover" />}
                    <Badge variant="secondary" className="absolute start-2 top-2 capitalize">
                      {item.condition}
                    </Badge>
                  </div>
                  <CardContent className="space-y-1 p-3">
                    <p className="line-clamp-2 text-sm font-medium">{item.title}</p>
                    <p className="font-bold text-primary">{display(item.price, item.currency)}</p>
                    {item.location && (
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {item.location}
                      </p>
                    )}
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>

          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={(filters.page ?? 1) <= 1}
              onClick={() => setFilters({ ...filters, page: (filters.page ?? 1) - 1 })}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {data.page} of {Math.max(1, Math.ceil(data.total / data.pageSize))}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={data.page * data.pageSize >= data.total}
              onClick={() => setFilters({ ...filters, page: (filters.page ?? 1) + 1 })}
            >
              Next
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
