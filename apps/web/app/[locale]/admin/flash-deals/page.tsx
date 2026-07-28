"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useProducts } from "@/lib/hooks/useProducts";
import { useAdminFlashDeals, useCreateFlashDeal, useDeleteFlashDeal } from "@/lib/hooks/useAdminCatalogExtras";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function AdminFlashDealsPage() {
  const { data: deals, isLoading } = useAdminFlashDeals();
  const { data: products } = useProducts({ sort: "newest" });
  const createDeal = useCreateFlashDeal();
  const deleteDeal = useDeleteFlashDeal();

  const [title, setTitle] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [productId, setProductId] = useState("");
  const [discountPercent, setDiscountPercent] = useState(10);

  const selectedProduct = products?.items.find((p) => p.id === productId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const variant = selectedProduct?.variants[0];
    if (!variant) {
      toast.error("Select a product");
      return;
    }
    try {
      await createDeal.mutateAsync({
        title,
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
        products: [{ productId, variantSku: variant.sku, discountPercent, dealStock: variant.stock }],
      });
      setTitle("");
      toast.success("Flash deal created");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Could not create flash deal");
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
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Starts at</Label>
              <Input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Ends at</Label>
              <Input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Product</Label>
              <select
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                required
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
              <Label>Discount %</Label>
              <Input
                type="number"
                min={1}
                max={90}
                value={discountPercent}
                onChange={(e) => setDiscountPercent(Number(e.target.value))}
                required
              />
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
                <Badge variant={deal.active ? "secondary" : "outline"}>{deal.active ? "Active" : "Inactive"}</Badge>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>
                  {new Date(deal.startsAt).toLocaleString()} → {new Date(deal.endsAt).toLocaleString()}
                </p>
                <p>{deal.products.length} product(s)</p>
                <Button variant="ghost" size="sm" onClick={() => deleteDeal.mutate(deal.id)}>
                  Deactivate
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
