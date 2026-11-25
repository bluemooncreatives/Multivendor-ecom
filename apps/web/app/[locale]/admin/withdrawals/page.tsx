"use client";

import { Banknote } from "lucide-react";
import { useAdminWithdrawals, useResolveWithdrawal } from "@/lib/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/loading-state";
import { formatPrice } from "@/lib/format";

export default function AdminWithdrawalsPage() {
  const { data: withdrawals, isLoading } = useAdminWithdrawals();
  const resolve = useResolveWithdrawal();

  return (
    <div className="space-y-6">
      <PageHeader title="Withdrawal requests" description="Approve or reject seller payout requests." />

      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : !withdrawals || withdrawals.length === 0 ? (
        <EmptyState icon={Banknote} title="No withdrawal requests" description="Seller payout requests will appear here." />
      ) : (
        <Card className="divide-y overflow-hidden">
          {withdrawals.map((w: { id: string; amount: number; status: string }) => (
            <div key={w.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 text-sm">
              <span className="text-base font-semibold">{formatPrice(w.amount)}</span>
              <StatusBadge status={w.status} />
              {w.status === "pending" && (
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => resolve.mutate({ id: w.id, approve: true })}>
                    Approve
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => resolve.mutate({ id: w.id, approve: false })}>
                    Reject
                  </Button>
                </div>
              )}
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
