"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Banknote, Wallet } from "lucide-react";
import { useSellerLedgerSummary, useSellerWithdrawals, useCreateWithdrawal } from "@/lib/hooks/useSeller";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/loading-state";
import { formatPrice } from "@/lib/format";
import { getApiErrorMessage } from "@/lib/utils";

export default function SellerWithdrawalsPage() {
  const { data: summary } = useSellerLedgerSummary();
  const { data: withdrawals, isLoading } = useSellerWithdrawals();
  const createWithdrawal = useCreateWithdrawal();
  const [amount, setAmount] = useState(0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createWithdrawal.mutateAsync({ amount, method: "bank_transfer" });
      setAmount(0);
      toast.success("Withdrawal request submitted");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not submit request"));
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Withdrawals" description="Request payouts from your available seller balance." />

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Available balance" value={formatPrice(summary?.available ?? 0)} icon={Wallet} tone="success" />
        <Card>
          <CardHeader className="pb-3 pt-5">
            <CardTitle className="text-sm font-medium text-muted-foreground">Request payout</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="flex gap-2" onSubmit={handleSubmit}>
              <Input
                type="number"
                min={1}
                placeholder="Amount"
                value={amount || ""}
                onChange={(e) => setAmount(Number(e.target.value))}
                required
              />
              <Button type="submit" disabled={createWithdrawal.isPending}>
                Request withdrawal
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="border-b bg-muted/20 py-3.5">
          <CardTitle className="text-base">Withdrawal history</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4">
              <TableSkeleton rows={3} />
            </div>
          ) : !withdrawals || withdrawals.length === 0 ? (
            <div className="p-6">
              <EmptyState icon={Banknote} title="No withdrawals yet" description="Submitted withdrawal requests appear here." />
            </div>
          ) : (
            <div className="divide-y">
              {withdrawals.map((w: { id: string; amount: number; status: string }) => (
                <div key={w.id} className="flex items-center justify-between px-5 py-3.5 text-sm">
                  <span className="font-semibold">{formatPrice(w.amount)}</span>
                  <StatusBadge status={w.status} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
