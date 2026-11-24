"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { useStaff } from "@/lib/hooks/useAdminPeople";
import { useAdminPickupPoints, useCreatePickupPoint, useDeletePickupPoint } from "@/lib/hooks/useAdminCatalogExtras";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function StaffSelector({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const { data } = useStaff();
  return <select aria-label="Assigned staff" className="rounded border bg-background p-2" value={value} onChange={(e) => onChange(e.target.value)}>
    <option value="">Unassigned</option>{data?.filter((staff) => !staff.banned).map((staff) => <option key={staff.id} value={staff.id}>{staff.name} · {staff.email}</option>)}
  </select>;
}

function PickupOrders({ pointId }: { pointId: string }) {
  const client = useQueryClient();
  const { data, isLoading, isError } = useQuery({ queryKey: ["pickup-orders", pointId],
    queryFn: async () => (await api.get("/admin/orders/by-pickup-point", { params: { pickupPointId: pointId } })).data.items as {
      id: string; code: string; paymentStatus: string; addressSnapshot: { phone?: string };
      details: { sellerId: string | null; status: string; items: { name: string; quantity: number }[] }[];
    }[] });
  const fulfill = useMutation({ mutationFn: async (input: { orderId: string; sellerId: string | null; status: string }) =>
    api.patch(`/pickup-points/admin/${pointId}/orders/${input.orderId}`, { sellerId: input.sellerId, status: input.status }),
    onSuccess: () => client.invalidateQueries({ queryKey: ["pickup-orders", pointId] }),
    onError: (error: any) => toast.error(error?.response?.data?.message ?? "Could not update shipment") });
  return <Card><CardContent className="space-y-3 pt-6"><h2 className="text-lg font-semibold">Collection orders</h2>
    {isLoading && <p>Loading…</p>}{isError && <p>Could not load collection orders.</p>}
    {data?.length === 0 && <p>No orders at this pickup point.</p>}
    {data?.map((order) => <div key={order.id} className="space-y-2 rounded border p-3 text-sm"><p>{order.code} · {order.paymentStatus} · {order.addressSnapshot.phone}</p>
      {order.details.map((detail) => <div key={detail.sellerId ?? "admin"} className="flex items-center justify-between gap-2">
        <span>{detail.items.map((item) => `${item.name} × ${item.quantity}`).join(", ")}</span>
        <select aria-label={`Shipment status for ${order.code}`} className="rounded border bg-background p-2" value={detail.status}
          disabled={fulfill.isPending || ["cancelled", "refunded", "delivered"].includes(detail.status)}
          onChange={(e) => fulfill.mutate({ orderId: order.id, sellerId: detail.sellerId, status: e.target.value })}>
          {["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"].map((status) => <option key={status} value={status} disabled={["pending", "confirmed", "cancelled", "refunded"].includes(status)}>{status}</option>)}
        </select>
      </div>)}
    </div>)}
  </CardContent></Card>;
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
  const update = useMutation({ mutationFn: async (body: unknown) => api.patch(`/pickup-points/admin/${editingId}`, body),
    onSuccess: () => client.invalidateQueries({ queryKey: ["admin", "pickup-points"] }) });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Pickup points</h1>
      <Card>
        <CardContent className="pt-6">
          <form
            className="grid gap-3 sm:grid-cols-2"
            onSubmit={async (e) => {
              e.preventDefault();
              const { staffId, ...fields } = form;
              const body = { ...fields, ...(isAdmin ? { staffId: staffId || null } : {}) };
              try {
                if (editingId) await update.mutateAsync(body); else await createPoint.mutateAsync(body);
                setForm(empty); setEditingId(null); toast.success("Pickup point saved");
              } catch (error: any) { toast.error(error?.response?.data?.message ?? "Could not save pickup point"); }
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
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />Available for collection</label>
            <Button type="submit" className="sm:col-span-2" disabled={createPoint.isPending || update.isPending}>
              {editingId ? "Save pickup point" : "Add pickup point"}
            </Button>
            {editingId && <Button type="button" variant="outline" onClick={() => { setEditingId(null); setForm(empty); }}>Cancel edit</Button>}
          </form>
        </CardContent>
      </Card>

      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        <div className="divide-y rounded-md border">
          {points?.map((point) => (
            <div key={point.id} className="flex items-center justify-between p-3 text-sm">
              <div>
                <p className="font-medium">{point.name} {!point.active && "(inactive)"}</p>
                <p className="text-muted-foreground">
                  {point.address}, {point.city}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPointId(point.id)}>Orders</Button>
                <Button variant="outline" size="sm" onClick={() => { setEditingId(point.id); setForm({ name: point.name, city: point.city, address: point.address, phone: point.phone ?? "", staffId: point.staffId ?? "", active: point.active }); }}>Edit</Button>
                {point.active && <Button variant="ghost" size="sm" disabled={deletePoint.isPending} onClick={() => deletePoint.mutate(point.id, { onError: (error: any) => toast.error(error?.response?.data?.message ?? "Could not deactivate point") })}>Deactivate</Button>}
              </div>
            </div>
          ))}
        </div>
      )}
      {pointId && <PickupOrders key={pointId} pointId={pointId} />}
    </div>
  );
}
