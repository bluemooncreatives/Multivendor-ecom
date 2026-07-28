"use client";

import { useState } from "react";
import { useLinks, useCreateLink, useDeleteLink } from "@/lib/hooks/useAdminCatalogExtras";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
      <h1 className="text-2xl font-bold">Header & footer links</h1>
      <Card>
        <CardContent className="pt-6">
          <form
            className="flex flex-wrap items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              createLink.mutate(form);
              setForm({ label: "", url: "", placement: "footer" });
            }}
          >
            <Input placeholder="Label" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} required />
            <Input placeholder="URL" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} required />
            <select
              className="h-10 rounded-md border bg-background px-3 text-sm"
              value={form.placement}
              onChange={(e) => setForm({ ...form, placement: e.target.value as "header" | "footer" })}
            >
              <option value="header">Header</option>
              <option value="footer">Footer</option>
            </select>
            <Button type="submit" disabled={createLink.isPending}>
              Add link
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="divide-y rounded-md border">
        {links?.map((link) => (
          <div key={link.id} className="flex items-center justify-between p-3 text-sm">
            <span>
              [{link.placement}] {link.label} → {link.url}
            </span>
            <Button variant="ghost" size="sm" onClick={() => deleteLink.mutate(link.id)}>
              Remove
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
