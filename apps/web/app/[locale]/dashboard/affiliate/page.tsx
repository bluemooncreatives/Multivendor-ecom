"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import {
  useAffiliateConfig,
  useMyAffiliate,
  useJoinAffiliate,
  useAffiliateEarnings,
  useRequestAffiliateWithdraw,
} from "@/lib/hooks/useAddons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/format";

export default function AffiliatePage() {
  const { data: config } = useAffiliateConfig();
  const { data: affiliate, isLoading } = useMyAffiliate();
  const joinAffiliate = useJoinAffiliate();
  const { data: earnings } = useAffiliateEarnings();
  const requestWithdraw = useRequestAffiliateWithdraw();
  const [amount, setAmount] = useState(0);

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

  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault();
    try {
      await requestWithdraw.mutateAsync({ amount, method: "bank_transfer" });
      toast.success("Withdrawal requested");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Could not submit request");
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Affiliate program</h1>
      <div className="grid gap-4 sm:grid-cols-3">
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
            <CardTitle className="text-sm text-muted-foreground">Available balance</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{formatPrice(affiliate.availableBalance)}</CardContent>
        </Card>
      </div>

      <form className="flex gap-2" onSubmit={handleWithdraw}>
        <Input type="number" min={1} value={amount} onChange={(e) => setAmount(Number(e.target.value))} required />
        <Button type="submit" disabled={requestWithdraw.isPending}>
          Request withdrawal
        </Button>
      </form>

      <div>
        <h2 className="mb-2 text-lg font-semibold">Earnings history</h2>
        <div className="divide-y rounded-md border">
          {earnings?.map((e: any) => (
            <div key={e.id} className="flex items-center justify-between p-3 text-sm">
              <span>{new Date(e.createdAt).toLocaleDateString()}</span>
              <span>{formatPrice(e.amount)}</span>
              <span className="capitalize text-muted-foreground">{e.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
