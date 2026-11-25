"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Plus, Tag, Trash2 } from "lucide-react";
import { useCategories } from "@/lib/hooks/useProducts";
import { useMyClassifieds, useCreateClassified, useDeleteClassified } from "@/lib/hooks/useAddons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { FormField } from "@/components/shared/form-field";
import { EmptyState } from "@/components/shared/empty-state";
import { CardGridSkeleton } from "@/components/shared/loading-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { formatPrice } from "@/lib/format";
import { getApiErrorMessage } from "@/lib/utils";

const EMPTY = { title: "", description: "", price: 0, categoryId: "", location: "", contactPhone: "" };

export default function ClassifiedsPage() {
  const { data: categories } = useCategories();
  const { data: listings, isLoading } = useMyClassifieds();
  const createClassified = useCreateClassified();
  const deleteClassified = useDeleteClassified();
  const [form, setForm] = useState(EMPTY);
  const [showForm, setShowForm] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createClassified.mutateAsync(form);
      setForm(EMPTY);
      setShowForm(false);
      toast.success("Listing submitted for review");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not create listing"));
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My classifieds"
        description="Post and manage your peer-to-peer classified listings."
        actions={
          <Button variant={showForm ? "outline" : "default"} onClick={() => setShowForm((v) => !v)}>
            <Plus className="h-4 w-4" />
            {showForm ? "Cancel" : "New listing"}
          </Button>
        }
      />

      {showForm && (
        <Card>
          <CardHeader className="border-b bg-muted/20 pb-4">
            <CardTitle className="text-base">Create listing</CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
              <FormField label="Title" htmlFor="cl-title" required className="sm:col-span-2">
                <Input id="cl-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </FormField>
              <FormField label="Price" htmlFor="cl-price" required>
                <Input
                  id="cl-price"
                  type="number"
                  min={0}
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                  required
                />
              </FormField>
              <FormField label="Category" htmlFor="cl-category" required>
                <NativeSelect
                  id="cl-category"
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  required
                >
                  <option value="">Select category</option>
                  {categories?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </NativeSelect>
              </FormField>
              <FormField label="Location" htmlFor="cl-location">
                <Input id="cl-location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </FormField>
              <FormField label="Contact phone" htmlFor="cl-phone">
                <Input
                  id="cl-phone"
                  value={form.contactPhone}
                  onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                />
              </FormField>
              <FormField label="Description" htmlFor="cl-desc" className="sm:col-span-2">
                <Textarea
                  id="cl-desc"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </FormField>
              <Button type="submit" className="sm:col-span-2" disabled={createClassified.isPending}>
                Submit listing
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <CardGridSkeleton count={2} columns="sm:grid-cols-2" />
      ) : !listings || listings.length === 0 ? (
        <EmptyState icon={Tag} title="No classified listings yet" description="You haven't posted any listings yet." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {listings.map((item: { id: string; title: string; status: string; price: number; currency?: string }) => (
            <Card key={item.id}>
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="truncate text-base">{item.title}</CardTitle>
                <StatusBadge status={item.status} />
              </CardHeader>
              <CardContent className="flex items-center justify-between pt-2">
                <p className="text-lg font-bold text-primary">{formatPrice(item.price, item.currency)}</p>
                <ConfirmDialog
                  title="Delete classified listing?"
                  description="This listing will be permanently removed."
                  confirmLabel="Delete"
                  onConfirm={() => deleteClassified.mutate(item.id)}
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
