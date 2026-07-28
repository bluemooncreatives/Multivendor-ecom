"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useSellerLedgerSummary, useSellerWithdrawals, useCreateWithdrawal } from "@/lib/hooks/useSeller";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/format";

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
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Could not submit request");
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Withdrawals</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Available balance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-2xl font-bold">{formatPrice(summary?.available ?? 0)}</p>
          <form className="flex gap-2" onSubmit={handleSubmit}>
            <Input type="number" min={1} value={amount} onChange={(e) => setAmount(Number(e.target.value))} required />
            <Button type="submit" disabled={createWithdrawal.isPending}>
              Request withdrawal
            </Button>
          </form>
        </CardContent>
      </Card>

      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        <div className="space-y-2">
          {withdrawals?.map((w: any) => (
            <div key={w.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
              <span>{formatPrice(w.amount)}</span>
              <Badge variant={w.status === "paid" ? "secondary" : w.status === "rejected" ? "destructive" : "outline"}>
                {w.status}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
