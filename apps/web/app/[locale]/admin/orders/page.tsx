"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useAdminOrders, type AdminOrder, type AdminOrderFilters } from "@/lib/hooks/useAdmin";
import {
  useUpdateOrderStatus,
  useUpdateOrderPaymentStatus,
  useCancelOrderAsAdmin,
  downloadFile,
} from "@/lib/hooks/useAdminCommerce";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatPrice } from "@/lib/format";

const FULFILLMENT_STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];
const PAYMENT_STATUSES = ["unpaid", "pending", "paid", "failed"];

function apiError(err: unknown, fallback: string) {
  return (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? fallback;
}

export default function AdminOrdersPage() {
  const [filters, setFilters] = useState<AdminOrderFilters>({ page: 1 });
  const { data, isLoading } = useAdminOrders(filters);
  const [selected, setSelected] = useState<AdminOrder | null>(null);

  const patch = (next: Partial<AdminOrderFilters>) => setFilters({ ...filters, ...next, page: 1 });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Orders</h1>

      <Card>
        <CardContent className="grid gap-3 pt-6 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-1">
            <Label htmlFor="q">Search</Label>
            <Input
              id="q"
              placeholder="Order code or phone"
              value={filters.q ?? ""}
              onChange={(e) => patch({ q: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="status">Delivery status</Label>
            <select
              id="status"
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              value={filters.status ?? ""}
              onChange={(e) => patch({ status: e.target.value || undefined })}
            >
              <option value="">Any</option>
              {FULFILLMENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="payment">Payment status</Label>
            <select
              id="payment"
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              value={filters.paymentStatus ?? ""}
              onChange={(e) => patch({ paymentStatus: e.target.value || undefined })}
            >
              <option value="">Any</option>
              {PAYMENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="from">From</Label>
            <Input id="from" type="date" value={filters.from ?? ""} onChange={(e) => patch({ from: e.target.value || undefined })} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="to">To</Label>
            <Input id="to" type="date" value={filters.to ?? ""} onChange={(e) => patch({ to: e.target.value || undefined })} />
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : !data || data.items.length === 0 ? (
        <p className="text-muted-foreground">No orders match those filters.</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b text-xs uppercase text-muted-foreground">
                  <th className="p-3 text-start">Order</th>
                  <th className="p-3 text-start">Placed</th>
                  <th className="p-3 text-start">Total</th>
                  <th className="p-3 text-start">Payment</th>
                  <th className="p-3 text-start">Delivery</th>
                  <th className="p-3 text-start" />
                </tr>
              </thead>
              <tbody>
                {data.items.map((order) => (
                  <tr key={order.id} className="border-b last:border-0">
                    <td className="p-3 font-mono text-xs">{order.code}</td>
                    <td className="p-3">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="p-3">{formatPrice(order.grandTotal, order.currency)}</td>
                    <td className="p-3">
                      <Badge variant={order.paymentStatus === "paid" ? "secondary" : "outline"}>
                        {order.paymentStatus}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <Badge variant="secondary">{order.status}</Badge>
                    </td>
                    <td className="p-3">
                      <Button variant="outline" size="sm" onClick={() => setSelected(order)}>
                        Manage
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={(filters.page ?? 1) <= 1}
              onClick={() => setFilters({ ...filters, page: (filters.page ?? 1) - 1 })}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {data.page} of {Math.max(1, Math.ceil(data.total / data.pageSize))} · {data.total} orders
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={data.page * data.pageSize >= data.total}
              onClick={() => setFilters({ ...filters, page: (filters.page ?? 1) + 1 })}
            >
              Next
            </Button>
          </div>
        </>
      )}

      <OrderDetailDialog order={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function OrderDetailDialog({ order, onClose }: { order: AdminOrder | null; onClose: () => void }) {
  const updateStatus = useUpdateOrderStatus();
  const updatePaymentStatus = useUpdateOrderPaymentStatus();
  const cancelOrder = useCancelOrderAsAdmin();

  if (!order) return null;
  const addr = order.addressSnapshot ?? {};

  async function run(action: Promise<unknown>, success: string) {
    try {
      await action;
      toast.success(success);
      onClose();
    } catch (err) {
      toast.error(apiError(err, "That change could not be applied"));
    }
  }

  return (
    <Dialog open={Boolean(order)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Order {order.code}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div>
            <p className="font-medium">Ship to</p>
            <p className="text-muted-foreground">
              {[addr.line1, addr.line2, addr.city, addr.state, addr.postalCode, addr.country].filter(Boolean).join(", ")}
              {addr.phone ? ` — ${addr.phone}` : ""}
            </p>
          </div>

          {order.details.map((detail, i) => (
            <div key={i} className="rounded-md border p-3">
              <div className="flex items-center justify-between">
                <p className="font-medium">{detail.sellerId ? `Shipment ${detail.sellerId.slice(-6)}` : "In-House items"}</p>
                <Badge variant="outline">{detail.status}</Badge>
              </div>
              <ul className="mt-1 text-muted-foreground">
                {detail.items.map((item, j) => (
                  <li key={j}>
                    {item.name} × {item.quantity} @ {formatPrice(item.unitPrice, order.currency)}
                  </li>
                ))}
              </ul>
              <p className="mt-1 text-xs text-muted-foreground">
                Subtotal {formatPrice(detail.subtotal, order.currency)} · Shipping{" "}
                {formatPrice(detail.shippingCost, order.currency)} · Commission{" "}
                {formatPrice(detail.commissionAmount, order.currency)}
                {detail.pickupPointId ? " · Collected in person" : ""}
              </p>
            </div>
          ))}

          <div className="space-y-1 border-t pt-3">
            {order.couponCode && <p>Coupon: {order.couponCode}</p>}
            <p>Discount: {formatPrice(order.discount, order.currency)}</p>
            <p>Tax: {formatPrice(order.tax, order.currency)}</p>
            <p>Shipping: {formatPrice(order.shippingTotal, order.currency)}</p>
            <p className="font-semibold">Total: {formatPrice(order.grandTotal, order.currency)}</p>
          </div>

          <div className="grid gap-3 border-t pt-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Delivery status</Label>
              <select
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={order.status}
                onChange={(e) =>
                  run(updateStatus.mutateAsync({ id: order.id, status: e.target.value }), "Delivery status updated")
                }
              >
                {FULFILLMENT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Payment status</Label>
              <select
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={order.paymentStatus}
                onChange={(e) =>
                  run(
                    updatePaymentStatus.mutateAsync({ id: order.id, paymentStatus: e.target.value }),
                    "Payment status updated",
                  )
                }
              >
                {PAYMENT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Marking an order paid settles it: stock is confirmed and the seller ledger credited.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 border-t pt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadFile(`/orders/${order.id}/invoice`, `invoice-${order.code}.pdf`)}
            >
              Download invoice
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={order.status === "cancelled"}
              onClick={() => run(cancelOrder.mutateAsync(order.id), "Order cancelled and reversed")}
            >
              Cancel order
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
