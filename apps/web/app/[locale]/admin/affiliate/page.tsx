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
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const TABS = ["Configuration", "Affiliates", "Withdrawals", "Payments", "Referrals"] as const;

export default function AdminAffiliatePage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Configuration");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Affiliate program</h1>

      <div className="flex flex-wrap gap-2 border-b">
        {TABS.map((name) => (
          <button
            key={name}
            onClick={() => setTab(name)}
            className={`px-3 py-2 text-sm ${tab === name ? "border-b-2 border-primary font-medium" : "text-muted-foreground"}`}
          >
            {name}
          </button>
        ))}
      </div>

      {tab === "Configuration" && <ConfigPanel />}
      {tab === "Affiliates" && <AffiliatesPanel />}
      {tab === "Withdrawals" && <WithdrawalsPanel />}
      {tab === "Payments" && <PaymentsPanel />}
      {tab === "Referrals" && <ReferralsPanel />}
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

  if (!form) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Program settings</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-4 md:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            const { id: _id, ...payload } = form;
            saveConfig.mutate(payload);
          }}
        >
          <label className="flex items-center gap-2 md:col-span-2">
            <input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} />
            <span className="text-sm font-medium">Affiliate program is active</span>
          </label>

          <div className="space-y-1">
            <Label htmlFor="commission">Commission on referred orders (%)</Label>
            <Input
              id="commission"
              type="number"
              min={0}
              max={100}
              step="0.1"
              value={form.commissionPercent}
              onChange={(e) => setForm({ ...form, commissionPercent: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="cookie">Attribution window (days)</Label>
            <Input
              id="cookie"
              type="number"
              min={0}
              max={365}
              value={form.cookieDays}
              onChange={(e) => setForm({ ...form, cookieDays: Number(e.target.value) })}
            />
            <p className="text-xs text-muted-foreground">
              Orders count toward a referral only within this many days of the referred customer signing up.
            </p>
          </div>
          <div className="space-y-1">
            <Label htmlFor="minWithdraw">Minimum withdrawal amount</Label>
            <Input
              id="minWithdraw"
              type="number"
              min={0}
              value={form.minWithdrawAmount}
              onChange={(e) => setForm({ ...form, minWithdrawAmount: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="signupBonus">Signup bonus per referral</Label>
            <Input
              id="signupBonus"
              type="number"
              min={0}
              value={form.actionBonuses?.signup ?? 0}
              onChange={(e) => setForm({ ...form, actionBonuses: { ...form.actionBonuses, signup: Number(e.target.value) } })}
            />
          </div>

          <fieldset className="space-y-2 md:col-span-2">
            <legend className="text-sm font-medium">Allowed payout methods</legend>
            <div className="flex flex-wrap gap-4">
              {(["bank_transfer", "wallet", "manual"] as const).map((method) => (
                <label key={method} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.allowedMethods.includes(method)}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        allowedMethods: e.target.checked
                          ? [...form.allowedMethods, method]
                          : form.allowedMethods.filter((m) => m !== method),
                      })
                    }
                  />
                  {method.replace("_", " ")}
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
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-base">Affiliate accounts</CardTitle>
        <select
          className="h-9 rounded-md border bg-background px-2 text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="suspended">Suspended</option>
        </select>
      </CardHeader>
      <CardContent className="space-y-2">
        {affiliates?.length === 0 && <p className="text-sm text-muted-foreground">No affiliates match that filter.</p>}
        {affiliates?.map((affiliate) => (
          <div key={affiliate.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm">
            <div>
              <p className="font-medium">{affiliate.userId?.name ?? "Unknown user"}</p>
              <p className="text-muted-foreground">
                {affiliate.userId?.email} · code {affiliate.referralCode} · balance {affiliate.availableBalance} of{" "}
                {affiliate.totalEarnings} earned
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={affiliate.status === "approved" ? "default" : "outline"}>{affiliate.status}</Badge>
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
      <CardHeader>
        <CardTitle className="text-base">Withdrawal requests</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {withdrawals?.length === 0 && <p className="text-sm text-muted-foreground">No withdrawal requests.</p>}
        {withdrawals?.map(
          (request: {
            id: string;
            amount: number;
            method: string;
            status: string;
            affiliateUserId?: { userId?: { name: string; email: string } };
          }) => (
            <div key={request.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm">
              <div>
                <p className="font-medium">
                  {request.affiliateUserId?.userId?.name ?? "Unknown"} — {request.amount}
                </p>
                <p className="text-muted-foreground">
                  {request.affiliateUserId?.userId?.email} · via {request.method.replace("_", " ")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={request.status === "paid" ? "default" : "outline"}>{request.status}</Badge>
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
      <CardHeader>
        <CardTitle className="text-base">Payment history</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {payments?.length === 0 && <p className="text-sm text-muted-foreground">No payouts recorded yet.</p>}
        {payments?.map((payment: { id: string; amount: number; paidAt: string; affiliateUserId?: { userId?: { name: string } } }) => (
          <div key={payment.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
            <span>{payment.affiliateUserId?.userId?.name ?? "Unknown affiliate"}</span>
            <span className="font-medium">{payment.amount}</span>
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
      <CardHeader>
        <CardTitle className="text-base">Referred customers</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {referrals?.length === 0 && <p className="text-sm text-muted-foreground">Nobody has signed up through a referral yet.</p>}
        {referrals?.map((user: { id: string; name: string; email: string; createdAt: string; referredBy?: { name: string } }) => (
          <div key={user.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
            <span>
              {user.name} <span className="text-muted-foreground">({user.email})</span>
            </span>
            <span className="text-muted-foreground">referred by {user.referredBy?.name ?? "—"}</span>
            <span className="text-muted-foreground">{new Date(user.createdAt).toLocaleDateString()}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
