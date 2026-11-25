"use client";

import { Wallet } from "lucide-react";
import { useAdminWalletRecharges, useResolveWalletRecharge } from "@/lib/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/loading-state";
import { formatPrice } from "@/lib/format";

export default function AdminWalletRechargesPage() {
  const { data: requests, isLoading } = useAdminWalletRecharges();
  const resolve = useResolveWalletRecharge();

  return (
    <div className="space-y-6">
      <PageHeader title="Wallet recharge requests" description="Verify bank transfer proofs and credit customer wallets." />

      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : !requests || requests.length === 0 ? (
        <EmptyState icon={Wallet} title="No recharge requests" description="Submitted customer wallet recharges appear here." />
      ) : (
        <Card className="divide-y overflow-hidden">
          {requests.map((r: { id: string; amount: number; status: string; userId?: { name?: string } }) => (
            <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 text-sm">
              <div>
                <p className="font-semibold">{r.userId?.name ?? "Customer"}</p>
                <p className="text-muted-foreground">{formatPrice(r.amount)}</p>
              </div>
              <StatusBadge status={r.status} />
              {r.status === "pending" && (
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => resolve.mutate({ id: r.id, approve: true })}>
                    Approve
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => resolve.mutate({ id: r.id, approve: false })}>
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
