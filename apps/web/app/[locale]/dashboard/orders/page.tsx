"use client";

import toast from "react-hot-toast";
import { useMyOrders, useCancelOrder } from "@/lib/hooks/useOrders";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";

const CANCELLABLE = ["pending", "confirmed"];

export default function OrdersPage() {
  const { data: orders, isLoading } = useMyOrders();
  const cancelOrder = useCancelOrder();

  async function handleCancel(orderId: string) {
    try {
      await cancelOrder.mutateAsync(orderId);
      toast.success("Order cancelled");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Could not cancel order");
    }
  }

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (!orders || orders.length === 0) return <p className="text-muted-foreground">You haven't placed any orders yet.</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">My orders</h1>
      {orders.map((order) => (
        <Card key={order.id}>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">{order.code}</CardTitle>
              <p className="text-sm text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</p>
            </div>
            <Badge variant={order.status === "cancelled" ? "destructive" : "secondary"}>{order.status}</Badge>
          </CardHeader>
          <CardContent className="space-y-2">
            {order.details.map((detail, i) => (
              <div key={i} className="text-sm text-muted-foreground">
                {detail.items.map((item) => `${item.name} × ${item.quantity}`).join(", ")}
              </div>
            ))}
            <div className="flex items-center justify-between pt-2">
              <p className="font-semibold">{formatPrice(order.grandTotal, order.currency)}</p>
              {CANCELLABLE.includes(order.status) && (
                <Button variant="outline" size="sm" onClick={() => handleCancel(order.id)} disabled={cancelOrder.isPending}>
                  Cancel order
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
