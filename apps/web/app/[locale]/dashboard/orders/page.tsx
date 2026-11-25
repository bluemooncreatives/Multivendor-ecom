"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import toast from "react-hot-toast";
import { ShoppingBag } from "lucide-react";
import { useMyOrders, useCancelOrder } from "@/lib/hooks/useOrders";
import { useCreateRefundRequest, useRefundEligibility } from "@/lib/hooks/useAddons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { CardGridSkeleton } from "@/components/shared/loading-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { formatPrice } from "@/lib/format";
import { getApiErrorMessage } from "@/lib/utils";

const CANCELLABLE = ["pending", "confirmed"];

export default function OrdersPage() {
  const locale = useLocale();
  const { data: orders, isLoading } = useMyOrders();
  const cancelOrder = useCancelOrder();

  async function handleCancel(orderId: string) {
    try {
      await cancelOrder.mutateAsync(orderId);
      toast.success("Order cancelled");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not cancel order"));
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="My orders" description="Track deliveries, cancel pending orders, or request refunds." />

      {isLoading ? (
        <CardGridSkeleton count={3} columns="grid-cols-1" />
      ) : !orders || orders.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No orders yet"
          description="You haven't placed any orders yet."
          action={
            <Button asChild>
              <Link href={`/${locale}/products`}>Start Shopping</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id} className="overflow-hidden">
              <CardHeader className="flex-row items-center justify-between space-y-0 border-b bg-muted/20 py-4">
                <div>
                  <CardTitle className="font-mono text-base">{order.code}</CardTitle>
                  <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <StatusBadge status={order.status} />
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                <div className="space-y-1.5">
                  {order.details.map((detail, i) => (
                    <div key={i} className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
                      <span>{detail.items.map((item) => `${item.name} × ${item.quantity}`).join(", ")}</span>
                      <StatusBadge status={detail.status} />
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between border-t pt-3">
                  <p className="text-base font-bold">{formatPrice(order.grandTotal, order.currency)}</p>
                  {CANCELLABLE.includes(order.status) && (
                    <ConfirmDialog
                      title="Cancel this order?"
                      description={`Order ${order.code} will be cancelled and any reserved stock released.`}
                      confirmLabel="Cancel order"
                      onConfirm={() => handleCancel(order.id)}
                      trigger={
                        <Button variant="outline" size="sm" disabled={cancelOrder.isPending}>
                          Cancel order
                        </Button>
                      }
                    />
                  )}
                </div>
                <RefundSection orderId={order.id} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

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
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not submit refund request"));
    }
  }

  return (
    <div className="space-y-3 border-t pt-3">
      {actionable.map((shipment) =>
        shipment.alreadyRequested ? (
          <p key={shipment.sellerId} className="rounded-md bg-muted/40 p-2.5 text-xs text-muted-foreground">
            A refund request for {formatPrice(shipment.amount)} of this order is already in progress.
          </p>
        ) : (
          <div key={shipment.sellerId} className="space-y-1.5 rounded-lg border bg-muted/20 p-3">
            <div className="flex flex-wrap gap-2">
              <Input
                className="flex-1 bg-background"
                placeholder={`Reason for refunding ${formatPrice(shipment.amount)}`}
                value={reasons[shipment.sellerId] ?? ""}
                onChange={(e) => setReasons({ ...reasons, [shipment.sellerId]: e.target.value })}
              />
              <Button variant="outline" size="sm" onClick={() => submit(shipment.sellerId)} disabled={createRefund.isPending}>
                Request refund
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Refund {formatPrice(shipment.amount)} ({formatPrice(shipment.merchandise)} goods
              {shipment.tax > 0 ? ` + ${formatPrice(shipment.tax)} tax` : ""}
              {shipment.discount > 0 ? ` − ${formatPrice(shipment.discount)} discount` : ""}). Shipping is not refunded.
            </p>
            {shipment.partial && (
              <p className="text-xs text-muted-foreground">
                Only the refundable items in this shipment are covered; final-sale items are excluded.
              </p>
            )}
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
