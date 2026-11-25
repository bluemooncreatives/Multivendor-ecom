"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import toast from "react-hot-toast";
import { Info } from "lucide-react";
import { useSellerProduct, useUpdateSellerProduct } from "@/lib/hooks/useSeller";
import { ProductForm, toFormInput, emptyProduct } from "@/components/catalog/product-form";
import type { ProductFormInput } from "@/lib/hooks/useCatalogForm";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { PageSkeleton } from "@/components/shared/loading-state";
import { EmptyState } from "@/components/shared/empty-state";
import { getApiErrorMessage } from "@/lib/utils";

export default function SellerProductEditPage() {
  const { id } = useParams<{ id: string }>();
  const locale = useLocale();
  const router = useRouter();

  const { data: product, isLoading } = useSellerProduct(id);
  const updateProduct = useUpdateSellerProduct();
  const [form, setForm] = useState<ProductFormInput>(emptyProduct);

  useEffect(() => {
    if (product) setForm(toFormInput(product));
  }, [product]);

  async function handleSubmit(value: ProductFormInput) {
    try {
      await updateProduct.mutateAsync({ ...value, id });
      toast.success("Product saved");
      router.push(`/${locale}/seller/products`);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not save product"));
    }
  }

  if (isLoading) return <PageSkeleton />;
  if (!product) {
    return <EmptyState title="Product not found" description="That product could not be found." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit ${product.name}`}
        backHref={`/${locale}/seller/products`}
        backLabel="Back to products"
        badge={
          <StatusBadge
            status={product.published ? "live" : "pending"}
            label={product.published ? "Live" : "Pending approval"}
          />
        }
      />

      <Alert variant="info">
        <Info className="h-4 w-4" />
        <AlertDescription>
          Changing the name, images, category, pricing or shipping sends this listing back to moderation. Stock and SKU
          edits go live immediately.
        </AlertDescription>
      </Alert>

      <ProductForm
        scope="seller"
        value={form}
        onChange={setForm}
        onSubmit={handleSubmit}
        submitting={updateProduct.isPending}
        submitLabel="Save changes"
      />
    </div>
  );
}
