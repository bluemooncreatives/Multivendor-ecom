"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useMyClubPoints, useClubPointsHistory, useConvertClubPoints } from "@/lib/hooks/useAddons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPrice } from "@/lib/format";

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
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(message ?? "Could not convert your points");
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Club points</h1>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Your balance</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{balance} pts</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Worth in wallet credit</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{formatPrice(points?.convertibleValue ?? 0)}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Convert points to wallet credit</CardTitle>
        </CardHeader>
        <CardContent>
          {rate <= 0 ? (
            <p className="text-sm text-muted-foreground">Point conversion is currently disabled.</p>
          ) : (
            <form className="space-y-3" onSubmit={handleConvert}>
              <div className="max-w-xs space-y-1">
                <Label htmlFor="points">Points to convert</Label>
                <Input
                  id="points"
                  type="number"
                  min={Math.max(1, minimum)}
                  max={balance}
                  value={amount || ""}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Each point is worth {formatPrice(rate)}
                  {minimum > 0 && ` · minimum ${minimum} points per conversion`}
                </p>
              </div>
              {amount > 0 && (
                <p className="text-sm">
                  You will receive <span className="font-semibold">{formatPrice(Math.round(amount * rate * 100) / 100)}</span> in
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

      <div>
        <h2 className="mb-2 text-lg font-semibold">History</h2>
        {isLoading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : !history || history.length === 0 ? (
          <p className="text-muted-foreground">No point activity yet.</p>
        ) : (
          <div className="divide-y rounded-md border">
            {history.map((tx: { id: string; reason: string; points: number; createdAt: string }) => (
              <div key={tx.id} className="flex items-center justify-between p-3 text-sm">
                <div>
                  <p>{tx.reason}</p>
                  <p className="text-xs text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={tx.points >= 0 ? "font-semibold text-green-600" : "font-semibold text-destructive"}>
                  {tx.points >= 0 ? "+" : ""}
                  {tx.points} pts
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
