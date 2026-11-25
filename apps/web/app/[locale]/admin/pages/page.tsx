"use client";

import { useState } from "react";
import { FileText } from "lucide-react";
import { useAdminPages, useCreatePage, useDeletePage } from "@/lib/hooks/useAdminCatalogExtras";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/loading-state";

export default function AdminPagesPage() {
  const { data: pages, isLoading } = useAdminPages();
  const createPage = useCreatePage();
  const deletePage = useDeletePage();
  const [form, setForm] = useState({ slug: "", title: "", body: "" });

  return (
    <div className="space-y-6">
      <PageHeader title="CMS pages" description="Create and manage custom informational pages." />

      <Card>
        <CardHeader className="border-b bg-muted/20 pb-3.5">
          <CardTitle className="text-base">New page</CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              createPage.mutate(form);
              setForm({ slug: "", title: "", body: "" });
            }}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Input placeholder="Slug (about-us)" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
              <Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <Textarea
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
        <TableSkeleton rows={4} />
      ) : !pages || pages.length === 0 ? (
        <EmptyState icon={FileText} title="No CMS pages yet" description="Pages created above will appear here." />
      ) : (
        <Card className="divide-y overflow-hidden">
          {pages.map((page) => (
            <div key={page.id} className="flex items-center justify-between px-5 py-3.5 text-sm">
              <div>
                <p className="font-semibold">{page.title}</p>
                <p className="font-mono text-xs text-muted-foreground">/{page.slug}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={page.published ? "published" : "draft"} />
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => deletePage.mutate(page.id)}>
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
