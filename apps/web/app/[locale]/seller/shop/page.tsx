"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useMyShop, useSaveShop, useApplyForVerification } from "@/lib/hooks/useSeller";
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

      <VerificationCard />
    </div>
  );
}

function VerificationCard() {
  const { data: shop } = useMyShop();
  const applyForVerification = useApplyForVerification();
  const [docs, setDocs] = useState<string[]>([""]);

  const underReview = shop?.verificationStatus === "pending" && (shop.verificationDocs?.length ?? 0) > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const urls = docs.map((d) => d.trim()).filter(Boolean);
    if (urls.length === 0) return toast.error("Add at least one document URL");
    try {
      await applyForVerification.mutateAsync(urls);
      toast.success("Verification request submitted");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Could not submit your request");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Shop verification</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {shop?.verified ? (
          <p className="text-sm text-muted-foreground">
            Your shop is verified and visible on the storefront. Submitting new documents will queue another review without
            de-listing your shop.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Upload your business documents to get verified. Only verified shops appear on the public storefront.
          </p>
        )}

        {underReview ? (
          <p className="text-sm">
            Your documents are under review. You will be notified once an administrator makes a decision.
          </p>
        ) : (
          <form className="space-y-3" onSubmit={handleSubmit}>
            {docs.map((doc, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder="https://…/business-licence.pdf"
                  value={doc}
                  onChange={(e) => setDocs(docs.map((d, i) => (i === index ? e.target.value : d)))}
                />
                {docs.length > 1 && (
                  <Button type="button" variant="ghost" onClick={() => setDocs(docs.filter((_, i) => i !== index))}>
                    Remove
                  </Button>
                )}
              </div>
            ))}
            <div className="flex gap-2">
              {docs.length < 10 && (
                <Button type="button" variant="outline" onClick={() => setDocs([...docs, ""])}>
                  Add another document
                </Button>
              )}
              <Button type="submit" disabled={applyForVerification.isPending}>
                Submit for verification
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
