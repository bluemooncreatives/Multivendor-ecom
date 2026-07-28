"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useCategories } from "@/lib/hooks/useProducts";
import { useMyClassifieds, useCreateClassified, useDeleteClassified } from "@/lib/hooks/useAddons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/format";

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
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Could not create listing");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My classifieds</h1>
        <Button variant="outline" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "New listing"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="pt-6">
            <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
              <div className="space-y-2 sm:col-span-2">
                <Label>Title</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Price</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <select
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
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
                </select>
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Contact phone</Label>
                <Input value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Description</Label>
                <textarea
                  className="w-full rounded-md border p-2 text-sm"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <Button type="submit" className="sm:col-span-2" disabled={createClassified.isPending}>
                Submit listing
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : !listings || listings.length === 0 ? (
        <p className="text-muted-foreground">You haven't posted any listings yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {listings.map((item: any) => (
            <Card key={item.id}>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">{item.title}</CardTitle>
                <Badge variant={item.status === "approved" ? "secondary" : "outline"}>{item.status}</Badge>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="font-semibold">{formatPrice(item.price, item.currency)}</p>
                <Button variant="ghost" size="sm" onClick={() => deleteClassified.mutate(item.id)}>
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
