"use client";

import { useSellerLedgerSummary, useSellerProducts, useSellerOrders } from "@/lib/hooks/useSeller";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/format";

export default function SellerOverviewPage() {
  const { data: summary } = useSellerLedgerSummary();
  const { data: products } = useSellerProducts();
  const { data: orders } = useSellerOrders();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Seller dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Available balance</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{formatPrice(summary?.available ?? 0)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Products</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{products?.length ?? 0}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Orders</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{orders?.length ?? 0}</CardContent>
        </Card>
      </div>
    </div>
  );
}
