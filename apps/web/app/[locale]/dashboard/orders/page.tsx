"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useMyOrders, useCancelOrder } from "@/lib/hooks/useOrders";
import { useCreateRefundRequest, useRefundEligibility } from "@/lib/hooks/useAddons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  if (!orders || orders.length === 0) return <p className="text-muted-foreground">You haven&apos;t placed any orders yet.</p>;

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
            <RefundSection orderId={order.id} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Refund eligibility is decided server-side per seller shipment (delivered, inside
// the policy window, not already claimed), so the UI just renders what it is told
// rather than re-deriving the rules and drifting from them. The refundable amount
// is likewise computed by the API and never sent from here.
function RefundSection({ orderId }: { orderId: string }) {
  const { data: eligibility } = useRefundEligibility(orderId);
  const createRefund = useCreateRefundRequest();
  const [reasons, setReasons] = useState<Record<string, string>>({});

  const actionable = eligibility?.shipments.filter((s) => s.eligible || s.alreadyRequested) ?? [];
  if (actionable.length === 0) return null;

  async function submit(sellerId: string) {
    const reason = reasons[sellerId]?.trim();
    if (!reason) {
      toast.error("Please describe the reason for your refund request");
      return;
    }
    try {
      await createRefund.mutateAsync({ orderId, sellerId, reason });
      toast.success("Refund request submitted");
      setReasons({ ...reasons, [sellerId]: "" });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Could not submit refund request");
    }
  }

  return (
    <div className="space-y-2 border-t pt-2">
      {actionable.map((shipment) =>
        shipment.alreadyRequested ? (
          <p key={shipment.sellerId} className="text-xs text-muted-foreground">
            A refund request for {formatPrice(shipment.amount)} of this order is already in progress.
          </p>
        ) : (
          <div key={shipment.sellerId} className="space-y-1">
            <div className="flex gap-2">
              <Input
                placeholder={`Reason for refunding ${formatPrice(shipment.amount)}`}
                value={reasons[shipment.sellerId] ?? ""}
                onChange={(e) => setReasons({ ...reasons, [shipment.sellerId]: e.target.value })}
              />
              <Button variant="outline" size="sm" onClick={() => submit(shipment.sellerId)} disabled={createRefund.isPending}>
                Request refund
              </Button>
            </div>
            {shipment.windowClosesAt && (
              <p className="text-xs text-muted-foreground">
                You can request a refund until {new Date(shipment.windowClosesAt).toLocaleDateString()}.
              </p>
            )}
          </div>
        ),
      )}
    </div>
  );
}
