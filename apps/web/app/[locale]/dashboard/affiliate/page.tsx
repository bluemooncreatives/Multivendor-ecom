"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Share2, Wallet, Users, BadgePercent, DollarSign } from "lucide-react";
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
import { NativeSelect } from "@/components/ui/native-select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { FormField } from "@/components/shared/form-field";
import { CopyButton } from "@/components/shared/copy-button";
import { PageSkeleton } from "@/components/shared/loading-state";
import { EmptyState } from "@/components/shared/empty-state";
import { formatPrice } from "@/lib/format";
import { getApiErrorMessage } from "@/lib/utils";

export default function AffiliatePage() {
  const { data: config } = useAffiliateConfig();
  const { data: affiliate, isLoading } = useMyAffiliate();
  const joinAffiliate = useJoinAffiliate();

  if (!config?.enabled) {
    return (
      <EmptyState
        icon={Share2}
        title="Affiliate program inactive"
        description="The affiliate program is not currently active."
      />
    );
  }

  if (isLoading) return <PageSkeleton />;

  if (!affiliate) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Affiliate program"
          description={`Earn ${config.commissionPercent}% commission on every sale referred through your link.`}
        />
        <Card>
          <CardContent className="space-y-4 pt-6">
            <p className="text-sm text-muted-foreground">
              Share referral and product links with your audience and withdraw commissions once approved.
            </p>
            <Button onClick={() => joinAffiliate.mutate()} disabled={joinAffiliate.isPending}>
              Join affiliate program
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (affiliate.status !== "approved") {
    return (
      <div className="space-y-6">
        <PageHeader title="Affiliate program" badge={<StatusBadge status={affiliate.status} />} />
        <Alert variant={affiliate.status === "pending" ? "info" : "destructive"}>
          <AlertDescription>
            {affiliate.status === "pending"
              ? "Your application is being reviewed. You will be able to share your link once it is approved."
              : "Your affiliate account is currently suspended. Contact support for details."}
          </AlertDescription>
        </Alert>
        {affiliate.rejectionReason && (
          <p className="text-sm text-muted-foreground">Reason: {affiliate.rejectionReason}</p>
        )}
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

  const pendingTotal = (withdrawals ?? [])
    .filter((w: { status: string }) => w.status === "pending" || w.status === "approved")
    .reduce((sum: number, w: { amount: number }) => sum + w.amount, 0);
  const withdrawable = affiliate.availableBalance - pendingTotal;

  const [shareUrl, setShareUrl] = useState("");
  const referralLink =
    typeof window === "undefined" ? "" : `${window.location.origin}/register?ref=${affiliate.referralCode}`;

  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault();
    try {
      await requestWithdraw.mutateAsync(withdraw);
      toast.success("Withdrawal requested");
      setWithdraw({ ...withdraw, amount: 0 });
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not submit request"));
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Affiliate program" description={`Earning ${config.commissionPercent}% commission on referrals.`} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Referral code" value={affiliate.referralCode} icon={BadgePercent} tone="primary" />
        <StatCard label="Total earnings" value={formatPrice(affiliate.totalEarnings)} icon={DollarSign} tone="success" />
        <StatCard label="Available now" value={formatPrice(withdrawable)} icon={Wallet} tone="primary" />
        <StatCard label="Referred signups" value={referrals?.length ?? 0} icon={Users} tone="default" />
      </div>

      <Card>
        <CardHeader className="border-b bg-muted/20 pb-4">
          <CardTitle className="text-base">Your referral link</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 pt-5">
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <Input readOnly value={referralLink} className="max-w-lg font-mono text-xs" aria-label="Signup referral link" />
              <CopyButton value={referralLink} label="Copy" successMessage="Link copied" />
            </div>
            <p className="text-xs text-muted-foreground">
              Shares the store and credits you when someone signs up through it.
            </p>
          </div>

          <div className="space-y-2 border-t pt-4">
            <p className="text-sm font-semibold">Share a product</p>
            <div className="flex flex-wrap gap-2">
              <Input
                value={shareUrl}
                onChange={(e) => setShareUrl(e.target.value)}
                placeholder="Paste a product link"
                className="max-w-lg font-mono text-xs"
                aria-label="Product link to share"
              />
              <Button
                variant="outline"
                onClick={() => {
                  const link = buildProductShareLink(shareUrl, affiliate.referralCode);
                  if (!link) {
                    toast.error("Paste a product link from this store first");
                    return;
                  }
                  navigator.clipboard.writeText(link);
                  toast.success("Product share link copied");
                }}
              >
                Copy share link
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b bg-muted/20 pb-4">
          <CardTitle className="text-base">Payout details</CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          <form
            className="grid gap-4 md:grid-cols-3"
            onSubmit={(e) => {
              e.preventDefault();
              savePaymentSettings.mutate(settings, { onSuccess: () => toast.success("Payout details saved") });
            }}
          >
            <FormField label="Method" htmlFor="pay-method">
              <NativeSelect
                id="pay-method"
                value={settings.method}
                onChange={(e) => setSettings({ ...settings, method: e.target.value })}
              >
                {config.allowedMethods.map((method) => (
                  <option key={method} value={method}>
                    {method.replace("_", " ")}
                  </option>
                ))}
              </NativeSelect>
            </FormField>
            <FormField label="Account name" htmlFor="acc-name">
              <Input
                id="acc-name"
                value={settings.accountName ?? ""}
                onChange={(e) => setSettings({ ...settings, accountName: e.target.value })}
              />
            </FormField>
            <FormField label="Account number" htmlFor="acc-number">
              <Input
                id="acc-number"
                value={settings.accountNumber ?? ""}
                onChange={(e) => setSettings({ ...settings, accountNumber: e.target.value })}
              />
            </FormField>
            <FormField label="Bank name" htmlFor="bank">
              <Input id="bank" value={settings.bankName ?? ""} onChange={(e) => setSettings({ ...settings, bankName: e.target.value })} />
            </FormField>
            <FormField label="Routing / IFSC" htmlFor="routing">
              <Input
                id="routing"
                value={settings.routingNumber ?? ""}
                onChange={(e) => setSettings({ ...settings, routingNumber: e.target.value })}
              />
            </FormField>
            <div className="flex items-end">
              <Button type="submit" variant="outline" disabled={savePaymentSettings.isPending}>
                Save details
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b bg-muted/20 pb-4">
          <CardTitle className="text-base">Request a withdrawal</CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          <form className="flex flex-wrap items-end gap-3" onSubmit={handleWithdraw}>
            <FormField label="Amount" htmlFor="wd-amount">
              <Input
                id="wd-amount"
                type="number"
                min={config.minWithdrawAmount}
                max={withdrawable}
                value={withdraw.amount || ""}
                onChange={(e) => setWithdraw({ ...withdraw, amount: Number(e.target.value) })}
                required
              />
            </FormField>
            <FormField label="Method" htmlFor="wd-method">
              <NativeSelect
                id="wd-method"
                value={withdraw.method}
                onChange={(e) => setWithdraw({ ...withdraw, method: e.target.value })}
              >
                {config.allowedMethods.map((method) => (
                  <option key={method} value={method}>
                    {method.replace("_", " ")}
                  </option>
                ))}
              </NativeSelect>
            </FormField>
            <Button type="submit" disabled={requestWithdraw.isPending || withdrawable < config.minWithdrawAmount}>
              Request withdrawal
            </Button>
          </form>
          <p className="mt-2.5 text-xs text-muted-foreground">
            Minimum withdrawal is {formatPrice(config.minWithdrawAmount)}.
            {pendingTotal > 0 && ` ${formatPrice(pendingTotal)} is already reserved by pending requests.`}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="border-b bg-muted/20 py-3.5">
            <CardTitle className="text-base">Earnings history</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {!earnings || earnings.length === 0 ? (
              <p className="p-5 text-sm text-muted-foreground">No commission earned yet.</p>
            ) : (
              <div className="divide-y">
                {earnings.map((e: { id: string; amount: number; status: string; createdAt: string }) => (
                  <div key={e.id} className="flex items-center justify-between px-5 py-3 text-sm">
                    <span className="text-muted-foreground">{new Date(e.createdAt).toLocaleDateString()}</span>
                    <span className="font-semibold">{formatPrice(e.amount)}</span>
                    <StatusBadge status={e.status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b bg-muted/20 py-3.5">
            <CardTitle className="text-base">Withdrawals</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {!withdrawals || withdrawals.length === 0 ? (
              <p className="p-5 text-sm text-muted-foreground">No withdrawals requested yet.</p>
            ) : (
              <div className="divide-y">
                {withdrawals.map((w: { id: string; amount: number; status: string; createdAt: string }) => (
                  <div key={w.id} className="flex items-center justify-between px-5 py-3 text-sm">
                    <span className="text-muted-foreground">{new Date(w.createdAt).toLocaleDateString()}</span>
                    <span className="font-semibold">{formatPrice(w.amount)}</span>
                    <StatusBadge status={w.status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="border-b bg-muted/20 py-3.5">
          <CardTitle className="text-base">Your referrals</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!referrals || referrals.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">Nobody has signed up through your link yet.</p>
          ) : (
            <div className="divide-y">
              {referrals.map((user: { id: string; name: string; email: string; createdAt: string }) => (
                <div key={user.id} className="flex items-center justify-between px-5 py-3 text-sm">
                  <span className="font-medium">{user.name}</span>
                  <span className="text-muted-foreground">{new Date(user.createdAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function buildProductShareLink(input: string, referralCode: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed, window.location.origin);
    if (url.origin !== window.location.origin) return null;
    if (!url.pathname.includes("/product/")) return null;
    url.searchParams.set("ref", referralCode);
    return url.toString();
  } catch {
    return null;
  }
}
