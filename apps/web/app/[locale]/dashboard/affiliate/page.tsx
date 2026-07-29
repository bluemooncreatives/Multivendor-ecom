"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  useAffiliateConfig,
  useMyAffiliate,
  useJoinAffiliate,
  useAffiliateEarnings,
  useRequestAffiliateWithdraw,
  useMyAffiliateWithdrawals,
  useMyReferrals,
  useAffiliatePaymentSettings,
  useSaveAffiliatePaymentSettings,
} from "@/lib/hooks/useAddons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/format";

export default function AffiliatePage() {
  const { data: config } = useAffiliateConfig();
  const { data: affiliate, isLoading } = useMyAffiliate();
  const joinAffiliate = useJoinAffiliate();

  if (!config?.enabled) {
    return <p className="text-muted-foreground">The affiliate program is not currently active.</p>;
  }

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;

  if (!affiliate) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Affiliate program</h1>
        <p className="text-muted-foreground">
          Earn {config.commissionPercent}% commission on every sale referred through your link.
        </p>
        <Button onClick={() => joinAffiliate.mutate()} disabled={joinAffiliate.isPending}>
          Join affiliate program
        </Button>
      </div>
    );
  }

  if (affiliate.status !== "approved") {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Affiliate program</h1>
        <Badge variant="outline">{affiliate.status}</Badge>
        <p className="text-muted-foreground">
          {affiliate.status === "pending"
            ? "Your application is being reviewed. You will be able to share your link once it is approved."
            : "Your affiliate account is currently suspended. Contact support for details."}
        </p>
        {affiliate.rejectionReason && <p className="text-sm text-muted-foreground">Reason: {affiliate.rejectionReason}</p>}
      </div>
    );
  }

  return <ApprovedAffiliate affiliate={affiliate} config={config} />;
}

