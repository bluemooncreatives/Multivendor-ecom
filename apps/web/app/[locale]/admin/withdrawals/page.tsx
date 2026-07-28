"use client";

import { useAdminWithdrawals, useResolveWithdrawal } from "@/lib/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/format";

export default function AdminWithdrawalsPage() {
  const { data: withdrawals, isLoading } = useAdminWithdrawals();
  const resolve = useResolveWithdrawal();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Withdrawal requests</h1>
      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        <div className="divide-y rounded-md border">
          {withdrawals?.map((w: any) => (
            <div key={w.id} className="flex items-center justify-between p-3 text-sm">
              <span>{formatPrice(w.amount)}</span>
              <Badge variant="secondary">{w.status}</Badge>
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
        </div>
      )}
    </div>
  );
}
