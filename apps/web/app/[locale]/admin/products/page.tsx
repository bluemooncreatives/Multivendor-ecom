"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { usePendingProducts, useModerateProduct } from "@/lib/hooks/useAdmin";
import {
  useAdminProducts,
  useCreateAdminProduct,
  useUpdateAdminProduct,
  useUpdateProductFlags,
  downloadCsv,
  type AdminProduct,
} from "@/lib/hooks/useAdminCommerce";
import { ProductForm, toFormInput, emptyProduct } from "@/components/catalog/product-form";
import type { ProductFormInput } from "@/lib/hooks/useCatalogForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatPrice } from "@/lib/format";

function apiError(err: unknown, fallback: string) {
  return (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? fallback;
}

export default function AdminProductsPage() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Products</h1>
        <Button variant="outline" size="sm" onClick={() => downloadCsv("/catalog/admin/products/export", "products.csv")}>
          Export CSV
        </Button>
      </div>

      <Tabs defaultValue="moderation">
        <TabsList>
          <TabsTrigger value="moderation">Moderation queue</TabsTrigger>
          <TabsTrigger value="catalog">All products</TabsTrigger>
          <TabsTrigger value="in-house">Add In-House product</TabsTrigger>
        </TabsList>

        <TabsContent value="moderation">
          <ModerationQueue />
        </TabsContent>
        <TabsContent value="catalog">
          <CatalogBrowser />
        </TabsContent>
        <TabsContent value="in-house">
          <InHouseProductForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ModerationQueue() {
  const { data: products, isLoading } = usePendingProducts();
  const moderate = useModerateProduct();

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (!products || products.length === 0) return <p className="text-muted-foreground">No products awaiting review.</p>;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {products.map((product: AdminProduct) => (
        <Card key={product.id}>
          <CardHeader>
            <CardTitle className="text-base">{product.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-semibold">{formatPrice(product.basePrice, product.currency)}</p>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => moderate.mutate({ id: product.id, approved: true })}>
                Approve
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => moderate.mutate({ id: product.id, approved: false })}
              >
                Reject
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function CatalogBrowser() {
  const [filters, setFilters] = useState<{ q: string; approvalStatus: string; page: number }>({
    q: "",
    approvalStatus: "",
    page: 1,
  });
  const { data, isLoading } = useAdminProducts({
    q: filters.q || undefined,
    approvalStatus: filters.approvalStatus || undefined,
    page: filters.page,
  });
  const updateFlags = useUpdateProductFlags();
  const updateProduct = useUpdateAdminProduct();

  const [editing, setEditing] = useState<{ id: string; form: ProductFormInput } | null>(null);

  async function handleSave(value: ProductFormInput) {
    if (!editing) return;
    try {
      await updateProduct.mutateAsync({ ...value, id: editing.id });
      setEditing(null);
      toast.success("Product saved");
    } catch (err) {
      toast.error(apiError(err, "Could not save product"));
    }
  }

  if (editing) {
    return (
      <div className="space-y-4">
        <Button variant="outline" size="sm" onClick={() => setEditing(null)}>
          Back to catalog
        </Button>
        <ProductForm
          scope="admin"
          value={editing.form}
          onChange={(form) => setEditing({ ...editing, form })}
          onSubmit={handleSave}
          submitting={updateProduct.isPending}
          submitLabel="Save changes"
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Input
          className="max-w-xs"
          placeholder="Search by name"
          value={filters.q}
          onChange={(e) => setFilters({ ...filters, q: e.target.value, page: 1 })}
        />
        <select
          className="h-10 rounded-md border bg-background px-3 text-sm"
          value={filters.approvalStatus}
          onChange={(e) => setFilters({ ...filters, approvalStatus: e.target.value, page: 1 })}
        >
          <option value="">Any status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : !data || data.items.length === 0 ? (
        <p className="text-muted-foreground">No products match those filters.</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b text-xs uppercase text-muted-foreground">
                  <th className="py-2 text-start">Product</th>
                  <th className="py-2 text-start">Owner</th>
                  <th className="py-2 text-start">Price</th>
                  <th className="py-2 text-start">Status</th>
                  <th className="py-2 text-start">Placement</th>
                  <th className="py-2 text-start">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((product) => (
                  <tr key={product.id} className="border-b">
                    <td className="py-2 pe-2">{product.name}</td>
                    <td className="py-2 pe-2">
                      <Badge variant="outline">{product.addedBy === "admin" ? "In House" : "Seller"}</Badge>
                    </td>
                    <td className="py-2 pe-2">{formatPrice(product.basePrice, product.currency)}</td>
                    <td className="py-2 pe-2">
                      <Badge variant={product.published ? "secondary" : "outline"}>
                        {product.published ? "Live" : product.approvalStatus}
                      </Badge>
                    </td>
                    <td className="py-2 pe-2">
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateFlags.mutate({ id: product.id, featured: !product.featured })}
                        >
                          {product.featured ? "Unfeature" : "Feature"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateFlags.mutate({ id: product.id, todaysDeal: !product.todaysDeal })}
                        >
                          {product.todaysDeal ? "Undeal" : "Deal"}
                        </Button>
                      </div>
                    </td>
                    <td className="py-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditing({ id: product.id, form: toFormInput(product) })}
                      >
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={filters.page <= 1}
              onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {data.page} · {data.total} products
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={data.items.length === 0}
              onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
            >
              Next
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function InHouseProductForm() {
  const createProduct = useCreateAdminProduct();
  const [form, setForm] = useState<ProductFormInput>(emptyProduct);

  async function handleSubmit(value: ProductFormInput) {
    try {
      await createProduct.mutateAsync(value);
      setForm(emptyProduct);
      toast.success("In-House product published");
    } catch (err) {
      toast.error(apiError(err, "Could not create product"));
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        In-House products are owned by the store rather than a vendor. They publish immediately without moderation and
        carry no seller commission.
      </p>
      <ProductForm
        scope="admin"
        value={form}
        onChange={setForm}
        onSubmit={handleSubmit}
        submitting={createProduct.isPending}
        submitLabel="Publish product"
      />
    </div>
  );
}
