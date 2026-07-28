"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import {
  useWallet,
  useWalletHistory,
  useManualPaymentMethods,
  useMyRechargeRequests,
  useCreateRechargeRequest,
} from "@/lib/hooks/useWallet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/format";

export default function WalletPage() {
  const { data: wallet } = useWallet();
  const { data: history, isLoading } = useWalletHistory();
  const { data: methods } = useManualPaymentMethods();
  const { data: recharges } = useMyRechargeRequests();
  const createRecharge = useCreateRechargeRequest();

  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState(0);
  const [methodId, setMethodId] = useState("");
  const [proofUrl, setProofUrl] = useState("");

  const selectedMethod = methods?.find((m) => m.id === methodId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createRecharge.mutateAsync({ amount, methodId, proofUrl });
      setShowForm(false);
      setAmount(0);
      setProofUrl("");
      toast.success("Recharge request submitted for approval");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Could not submit recharge request");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Wallet</h1>
        <Button variant="outline" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "Add money"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Available balance</CardTitle>
        </CardHeader>
        <CardContent className="text-3xl font-bold">{formatPrice(wallet?.balance ?? 0, wallet?.currency)}</CardContent>
      </Card>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recharge via bank transfer</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label>Amount</Label>
                <Input type="number" min={1} value={amount} onChange={(e) => setAmount(Number(e.target.value))} required />
              </div>
              <div className="space-y-2">
                <Label>Payment method</Label>
                <select
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={methodId}
                  onChange={(e) => setMethodId(e.target.value)}
                  required
                >
                  <option value="">Select method</option>
                  {methods?.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
                {selectedMethod && <p className="text-xs text-muted-foreground">{selectedMethod.instructions}</p>}
              </div>
              <div className="space-y-2">
                <Label>Receipt / proof URL</Label>
                <Input value={proofUrl} onChange={(e) => setProofUrl(e.target.value)} placeholder="Link to your payment receipt" required />
              </div>
              <Button type="submit" disabled={createRecharge.isPending}>
                Submit request
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {recharges && recharges.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold">Recharge requests</h2>
          <div className="divide-y rounded-md border">
            {recharges.map((r) => (
              <div key={r.id} className="flex items-center justify-between p-3 text-sm">
                <span>{formatPrice(r.amount, wallet?.currency)}</span>
                <Badge variant={r.status === "approved" ? "secondary" : r.status === "rejected" ? "destructive" : "outline"}>
                  {r.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-3 text-lg font-semibold">Transaction history</h2>
        {isLoading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : !history || history.length === 0 ? (
          <p className="text-muted-foreground">No transactions yet.</p>
        ) : (
          <div className="divide-y rounded-md border">
            {history.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-3 text-sm">
                <div>
                  <p>{tx.reason}</p>
                  <p className="text-muted-foreground">{new Date(tx.createdAt).toLocaleString()}</p>
                </div>
                <p className={tx.amount >= 0 ? "font-semibold text-green-600" : "font-semibold text-destructive"}>
                  {tx.amount >= 0 ? "+" : ""}
                  {formatPrice(tx.amount, wallet?.currency)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
