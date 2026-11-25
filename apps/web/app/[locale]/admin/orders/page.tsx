"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Download, ShoppingBag } from "lucide-react";
import { useAdminOrders, type AdminOrder, type AdminOrderFilters } from "@/lib/hooks/useAdmin";
import {
  useUpdateOrderStatus,
  useUpdateOrderPaymentStatus,
  useCancelOrderAsAdmin,
  downloadFile,
} from "@/lib/hooks/useAdminCommerce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { FormField } from "@/components/shared/form-field";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/loading-state";
import { formatPrice } from "@/lib/format";
import { getApiErrorMessage } from "@/lib/utils";

const FULFILLMENT_STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];
const PAYMENT_STATUSES = ["unpaid", "pending", "paid", "failed"];

export default function AdminOrdersPage() {
  const [filters, setFilters] = useState<AdminOrderFilters>({ page: 1 });
  const { data, isLoading } = useAdminOrders(filters);
  const [selected, setSelected] = useState<AdminOrder | null>(null);

  const patch = (next: Partial<AdminOrderFilters>) => setFilters({ ...filters, ...next, page: 1 });

  return (
    <div className="space-y-6">
      <PageHeader title="Orders" description="Filter marketplace orders, settle payments, download invoices, or cancel." />

      <Card>
        <CardContent className="grid gap-3 pt-6 sm:grid-cols-2 lg:grid-cols-5">
          <FormField label="Search" htmlFor="q">
            <Input
              id="q"
              placeholder="Order code or phone"
              value={filters.q ?? ""}
              onChange={(e) => patch({ q: e.target.value })}
            />
          </FormField>
          <FormField label="Delivery status" htmlFor="status">
            <NativeSelect id="status" value={filters.status ?? ""} onChange={(e) => patch({ status: e.target.value || undefined })}>
              <option value="">Any</option>
              {FULFILLMENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </NativeSelect>
          </FormField>
          <FormField label="Payment status" htmlFor="payment">
            <NativeSelect
              id="payment"
              value={filters.paymentStatus ?? ""}
              onChange={(e) => patch({ paymentStatus: e.target.value || undefined })}
            >
              <option value="">Any</option>
              {PAYMENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </NativeSelect>
          </FormField>
          <FormField label="From" htmlFor="from">
            <Input id="from" type="date" value={filters.from ?? ""} onChange={(e) => patch({ from: e.target.value || undefined })} />
          </FormField>
          <FormField label="To" htmlFor="to">
            <Input id="to" type="date" value={filters.to ?? ""} onChange={(e) => patch({ to: e.target.value || undefined })} />
          </FormField>
        </CardContent>
      </Card>

      {isLoading ? (
        <TableSkeleton rows={6} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState icon={ShoppingBag} title="No orders match" description="No orders match those filters." />
      ) : (
        <>
          <Card className="overflow-hidden">
            <Table className="min-w-[760px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Placed</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Delivery</TableHead>
                  <TableHead className="text-end" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-xs font-semibold">{order.code}</TableCell>
                    <TableCell className="text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="font-semibold">{formatPrice(order.grandTotal, order.currency)}</TableCell>
                    <TableCell>
                      <StatusBadge status={order.paymentStatus} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={order.status} />
                    </TableCell>
                    <TableCell className="text-end">
                      <Button variant="outline" size="sm" onClick={() => setSelected(order)}>
                        Manage
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          <PaginationBar
            page={data.page}
            pageSize={data.pageSize}
            total={data.total}
            onPageChange={(page) => setFilters({ ...filters, page })}
            itemLabel="orders"
          />
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
      toast.error(getApiErrorMessage(err, "That change could not be applied"));
    }
  }

  return (
    <Dialog open={Boolean(order)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-mono">Order {order.code}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="rounded-lg border bg-muted/20 p-3">
            <p className="font-semibold">Ship to</p>
            <p className="text-muted-foreground">
              {[addr.line1, addr.line2, addr.city, addr.state, addr.postalCode, addr.country].filter(Boolean).join(", ")}
              {addr.phone ? ` — ${addr.phone}` : ""}
            </p>
          </div>

          {order.details.map((detail, i) => (
            <div key={i} className="space-y-1.5 rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <p className="font-semibold">{detail.sellerId ? `Shipment ${detail.sellerId.slice(-6)}` : "In-House items"}</p>
                <StatusBadge status={detail.status} />
              </div>
              <ul className="text-muted-foreground">
                {detail.items.map((item, j) => (
                  <li key={j}>
                    {item.name} × {item.quantity} @ {formatPrice(item.unitPrice, order.currency)}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground">
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
            <p className="text-base font-bold text-primary">Total: {formatPrice(order.grandTotal, order.currency)}</p>
          </div>

          <div className="grid gap-3 border-t pt-3 sm:grid-cols-2">
            <FormField label="Delivery status">
              <NativeSelect
                value={order.status}
                onChange={(e) => run(updateStatus.mutateAsync({ id: order.id, status: e.target.value }), "Delivery status updated")}
              >
                {FULFILLMENT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </NativeSelect>
            </FormField>
            <FormField
              label="Payment status"
              hint="Marking an order paid settles it: stock is confirmed and the seller ledger credited."
            >
              <NativeSelect
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
              </NativeSelect>
            </FormField>
          </div>

          <div className="flex flex-wrap gap-2 border-t pt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadFile(`/orders/${order.id}/invoice`, `invoice-${order.code}.pdf`)}
            >
              <Download className="h-3.5 w-3.5" />
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
