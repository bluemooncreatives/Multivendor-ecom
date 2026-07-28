"use client";

import { useWallet, useWalletHistory } from "@/lib/hooks/useWallet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/format";

export default function WalletPage() {
  const { data: wallet } = useWallet();
  const { data: history, isLoading } = useWalletHistory();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Wallet</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Available balance</CardTitle>
        </CardHeader>
        <CardContent className="text-3xl font-bold">{formatPrice(wallet?.balance ?? 0, wallet?.currency)}</CardContent>
      </Card>

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
