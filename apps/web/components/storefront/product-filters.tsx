"use client";

import type { Category, Brand } from "@ecommercemultivendor/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { X, Filter } from "lucide-react";
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
  const hasFilters = Boolean(
    categoryId || brandId || minPrice !== undefined || maxPrice !== undefined,
  );

  const activeFilterCount = [categoryId, brandId, minPrice !== undefined || maxPrice !== undefined]
    .filter(Boolean).length;

  return (
    <aside className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Filter className="h-4 w-4" />
          </div>
          <span className="text-sm font-bold">Filters</span>
          {activeFilterCount > 0 && (
            <Badge className="rounded-full px-2 py-0 text-xs">{activeFilterCount}</Badge>
          )}
        </div>
        {hasFilters && onClear && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 gap-1 rounded-lg px-2 text-xs text-muted-foreground hover:text-destructive"
            onClick={onClear}
          >
            <X className="h-3 w-3" />
            Clear
          </Button>
        )}
      </div>

      {/* Categories */}
      <div className="rounded-2xl border bg-card p-4">
        <p className="mb-3 text-[11px] font-black uppercase tracking-widest text-muted-foreground">
          Categories
        </p>
        <ScrollArea className="max-h-72 pe-2">
          <ul className="space-y-0.5 text-sm">
            <li>
              <button
                type="button"
                onClick={() => onCategoryChange(undefined)}
                className={cn(
                  "w-full rounded-xl px-3 py-2 text-start transition-all hover:bg-accent",
                  !categoryId
                    ? "bg-primary/10 font-semibold text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                All Categories
              </button>
            </li>
            {categories.map((category) => (
              <li key={category.id} style={{ paddingInlineStart: category.level * 10 }}>
                <button
                  type="button"
                  onClick={() => onCategoryChange(category.id)}
                  className={cn(
                    "w-full rounded-xl px-3 py-2 text-start transition-all hover:bg-accent",
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
      </div>

      {/* Price range */}
      <div className="rounded-2xl border bg-card p-4">
        <p className="mb-3 text-[11px] font-black uppercase tracking-widest text-muted-foreground">
          Price Range
        </p>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={0}
            placeholder="Min"
            value={minPrice ?? ""}
            onChange={(e) =>
              onPriceChange(e.target.value ? Number(e.target.value) : undefined, maxPrice)
            }
            className="h-9 rounded-xl"
          />
          <span className="shrink-0 text-sm text-muted-foreground">–</span>
          <Input
            type="number"
            min={0}
            placeholder="Max"
            value={maxPrice ?? ""}
            onChange={(e) =>
              onPriceChange(minPrice, e.target.value ? Number(e.target.value) : undefined)
            }
            className="h-9 rounded-xl"
          />
        </div>
      </div>

      {/* Brands */}
      {brands.length > 0 && (
        <div className="rounded-2xl border bg-card p-4">
          <p className="mb-3 text-[11px] font-black uppercase tracking-widest text-muted-foreground">
            Brands
          </p>
          <ScrollArea className="max-h-56 pe-2">
            <ul className="space-y-0.5 text-sm">
              <li>
                <label className="flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 hover:bg-accent">
                  <input
                    type="radio"
                    className="accent-primary"
                    checked={!brandId}
                    onChange={() => onBrandChange(undefined)}
                  />
                  <span className={!brandId ? "font-semibold text-foreground" : "text-muted-foreground"}>
                    All Brands
                  </span>
                </label>
              </li>
              {brands.map((brand) => (
                <li key={brand.id}>
                  <label className="flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 hover:bg-accent">
                    <input
                      type="radio"
                      className="accent-primary"
                      checked={brandId === brand.id}
                      onChange={() => onBrandChange(brand.id)}
                    />
                    <span
                      className={
                        brandId === brand.id
                          ? "font-semibold text-foreground"
                          : "text-muted-foreground"
                      }
                    >
                      {brand.name}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </ScrollArea>
        </div>
      )}
    </aside>
  );
}
