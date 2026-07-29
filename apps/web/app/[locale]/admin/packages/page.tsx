"use client";

import { useState } from "react";
import {
  useAdminSellerPackages,
  useSaveSellerPackage,
  useDeleteSellerPackage,
  useAdminCustomerPackages,
  useSaveCustomerPackage,
  useDeleteCustomerPackage,
  usePackagePayments,
  useApprovePackagePayment,
  useEnforceProductLimits,
  type SellerPackage,
  type CustomerPackage,
} from "@/lib/hooks/useAdminAddons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function AdminPackagesPage() {
  const enforceLimits = useEnforceProductLimits();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Subscription packages</h1>
        <div className="text-end">
          <Button variant="outline" size="sm" disabled={enforceLimits.isPending} onClick={() => enforceLimits.mutate()}>
            Enforce product limits now
          </Button>
          {enforceLimits.data && (
            <p className="mt-1 text-xs text-muted-foreground">Unpublished {enforceLimits.data.unpublished} over-limit product(s).</p>
          )}
        </div>
      </div>

      <SellerPackages />
      <CustomerPackages />
      <PaymentQueue kind="seller" />
      <PaymentQueue kind="customer" />
    </div>
  );
}

const BLANK_SELLER = { name: "", price: 0, durationDays: 30, productLimit: 50, commissionRateOverride: null };

function SellerPackages() {
  const { data: packages } = useAdminSellerPackages();
  const save = useSaveSellerPackage();
  const remove = useDeleteSellerPackage();
  const [form, setForm] = useState<Partial<SellerPackage> & { id?: string }>(BLANK_SELLER);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Seller packages</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form
          className="grid gap-4 md:grid-cols-5"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate(form, { onSuccess: () => setForm(BLANK_SELLER) });
          }}
        >
          <div className="space-y-1">
            <Label htmlFor="sp-name">Name</Label>
            <Input id="sp-name" value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="sp-price">Price</Label>
            <Input
              id="sp-price"
              type="number"
              min={0}
              value={form.price ?? 0}
              onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="sp-days">Days</Label>
            <Input
              id="sp-days"
              type="number"
              min={1}
              value={form.durationDays ?? 30}
              onChange={(e) => setForm({ ...form, durationDays: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="sp-limit">Product limit</Label>
            <Input
              id="sp-limit"
              type="number"
              min={0}
              value={form.productLimit ?? 0}
              onChange={(e) => setForm({ ...form, productLimit: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="sp-commission">Commission % override</Label>
            <Input
              id="sp-commission"
              type="number"
              min={0}
              max={100}
              step="0.1"
              placeholder="Platform default"
              value={form.commissionRateOverride ?? ""}
              onChange={(e) => setForm({ ...form, commissionRateOverride: e.target.value ? Number(e.target.value) : null })}
            />
          </div>
          <div className="flex items-end gap-2 md:col-span-5">
            <Button type="submit" disabled={save.isPending}>
              {form.id ? "Save changes" : "Add package"}
            </Button>
            {form.id && (
              <Button type="button" variant="outline" onClick={() => setForm(BLANK_SELLER)}>
                Cancel
              </Button>
            )}
          </div>
        </form>

        <div className="space-y-2">
          {packages?.map((pkg) => (
            <div key={pkg.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm">
              <div>
                <span className="font-medium">{pkg.name}</span>{" "}
                <span className="text-muted-foreground">
                  {pkg.price} / {pkg.durationDays} days · up to {pkg.productLimit} products
                  {pkg.commissionRateOverride !== null && ` · ${pkg.commissionRateOverride}% commission`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={pkg.active ? "default" : "outline"}>{pkg.active ? "Active" : "Retired"}</Badge>
                <Button variant="ghost" size="sm" onClick={() => setForm(pkg)}>
                  Edit
                </Button>
                <Button variant="ghost" size="sm" onClick={() => remove.mutate(pkg.id)}>
                  Retire
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

const BLANK_CUSTOMER = { name: "", price: 0, durationDays: 30, classifiedListingLimit: 10 };

function CustomerPackages() {
  const { data: packages } = useAdminCustomerPackages();
  const save = useSaveCustomerPackage();
  const remove = useDeleteCustomerPackage();
  const [form, setForm] = useState<Partial<CustomerPackage> & { id?: string }>(BLANK_CUSTOMER);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Customer packages (classified listings)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form
          className="grid gap-4 md:grid-cols-4"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate(form, { onSuccess: () => setForm(BLANK_CUSTOMER) });
          }}
        >
          <div className="space-y-1">
            <Label htmlFor="cp-name">Name</Label>
            <Input id="cp-name" value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="cp-price">Price</Label>
            <Input
              id="cp-price"
              type="number"
              min={0}
              value={form.price ?? 0}
              onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="cp-days">Days</Label>
            <Input
              id="cp-days"
              type="number"
              min={1}
              value={form.durationDays ?? 30}
              onChange={(e) => setForm({ ...form, durationDays: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="cp-limit">Listing limit</Label>
            <Input
              id="cp-limit"
              type="number"
              min={0}
              value={form.classifiedListingLimit ?? 0}
              onChange={(e) => setForm({ ...form, classifiedListingLimit: Number(e.target.value) })}
            />
          </div>
          <div className="flex items-end gap-2 md:col-span-4">
            <Button type="submit" disabled={save.isPending}>
              {form.id ? "Save changes" : "Add package"}
            </Button>
            {form.id && (
              <Button type="button" variant="outline" onClick={() => setForm(BLANK_CUSTOMER)}>
                Cancel
              </Button>
            )}
          </div>
        </form>

        <div className="space-y-2">
          {packages?.map((pkg) => (
            <div key={pkg.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm">
              <div>
                <span className="font-medium">{pkg.name}</span>{" "}
                <span className="text-muted-foreground">
                  {pkg.price} / {pkg.durationDays} days · up to {pkg.classifiedListingLimit} listings
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={pkg.active ? "default" : "outline"}>{pkg.active ? "Active" : "Retired"}</Badge>
                <Button variant="ghost" size="sm" onClick={() => setForm(pkg)}>
                  Edit
                </Button>
                <Button variant="ghost" size="sm" onClick={() => remove.mutate(pkg.id)}>
                  Retire
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function PaymentQueue({ kind }: { kind: "seller" | "customer" }) {
  const { data: payments } = usePackagePayments(kind, "pending");
  const approve = useApprovePackagePayment(kind);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Offline {kind} package payments awaiting approval</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {payments?.length === 0 && <p className="text-sm text-muted-foreground">Nothing awaiting approval.</p>}
        {payments?.map(
          (payment: {
            id: string;
            amount: number;
            paymentMethod: string;
            packageId?: { name: string };
            sellerId?: { name: string; email: string };
            userId?: { name: string; email: string };
          }) => {
            const buyer = payment.sellerId ?? payment.userId;
            return (
              <div key={payment.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm">
                <div>
                  <p className="font-medium">
                    {buyer?.name ?? "Unknown"} — {payment.packageId?.name ?? "Package"} ({payment.amount})
                  </p>
                  <p className="text-muted-foreground">
                    {buyer?.email} · paid via {payment.paymentMethod}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => approve.mutate({ id: payment.id, approve: true })}>
                    Approve
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => approve.mutate({ id: payment.id, approve: false })}>
                    Decline
                  </Button>
                </div>
              </div>
            );
          },
        )}
      </CardContent>
    </Card>
  );
}
