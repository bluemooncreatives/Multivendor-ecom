"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import toast from "react-hot-toast";
import { useCategories } from "@/lib/hooks/useProducts";
import {
  useSellerProducts,
  useCreateSellerProduct,
  useCloneSellerProduct,
  useDeleteSellerProduct,
} from "@/lib/hooks/useSeller";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/format";

const EMPTY = {
  name: "",
  slug: "",
  categoryId: "",
  description: "",
  basePrice: 0,
  stock: 0,
  isDigital: false,
  digitalFileUrl: "",
};

export default function SellerProductsPage() {
  const locale = useLocale();
  const { data: categories } = useCategories();
  const { data: products, isLoading } = useSellerProducts();
  const createProduct = useCreateSellerProduct();
  const cloneProduct = useCloneSellerProduct();
  const deleteProduct = useDeleteSellerProduct();
  const [form, setForm] = useState(EMPTY);
  const [showForm, setShowForm] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createProduct.mutateAsync({
        name: form.name,
        slug: form.slug,
        categoryId: form.categoryId,
        description: form.description,
        images: [],
        basePrice: form.basePrice,
        tags: [],
        isDigital: form.isDigital,
        digitalFileUrl: form.isDigital ? form.digitalFileUrl : undefined,
        variants: [
          {
            sku: form.slug || `sku-${Date.now()}`,
            attributes: {},
            price: form.basePrice,
            // Digital goods aren't stock-limited the way physical inventory is —
            // a large fixed count stands in for "always available".
            stock: form.isDigital ? 999999 : form.stock,
          },
        ],
      });
      setForm(EMPTY);
      setShowForm(false);
      toast.success("Product created — pending admin approval");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Could not create product");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/${locale}/seller/products/bulk-upload`}>Bulk upload</Link>
          </Button>
          <Button variant="outline" onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Cancel" : "Add product"}
          </Button>
        </div>
      </div>

      {showForm && (
        <Card>
          <CardContent className="pt-6">
            <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <select
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  required
                >
                  <option value="">Select category</option>
                  {categories?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Price</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.basePrice}
                  onChange={(e) => setForm({ ...form, basePrice: Number(e.target.value) })}
                  required
                />
              </div>
              <div className="flex items-end gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.isDigital}
                    onChange={(e) => setForm({ ...form, isDigital: e.target.checked })}
                  />
                  Digital product
                </label>
              </div>
              {form.isDigital ? (
                <div className="space-y-2 sm:col-span-2">
                  <Label>Digital file URL</Label>
                  <Input
                    value={form.digitalFileUrl}
                    onChange={(e) => setForm({ ...form, digitalFileUrl: e.target.value })}
                    placeholder="Link to the file buyers will download"
                    required
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Stock</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                    required
                  />
                </div>
              )}
              <div className="space-y-2 sm:col-span-2">
                <Label>Description</Label>
                <textarea
                  className="w-full rounded-md border p-2 text-sm"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <Button type="submit" className="sm:col-span-2" disabled={createProduct.isPending}>
                Create product
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : !products || products.length === 0 ? (
        <p className="text-muted-foreground">No products yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {products.map((product) => (
            <Card key={product.id}>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">{product.name}</CardTitle>
                <Badge variant={product.published ? "secondary" : "outline"}>
                  {product.published ? "Live" : "Pending approval"}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="font-semibold">{formatPrice(product.basePrice, product.currency)}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => cloneProduct.mutate(product.id)}>
                    Clone
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteProduct.mutate(product.id)}>
                    Unpublish
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
