"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import toast from "react-hot-toast";
import { Copy, Edit, Package, Plus, Upload } from "lucide-react";
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
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { CardGridSkeleton } from "@/components/shared/loading-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { formatPrice } from "@/lib/format";
import { getApiErrorMessage } from "@/lib/utils";

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
      toast.error(getApiErrorMessage(err, "Could not create product"));
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Add, clone, edit, or bulk-import products for your shop."
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href={`/${locale}/seller/products/bulk-upload`}>
                <Upload className="h-4 w-4" />
                Bulk upload
              </Link>
            </Button>
            <Button variant={showForm ? "outline" : "default"} onClick={() => setShowForm((v) => !v)}>
              <Plus className="h-4 w-4" />
              {showForm ? "Cancel" : "Add product"}
            </Button>
          </>
        }
      />

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
        <CardGridSkeleton count={4} columns="sm:grid-cols-2" />
      ) : !products || products.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No products yet"
          description="Create your first product or import a catalog CSV to start selling."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {products.map((product) => (
            <Card key={product.id}>
              <CardHeader className="flex-row items-center justify-between space-y-0 border-b bg-muted/20 py-3.5">
                <CardTitle className="truncate text-base">{product.name}</CardTitle>
                <StatusBadge
                  status={product.published ? "live" : "pending"}
                  label={product.published ? "Live" : "Pending approval"}
                />
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                <p className="text-lg font-bold text-primary">{formatPrice(product.basePrice, product.currency)}</p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/${locale}/seller/products/${product.id}/edit`}>
                      <Edit className="h-3.5 w-3.5" />
                      Edit
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => cloneProduct.mutate(product.id)}>
                    <Copy className="h-3.5 w-3.5" />
                    Clone
                  </Button>
                  <ConfirmDialog
                    title="Unpublish this product?"
                    description={`"${product.name}" will be removed from the public storefront.`}
                    confirmLabel="Unpublish"
                    onConfirm={() => deleteProduct.mutate(product.id)}
                    trigger={
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                        Unpublish
                      </Button>
                    }
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
