"use client";

import type { Category, Brand } from "@ecommercemultivendor/types";

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
}) {
  return (
    <aside className="space-y-3">
      <div className="rounded-lg bg-card p-4 shadow-sm">
        <h3 className="mb-3 text-center text-sm font-bold uppercase tracking-wide">Categories</h3>
        <ul className="space-y-1 text-sm">
          <li>
            <button
              type="button"
              onClick={() => onCategoryChange(undefined)}
              className={`w-full rounded px-2 py-1 text-left hover:bg-accent ${!categoryId ? "font-semibold text-primary" : ""}`}
            >
              All Categories
            </button>
          </li>
          {categories.map((category) => (
            <li key={category.id} style={{ paddingInlineStart: category.level * 12 }}>
              <button
                type="button"
                onClick={() => onCategoryChange(category.id)}
                className={`w-full rounded px-2 py-1 text-left hover:bg-accent ${categoryId === category.id ? "font-semibold text-primary" : ""}`}
              >
                {category.name}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-lg bg-card p-4 shadow-sm">
        <h3 className="mb-3 text-center text-sm font-bold uppercase tracking-wide">Price Range</h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={minPrice ?? ""}
            onChange={(e) => onPriceChange(e.target.value ? Number(e.target.value) : undefined, maxPrice)}
            className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
          />
          <span className="text-muted-foreground">–</span>
          <input
            type="number"
            placeholder="Max"
            value={maxPrice ?? ""}
            onChange={(e) => onPriceChange(minPrice, e.target.value ? Number(e.target.value) : undefined)}
            className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
          />
        </div>
      </div>

      {brands.length > 0 && (
        <div className="rounded-lg bg-card p-4 shadow-sm">
          <h3 className="mb-3 text-center text-sm font-bold uppercase tracking-wide">Brands</h3>
          <ul className="space-y-1 text-sm">
            <li>
              <label className="flex cursor-pointer items-center gap-2">
                <input type="radio" checked={!brandId} onChange={() => onBrandChange(undefined)} />
                All Brands
              </label>
            </li>
            {brands.map((brand) => (
              <li key={brand.id}>
                <label className="flex cursor-pointer items-center gap-2">
                  <input type="radio" checked={brandId === brand.id} onChange={() => onBrandChange(brand.id)} />
                  {brand.name}
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}
