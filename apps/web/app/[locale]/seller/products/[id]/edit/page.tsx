"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import toast from "react-hot-toast";
import { useSellerProduct, useUpdateSellerProduct } from "@/lib/hooks/useSeller";
import { ProductForm, toFormInput, emptyProduct } from "@/components/catalog/product-form";
import type { ProductFormInput } from "@/lib/hooks/useCatalogForm";
import { Badge } from "@/components/ui/badge";

export default function SellerProductEditPage() {
  const { id } = useParams<{ id: string }>();
  const locale = useLocale();
  const router = useRouter();

  const { data: product, isLoading } = useSellerProduct(id);
  const updateProduct = useUpdateSellerProduct();
  const [form, setForm] = useState<ProductFormInput>(emptyProduct);

  // The list query may resolve after first paint, so seed the form once the
  // product arrives rather than in a useState initialiser.
  useEffect(() => {
    if (product) setForm(toFormInput(product));
  }, [product]);

  async function handleSubmit(value: ProductFormInput) {
    try {
      await updateProduct.mutateAsync({ ...value, id });
      toast.success("Product saved");
      router.push(`/${locale}/seller/products`);
    } catch (err) {
      const response = (err as { response?: { data?: { message?: string } } })?.response;
      toast.error(response?.data?.message ?? "Could not save product");
    }
  }

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (!product) return <p className="text-muted-foreground">That product could not be found.</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Edit {product.name}</h1>
        <Badge variant={product.published ? "secondary" : "outline"}>
          {product.published ? "Live" : "Pending approval"}
        </Badge>
      </div>

      <p className="text-sm text-muted-foreground">
        Changing the name, images, category, pricing or shipping sends this listing back to moderation. Stock and SKU
        edits go live immediately.
      </p>

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
