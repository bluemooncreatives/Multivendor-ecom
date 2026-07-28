"use client";

import { useAuthStore } from "@/lib/store";
import { useMyOrders } from "@/lib/hooks/useOrders";
import { useWallet } from "@/lib/hooks/useWallet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/format";

export default function DashboardOverviewPage() {
  const user = useAuthStore((s) => s.user);
  const { data: orders } = useMyOrders();
  const { data: wallet } = useWallet();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Welcome{user ? `, ${user.name}` : ""}</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Total orders</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{orders?.length ?? 0}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Wallet balance</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{formatPrice(wallet?.balance ?? 0, wallet?.currency)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Email verified</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{user?.emailVerifiedAt ? "Yes" : "No"}</CardContent>
        </Card>
      </div>
    </div>
  );
}
