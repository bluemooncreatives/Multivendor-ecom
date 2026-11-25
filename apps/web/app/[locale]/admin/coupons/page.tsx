"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import {
  useCoupons,
  useSaveCoupon,
  useDeleteCoupon,
  useCouponUsage,
  useAdminCategories,
  useAdminProducts,
  type Coupon,
} from "@/lib/hooks/useAdminCommerce";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { FormField } from "@/components/shared/form-field";
import { getApiErrorMessage } from "@/lib/utils";

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
        maxDiscount: editing.maxDiscount ?? null,
        usageLimitTotal: editing.usageLimitTotal ?? null,
        startsAt: editing.startsAt ? new Date(editing.startsAt).toISOString() : undefined,
        expiresAt: editing.expiresAt ? new Date(`${editing.expiresAt.slice(0, 10)}T23:59:59.999Z`).toISOString() : undefined,
      },
      {
        onSuccess: () => {
          setEditing(BLANK);
          toast.success("Coupon saved");
        },
        onError: (error) => toast.error(getApiErrorMessage(error, "Could not save coupon")),
      },
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Coupons" description="Create cart-wide or product-scoped discount codes and inspect redemptions." />

      <Card>
        <CardHeader className="border-b bg-muted/20 pb-3.5">
          <CardTitle className="text-base">{editing.id ? `Edit ${editing.code}` : "Create a coupon"}</CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          <form className="grid gap-4 md:grid-cols-3" onSubmit={submit}>
            <FormField label="Applies to" htmlFor="scope" className="md:col-span-3">
              <NativeSelect
                id="scope"
                value={editing.scope ?? "cart"}
                onChange={(event) => setEditing({ ...editing, scope: event.target.value as "cart" | "product" })}
              >
                <option value="cart">Entire cart</option>
                <option value="product">Selected products or categories</option>
              </NativeSelect>
            </FormField>

            {editing.scope === "product" && (
              <div className="grid gap-4 md:col-span-3 md:grid-cols-2">
                <div className="space-y-2">
                  <FormField
                    label="Find eligible products"
                    htmlFor="coupon-products"
                    hint={`${editing.productIds?.length ?? 0} selected`}
                  >
                    <Input
                      id="coupon-products"
                      value={productSearch}
                      onChange={(event) => setProductSearch(event.target.value)}
                      placeholder="Search products"
                    />
                  </FormField>
                  <div className="max-h-40 space-y-1.5 overflow-auto rounded-lg border p-2.5">
                    {products?.items.map((product) => (
                      <label key={product.id} className="flex cursor-pointer items-center gap-2 text-sm">
                        <Checkbox
                          checked={editing.productIds?.includes(product.id) ?? false}
                          onCheckedChange={(checked) =>
                            setEditing({
                              ...editing,
                              productIds:
                                checked === true
                                  ? [...(editing.productIds ?? []), product.id]
                                  : editing.productIds?.filter((id) => id !== product.id),
                            })
                          }
                        />
                        <span>{product.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Eligible categories (includes descendants)</p>
                  <div className="max-h-52 space-y-1.5 overflow-auto rounded-lg border p-2.5">
                    {categories?.map((category) => (
                      <label key={category.id} className="flex cursor-pointer items-center gap-2 text-sm">
                        <Checkbox
                          checked={editing.categoryIds?.includes(category.id) ?? false}
                          onCheckedChange={(checked) =>
                            setEditing({
                              ...editing,
                              categoryIds:
                                checked === true
                                  ? [...(editing.categoryIds ?? []), category.id]
                                  : editing.categoryIds?.filter((id) => id !== category.id),
                            })
                          }
                        />
                        <span>{category.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <FormField label="Code" htmlFor="code" required>
              <Input
                id="code"
                value={editing.code ?? ""}
                onChange={(e) => setEditing({ ...editing, code: e.target.value.toUpperCase() })}
                placeholder="WELCOME10"
                required
              />
            </FormField>
            <FormField label="Type" htmlFor="type">
              <NativeSelect
                id="type"
                value={editing.type ?? "percent"}
                onChange={(e) => setEditing({ ...editing, type: e.target.value as "flat" | "percent" })}
              >
                <option value="percent">Percentage off</option>
                <option value="flat">Flat amount off</option>
              </NativeSelect>
            </FormField>
            <FormField label={editing.type === "flat" ? "Amount" : "Percent"} htmlFor="value" required>
              <Input
                id="value"
                type="number"
                min={0}
                value={editing.value ?? 0}
                onChange={(e) => setEditing({ ...editing, value: Number(e.target.value) })}
                required
              />
            </FormField>
            <FormField label="Minimum order value" htmlFor="minOrderValue">
              <Input
                id="minOrderValue"
                type="number"
                min={0}
                value={editing.minOrderValue ?? 0}
                onChange={(e) => setEditing({ ...editing, minOrderValue: Number(e.target.value) })}
              />
            </FormField>
            <FormField label="Max discount (optional)" htmlFor="maxDiscount">
              <Input
                id="maxDiscount"
                type="number"
                min={0}
                value={editing.maxDiscount ?? ""}
                onChange={(e) => setEditing({ ...editing, maxDiscount: e.target.value ? Number(e.target.value) : null })}
              />
            </FormField>
            <FormField label="Total uses (optional)" htmlFor="usageLimitTotal">
              <Input
                id="usageLimitTotal"
                type="number"
                min={1}
                value={editing.usageLimitTotal ?? ""}
                onChange={(e) => setEditing({ ...editing, usageLimitTotal: e.target.value ? Number(e.target.value) : null })}
              />
            </FormField>
            <FormField label="Uses per customer" htmlFor="usageLimitPerUser">
              <Input
                id="usageLimitPerUser"
                type="number"
                min={1}
                value={editing.usageLimitPerUser ?? 1}
                onChange={(e) => setEditing({ ...editing, usageLimitPerUser: Number(e.target.value) })}
              />
            </FormField>
            <FormField label="Starts" htmlFor="startsAt">
              <Input
                id="startsAt"
                type="date"
                value={editing.startsAt?.slice(0, 10) ?? ""}
                onChange={(e) => setEditing({ ...editing, startsAt: e.target.value })}
              />
            </FormField>
            <FormField label="Expires" htmlFor="expiresAt">
              <Input
                id="expiresAt"
                type="date"
                value={editing.expiresAt?.slice(0, 10) ?? ""}
                onChange={(e) => setEditing({ ...editing, expiresAt: e.target.value })}
              />
            </FormField>

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
        <CardHeader className="border-b bg-muted/20 pb-3.5">
          <CardTitle className="text-base">All coupons</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-4">
          {coupons?.length === 0 && <p className="text-sm text-muted-foreground">No coupons yet.</p>}
          {coupons?.map((coupon) => (
            <div key={coupon.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3.5 text-sm">
              <div>
                <span className="font-mono font-semibold">{coupon.code}</span>{" "}
                <span className="text-muted-foreground">
                  {coupon.type === "percent" ? `${coupon.value}% off` : `${coupon.value} off`}
                  {coupon.minOrderValue > 0 && ` · min ${coupon.minOrderValue}`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={coupon.active ? "active" : "inactive"} />
                <Button variant="ghost" size="sm" onClick={() => setUsageFor(usageFor === coupon.id ? null : coupon.id)}>
                  Usage
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setEditing(coupon)}>
                  Edit
                </Button>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => deleteCoupon.mutate(coupon.id)}>
                  Deactivate
                </Button>
              </div>
              {usageFor === coupon.id && usage && (
                <div className="w-full rounded-lg border bg-muted/30 p-3 text-xs">
                  <p className="mb-2 font-semibold">Redeemed {usage.usedCount} time(s)</p>
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
