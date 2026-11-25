"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { PlusCircle, Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft } from "lucide-react";
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
import { NativeSelect } from "@/components/ui/native-select";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { FormField } from "@/components/shared/form-field";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/loading-state";
import { formatPrice } from "@/lib/format";
import { getApiErrorMessage } from "@/lib/utils";

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
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not submit recharge request"));
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Wallet"
        description="Manage store credit and view your transaction ledger."
        actions={
          <Button variant={showForm ? "outline" : "default"} onClick={() => setShowForm((v) => !v)}>
            <PlusCircle className="h-4 w-4" />
            {showForm ? "Cancel" : "Add money"}
          </Button>
        }
      />

      <StatCard
        label="Available balance"
        value={formatPrice(wallet?.balance ?? 0, wallet?.currency)}
        icon={WalletIcon}
        tone="success"
      />

      {showForm && (
        <Card>
          <CardHeader className="border-b bg-muted/20 pb-4">
            <CardTitle className="text-base">Recharge via bank transfer</CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
              <FormField label="Amount" htmlFor="recharge-amount" required>
                <Input
                  id="recharge-amount"
                  type="number"
                  min={1}
                  value={amount || ""}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  required
                />
              </FormField>
              <FormField label="Payment method" htmlFor="recharge-method" hint={selectedMethod?.instructions} required>
                <NativeSelect id="recharge-method" value={methodId} onChange={(e) => setMethodId(e.target.value)} required>
                  <option value="">Select method</option>
                  {methods?.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </NativeSelect>
              </FormField>
              <FormField label="Receipt / proof URL" htmlFor="recharge-proof" required className="sm:col-span-2">
                <Input
                  id="recharge-proof"
                  value={proofUrl}
                  onChange={(e) => setProofUrl(e.target.value)}
                  placeholder="Link to your payment receipt"
                  required
                />
              </FormField>
              <div className="sm:col-span-2">
                <Button type="submit" disabled={createRecharge.isPending}>
                  Submit request
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {recharges && recharges.length > 0 && (
        <Card>
          <CardHeader className="border-b bg-muted/20 py-3.5">
            <CardTitle className="text-base">Recharge requests</CardTitle>
          </CardHeader>
          <CardContent className="divide-y p-0">
            {recharges.map((r) => (
              <div key={r.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <span className="font-medium">{formatPrice(r.amount, wallet?.currency)}</span>
                <StatusBadge status={r.status} />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="border-b bg-muted/20 py-3.5">
          <CardTitle className="text-base">Transaction history</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4">
              <TableSkeleton rows={4} />
            </div>
          ) : !history || history.length === 0 ? (
            <div className="p-6">
              <EmptyState icon={WalletIcon} title="No transactions yet" description="Wallet credits and debits will appear here." />
            </div>
          ) : (
            <div className="divide-y">
              {history.map((tx) => {
                const positive = tx.amount >= 0;
                return (
                  <div key={tx.id} className="flex items-center justify-between gap-3 px-5 py-3.5 text-sm">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                          positive ? "bg-emerald-500/15 text-emerald-600" : "bg-destructive/15 text-destructive"
                        }`}
                      >
                        {positive ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="font-medium">{tx.reason}</p>
                        <p className="text-xs text-muted-foreground">{new Date(tx.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                    <p className={`font-semibold ${positive ? "text-emerald-600" : "text-destructive"}`}>
                      {positive ? "+" : ""}
                      {formatPrice(tx.amount, wallet?.currency)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
