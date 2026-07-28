"use client";

import { useSellerLedger } from "@/lib/hooks/useSeller";
import { formatPrice } from "@/lib/format";

export default function SellerLedgerPage() {
  const { data: entries, isLoading } = useSellerLedger();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Ledger</h1>
      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : !entries || entries.length === 0 ? (
        <p className="text-muted-foreground">No ledger entries yet.</p>
      ) : (
        <div className="divide-y rounded-md border">
          {entries.map((entry: any) => (
            <div key={entry.id} className="flex items-center justify-between p-3 text-sm">
              <div>
                <p className="capitalize">{entry.type}</p>
                <p className="text-muted-foreground">{entry.note}</p>
              </div>
              <p className={entry.amount >= 0 ? "font-semibold text-green-600" : "font-semibold text-destructive"}>
                {entry.amount >= 0 ? "+" : ""}
                {formatPrice(entry.amount)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
