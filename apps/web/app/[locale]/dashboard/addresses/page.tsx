"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { MapPin, Plus, Trash2 } from "lucide-react";
import { useAddresses, useCreateAddress, useDeleteAddress } from "@/lib/hooks/useAddresses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { FormField } from "@/components/shared/form-field";
import { EmptyState } from "@/components/shared/empty-state";
import { CardGridSkeleton } from "@/components/shared/loading-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { getApiErrorMessage } from "@/lib/utils";

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
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not save address"));
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Addresses"
        description="Save delivery addresses for faster checkout."
        actions={
          <Button variant={showForm ? "outline" : "default"} onClick={() => setShowForm((v) => !v)}>
            <Plus className="h-4 w-4" />
            {showForm ? "Cancel" : "Add address"}
          </Button>
        }
      />

      {showForm && (
        <Card>
          <CardHeader className="border-b bg-muted/20 pb-4">
            <CardTitle className="text-base">New address</CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
              <FormField label="Label" htmlFor="addr-label">
                <Input id="addr-label" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
              </FormField>
              <FormField label="Phone" htmlFor="addr-phone" required>
                <Input id="addr-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
              </FormField>
              <FormField label="Address line 1" htmlFor="addr-line1" required className="sm:col-span-2">
                <Input id="addr-line1" value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} required />
              </FormField>
              <FormField label="City" htmlFor="addr-city" required>
                <Input id="addr-city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
              </FormField>
              <FormField label="State" htmlFor="addr-state" required>
                <Input id="addr-state" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} required />
              </FormField>
              <FormField label="Postal code" htmlFor="addr-postal" required>
                <Input id="addr-postal" value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} required />
              </FormField>
              <FormField label="Country" htmlFor="addr-country" required>
                <Input id="addr-country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} required />
              </FormField>
              <Button type="submit" className="sm:col-span-2" disabled={createAddress.isPending}>
                Save address
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <CardGridSkeleton count={2} columns="sm:grid-cols-2" />
      ) : !addresses || addresses.length === 0 ? (
        <EmptyState icon={MapPin} title="No saved addresses yet" description="Add a shipping address to speed up future orders." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map((address) => (
            <Card key={address.id}>
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin className="h-4 w-4 text-primary" />
                  {address.label}
                </CardTitle>
                {address.isDefault && <Badge>Default</Badge>}
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  {address.line1}, {address.city}, {address.state} {address.postalCode}
                </p>
                <p>{address.phone}</p>
                <ConfirmDialog
                  title="Delete saved address?"
                  description="This address will be removed from your account."
                  confirmLabel="Delete"
                  onConfirm={() => deleteAddress.mutate(address.id)}
                  trigger={
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </Button>
                  }
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
