"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useMyShop, useSaveShop } from "@/lib/hooks/useSeller";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SellerShopPage() {
  const { data: shop } = useMyShop();
  const saveShop = useSaveShop();
  const [form, setForm] = useState({ name: "", slug: "", description: "", logoUrl: "", bannerUrl: "" });

  useEffect(() => {
    if (shop) setForm({ name: shop.name, slug: shop.slug, description: shop.description ?? "", logoUrl: shop.logoUrl ?? "", bannerUrl: shop.bannerUrl ?? "" });
  }, [shop]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await saveShop.mutateAsync(form);
      toast.success("Shop saved");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Could not save shop");
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Shop settings</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{shop?.verified ? "Verified shop" : "Pending verification"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label>Shop name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Shop URL slug</Label>
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Logo URL</Label>
              <Input value={form.logoUrl} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Banner URL</Label>
              <Input value={form.bannerUrl} onChange={(e) => setForm({ ...form, bannerUrl: e.target.value })} />
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
            <Button type="submit" className="sm:col-span-2" disabled={saveShop.isPending}>
              Save shop
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
