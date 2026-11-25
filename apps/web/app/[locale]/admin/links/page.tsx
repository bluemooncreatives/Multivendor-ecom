"use client";

import { useState } from "react";
import { useLinks, useCreateLink, useDeleteLink } from "@/lib/hooks/useAdminCatalogExtras";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { FormField } from "@/components/shared/form-field";

export default function AdminLinksPage() {
  const { data: links } = useLinks();
  const createLink = useCreateLink();
  const deleteLink = useDeleteLink();
  const [form, setForm] = useState<{ label: string; url: string; placement: "header" | "footer" }>({
    label: "",
    url: "",
    placement: "footer",
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Header & footer links" description="Add custom navigation links to the storefront header or footer." />

      <Card>
        <CardHeader className="border-b bg-muted/20 pb-3.5">
          <CardTitle className="text-base">Add link</CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          <form
            className="grid gap-3 sm:grid-cols-[1fr_1fr_160px_auto]"
            onSubmit={(e) => {
              e.preventDefault();
              createLink.mutate(form);
              setForm({ label: "", url: "", placement: "footer" });
            }}
          >
            <FormField label="Label">
              <Input placeholder="About Us" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} required />
            </FormField>
            <FormField label="URL">
              <Input placeholder="/about-us" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} required />
            </FormField>
            <FormField label="Placement">
              <NativeSelect
                value={form.placement}
                onChange={(e) => setForm({ ...form, placement: e.target.value as "header" | "footer" })}
              >
                <option value="header">Header</option>
                <option value="footer">Footer</option>
              </NativeSelect>
            </FormField>
            <div className="flex items-end">
              <Button type="submit" disabled={createLink.isPending}>
                Add link
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="divide-y overflow-hidden">
        {links?.map((link) => (
          <div key={link.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3.5 text-sm">
            <div className="flex items-center gap-2.5">
              <Badge variant="outline" className="capitalize">
                {link.placement}
              </Badge>
              <span className="font-semibold">{link.label}</span>
              <span className="font-mono text-xs text-muted-foreground">{link.url}</span>
            </div>
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => deleteLink.mutate(link.id)}>
              Remove
            </Button>
          </div>
        ))}
      </Card>
    </div>
  );
}
