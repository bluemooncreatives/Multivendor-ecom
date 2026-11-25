"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Trash2, Zap } from "lucide-react";
import { useProducts } from "@/lib/hooks/useProducts";
import {
  useAdminFlashDeals,
  useCreateFlashDeal,
  useDeleteFlashDeal,
  useUpdateFlashDeal,
  type FlashDealLineInput,
} from "@/lib/hooks/useAdminCatalogExtras";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { FormField } from "@/components/shared/form-field";
import { CardGridSkeleton } from "@/components/shared/loading-state";
import { getApiErrorMessage } from "@/lib/utils";

export default function AdminFlashDealsPage() {
  const { data: deals, isLoading } = useAdminFlashDeals();
  const { data: products } = useProducts({ sort: "newest" });
  const createDeal = useCreateFlashDeal();
  const updateDeal = useUpdateFlashDeal();
  const deleteDeal = useDeleteFlashDeal();

  const [title, setTitle] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [textColor, setTextColor] = useState("");
  const [backgroundColor, setBackgroundColor] = useState("");
  const [featured, setFeatured] = useState(false);
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [lines, setLines] = useState<FlashDealLineInput[]>([]);

  const [productId, setProductId] = useState("");
  const [variantSku, setVariantSku] = useState("");
  const [discountType, setDiscountType] = useState<"percent" | "flat">("percent");
  const [discount, setDiscount] = useState(10);
  const [dealStock, setDealStock] = useState<string>("");

  const selectedProduct = products?.items.find((p) => p.id === productId);
  const productById = (id: string) => products?.items.find((p) => p.id === id);

  function addLine() {
    const variant = selectedProduct?.variants.find((v) => v.sku === variantSku) ?? selectedProduct?.variants[0];
    if (!selectedProduct || !variant) {
      toast.error("Pick a product and a variant first");
      return;
    }
    if (lines.some((line) => line.productId === selectedProduct.id && line.variantSku === variant.sku)) {
      toast.error("That variant is already in this campaign");
      return;
    }
    if (discount <= 0) {
      toast.error("Enter a discount above zero");
      return;
    }
    if (discountType === "percent" && discount > 90) {
      toast.error("A percentage discount cannot exceed 90%");
      return;
    }
    if (discountType === "flat" && discount >= variant.price) {
      toast.error("A fixed discount must be smaller than the variant price");
      return;
    }

    setLines((current) => [
      ...current,
      {
        productId: selectedProduct.id,
        variantSku: variant.sku,
        discountType,
        discount,
        dealStock: dealStock.trim() === "" ? null : Math.max(0, Number(dealStock)),
      },
    ]);
    setDealStock("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (lines.length === 0) {
      toast.error("Add at least one product to the campaign");
      return;
    }
    if (new Date(endsAt) <= new Date(startsAt)) {
      toast.error("The campaign must end after it starts");
      return;
    }
    try {
      await createDeal.mutateAsync({
        title,
        bannerUrl: bannerUrl.trim() || undefined,
        textColor: textColor.trim() || null,
        backgroundColor: backgroundColor.trim() || null,
        featured,
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
        products: lines,
      });
      setTitle("");
      setBannerUrl("");
      setTextColor("");
      setBackgroundColor("");
      setFeatured(false);
      setLines([]);
      toast.success("Flash deal created");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not create flash deal"));
    }
  }

  async function toggleFeatured(id: string, next: boolean) {
    try {
      await updateDeal.mutateAsync({ id, featured: next });
      toast.success(next ? "Campaign promoted" : "Campaign no longer promoted");
    } catch {
      toast.error("Could not update the campaign");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Flash deals" description="Schedule limited-time promotional campaigns with per-variant discounts." />

      <Card>
        <CardHeader className="border-b bg-muted/20 pb-3.5">
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="h-4 w-4 text-primary" />
            New flash deal
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
            <FormField label="Title" htmlFor="deal-title" required className="sm:col-span-2">
              <Input id="deal-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </FormField>
            <FormField label="Starts at" htmlFor="deal-starts" required>
              <Input id="deal-starts" type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} required />
            </FormField>
            <FormField label="Ends at" htmlFor="deal-ends" required>
              <Input id="deal-ends" type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} required />
            </FormField>
            <FormField label="Banner image URL (optional)" htmlFor="deal-banner" className="sm:col-span-2">
              <Input id="deal-banner" value={bannerUrl} onChange={(e) => setBannerUrl(e.target.value)} placeholder="https://…" />
            </FormField>
            <FormField label="Text colour (optional)" htmlFor="deal-text-color">
              <Input id="deal-text-color" value={textColor} onChange={(e) => setTextColor(e.target.value)} placeholder="#ffffff" />
            </FormField>
            <FormField label="Background colour (optional)" htmlFor="deal-bg-color">
              <Input id="deal-bg-color" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} placeholder="#111111" />
            </FormField>
            <label className="flex cursor-pointer items-center gap-2 text-sm sm:col-span-2">
              <Checkbox checked={featured} onCheckedChange={(checked) => setFeatured(checked === true)} />
              <span>Promote on the home page (only one campaign can be promoted)</span>
            </label>

            <div className="space-y-4 rounded-lg border bg-muted/20 p-4 sm:col-span-2">
              <p className="text-sm font-semibold">Campaign products</p>
              <div className="grid gap-3 sm:grid-cols-5">
                <FormField label="Product" htmlFor="deal-product" className="sm:col-span-2">
                  <NativeSelect
                    id="deal-product"
                    value={productId}
                    onChange={(e) => {
                      setProductId(e.target.value);
                      setVariantSku(productById(e.target.value)?.variants[0]?.sku ?? "");
                    }}
                  >
                    <option value="">Select product</option>
                    {products?.items.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </NativeSelect>
                </FormField>
                <FormField label="Variant" htmlFor="deal-variant">
                  <NativeSelect
                    id="deal-variant"
                    value={variantSku}
                    onChange={(e) => setVariantSku(e.target.value)}
                    disabled={!selectedProduct}
                  >
                    {selectedProduct?.variants.map((variant) => (
                      <option key={variant.sku} value={variant.sku}>
                        {variant.sku} · {variant.price}
                      </option>
                    ))}
                  </NativeSelect>
                </FormField>
                <FormField label="Discount type" htmlFor="deal-discount-type">
                  <NativeSelect
                    id="deal-discount-type"
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as "percent" | "flat")}
                  >
                    <option value="percent">Percent</option>
                    <option value="flat">Fixed amount</option>
                  </NativeSelect>
                </FormField>
                <FormField label="Discount" htmlFor="deal-discount">
                  <Input
                    id="deal-discount"
                    type="number"
                    min={0}
                    step="0.01"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                  />
                </FormField>
                <FormField label="Units at this price (blank = unlimited)" htmlFor="deal-stock" className="sm:col-span-2">
                  <Input id="deal-stock" type="number" min={0} value={dealStock} onChange={(e) => setDealStock(e.target.value)} />
                </FormField>
                <div className="flex items-end sm:col-span-3">
                  <Button type="button" variant="secondary" onClick={addLine}>
                    Add product
                  </Button>
                </div>
              </div>

              {lines.length > 0 && (
                <ul className="divide-y rounded-lg border bg-background text-sm">
                  {lines.map((line, index) => (
                    <li key={`${line.productId}-${line.variantSku}`} className="flex items-center justify-between gap-3 px-3 py-2.5">
                      <span>
                        {productById(line.productId)?.name ?? line.productId} · {line.variantSku} ·{" "}
                        {line.discountType === "percent" ? `${line.discount}% off` : `-${line.discount}`} ·{" "}
                        {line.dealStock === null ? "unlimited" : `${line.dealStock} units`}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        aria-label="Remove product from campaign"
                        onClick={() => setLines((current) => current.filter((_, i) => i !== index))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <Button type="submit" className="sm:col-span-2" disabled={createDeal.isPending}>
              Create flash deal
            </Button>
          </form>
        </CardContent>
      </Card>

      {isLoading ? (
        <CardGridSkeleton count={2} columns="sm:grid-cols-2" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {deals?.map((deal) => (
            <Card key={deal.id}>
              <CardHeader className="flex-row items-center justify-between space-y-0 border-b bg-muted/20 py-3.5">
                <CardTitle className="text-base">{deal.title}</CardTitle>
                <div className="flex items-center gap-2">
                  {deal.featured && <Badge>Promoted</Badge>}
                  <StatusBadge status={deal.active ? "active" : "inactive"} />
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-4 text-sm text-muted-foreground">
                <p className="text-xs">
                  {new Date(deal.startsAt).toLocaleString()} → {new Date(deal.endsAt).toLocaleString()}
                </p>
                <ul className="space-y-1">
                  {deal.products.map((line) => (
                    <li key={`${line.productId}-${line.variantSku}`}>
                      {line.variantSku}: {line.listPrice ?? "—"} → {line.dealPrice ?? "—"} ({line.discountPercent}% off)
                      {line.dealStock !== null && ` · ${line.dealStock > 0 ? `${line.dealSold}/${line.dealStock} sold` : ""}`}
                      {line.soldOut && " · sold out"}
                    </li>
                  ))}
                </ul>
                <div className="flex gap-2 border-t pt-2">
                  <Button variant="ghost" size="sm" onClick={() => toggleFeatured(deal.id, !deal.featured)}>
                    {deal.featured ? "Unpromote" : "Promote"}
                  </Button>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => deleteDeal.mutate(deal.id)}>
                    Deactivate
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
