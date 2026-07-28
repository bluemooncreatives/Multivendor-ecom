"use client";

import { useSellerOrders, useUpdateFulfillment } from "@/lib/hooks/useSeller";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/format";
import type { OrderSummary } from "@/lib/hooks/useOrders";

const STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];

export default function SellerOrdersPage() {
  const { data: orders, isLoading } = useSellerOrders();
  const updateFulfillment = useUpdateFulfillment();

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (!orders || orders.length === 0) return <p className="text-muted-foreground">No orders yet.</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Orders</h1>
      {(orders as OrderSummary[]).map((order) => (
        <Card key={order.id}>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">{order.code}</CardTitle>
            <Badge variant="secondary">{order.status}</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {order.details.map((detail, i) => (
              <div key={i} className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {detail.items.map((item) => `${item.name} × ${item.quantity}`).join(", ")}
                </p>
                <select
                  className="h-9 rounded-md border bg-background px-2 text-sm"
                  value={detail.status}
                  onChange={(e) => updateFulfillment.mutate({ orderId: order.id, status: e.target.value })}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            ))}
            <p className="font-semibold">{formatPrice(order.grandTotal, order.currency)}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
