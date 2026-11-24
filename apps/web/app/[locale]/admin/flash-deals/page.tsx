"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Trash2 } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/**
 * Campaign editor. The legacy admin (`flash_deals/create.blade.php` plus the
 * `product_discount` partial) let one campaign hold many products, each with its
 * own percentage *or* fixed-amount discount — this page previously accepted a
 * single product at a single percentage, and posted no slug, which the API
 * rejected outright.
 */
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

  // Line being composed before it is added to the campaign.
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
        // Blank means "no campaign cap", matching the legacy behaviour of limiting
        // a deal only by the product's own stock.
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
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(message ?? "Could not create flash deal");
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
      <h1 className="text-2xl font-bold">Flash deals</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">New flash deal</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="deal-title">Title</Label>
              <Input id="deal-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deal-starts">Starts at</Label>
              <Input id="deal-starts" type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deal-ends">Ends at</Label>
              <Input id="deal-ends" type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} required />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="deal-banner">Banner image URL (optional)</Label>
              <Input id="deal-banner" value={bannerUrl} onChange={(e) => setBannerUrl(e.target.value)} placeholder="https://…" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deal-text-color">Text colour (optional)</Label>
              <Input id="deal-text-color" value={textColor} onChange={(e) => setTextColor(e.target.value)} placeholder="#ffffff" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deal-bg-color">Background colour (optional)</Label>
              <Input id="deal-bg-color" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} placeholder="#111111" />
            </div>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
              Promote on the home page (only one campaign can be promoted)
            </label>

            <div className="space-y-3 rounded-md border p-3 sm:col-span-2">
              <p className="text-sm font-medium">Campaign products</p>
              <div className="grid gap-3 sm:grid-cols-5">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="deal-product">Product</Label>
                  <select
                    id="deal-product"
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
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
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deal-variant">Variant</Label>
                  <select
                    id="deal-variant"
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                    value={variantSku}
                    onChange={(e) => setVariantSku(e.target.value)}
                    disabled={!selectedProduct}
                  >
                    {selectedProduct?.variants.map((variant) => (
                      <option key={variant.sku} value={variant.sku}>
                        {variant.sku} · {variant.price}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deal-discount-type">Discount type</Label>
                  <select
                    id="deal-discount-type"
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as "percent" | "flat")}
                  >
                    <option value="percent">Percent</option>
                    <option value="flat">Fixed amount</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deal-discount">Discount</Label>
                  <Input
                    id="deal-discount"
                    type="number"
                    min={0}
                    step="0.01"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="deal-stock">Units at this price (blank = unlimited)</Label>
                  <Input id="deal-stock" type="number" min={0} value={dealStock} onChange={(e) => setDealStock(e.target.value)} />
                </div>
                <div className="flex items-end sm:col-span-3">
                  <Button type="button" variant="secondary" onClick={addLine}>
                    Add product
                  </Button>
                </div>
              </div>

              {lines.length > 0 && (
                <ul className="divide-y rounded-md border text-sm">
                  {lines.map((line, index) => (
                    <li key={`${line.productId}-${line.variantSku}`} className="flex items-center justify-between gap-3 p-2">
                      <span>
                        {productById(line.productId)?.name ?? line.productId} · {line.variantSku} ·{" "}
                        {line.discountType === "percent" ? `${line.discount}% off` : `-${line.discount}`} ·{" "}
                        {line.dealStock === null ? "unlimited" : `${line.dealStock} units`}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
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
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {deals?.map((deal) => (
            <Card key={deal.id}>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">{deal.title}</CardTitle>
                <div className="flex items-center gap-2">
                  {deal.featured && <Badge>Promoted</Badge>}
                  <Badge variant={deal.active ? "secondary" : "outline"}>{deal.active ? "Active" : "Inactive"}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>
                  {new Date(deal.startsAt).toLocaleString()} → {new Date(deal.endsAt).toLocaleString()}
                </p>
                <ul className="space-y-1">
                  {deal.products.map((line) => (
                    <li key={`${line.productId}-${line.variantSku}`}>
                      {line.variantSku}: {line.listPrice ?? "—"} → {line.dealPrice ?? "—"} ({line.discountPercent}% off)
                      {line.dealStock !== null && ` · ${line.dealSold}/${line.dealStock} sold`}
                      {line.soldOut && " · sold out"}
                    </li>
                  ))}
                </ul>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => toggleFeatured(deal.id, !deal.featured)}>
                    {deal.featured ? "Unpromote" : "Promote"}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteDeal.mutate(deal.id)}>
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
