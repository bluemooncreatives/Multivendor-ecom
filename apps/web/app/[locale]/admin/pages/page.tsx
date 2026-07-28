"use client";

import { useState } from "react";
import { useAdminPages, useCreatePage, useDeletePage } from "@/lib/hooks/useAdminCatalogExtras";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function AdminPagesPage() {
  const { data: pages, isLoading } = useAdminPages();
  const createPage = useCreatePage();
  const deletePage = useDeletePage();
  const [form, setForm] = useState({ slug: "", title: "", body: "" });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">CMS pages</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">New page</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              createPage.mutate(form);
              setForm({ slug: "", title: "", body: "" });
            }}
          >
            <div className="flex gap-2">
              <Input placeholder="Slug (about-us)" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
              <Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <textarea
              className="w-full rounded-md border p-2 text-sm"
              rows={6}
              placeholder="Page content (HTML supported)"
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              required
            />
            <Button type="submit" disabled={createPage.isPending}>
              Create page
            </Button>
          </form>
        </CardContent>
      </Card>

      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        <div className="divide-y rounded-md border">
          {pages?.map((page) => (
            <div key={page.id} className="flex items-center justify-between p-3 text-sm">
              <div>
                <p className="font-medium">{page.title}</p>
                <p className="text-muted-foreground">/{page.slug}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={page.published ? "secondary" : "outline"}>{page.published ? "Published" : "Draft"}</Badge>
                <Button variant="ghost" size="sm" onClick={() => deletePage.mutate(page.id)}>
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
