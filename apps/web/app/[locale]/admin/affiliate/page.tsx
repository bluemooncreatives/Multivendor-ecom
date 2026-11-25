"use client";

import { useEffect, useState } from "react";
import {
  useAffiliateAdminConfig,
  useSaveAffiliateConfig,
  useAffiliateUsers,
  useModerateAffiliateUser,
  useAffiliateWithdrawals,
  useResolveAffiliateWithdrawal,
  useAffiliatePayments,
  useReferredUsers,
  type AffiliateConfig,
} from "@/lib/hooks/useAdminAddons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { FormField, ToggleCard } from "@/components/shared/form-field";
import { PageSkeleton } from "@/components/shared/loading-state";

export default function AdminAffiliatePage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Affiliate program" description="Configure commission rules, moderate affiliates, and settle payouts." />

      <Tabs defaultValue="configuration">
        <TabsList>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="affiliates">Affiliates</TabsTrigger>
          <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="referrals">Referrals</TabsTrigger>
        </TabsList>

        <TabsContent value="configuration">
          <ConfigPanel />
        </TabsContent>
        <TabsContent value="affiliates">
          <AffiliatesPanel />
        </TabsContent>
        <TabsContent value="withdrawals">
          <WithdrawalsPanel />
        </TabsContent>
        <TabsContent value="payments">
          <PaymentsPanel />
        </TabsContent>
        <TabsContent value="referrals">
          <ReferralsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ConfigPanel() {
  const { data } = useAffiliateAdminConfig();
  const saveConfig = useSaveAffiliateConfig();
  const [form, setForm] = useState<AffiliateConfig | null>(null);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  if (!form) return <PageSkeleton />;

  return (
    <Card>
      <CardHeader className="border-b bg-muted/20 pb-3.5">
        <CardTitle className="text-base">Program settings</CardTitle>
      </CardHeader>
      <CardContent className="pt-5">
        <form
          className="grid gap-4 md:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            const { id: _id, ...payload } = form;
            saveConfig.mutate(payload);
          }}
        >
          <ToggleCard
            label="Affiliate program is active"
            checked={form.enabled}
            onCheckedChange={(checked) => setForm({ ...form, enabled: checked })}
            className="md:col-span-2"
          />

          <FormField label="Commission on referred orders (%)" htmlFor="commission">
            <Input
              id="commission"
              type="number"
              min={0}
              max={100}
              step="0.1"
              value={form.commissionPercent}
              onChange={(e) => setForm({ ...form, commissionPercent: Number(e.target.value) })}
            />
          </FormField>
          <FormField
            label="Attribution window (days)"
            htmlFor="cookie"
            hint="Orders count toward a referral only within this many days of the referred customer signing up."
          >
            <Input
              id="cookie"
              type="number"
              min={0}
              max={365}
              value={form.cookieDays}
              onChange={(e) => setForm({ ...form, cookieDays: Number(e.target.value) })}
            />
          </FormField>
          <FormField label="Minimum withdrawal amount" htmlFor="minWithdraw">
            <Input
              id="minWithdraw"
              type="number"
              min={0}
              value={form.minWithdrawAmount}
              onChange={(e) => setForm({ ...form, minWithdrawAmount: Number(e.target.value) })}
            />
          </FormField>
          <FormField label="Signup bonus per referral" htmlFor="signupBonus">
            <Input
              id="signupBonus"
              type="number"
              min={0}
              value={form.actionBonuses?.signup ?? 0}
              onChange={(e) => setForm({ ...form, actionBonuses: { ...form.actionBonuses, signup: Number(e.target.value) } })}
            />
          </FormField>

          <fieldset className="space-y-3 rounded-lg border p-4 md:col-span-2">
            <legend className="px-1 text-sm font-semibold">First-purchase bonus</legend>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox
                checked={form.firstPurchase?.enabled ?? false}
                onCheckedChange={(checked) =>
                  setForm({
                    ...form,
                    firstPurchase: { percent: form.firstPurchase?.percent ?? 0, enabled: checked === true },
                  })
                }
              />
              <span>Pay the referrer when their referred customer first buys</span>
            </label>
            <FormField label="Percent of that first order" htmlFor="firstPurchasePercent" className="sm:max-w-xs">
              <Input
                id="firstPurchasePercent"
                type="number"
                min={0}
                max={100}
                step="0.1"
                value={form.firstPurchase?.percent ?? 0}
                onChange={(e) =>
                  setForm({
                    ...form,
                    firstPurchase: { enabled: form.firstPurchase?.enabled ?? false, percent: Number(e.target.value) },
                  })
                }
              />
            </FormField>
          </fieldset>

          <fieldset className="space-y-3 rounded-lg border p-4 md:col-span-2">
            <legend className="px-1 text-sm font-semibold">Product share links</legend>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox
                checked={form.productSharing?.enabled ?? false}
                onCheckedChange={(checked) =>
                  setForm({
                    ...form,
                    productSharing: {
                      commissionType: form.productSharing?.commissionType ?? "percent",
                      commission: form.productSharing?.commission ?? 0,
                      enabled: checked === true,
                    },
                  })
                }
              />
              <span>Pay an affiliate when a product bought through their share link is sold</span>
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="Commission type" htmlFor="shareType">
                <NativeSelect
                  id="shareType"
                  value={form.productSharing?.commissionType ?? "percent"}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      productSharing: {
                        enabled: form.productSharing?.enabled ?? false,
                        commission: form.productSharing?.commission ?? 0,
                        commissionType: e.target.value as "amount" | "percent",
                      },
                    })
                  }
                >
                  <option value="percent">Percent of the line</option>
                  <option value="amount">Fixed amount</option>
                </NativeSelect>
              </FormField>
              <FormField label="Commission" htmlFor="shareCommission">
                <Input
                  id="shareCommission"
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.productSharing?.commission ?? 0}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      productSharing: {
                        enabled: form.productSharing?.enabled ?? false,
                        commissionType: form.productSharing?.commissionType ?? "percent",
                        commission: Number(e.target.value),
                      },
                    })
                  }
                />
              </FormField>
            </div>
            <p className="text-xs text-muted-foreground">While this is on, per-category rates are ignored.</p>
          </fieldset>

          <fieldset className="space-y-2 md:col-span-2">
            <legend className="text-sm font-semibold">Allowed payout methods</legend>
            <div className="flex flex-wrap gap-4 pt-1">
              {(["bank_transfer", "wallet", "manual"] as const).map((method) => (
                <label key={method} className="flex cursor-pointer items-center gap-2 text-sm">
                  <Checkbox
                    checked={form.allowedMethods.includes(method)}
                    onCheckedChange={(checked) =>
                      setForm({
                        ...form,
                        allowedMethods:
                          checked === true
                            ? [...form.allowedMethods, method]
                            : form.allowedMethods.filter((m) => m !== method),
                      })
                    }
                  />
                  <span>{method.replace("_", " ")}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="md:col-span-2">
            <Button type="submit" disabled={saveConfig.isPending || form.allowedMethods.length === 0}>
              Save settings
            </Button>
            {form.allowedMethods.length === 0 && (
              <p className="mt-1 text-xs text-destructive">Select at least one payout method.</p>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function AffiliatesPanel() {
  const [status, setStatus] = useState("");
  const { data: affiliates } = useAffiliateUsers(status || undefined);
  const moderate = useModerateAffiliateUser();

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 border-b bg-muted/20 pb-3.5">
        <CardTitle className="text-base">Affiliate accounts</CardTitle>
        <div className="w-40">
          <NativeSelect className="h-9" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="suspended">Suspended</option>
          </NativeSelect>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pt-4">
        {affiliates?.length === 0 && <p className="text-sm text-muted-foreground">No affiliates match that filter.</p>}
        {affiliates?.map((affiliate) => (
          <div key={affiliate.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3.5 text-sm">
            <div>
              <p className="font-semibold">{affiliate.userId?.name ?? "Unknown user"}</p>
              <p className="text-xs text-muted-foreground">
                {affiliate.userId?.email} · code {affiliate.referralCode} · balance {affiliate.availableBalance} of{" "}
                {affiliate.totalEarnings} earned
              </p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={affiliate.status} />
              {affiliate.status !== "approved" && (
                <Button size="sm" onClick={() => moderate.mutate({ id: affiliate.id, status: "approved" })}>
                  Approve
                </Button>
              )}
              {affiliate.status !== "suspended" && (
                <Button size="sm" variant="outline" onClick={() => moderate.mutate({ id: affiliate.id, status: "suspended" })}>
                  Suspend
                </Button>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function WithdrawalsPanel() {
  const { data: withdrawals } = useAffiliateWithdrawals();
  const resolve = useResolveAffiliateWithdrawal();

  return (
    <Card>
      <CardHeader className="border-b bg-muted/20 pb-3.5">
        <CardTitle className="text-base">Withdrawal requests</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pt-4">
        {withdrawals?.length === 0 && <p className="text-sm text-muted-foreground">No withdrawal requests.</p>}
        {withdrawals?.map(
          (request: {
            id: string;
            amount: number;
            method: string;
            status: string;
            affiliateUserId?: { userId?: { name: string; email: string } };
          }) => (
            <div key={request.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3.5 text-sm">
              <div>
                <p className="font-semibold">
                  {request.affiliateUserId?.userId?.name ?? "Unknown"} — {request.amount}
                </p>
                <p className="text-xs text-muted-foreground">
                  {request.affiliateUserId?.userId?.email} · via {request.method.replace("_", " ")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={request.status} />
                {request.status === "pending" && (
                  <>
                    <Button size="sm" onClick={() => resolve.mutate({ id: request.id, approve: true })}>
                      Mark paid
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => resolve.mutate({ id: request.id, approve: false })}>
                      Reject
                    </Button>
                  </>
                )}
              </div>
            </div>
          ),
        )}
      </CardContent>
    </Card>
  );
}

function PaymentsPanel() {
  const { data: payments } = useAffiliatePayments();

  return (
    <Card>
      <CardHeader className="border-b bg-muted/20 pb-3.5">
        <CardTitle className="text-base">Payment history</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pt-4">
        {payments?.length === 0 && <p className="text-sm text-muted-foreground">No payouts recorded yet.</p>}
        {payments?.map((payment: { id: string; amount: number; paidAt: string; affiliateUserId?: { userId?: { name: string } } }) => (
          <div key={payment.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
            <span className="font-medium">{payment.affiliateUserId?.userId?.name ?? "Unknown affiliate"}</span>
            <span className="font-semibold">{payment.amount}</span>
            <span className="text-muted-foreground">{new Date(payment.paidAt).toLocaleDateString()}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ReferralsPanel() {
  const { data: referrals } = useReferredUsers();

  return (
    <Card>
      <CardHeader className="border-b bg-muted/20 pb-3.5">
        <CardTitle className="text-base">Referred customers</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pt-4">
        {referrals?.length === 0 && <p className="text-sm text-muted-foreground">Nobody has signed up through a referral yet.</p>}
        {referrals?.map((user: { id: string; name: string; email: string; createdAt: string; referredBy?: { name: string } }) => (
          <div key={user.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm">
            <span>
              <span className="font-medium">{user.name}</span>{" "}
              <span className="text-muted-foreground">({user.email})</span>
            </span>
            <span className="text-muted-foreground">referred by {user.referredBy?.name ?? "—"}</span>
            <span className="text-muted-foreground">{new Date(user.createdAt).toLocaleDateString()}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
