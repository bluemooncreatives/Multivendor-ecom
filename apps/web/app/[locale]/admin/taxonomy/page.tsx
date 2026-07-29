"use client";

import { useMemo, useState } from "react";
import {
  useAdminCategories,
  useSaveCategory,
  useDeleteCategory,
  useToggleCategoryFeatured,
  useAdminBrands,
  useSaveBrand,
  useDeleteBrand,
  useToggleBrandFeatured,
  downloadCsv,
  type Category,
} from "@/lib/hooks/useAdminCommerce";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function AdminTaxonomyPage() {
  const { data: categories } = useAdminCategories();
  const saveCategory = useSaveCategory();
  const deleteCategory = useDeleteCategory();
  const toggleCategoryFeatured = useToggleCategoryFeatured();

  const { data: brands } = useAdminBrands();
  const saveBrand = useSaveBrand();
  const deleteBrand = useDeleteBrand();
  const toggleBrandFeatured = useToggleBrandFeatured();

  const emptyCategory = { name: "", slug: "", parentId: null as string | null, commissionRate: null as number | null };
  const emptyBrand = { name: "", slug: "", logoUrl: "", categoryIds: [] as string[] };

  const [category, setCategory] = useState<typeof emptyCategory & { id?: string }>(emptyCategory);
  const [brand, setBrand] = useState<typeof emptyBrand & { id?: string }>(emptyBrand);

  // Only levels 0 and 1 can take children — level 2 is the deepest the API allows.
  const parentOptions = useMemo(() => (categories ?? []).filter((c) => c.level < 2), [categories]);

  const byParent = useMemo(() => {
    const map = new Map<string, Category[]>();
    for (const c of categories ?? []) {
      const key = c.parentId ?? "root";
      map.set(key, [...(map.get(key) ?? []), c]);
    }
    return map;
  }, [categories]);

  function renderTree(parentId: string) {
    const children = byParent.get(parentId) ?? [];
    return children.map((c) => (
      <div key={c.id} className="ms-4 border-s ps-3">
        <div className="flex flex-wrap items-center justify-between gap-2 py-1 text-sm">
          <span className={c.active ? "" : "text-muted-foreground line-through"}>{c.name}</span>
          <div className="flex items-center gap-1">
            {c.featured && <Badge variant="outline">Featured</Badge>}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleCategoryFeatured.mutate({ id: c.id, featured: !c.featured })}
            >
              {c.featured ? "Unfeature" : "Feature"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setCategory({
                  id: c.id,
                  name: c.name,
                  slug: c.slug,
                  parentId: c.parentId,
                  commissionRate: c.commissionRate,
                })
              }
            >
              Edit
            </Button>
            <Button variant="ghost" size="sm" onClick={() => deleteCategory.mutate(c.id)}>
              Deactivate
            </Button>
          </div>
        </div>
        {renderTree(c.id)}
      </div>
    ));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Categories & brands</h1>
        <Button variant="outline" size="sm" onClick={() => downloadCsv("/catalog/admin/categories/export", "categories.csv")}>
          Export categories CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{category.id ? `Edit ${category.name}` : "Add a category"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4 md:grid-cols-5"
            onSubmit={(e) => {
              e.preventDefault();
              saveCategory.mutate(category, { onSuccess: () => setCategory(emptyCategory) });
            }}
          >
            <div className="space-y-1">
              <Label htmlFor="cat-name">Name</Label>
              <Input
                id="cat-name"
                value={category.name}
                onChange={(e) =>
                  setCategory((prev) => ({
                    ...prev,
                    name: e.target.value,
                    // Keep the slug in step with the name until it's edited by hand.
                    slug: prev.slug === slugify(prev.name) || !prev.slug ? slugify(e.target.value) : prev.slug,
                  }))
                }
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="cat-slug">Slug</Label>
              <Input id="cat-slug" value={category.slug} onChange={(e) => setCategory({ ...category, slug: e.target.value })} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="cat-parent">Parent</Label>
              <select
                id="cat-parent"
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={category.parentId ?? ""}
                onChange={(e) => setCategory({ ...category, parentId: e.target.value || null })}
              >
                <option value="">Top level</option>
                {parentOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {"— ".repeat(c.level)}
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="cat-commission">Commission %</Label>
              <Input
                id="cat-commission"
                type="number"
                min={0}
                max={100}
                step="0.01"
                placeholder="Global rate"
                value={category.commissionRate ?? ""}
                onChange={(e) =>
                  setCategory({ ...category, commissionRate: e.target.value === "" ? null : Number(e.target.value) })
                }
              />
            </div>
            <div className="flex items-end gap-2">
              <Button type="submit" disabled={saveCategory.isPending}>
                {category.id ? "Save" : "Add"}
              </Button>
              {category.id && (
                <Button type="button" variant="outline" onClick={() => setCategory(emptyCategory)}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Category tree</CardTitle>
        </CardHeader>
        <CardContent>{renderTree("root")}</CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Brands</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="grid gap-4 md:grid-cols-5"
            onSubmit={(e) => {
              e.preventDefault();
              saveBrand.mutate(brand, { onSuccess: () => setBrand(emptyBrand) });
            }}
          >
            <div className="space-y-1">
              <Label htmlFor="brand-name">Name</Label>
              <Input
                id="brand-name"
                value={brand.name}
                onChange={(e) =>
                  setBrand((prev) => ({
                    ...prev,
                    name: e.target.value,
                    slug: prev.slug === slugify(prev.name) || !prev.slug ? slugify(e.target.value) : prev.slug,
                  }))
                }
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="brand-slug">Slug</Label>
              <Input id="brand-slug" value={brand.slug} onChange={(e) => setBrand({ ...brand, slug: e.target.value })} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="brand-logo">Logo URL</Label>
              <Input id="brand-logo" value={brand.logoUrl ?? ""} onChange={(e) => setBrand({ ...brand, logoUrl: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="brand-categories">Categories</Label>
              <select
                id="brand-categories"
                multiple
                className="h-24 w-full rounded-md border bg-background px-3 py-1 text-sm"
                value={brand.categoryIds}
                onChange={(e) =>
                  setBrand({ ...brand, categoryIds: Array.from(e.target.selectedOptions, (o) => o.value) })
                }
              >
                {(categories ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {"— ".repeat(c.level)}
                    {c.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">Leave empty to offer this brand everywhere.</p>
            </div>
            <div className="flex items-end gap-2">
              <Button type="submit" disabled={saveBrand.isPending}>
                {brand.id ? "Save" : "Add"}
              </Button>
              {brand.id && (
                <Button type="button" variant="outline" onClick={() => setBrand(emptyBrand)}>
                  Cancel
                </Button>
              )}
            </div>
          </form>

          <div className="space-y-2">
            {brands?.map((b) => (
              <div key={b.id} className="flex items-center justify-between rounded-md border p-2 text-sm">
                <span className={b.active ? "" : "text-muted-foreground line-through"}>{b.name}</span>
                <div className="flex items-center gap-1">
                  {b.featured && <Badge variant="outline">Featured</Badge>}
                  <Button variant="ghost" size="sm" onClick={() => toggleBrandFeatured.mutate({ id: b.id, featured: !b.featured })}>
                    {b.featured ? "Unfeature" : "Feature"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setBrand({
                        id: b.id,
                        name: b.name,
                        slug: b.slug,
                        logoUrl: b.logoUrl ?? "",
                        categoryIds: b.categoryIds ?? [],
                      })
                    }
                  >
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteBrand.mutate(b.id)}>
                    Deactivate
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
