"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import toast from "react-hot-toast";
import {
  useSellerProducts,
  useCreateSellerProduct,
  useCloneSellerProduct,
  useDeleteSellerProduct,
} from "@/lib/hooks/useSeller";
import { ProductForm, emptyProduct } from "@/components/catalog/product-form";
import type { ProductFormInput } from "@/lib/hooks/useCatalogForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/format";

export default function SellerProductsPage() {
  const locale = useLocale();
  const { data: products, isLoading } = useSellerProducts();
  const createProduct = useCreateSellerProduct();
  const cloneProduct = useCloneSellerProduct();
  const deleteProduct = useDeleteSellerProduct();

  const [form, setForm] = useState<ProductFormInput>(emptyProduct);
  const [showForm, setShowForm] = useState(false);

  async function handleSubmit(value: ProductFormInput) {
    try {
      await createProduct.mutateAsync(value);
      setForm(emptyProduct);
      setShowForm(false);
      toast.success("Product created — pending admin approval");
    } catch (err) {
      const response = (err as { response?: { data?: { message?: string } } })?.response;
      toast.error(response?.data?.message ?? "Could not create product");
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
        <ProductForm
          scope="seller"
          value={form}
          onChange={setForm}
          onSubmit={handleSubmit}
          submitting={createProduct.isPending}
          submitLabel="Create product"
        />
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
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/${locale}/seller/products/${product.id}/edit`}>Edit</Link>
                  </Button>
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
