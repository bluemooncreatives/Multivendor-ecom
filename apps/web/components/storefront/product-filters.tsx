"use client";

import type { Category, Brand } from "@ecommercemultivendor/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export function ProductFilters({
  categories,
  categoryId,
  onCategoryChange,
  brands,
  brandId,
  onBrandChange,
  minPrice,
  maxPrice,
  onPriceChange,
  onClear,
}: {
  categories: Category[];
  categoryId?: string;
  onCategoryChange: (id?: string) => void;
  brands: Brand[];
  brandId?: string;
  onBrandChange: (id?: string) => void;
  minPrice?: number;
  maxPrice?: number;
  onPriceChange: (min?: number, max?: number) => void;
  onClear?: () => void;
}) {
  const hasFilters = Boolean(categoryId || brandId || minPrice !== undefined || maxPrice !== undefined);

  return (
      <aside className="space-y-4">
        {hasFilters && onClear && (
          <Button type="button" variant="outline" size="sm" className="w-full" onClick={onClear}>
            Clear all filters
          </Button>
        )}

        <Card>
          <CardHeader className="pb-3 pt-4">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Categories</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ScrollArea className="max-h-64 pe-2">
              <ul className="space-y-1 text-sm">
                <li>
                  <button
                    type="button"
                    onClick={() => onCategoryChange(undefined)}
                    className={cn(
                      "w-full rounded-md px-2.5 py-1.5 text-start transition-colors hover:bg-accent",
                      !categoryId ? "bg-primary/10 font-semibold text-primary" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    All Categories
                  </button>
                </li>
                {categories.map((category) => (
                  <li key={category.id} style={{ paddingInlineStart: category.level * 12 }}>
                    <button
                      type="button"
                      onClick={() => onCategoryChange(category.id)}
                      className={cn(
                        "w-full rounded-md px-2.5 py-1.5 text-start transition-colors hover:bg-accent",
                        categoryId === category.id
                          ? "bg-primary/10 font-semibold text-primary"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {category.name}
                    </button>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3 pt-4">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Price Range</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                placeholder="Min"
                value={minPrice ?? ""}
                onChange={(e) => onPriceChange(e.target.value ? Number(e.target.value) : undefined, maxPrice)}
                className="h-9"
              />
              <span className="text-muted-foreground">–</span>
              <Input
                type="number"
                min={0}
                placeholder="Max"
                value={maxPrice ?? ""}
                onChange={(e) => onPriceChange(minPrice, e.target.value ? Number(e.target.value) : undefined)}
                className="h-9"
              />
            </div>
          </CardContent>
        </Card>

        {brands.length > 0 && (
        <Card>
          <CardHeader className="pb-3 pt-4">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Brands</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ScrollArea className="max-h-56 pe-2">
              <ul className="space-y-1.5 text-sm">
                <li>
                  <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 hover:bg-accent">
                    <input
                      type="radio"
                      className="accent-primary"
                      checked={!brandId}
                      onChange={() => onBrandChange(undefined)}
                    />
                    <span className={!brandId ? "font-medium text-foreground" : "text-muted-foreground"}>All Brands</span>
                  </label>
                </li>
                {brands.map((brand) => (
                  <li key={brand.id}>
                    <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 hover:bg-accent">
                      <input
                        type="radio"
                        className="accent-primary"
                        checked={brandId === brand.id}
                        onChange={() => onBrandChange(brand.id)}
                      />
                      <span className={brandId === brand.id ? "font-medium text-foreground" : "text-muted-foreground"}>
                        {brand.name}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </CardContent>
        </Card>
        )}
      </aside>
      );
}
