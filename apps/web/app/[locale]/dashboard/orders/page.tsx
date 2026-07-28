"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useMyOrders, useCancelOrder } from "@/lib/hooks/useOrders";
import { useCreateRefundRequest } from "@/lib/hooks/useAddons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/format";

const CANCELLABLE = ["pending", "confirmed"];
const REFUNDABLE = ["delivered"];

export default function OrdersPage() {
  const { data: orders, isLoading } = useMyOrders();
  const cancelOrder = useCancelOrder();
  const createRefund = useCreateRefundRequest();
  const [refundReason, setRefundReason] = useState<Record<string, string>>({});

  async function handleCancel(orderId: string) {
    try {
      await cancelOrder.mutateAsync(orderId);
      toast.success("Order cancelled");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Could not cancel order");
    }
  }

  async function handleRefund(orderId: string, sellerId: string, amount: number) {
    const reason = refundReason[orderId];
    if (!reason) {
      toast.error("Please describe the reason for your refund request");
      return;
    }
    try {
      await createRefund.mutateAsync({ orderId, sellerId, reason, amount });
      toast.success("Refund request submitted");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Could not submit refund request");
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
            {REFUNDABLE.includes(order.status) && (
              <div className="flex gap-2 pt-2">
                <Input
                  placeholder="Reason for refund"
                  value={refundReason[order.id] ?? ""}
                  onChange={(e) => setRefundReason({ ...refundReason, [order.id]: e.target.value })}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRefund(order.id, order.details[0]?.sellerId ?? "", order.grandTotal)}
                  disabled={createRefund.isPending}
                >
                  Request refund
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
