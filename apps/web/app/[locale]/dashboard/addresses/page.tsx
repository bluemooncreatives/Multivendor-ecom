"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useAddresses, useCreateAddress, useDeleteAddress } from "@/lib/hooks/useAddresses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const EMPTY = { label: "Home", line1: "", city: "", state: "", country: "India", postalCode: "", phone: "", isDefault: false };

export default function AddressesPage() {
  const { data: addresses, isLoading } = useAddresses();
  const createAddress = useCreateAddress();
  const deleteAddress = useDeleteAddress();
  const [form, setForm] = useState(EMPTY);
  const [showForm, setShowForm] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createAddress.mutateAsync(form);
      setForm(EMPTY);
      setShowForm(false);
      toast.success("Address saved");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Could not save address");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Addresses</h1>
        <Button variant="outline" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "Add address"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="pt-6">
            <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
              <div className="space-y-2 sm:col-span-2">
                <Label>Address line 1</Label>
                <Input value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>City</Label>
                <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>State</Label>
                <Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Postal code</Label>
                <Input value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
              </div>
              <Button type="submit" className="sm:col-span-2" disabled={createAddress.isPending}>
                Save address
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : !addresses || addresses.length === 0 ? (
        <p className="text-muted-foreground">No saved addresses yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map((address) => (
            <Card key={address.id}>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">{address.label}</CardTitle>
                {address.isDefault && <Badge>Default</Badge>}
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>
                  {address.line1}, {address.city}, {address.state} {address.postalCode}
                </p>
                <p>{address.phone}</p>
                <Button variant="ghost" size="sm" onClick={() => deleteAddress.mutate(address.id)}>
                  Delete
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
