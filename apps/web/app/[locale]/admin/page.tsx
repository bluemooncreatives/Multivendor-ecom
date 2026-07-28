"use client";

import { useAdminDashboard } from "@/lib/hooks/useAdmin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/format";

export default function AdminOverviewPage() {
  const { data } = useAdminDashboard();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Total orders</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{data?.totalOrders ?? 0}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Total revenue</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{formatPrice(data?.totalRevenue ?? 0)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Sellers</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{data?.sellerCount ?? 0}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Pending withdrawals</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{data?.pendingWithdrawals ?? 0}</CardContent>
        </Card>
      </div>
    </div>
  );
}
