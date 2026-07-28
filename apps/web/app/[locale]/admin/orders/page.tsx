"use client";

import { useAdminOrders } from "@/lib/hooks/useAdmin";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/format";

export default function AdminOrdersPage() {
  const { data: orders, isLoading } = useAdminOrders();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Orders</h1>
      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        <div className="divide-y rounded-md border">
          {orders?.map((order: any) => (
            <div key={order.id} className="flex items-center justify-between p-3 text-sm">
              <span className="font-mono">{order.code}</span>
              <span>{formatPrice(order.grandTotal, order.currency)}</span>
              <Badge variant="secondary">{order.status}</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
