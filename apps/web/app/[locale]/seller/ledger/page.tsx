"use client";

import { BookOpen, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { useSellerLedger } from "@/lib/hooks/useSeller";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/loading-state";
import { formatPrice } from "@/lib/format";

export default function SellerLedgerPage() {
  const { data: entries, isLoading } = useSellerLedger();

  return (
    <div className="space-y-6">
      <PageHeader title="Ledger" description="Track earnings, commissions, refunds, and payouts." />

      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : !entries || entries.length === 0 ? (
        <EmptyState icon={BookOpen} title="No ledger entries yet" description="Sales and payouts will appear in your ledger." />
      ) : (
        <Card className="overflow-hidden">
          <CardContent className="divide-y p-0">
            {entries.map((entry: { id: string; type: string; note?: string; amount: number }) => {
              const positive = entry.amount >= 0;
              return (
                <div key={entry.id} className="flex items-center justify-between gap-3 px-5 py-3.5 text-sm">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        positive ? "bg-emerald-500/15 text-emerald-600" : "bg-destructive/15 text-destructive"
                      }`}
                    >
                      {positive ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="font-medium capitalize">{entry.type}</p>
                      {entry.note && <p className="text-xs text-muted-foreground">{entry.note}</p>}
                    </div>
                  </div>
                  <p className={positive ? "font-semibold text-emerald-600" : "font-semibold text-destructive"}>
                    {positive ? "+" : ""}
                    {formatPrice(entry.amount)}
                  </p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
