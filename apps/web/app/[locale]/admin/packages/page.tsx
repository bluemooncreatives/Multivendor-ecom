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
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { FormField } from "@/components/shared/form-field";

export default function AdminPackagesPage() {
  const enforceLimits = useEnforceProductLimits();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscription packages"
        description="Manage seller and customer listing tiers, limits, and offline package approvals."
        actions={
          <div className="text-end">
            <Button variant="outline" size="sm" disabled={enforceLimits.isPending} onClick={() => enforceLimits.mutate()}>
              Enforce product limits now
            </Button>
            {enforceLimits.data && (
              <p className="mt-1 text-xs text-muted-foreground">
                Unpublished {enforceLimits.data.unpublished} over-limit product(s).
              </p>
            )}
          </div>
        }
      />

      <SellerPackages />
      <CustomerPackages />
      <PaymentQueue kind="seller" />
      <PaymentQueue kind="customer" />
    </div>
  );
}

const BLANK_SELLER = { name: "", price: 0, durationDays: 30, productLimit: 50, digitalProductLimit: 0, commissionRateOverride: null };

function SellerPackages() {
  const { data: packages } = useAdminSellerPackages();
  const save = useSaveSellerPackage();
  const remove = useDeleteSellerPackage();
  const [form, setForm] = useState<Partial<SellerPackage> & { id?: string }>(BLANK_SELLER);

  return (
    <Card>
      <CardHeader className="border-b bg-muted/20 pb-3.5">
        <CardTitle className="text-base">Seller packages</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 pt-5">
        <form
          className="grid gap-4 md:grid-cols-6"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate(form, { onSuccess: () => setForm(BLANK_SELLER) });
          }}
        >
          <FormField label="Name" htmlFor="sp-name" required>
            <Input id="sp-name" value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </FormField>
          <FormField label="Price" htmlFor="sp-price">
            <Input
              id="sp-price"
              type="number"
              min={0}
              value={form.price ?? 0}
              onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
            />
          </FormField>
          <FormField label="Days" htmlFor="sp-days">
            <Input
              id="sp-days"
              type="number"
              min={1}
              value={form.durationDays ?? 30}
              onChange={(e) => setForm({ ...form, durationDays: Number(e.target.value) })}
            />
          </FormField>
          <FormField label="Product uploads" htmlFor="sp-limit">
            <Input
              id="sp-limit"
              type="number"
              min={0}
              value={form.productLimit ?? 0}
              onChange={(e) => setForm({ ...form, productLimit: Number(e.target.value) })}
            />
          </FormField>
          <FormField label="Digital uploads" htmlFor="sp-digital-limit">
            <Input
              id="sp-digital-limit"
              type="number"
              min={0}
              value={form.digitalProductLimit ?? 0}
              onChange={(e) => setForm({ ...form, digitalProductLimit: Number(e.target.value) })}
            />
          </FormField>
          <FormField label="Commission % override" htmlFor="sp-commission">
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
          </FormField>
          <div className="flex items-end gap-2 md:col-span-6">
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

        <div className="space-y-2 border-t pt-4">
          {packages?.map((pkg) => (
            <div key={pkg.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3.5 text-sm">
              <div>
                <span className="font-semibold">{pkg.name}</span>{" "}
                <span className="text-muted-foreground">
                  {pkg.price} / {pkg.durationDays} days · {pkg.productLimit} product upload(s)
                  {!!pkg.digitalProductLimit && ` · ${pkg.digitalProductLimit} digital upload(s)`}
                  {pkg.commissionRateOverride !== null && ` · ${pkg.commissionRateOverride}% commission`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={pkg.active ? "active" : "retired"} />
                <Button variant="ghost" size="sm" onClick={() => setForm(pkg)}>
                  Edit
                </Button>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => remove.mutate(pkg.id)}>
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
      <CardHeader className="border-b bg-muted/20 pb-3.5">
        <CardTitle className="text-base">Customer packages (classified listings)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 pt-5">
        <form
          className="grid gap-4 md:grid-cols-4"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate(form, { onSuccess: () => setForm(BLANK_CUSTOMER) });
          }}
        >
          <FormField label="Name" htmlFor="cp-name" required>
            <Input id="cp-name" value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </FormField>
          <FormField label="Price" htmlFor="cp-price">
            <Input
              id="cp-price"
              type="number"
              min={0}
              value={form.price ?? 0}
              onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
            />
          </FormField>
          <FormField label="Days" htmlFor="cp-days">
            <Input
              id="cp-days"
              type="number"
              min={1}
              value={form.durationDays ?? 30}
              onChange={(e) => setForm({ ...form, durationDays: Number(e.target.value) })}
            />
          </FormField>
          <FormField label="Listing limit" htmlFor="cp-limit">
            <Input
              id="cp-limit"
              type="number"
              min={0}
              value={form.classifiedListingLimit ?? 0}
              onChange={(e) => setForm({ ...form, classifiedListingLimit: Number(e.target.value) })}
            />
          </FormField>
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

        <div className="space-y-2 border-t pt-4">
          {packages?.map((pkg) => (
            <div key={pkg.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3.5 text-sm">
              <div>
                <span className="font-semibold">{pkg.name}</span>{" "}
                <span className="text-muted-foreground">
                  {pkg.price} / {pkg.durationDays} days · up to {pkg.classifiedListingLimit} listings
                </span>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={pkg.active ? "active" : "retired"} />
                <Button variant="ghost" size="sm" onClick={() => setForm(pkg)}>
                  Edit
                </Button>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => remove.mutate(pkg.id)}>
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
      <CardHeader className="border-b bg-muted/20 pb-3.5">
        <CardTitle className="text-base">Offline {kind} package payments awaiting approval</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pt-4">
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
              <div key={payment.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3.5 text-sm">
                <div>
                  <p className="font-semibold">
                    {buyer?.name ?? "Unknown"} — {payment.packageId?.name ?? "Package"} ({payment.amount})
                  </p>
                  <p className="text-xs text-muted-foreground">
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
