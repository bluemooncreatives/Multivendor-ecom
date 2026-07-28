"use client";

import { useAdminWalletRecharges, useResolveWalletRecharge } from "@/lib/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/format";

export default function AdminWalletRechargesPage() {
  const { data: requests, isLoading } = useAdminWalletRecharges();
  const resolve = useResolveWalletRecharge();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Wallet recharge requests</h1>
      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : !requests || requests.length === 0 ? (
        <p className="text-muted-foreground">No recharge requests.</p>
      ) : (
        <div className="divide-y rounded-md border">
          {requests.map((r: any) => (
            <div key={r.id} className="flex items-center justify-between p-3 text-sm">
              <div>
                <p className="font-medium">{r.userId?.name ?? "Customer"}</p>
                <p className="text-muted-foreground">{formatPrice(r.amount)}</p>
              </div>
              <Badge variant="secondary">{r.status}</Badge>
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
        </div>
      )}
    </div>
  );
}
