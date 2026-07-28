"use client";

import { useState } from "react";
import { useAdminPickupPoints, useCreatePickupPoint, useDeletePickupPoint } from "@/lib/hooks/useAdminCatalogExtras";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AdminPickupPointsPage() {
  const { data: points, isLoading } = useAdminPickupPoints();
  const createPoint = useCreatePickupPoint();
  const deletePoint = useDeletePickupPoint();
  const [form, setForm] = useState({ name: "", address: "", city: "", phone: "" });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Pickup points</h1>
      <Card>
        <CardContent className="pt-6">
          <form
            className="grid gap-3 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              createPoint.mutate(form);
              setForm({ name: "", address: "", city: "", phone: "" });
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
            <Button type="submit" className="sm:col-span-2" disabled={createPoint.isPending}>
              Add pickup point
            </Button>
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
                <p className="font-medium">{point.name}</p>
                <p className="text-muted-foreground">
                  {point.address}, {point.city}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => deletePoint.mutate(point.id)}>
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