function ApprovedAffiliate({
  affiliate,
  config,
}: {
  affiliate: { referralCode: string; totalEarnings: number; availableBalance: number };
  config: { commissionPercent: number; minWithdrawAmount: number; allowedMethods: string[] };
}) {
  const { data: earnings } = useAffiliateEarnings();
  const { data: withdrawals } = useMyAffiliateWithdrawals();
  const { data: referrals } = useMyReferrals();
  const requestWithdraw = useRequestAffiliateWithdraw();

  const { data: paymentSettings } = useAffiliatePaymentSettings();
  const savePaymentSettings = useSaveAffiliatePaymentSettings();
  const [settings, setSettings] = useState<Record<string, string>>({ method: "bank_transfer" });

  useEffect(() => {
    if (paymentSettings && Object.keys(paymentSettings).length > 0) setSettings(paymentSettings);
  }, [paymentSettings]);

  const [withdraw, setWithdraw] = useState({ amount: 0, method: config.allowedMethods[0] ?? "bank_transfer" });

  // Pending requests are already held against the balance server-side; showing the
  // same maths here keeps the form from offering an amount that will be rejected.
  const pendingTotal = (withdrawals ?? [])
    .filter((w: { status: string }) => w.status === "pending" || w.status === "approved")
    .reduce((sum: number, w: { amount: number }) => sum + w.amount, 0);
  const withdrawable = affiliate.availableBalance - pendingTotal;

  // Only the referral code travels in the link; the API resolves it at signup.
  const referralLink =
    typeof window === "undefined" ? "" : `${window.location.origin}/register?ref=${affiliate.referralCode}`;

  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault();
    try {
      await requestWithdraw.mutateAsync(withdraw);
      toast.success("Withdrawal requested");
      setWithdraw({ ...withdraw, amount: 0 });
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(message ?? "Could not submit request");
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Affiliate program</h1>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Referral code</CardTitle>
          </CardHeader>
          <CardContent className="font-mono text-lg font-bold">{affiliate.referralCode}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Total earnings</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{formatPrice(affiliate.totalEarnings)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Available now</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{formatPrice(withdrawable)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Referred signups</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{referrals?.length ?? 0}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your referral link</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Input readOnly value={referralLink} className="max-w-lg font-mono text-xs" />
          <Button
            variant="outline"
            onClick={() => {
              navigator.clipboard.writeText(referralLink);
              toast.success("Link copied");
            }}
          >
            Copy
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payout details</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4 md:grid-cols-3"
            onSubmit={(e) => {
              e.preventDefault();
              savePaymentSettings.mutate(settings, { onSuccess: () => toast.success("Payout details saved") });
            }}
          >
            <div className="space-y-1">
              <Label htmlFor="pay-method">Method</Label>
              <select
                id="pay-method"
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={settings.method}
                onChange={(e) => setSettings({ ...settings, method: e.target.value })}
              >
                {config.allowedMethods.map((method) => (
                  <option key={method} value={method}>
                    {method.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="acc-name">Account name</Label>
              <Input
                id="acc-name"
                value={settings.accountName ?? ""}
                onChange={(e) => setSettings({ ...settings, accountName: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="acc-number">Account number</Label>
              <Input
                id="acc-number"
                value={settings.accountNumber ?? ""}
                onChange={(e) => setSettings({ ...settings, accountNumber: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="bank">Bank name</Label>
              <Input id="bank" value={settings.bankName ?? ""} onChange={(e) => setSettings({ ...settings, bankName: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="routing">Routing / IFSC</Label>
              <Input
                id="routing"
                value={settings.routingNumber ?? ""}
                onChange={(e) => setSettings({ ...settings, routingNumber: e.target.value })}
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" variant="outline" disabled={savePaymentSettings.isPending}>
                Save details
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Request a withdrawal</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-wrap items-end gap-2" onSubmit={handleWithdraw}>
            <div className="space-y-1">
              <Label htmlFor="wd-amount">Amount</Label>
              <Input
                id="wd-amount"
                type="number"
                min={config.minWithdrawAmount}
                max={withdrawable}
                value={withdraw.amount || ""}
                onChange={(e) => setWithdraw({ ...withdraw, amount: Number(e.target.value) })}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="wd-method">Method</Label>
              <select
                id="wd-method"
                className="h-10 rounded-md border bg-background px-3 text-sm"
                value={withdraw.method}
                onChange={(e) => setWithdraw({ ...withdraw, method: e.target.value })}
              >
                {config.allowedMethods.map((method) => (
                  <option key={method} value={method}>
                    {method.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" disabled={requestWithdraw.isPending || withdrawable < config.minWithdrawAmount}>
              Request withdrawal
            </Button>
          </form>
          <p className="mt-2 text-xs text-muted-foreground">
            Minimum withdrawal is {formatPrice(config.minWithdrawAmount)}.
            {pendingTotal > 0 && ` ${formatPrice(pendingTotal)} is already reserved by pending requests.`}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-2 text-lg font-semibold">Earnings history</h2>
          {!earnings || earnings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No commission earned yet.</p>
          ) : (
            <div className="divide-y rounded-md border">
              {earnings.map((e: { id: string; amount: number; status: string; createdAt: string }) => (
                <div key={e.id} className="flex items-center justify-between p-3 text-sm">
                  <span>{new Date(e.createdAt).toLocaleDateString()}</span>
                  <span>{formatPrice(e.amount)}</span>
                  <span className="capitalize text-muted-foreground">{e.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold">Withdrawals</h2>
          {!withdrawals || withdrawals.length === 0 ? (
            <p className="text-sm text-muted-foreground">No withdrawals requested yet.</p>
          ) : (
            <div className="divide-y rounded-md border">
              {withdrawals.map((w: { id: string; amount: number; status: string; createdAt: string }) => (
                <div key={w.id} className="flex items-center justify-between p-3 text-sm">
                  <span>{new Date(w.createdAt).toLocaleDateString()}</span>
                  <span>{formatPrice(w.amount)}</span>
                  <Badge variant={w.status === "paid" ? "default" : "outline"}>{w.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-lg font-semibold">Your referrals</h2>
        {!referrals || referrals.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nobody has signed up through your link yet.</p>
        ) : (
          <div className="divide-y rounded-md border">
            {referrals.map((user: { id: string; name: string; email: string; createdAt: string }) => (
              <div key={user.id} className="flex items-center justify-between p-3 text-sm">
                <span>{user.name}</span>
                <span className="text-muted-foreground">{new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
