"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useMyShop, useSaveShop, useApplyForVerification, useVerificationForm } from "@/lib/hooks/useSeller";
import { useUploadFile } from "@/lib/hooks/useCatalogForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function apiError(err: unknown, fallback: string) {
  return (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? fallback;
}

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
  const { data: fields } = useVerificationForm();
  const applyForVerification = useApplyForVerification();
  const uploadFile = useUploadFile();

  const [docs, setDocs] = useState<string[]>([""]);
  // Answers to the admin-composed form, keyed by field id. A string for
  // text/select/radio, a string array for multi-select, a URL for file fields.
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});

  const underReview = shop?.verificationStatus === "pending" && (shop.verificationDocs?.length ?? 0) > 0;

  function setAnswer(id: string, value: string | string[]) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  async function handleFileAnswer(id: string, file: File | null) {
    if (!file) return;
    try {
      const stored = await uploadFile.mutateAsync({ file, kind: "document" });
      setAnswer(id, stored.url);
    } catch (err) {
      toast.error(apiError(err, "Upload failed"));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const urls = docs.map((d) => d.trim()).filter(Boolean);

    // Required-field validation also runs server-side against the live form
    // definition; this is only to save a round trip.
    for (const field of fields ?? []) {
      const answer = answers[field.id];
      const empty = answer === undefined || answer === "" || (Array.isArray(answer) && answer.length === 0);
      if (field.required && empty) return toast.error(`"${field.label}" is required`);
    }

    if (urls.length === 0 && (fields ?? []).length === 0) {
      return toast.error("Add at least one document URL");
    }

    try {
      await applyForVerification.mutateAsync({ verificationDocs: urls, answers });
      toast.success("Verification request submitted");
    } catch (err) {
      toast.error(apiError(err, "Could not submit your request"));
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
            {/* Fields the administrator composed. Rendered from the live
                definition, so adding a question here needs no code change. */}
            {(fields ?? []).map((field) => (
              <div key={field.id} className="space-y-1">
                <Label>
                  {field.label}
                  {field.required && <span className="text-destructive"> *</span>}
                </Label>

                {field.type === "text" && (
                  <Input
                    value={(answers[field.id] as string) ?? ""}
                    onChange={(e) => setAnswer(field.id, e.target.value)}
                  />
                )}

                {field.type === "file" && (
                  <>
                    <Input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => handleFileAnswer(field.id, e.target.files?.[0] ?? null)}
                    />
                    {answers[field.id] && <p className="text-xs text-muted-foreground">Uploaded.</p>}
                  </>
                )}

                {(field.type === "select" || field.type === "radio") && (
                  <select
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                    value={(answers[field.id] as string) ?? ""}
                    onChange={(e) => setAnswer(field.id, e.target.value)}
                  >
                    <option value="">Select an option</option>
                    {field.options.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                )}

                {field.type === "multi_select" && (
                  <select
                    multiple
                    className="h-24 w-full rounded-md border bg-background px-3 py-1 text-sm"
                    value={(answers[field.id] as string[]) ?? []}
                    onChange={(e) => setAnswer(field.id, Array.from(e.target.selectedOptions, (o) => o.value))}
                  >
                    {field.options.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            ))}

            <Label>Supporting documents</Label>
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
