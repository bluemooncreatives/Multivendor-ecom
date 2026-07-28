"use client";

import { useAdminUsers, useVerifySeller, useBanUser } from "@/lib/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function AdminSellersPage() {
  const { data: sellers, isLoading } = useAdminUsers("seller");
  const verifySeller = useVerifySeller();
  const banUser = useBanUser();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Sellers</h1>
      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        <div className="divide-y rounded-md border">
          {sellers?.map((seller: any) => (
            <div key={seller.id} className="flex items-center justify-between p-3 text-sm">
              <div>
                <p className="font-medium">{seller.name}</p>
                <p className="text-muted-foreground">{seller.email}</p>
              </div>
              <div className="flex items-center gap-2">
                {seller.banned && <Badge variant="destructive">Banned</Badge>}
                <Button variant="outline" size="sm" onClick={() => verifySeller.mutate({ id: seller.id, approve: true })}>
                  Approve shop
                </Button>
                <Button variant="ghost" size="sm" onClick={() => verifySeller.mutate({ id: seller.id, approve: false })}>
                  Reject
                </Button>
                <Button variant="outline" size="sm" onClick={() => banUser.mutate({ id: seller.id, banned: !seller.banned })}>
                  {seller.banned ? "Unban" : "Ban"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
