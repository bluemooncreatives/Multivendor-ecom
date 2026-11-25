"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Coins, Wallet } from "lucide-react";
import { useMyClubPoints, useClubPointsHistory, useConvertClubPoints } from "@/lib/hooks/useAddons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { FormField } from "@/components/shared/form-field";
import { TableSkeleton } from "@/components/shared/loading-state";
import { formatPrice } from "@/lib/format";
import { getApiErrorMessage } from "@/lib/utils";

export default function ClubPointsPage() {
  const { data: points } = useMyClubPoints();
  const { data: history, isLoading } = useClubPointsHistory();
  const convert = useConvertClubPoints();
  const [amount, setAmount] = useState(0);

  const balance = points?.points ?? 0;
  const minimum = points?.minConvertPoints ?? 0;
  const rate = points?.convertRate ?? 0;

  async function handleConvert(event: React.FormEvent) {
    event.preventDefault();
    try {
      const result = await convert.mutateAsync(amount);
      toast.success(`Converted ${result.points} points into ${formatPrice(result.credited)} of wallet credit`);
      setAmount(0);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not convert your points"));
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Club points" description="Earn points on qualifying purchases and convert them to wallet credit." />

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Your balance" value={`${balance} pts`} icon={Coins} tone="primary" />
        <StatCard
          label="Worth in wallet credit"
          value={formatPrice(points?.convertibleValue ?? 0)}
          icon={Wallet}
          tone="success"
        />
      </div>

      <Card>
        <CardHeader className="border-b bg-muted/20 pb-4">
          <CardTitle className="text-base">Convert points to wallet credit</CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          {rate <= 0 ? (
            <p className="text-sm text-muted-foreground">Point conversion is currently disabled.</p>
          ) : (
            <form className="space-y-4" onSubmit={handleConvert}>
              <FormField
                label="Points to convert"
                htmlFor="points"
                hint={`Each point is worth ${formatPrice(rate)}${minimum > 0 ? ` · minimum ${minimum} points per conversion` : ""}`}
                className="max-w-xs"
              >
                <Input
                  id="points"
                  type="number"
                  min={Math.max(1, minimum)}
                  max={balance}
                  value={amount || ""}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  required
                />
              </FormField>
              {amount > 0 && (
                <p className="text-sm">
                  You will receive{" "}
                  <span className="font-semibold text-primary">{formatPrice(Math.round(amount * rate * 100) / 100)}</span> in
                  wallet credit.
                </p>
              )}
              <Button type="submit" disabled={convert.isPending || amount <= 0 || amount > balance || amount < minimum}>
                Convert
              </Button>
              {balance < minimum && (
                <p className="text-xs text-muted-foreground">You need at least {minimum} points before you can convert.</p>
              )}
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b bg-muted/20 py-3.5">
          <CardTitle className="text-base">History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4">
              <TableSkeleton rows={3} />
            </div>
          ) : !history || history.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">No point activity yet.</p>
          ) : (
            <div className="divide-y">
              {history.map((tx: { id: string; reason: string; points: number; createdAt: string }) => (
                <div key={tx.id} className="flex items-center justify-between px-5 py-3 text-sm">
                  <div>
                    <p className="font-medium">{tx.reason}</p>
                    <p className="text-xs text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className={tx.points >= 0 ? "font-semibold text-emerald-600" : "font-semibold text-destructive"}>
                    {tx.points >= 0 ? "+" : ""}
                    {tx.points} pts
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
