"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { CheckCircle2, Clock } from "lucide-react";
import { useMyShop, useSaveShop, useApplyForVerification, useVerificationForm } from "@/lib/hooks/useSeller";
import { useUploadFile } from "@/lib/hooks/useCatalogForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { FormField } from "@/components/shared/form-field";
import { getApiErrorMessage } from "@/lib/utils";

export default function SellerShopPage() {
  const { data: shop } = useMyShop();
  const saveShop = useSaveShop();
  const [form, setForm] = useState({ name: "", slug: "", description: "", logoUrl: "", bannerUrl: "" });

  useEffect(() => {
    if (shop) {
      setForm({
        name: shop.name,
        slug: shop.slug,
        description: shop.description ?? "",
        logoUrl: shop.logoUrl ?? "",
        bannerUrl: shop.bannerUrl ?? "",
      });
    }
  }, [shop]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await saveShop.mutateAsync(form);
      toast.success("Shop saved");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not save shop"));
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Shop settings"
        description="Customize your public storefront profile and submit verification documents."
        badge={
          shop?.verified ? (
            <Badge variant="success" className="gap-1">
              <CheckCircle2 className="h-3 w-3" /> Verified shop
            </Badge>
          ) : (
            <Badge variant="warning" className="gap-1">
              <Clock className="h-3 w-3" /> Pending verification
            </Badge>
          )
        }
      />

      <Card>
        <CardHeader className="border-b bg-muted/20 pb-4">
          <CardTitle className="text-base">Storefront profile</CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
            <FormField label="Shop name" htmlFor="shop-name" required>
              <Input id="shop-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </FormField>
            <FormField label="Shop URL slug" htmlFor="shop-slug" required>
              <Input id="shop-slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
            </FormField>
            <FormField label="Logo URL" htmlFor="shop-logo">
              <Input id="shop-logo" value={form.logoUrl} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })} />
            </FormField>
            <FormField label="Banner URL" htmlFor="shop-banner">
              <Input id="shop-banner" value={form.bannerUrl} onChange={(e) => setForm({ ...form, bannerUrl: e.target.value })} />
            </FormField>
            <FormField label="Description" htmlFor="shop-desc" className="sm:col-span-2">
              <Textarea
                id="shop-desc"
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </FormField>
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
      toast.error(getApiErrorMessage(err, "Upload failed"));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const urls = docs.map((d) => d.trim()).filter(Boolean);

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
      toast.error(getApiErrorMessage(err, "Could not submit your request"));
    }
  }

  return (
    <Card>
      <CardHeader className="border-b bg-muted/20 pb-4">
        <CardTitle className="text-base">Shop verification</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-5">
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
          <p className="rounded-lg border bg-muted/30 p-3 text-sm">
            Your documents are under review. You will be notified once an administrator makes a decision.
          </p>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            {(fields ?? []).map((field) => (
              <FormField key={field.id} label={field.label} required={field.required}>
                {field.type === "text" && (
                  <Input value={(answers[field.id] as string) ?? ""} onChange={(e) => setAnswer(field.id, e.target.value)} />
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
                  <NativeSelect
                    value={(answers[field.id] as string) ?? ""}
                    onChange={(e) => setAnswer(field.id, e.target.value)}
                  >
                    <option value="">Select an option</option>
                    {field.options.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </NativeSelect>
                )}

                {field.type === "multi_select" && (
                  <NativeSelect
                    multiple
                    className="h-24"
                    value={(answers[field.id] as string[]) ?? []}
                    onChange={(e) => setAnswer(field.id, Array.from(e.target.selectedOptions, (o) => o.value))}
                  >
                    {field.options.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </NativeSelect>
                )}
              </FormField>
            ))}

            <div className="space-y-2">
              <p className="text-sm font-medium">Supporting documents</p>
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
            </div>

            <div className="flex flex-wrap gap-2">
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
