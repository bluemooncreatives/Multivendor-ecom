"use client";

import { useMemo, useState } from "react";
import { Download } from "lucide-react";
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
import { NativeSelect } from "@/components/ui/native-select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { FormField } from "@/components/shared/form-field";
import { slugify } from "@/lib/utils";

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
        <div className="flex flex-wrap items-center justify-between gap-2 py-1.5 text-sm">
          <span className={c.active ? "font-medium" : "text-muted-foreground line-through"}>{c.name}</span>
          <div className="flex items-center gap-1">
            {c.featured && <Badge variant="info">Featured</Badge>}
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
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => deleteCategory.mutate(c.id)}>
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
      <PageHeader
        title="Categories & brands"
        description="Build your 3-level category tree, commission overrides, and brand associations."
        actions={
          <Button variant="outline" size="sm" onClick={() => downloadCsv("/catalog/admin/categories/export", "categories.csv")}>
            <Download className="h-4 w-4" />
            Export categories CSV
          </Button>
        }
      />

      <Card>
        <CardHeader className="border-b bg-muted/20 pb-3.5">
          <CardTitle className="text-base">{category.id ? `Edit ${category.name}` : "Add a category"}</CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          <form
            className="grid gap-4 md:grid-cols-5"
            onSubmit={(e) => {
              e.preventDefault();
              saveCategory.mutate(category, { onSuccess: () => setCategory(emptyCategory) });
            }}
          >
            <FormField label="Name" htmlFor="cat-name" required>
              <Input
                id="cat-name"
                value={category.name}
                onChange={(e) =>
                  setCategory((prev) => ({
                    ...prev,
                    name: e.target.value,
                    slug: prev.slug === slugify(prev.name) || !prev.slug ? slugify(e.target.value) : prev.slug,
                  }))
                }
                required
              />
            </FormField>
            <FormField label="Slug" htmlFor="cat-slug" required>
              <Input id="cat-slug" value={category.slug} onChange={(e) => setCategory({ ...category, slug: e.target.value })} required />
            </FormField>
            <FormField label="Parent" htmlFor="cat-parent">
              <NativeSelect
                id="cat-parent"
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
              </NativeSelect>
            </FormField>
            <FormField label="Commission %" htmlFor="cat-commission">
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
            </FormField>
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
        <CardHeader className="border-b bg-muted/20 pb-3.5">
          <CardTitle className="text-base">Category tree</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">{renderTree("root")}</CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b bg-muted/20 pb-3.5">
          <CardTitle className="text-base">Brands</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 pt-5">
          <form
            className="grid gap-4 md:grid-cols-5"
            onSubmit={(e) => {
              e.preventDefault();
              saveBrand.mutate(brand, { onSuccess: () => setBrand(emptyBrand) });
            }}
          >
            <FormField label="Name" htmlFor="brand-name" required>
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
            </FormField>
            <FormField label="Slug" htmlFor="brand-slug" required>
              <Input id="brand-slug" value={brand.slug} onChange={(e) => setBrand({ ...brand, slug: e.target.value })} required />
            </FormField>
            <FormField label="Logo URL" htmlFor="brand-logo">
              <Input id="brand-logo" value={brand.logoUrl ?? ""} onChange={(e) => setBrand({ ...brand, logoUrl: e.target.value })} />
            </FormField>
            <FormField label="Categories" htmlFor="brand-categories" hint="Leave empty to offer everywhere.">
              <NativeSelect
                id="brand-categories"
                multiple
                className="h-24"
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
              </NativeSelect>
            </FormField>
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

          <div className="space-y-2 border-t pt-4">
            {brands?.map((b) => (
              <div key={b.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm">
                <span className={b.active ? "font-medium" : "text-muted-foreground line-through"}>{b.name}</span>
                <div className="flex items-center gap-1">
                  {b.featured && <Badge variant="info">Featured</Badge>}
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
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => deleteBrand.mutate(b.id)}>
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
