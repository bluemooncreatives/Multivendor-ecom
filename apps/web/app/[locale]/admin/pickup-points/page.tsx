"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { useStaff } from "@/lib/hooks/useAdminPeople";
import { useAdminPickupPoints, useCreatePickupPoint, useDeletePickupPoint } from "@/lib/hooks/useAdminCatalogExtras";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { TableSkeleton } from "@/components/shared/loading-state";
import { getApiErrorMessage } from "@/lib/utils";

function StaffSelector({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const { data } = useStaff();
  return (
    <NativeSelect aria-label="Assigned staff" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Unassigned</option>
      {data
        ?.filter((staff) => !staff.banned)
        .map((staff) => (
          <option key={staff.id} value={staff.id}>
            {staff.name} · {staff.email}
          </option>
        ))}
    </NativeSelect>
  );
}

function PickupOrders({ pointId }: { pointId: string }) {
  const client = useQueryClient();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["pickup-orders", pointId],
    queryFn: async () =>
      (await api.get("/admin/orders/by-pickup-point", { params: { pickupPointId: pointId } })).data.items as {
        id: string;
        code: string;
        paymentStatus: string;
        addressSnapshot: { phone?: string };
        details: { sellerId: string | null; status: string; items: { name: string; quantity: number }[] }[];
      }[],
  });
  const fulfill = useMutation({
    mutationFn: async (input: { orderId: string; sellerId: string | null; status: string }) =>
      api.patch(`/pickup-points/admin/${pointId}/orders/${input.orderId}`, { sellerId: input.sellerId, status: input.status }),
    onSuccess: () => client.invalidateQueries({ queryKey: ["pickup-orders", pointId] }),
    onError: (error) => toast.error(getApiErrorMessage(error, "Could not update shipment")),
  });

  return (
    <Card>
      <CardHeader className="border-b bg-muted/20 pb-3.5">
        <CardTitle className="text-base">Collection orders</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-4">
        {isLoading && <TableSkeleton rows={3} />}
        {isError && <p className="text-sm text-destructive">Could not load collection orders.</p>}
        {data?.length === 0 && <p className="text-sm text-muted-foreground">No orders at this pickup point.</p>}
        {data?.map((order) => (
          <div key={order.id} className="space-y-2 rounded-lg border p-3.5 text-sm">
            <p className="font-medium">
              <span className="font-mono">{order.code}</span> · {order.paymentStatus} · {order.addressSnapshot.phone}
            </p>
            {order.details.map((detail) => (
              <div key={detail.sellerId ?? "admin"} className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-muted-foreground">
                  {detail.items.map((item) => `${item.name} × ${item.quantity}`).join(", ")}
                </span>
                <div className="w-40">
                  <NativeSelect
                    aria-label={`Shipment status for ${order.code}`}
                    className="h-9"
                    value={detail.status}
                    disabled={fulfill.isPending || ["cancelled", "refunded", "delivered"].includes(detail.status)}
                    onChange={(e) => fulfill.mutate({ orderId: order.id, sellerId: detail.sellerId, status: e.target.value })}
                  >
                    {["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"].map((status) => (
                      <option
                        key={status}
                        value={status}
                        disabled={["pending", "confirmed", "cancelled", "refunded"].includes(status)}
                      >
                        {status}
                      </option>
                    ))}
                  </NativeSelect>
                </div>
              </div>
            ))}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function AdminPickupPointsPage() {
  const { data: points, isLoading } = useAdminPickupPoints();
  const createPoint = useCreatePickupPoint();
  const deletePoint = useDeletePickupPoint();
  const empty = { name: "", address: "", city: "", phone: "", staffId: "", active: true };
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pointId, setPointId] = useState<string | null>(null);
  const isAdmin = useAuthStore((state) => state.user?.role === "admin");
  const client = useQueryClient();
  const update = useMutation({
    mutationFn: async (body: unknown) => api.patch(`/pickup-points/admin/${editingId}`, body),
    onSuccess: () => client.invalidateQueries({ queryKey: ["admin", "pickup-points"] }),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Pickup points" description="Manage in-person collection hubs and assign staff operators." />

      <Card>
        <CardHeader className="border-b bg-muted/20 pb-3.5">
          <CardTitle className="text-base">{editingId ? "Edit pickup point" : "Add pickup point"}</CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          <form
            className="grid gap-3 sm:grid-cols-2"
            onSubmit={async (e) => {
              e.preventDefault();
              const { staffId, ...fields } = form;
              const body = { ...fields, ...(isAdmin ? { staffId: staffId || null } : {}) };
              try {
                if (editingId) await update.mutateAsync(body);
                else await createPoint.mutateAsync(body);
                setForm(empty);
                setEditingId(null);
                toast.success("Pickup point saved");
              } catch (error) {
                toast.error(getApiErrorMessage(error, "Could not save pickup point"));
              }
            }}
          >
            <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <Input placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
            <Input
              placeholder="Address"
              className="sm:col-span-2"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              required
            />
            <Input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            {isAdmin && <StaffSelector value={form.staffId} onChange={(staffId) => setForm({ ...form, staffId })} />}
            <label className="flex cursor-pointer items-center gap-2 text-sm sm:col-span-2">
              <Checkbox checked={form.active} onCheckedChange={(checked) => setForm({ ...form, active: checked === true })} />
              <span>Available for collection</span>
            </label>
            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit" disabled={createPoint.isPending || update.isPending}>
                {editingId ? "Save pickup point" : "Add pickup point"}
              </Button>
              {editingId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingId(null);
                    setForm(empty);
                  }}
                >
                  Cancel edit
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {isLoading ? (
        <TableSkeleton rows={4} />
      ) : (
        <Card className="divide-y overflow-hidden">
          {points?.map((point) => (
            <div key={point.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3.5 text-sm">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{point.name}</p>
                  <StatusBadge status={point.active ? "active" : "inactive"} />
                </div>
                <p className="text-xs text-muted-foreground">
                  {point.address}, {point.city}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPointId(point.id)}>
                  Orders
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingId(point.id);
                    setForm({
                      name: point.name,
                      city: point.city,
                      address: point.address,
                      phone: point.phone ?? "",
                      staffId: point.staffId ?? "",
                      active: point.active,
                    });
                  }}
                >
                  Edit
                </Button>
                {point.active && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    disabled={deletePoint.isPending}
                    onClick={() =>
                      deletePoint.mutate(point.id, {
                        onError: (error) => toast.error(getApiErrorMessage(error, "Could not deactivate point")),
                      })
                    }
                  >
                    Deactivate
                  </Button>
                )}
              </div>
            </div>
          ))}
        </Card>
      )}
      {pointId && <PickupOrders key={pointId} pointId={pointId} />}
    </div>
  );
}
