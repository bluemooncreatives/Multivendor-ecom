"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useCoupons, useSaveCoupon, useDeleteCoupon, useCouponUsage, useAdminCategories, useAdminProducts, type Coupon } from "@/lib/hooks/useAdminCommerce";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const BLANK = {
  code: "",
  type: "percent" as "flat" | "percent",
  value: 10,
  minOrderValue: 0,
  usageLimitPerUser: 1,
  scope: "cart" as const,
  productIds: [] as string[],
  categoryIds: [] as string[],
};

export default function AdminCouponsPage() {
  const { data: coupons } = useCoupons();
  const saveCoupon = useSaveCoupon();
  const deleteCoupon = useDeleteCoupon();
  const { data: categories } = useAdminCategories();
  const [productSearch, setProductSearch] = useState("");
  const { data: products } = useAdminProducts({ q: productSearch });

  const [editing, setEditing] = useState<Partial<Coupon> & { id?: string }>(BLANK);
  const [usageFor, setUsageFor] = useState<string | null>(null);
  const { data: usage } = useCouponUsage(usageFor);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    saveCoupon.mutate(
      {
        ...editing,
        code: editing.code?.toUpperCase(),
        // Empty inputs come back as "" — send null so the API stores "no limit"
        // rather than rejecting an empty string as a number.
        maxDiscount: editing.maxDiscount ?? null,
        usageLimitTotal: editing.usageLimitTotal ?? null,
        startsAt: editing.startsAt ? new Date(editing.startsAt).toISOString() : undefined,
        expiresAt: editing.expiresAt ? new Date(`${editing.expiresAt.slice(0, 10)}T23:59:59.999Z`).toISOString() : undefined,
      },
      { onSuccess: () => setEditing(BLANK), onError: (error: any) => toast.error(error?.response?.data?.message ?? "Could not save coupon") },
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Coupons</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{editing.id ? `Edit ${editing.code}` : "Create a coupon"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-3" onSubmit={submit}>
            <div className="space-y-1 md:col-span-3">
              <Label htmlFor="scope">Applies to</Label>
              <select id="scope" className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={editing.scope ?? "cart"} onChange={(event) => setEditing({ ...editing, scope: event.target.value as "cart" | "product" })}>
                <option value="cart">Entire cart</option>
                <option value="product">Selected products or categories</option>
              </select>
            </div>
            {editing.scope === "product" && (
              <div className="grid gap-4 md:col-span-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="coupon-products">Find eligible products</Label>
                  <Input id="coupon-products" value={productSearch} onChange={(event) => setProductSearch(event.target.value)} placeholder="Search products" />
                  <p className="text-xs text-muted-foreground">{editing.productIds?.length ?? 0} selected</p>
                  <div className="max-h-40 space-y-1 overflow-auto rounded border p-2">
                    {products?.items.map((product) => (
                      <label key={product.id} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={editing.productIds?.includes(product.id) ?? false} onChange={(event) => setEditing({ ...editing,
                          productIds: event.target.checked ? [...(editing.productIds ?? []), product.id] : editing.productIds?.filter((id) => id !== product.id) })} />
                        {product.name}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Eligible categories (includes descendants)</Label>
                  <div className="max-h-52 space-y-1 overflow-auto rounded border p-2">
                    {categories?.map((category) => (
                      <label key={category.id} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={editing.categoryIds?.includes(category.id) ?? false} onChange={(event) => setEditing({ ...editing,
                          categoryIds: event.target.checked ? [...(editing.categoryIds ?? []), category.id] : editing.categoryIds?.filter((id) => id !== category.id) })} />
                        {category.name}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div className="space-y-1">
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                value={editing.code ?? ""}
                onChange={(e) => setEditing({ ...editing, code: e.target.value.toUpperCase() })}
                placeholder="WELCOME10"
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="type">Type</Label>
              <select
                id="type"
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={editing.type ?? "percent"}
                onChange={(e) => setEditing({ ...editing, type: e.target.value as "flat" | "percent" })}
              >
                <option value="percent">Percentage off</option>
                <option value="flat">Flat amount off</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="value">{editing.type === "flat" ? "Amount" : "Percent"}</Label>
              <Input
                id="value"
                type="number"
                min={0}
                value={editing.value ?? 0}
                onChange={(e) => setEditing({ ...editing, value: Number(e.target.value) })}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="minOrderValue">Minimum order value</Label>
              <Input
                id="minOrderValue"
                type="number"
                min={0}
                value={editing.minOrderValue ?? 0}
                onChange={(e) => setEditing({ ...editing, minOrderValue: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="maxDiscount">Max discount (optional)</Label>
              <Input
                id="maxDiscount"
                type="number"
                min={0}
                value={editing.maxDiscount ?? ""}
                onChange={(e) => setEditing({ ...editing, maxDiscount: e.target.value ? Number(e.target.value) : null })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="usageLimitTotal">Total uses (optional)</Label>
              <Input
                id="usageLimitTotal"
                type="number"
                min={1}
                value={editing.usageLimitTotal ?? ""}
                onChange={(e) => setEditing({ ...editing, usageLimitTotal: e.target.value ? Number(e.target.value) : null })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="usageLimitPerUser">Uses per customer</Label>
              <Input
                id="usageLimitPerUser"
                type="number"
                min={1}
                value={editing.usageLimitPerUser ?? 1}
                onChange={(e) => setEditing({ ...editing, usageLimitPerUser: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="startsAt">Starts</Label>
              <Input
                id="startsAt"
                type="date"
                value={editing.startsAt?.slice(0, 10) ?? ""}
                onChange={(e) => setEditing({ ...editing, startsAt: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="expiresAt">Expires</Label>
              <Input
                id="expiresAt"
                type="date"
                value={editing.expiresAt?.slice(0, 10) ?? ""}
                onChange={(e) => setEditing({ ...editing, expiresAt: e.target.value })}
              />
            </div>
            <div className="flex items-end gap-2 md:col-span-3">
              <Button type="submit" disabled={saveCoupon.isPending}>
                {editing.id ? "Save changes" : "Create coupon"}
              </Button>
              {editing.id && (
                <Button type="button" variant="outline" onClick={() => setEditing(BLANK)}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All coupons</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {coupons?.length === 0 && <p className="text-sm text-muted-foreground">No coupons yet.</p>}
          {coupons?.map((coupon) => (
            <div key={coupon.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm">
              <div>
                <span className="font-medium">{coupon.code}</span>{" "}
                <span className="text-muted-foreground">
                  {coupon.type === "percent" ? `${coupon.value}% off` : `${coupon.value} off`}
                  {coupon.minOrderValue > 0 && ` · min ${coupon.minOrderValue}`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={coupon.active ? "default" : "outline"}>{coupon.active ? "Active" : "Inactive"}</Badge>
                <Button variant="ghost" size="sm" onClick={() => setUsageFor(usageFor === coupon.id ? null : coupon.id)}>
                  Usage
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setEditing(coupon)}>
                  Edit
                </Button>
                <Button variant="ghost" size="sm" onClick={() => deleteCoupon.mutate(coupon.id)}>
                  Deactivate
                </Button>
              </div>
              {usageFor === coupon.id && usage && (
                <div className="w-full rounded-md bg-muted p-3 text-xs">
                  <p className="mb-2 font-medium">Redeemed {usage.usedCount} time(s)</p>
                  {usage.usages.length === 0 && <p className="text-muted-foreground">Not redeemed yet.</p>}
                  {usage.usages.map((row: { id: string; userId?: { name: string; email: string }; createdAt: string }) => (
                    <div key={row.id} className="flex justify-between py-0.5">
                      <span>{row.userId ? `${row.userId.name} (${row.userId.email})` : "Guest"}</span>
                      <span className="text-muted-foreground">{new Date(row.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
