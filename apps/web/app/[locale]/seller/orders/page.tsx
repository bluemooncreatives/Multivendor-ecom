"use client";

import { ShoppingBag } from "lucide-react";
import { useSellerOrders, useUpdateFulfillment } from "@/lib/hooks/useSeller";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/native-select";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { CardGridSkeleton } from "@/components/shared/loading-state";
import { formatPrice } from "@/lib/format";
import type { OrderSummary } from "@/lib/hooks/useOrders";

const STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];

export default function SellerOrdersPage() {
  const { data: orders, isLoading } = useSellerOrders();
  const updateFulfillment = useUpdateFulfillment();

  return (
    <div className="space-y-6">
      <PageHeader title="Orders" description="Review incoming customer orders and update shipment status." />

      {isLoading ? (
        <CardGridSkeleton count={3} columns="grid-cols-1" />
      ) : !orders || orders.length === 0 ? (
        <EmptyState icon={ShoppingBag} title="No orders yet" description="Orders containing your products will appear here." />
      ) : (
        <div className="space-y-4">
          {(orders as OrderSummary[]).map((order) => (
            <Card key={order.id}>
              <CardHeader className="flex-row items-center justify-between space-y-0 border-b bg-muted/20 py-3.5">
                <CardTitle className="font-mono text-base">{order.code}</CardTitle>
                <StatusBadge status={order.status} />
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                {order.details.map((detail, i) => (
                  <div key={i} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/10 p-3">
                    <p className="text-sm text-muted-foreground">
                      {detail.items.map((item) => `${item.name} × ${item.quantity}`).join(", ")}
                    </p>
                    <div className="w-40">
                      <NativeSelect
                        className="h-9"
                        value={detail.status}
                        onChange={(e) => updateFulfillment.mutate({ orderId: order.id, status: e.target.value })}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </NativeSelect>
                    </div>
                  </div>
                ))}
                <p className="text-end text-base font-bold text-primary">
                  {formatPrice(order.grandTotal, order.currency)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
