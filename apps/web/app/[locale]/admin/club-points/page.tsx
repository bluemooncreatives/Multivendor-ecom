"use client";

import { useEffect, useState } from "react";
import {
  useClubPointConfig,
  useSaveClubPointConfig,
  useClubPointProducts,
  useSetProductClubPoints,
  useBulkSetClubPoints,
  useClubPointUsers,
} from "@/lib/hooks/useAdminAddons";
import { useAdminCategories } from "@/lib/hooks/useAdminCommerce";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { FormField } from "@/components/shared/form-field";

export default function AdminClubPointsPage() {
  const { data: config } = useClubPointConfig();
  const saveConfig = useSaveClubPointConfig();
  const [form, setForm] = useState({ convertRate: 1, minConvertPoints: 0 });

  useEffect(() => {
    if (config) setForm({ convertRate: config.convertRate, minConvertPoints: config.minConvertPoints });
  }, [config]);

  const [assignedOnly, setAssignedOnly] = useState(false);
  const { data: products } = useClubPointProducts(assignedOnly);
  const setPoints = useSetProductClubPoints();
  const bulkSet = useBulkSetClubPoints();
  const { data: categories } = useAdminCategories();
  const { data: users } = useClubPointUsers();

  const [bulk, setBulk] = useState({ clubPoints: 0, categoryId: "" });
  const [drafts, setDrafts] = useState<Record<string, number>>({});

  return (
    <div className="space-y-6">
      <PageHeader title="Club points" description="Manage loyalty point conversion rates and product point assignments." />

      <Card>
        <CardHeader className="border-b bg-muted/20 pb-3.5">
          <CardTitle className="text-base">Conversion settings</CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          <form
            className="grid gap-4 md:grid-cols-3"
            onSubmit={(e) => {
              e.preventDefault();
              saveConfig.mutate(form);
            }}
          >
            <FormField label="Wallet value of one point" htmlFor="rate" hint="Set to 0 to disable conversion entirely.">
              <Input
                id="rate"
                type="number"
                min={0}
                step="0.01"
                value={form.convertRate}
                onChange={(e) => setForm({ ...form, convertRate: Number(e.target.value) })}
              />
            </FormField>
            <FormField label="Minimum points to convert" htmlFor="min">
              <Input
                id="min"
                type="number"
                min={0}
                value={form.minConvertPoints}
                onChange={(e) => setForm({ ...form, minConvertPoints: Number(e.target.value) })}
              />
            </FormField>
            <div className="flex items-end">
              <Button type="submit" disabled={saveConfig.isPending}>
                Save
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b bg-muted/20 pb-3.5">
          <CardTitle className="text-base">Assign points in bulk</CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          <form
            className="grid gap-4 md:grid-cols-3"
            onSubmit={(e) => {
              e.preventDefault();
              bulkSet.mutate({ clubPoints: bulk.clubPoints, categoryId: bulk.categoryId || undefined });
            }}
          >
            <FormField label="Points per unit" htmlFor="bulk-points">
              <Input
                id="bulk-points"
                type="number"
                min={0}
                value={bulk.clubPoints}
                onChange={(e) => setBulk({ ...bulk, clubPoints: Number(e.target.value) })}
              />
            </FormField>
            <FormField label="Limit to category" htmlFor="bulk-category">
              <NativeSelect
                id="bulk-category"
                value={bulk.categoryId}
                onChange={(e) => setBulk({ ...bulk, categoryId: e.target.value })}
              >
                <option value="">Every product</option>
                {categories?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </NativeSelect>
            </FormField>
            <div className="flex items-end">
              <Button type="submit" variant="outline" disabled={bulkSet.isPending}>
                Apply to {bulk.categoryId ? "category" : "all products"}
              </Button>
            </div>
          </form>
          {bulkSet.data && (
            <p className="mt-3 text-sm text-muted-foreground">
              Updated {bulkSet.data.updated} of {bulkSet.data.matched} matching products.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0 border-b bg-muted/20 pb-3.5">
          <CardTitle className="text-base">Points per product</CardTitle>
          <label className="flex cursor-pointer items-center gap-2 text-sm font-normal">
            <Checkbox checked={assignedOnly} onCheckedChange={(checked) => setAssignedOnly(checked === true)} />
            <span>Only products with points</span>
          </label>
        </CardHeader>
        <CardContent className="space-y-2 pt-4">
          {products?.length === 0 && <p className="text-sm text-muted-foreground">No products to show.</p>}
          {products?.map((product) => (
            <div key={product.id} className="flex items-center justify-between gap-2 rounded-lg border p-3 text-sm">
              <span className="font-medium">{product.name}</span>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  className="h-9 w-24"
                  value={drafts[product.id] ?? product.clubPoints}
                  onChange={(e) => setDrafts({ ...drafts, [product.id]: Number(e.target.value) })}
                />
                <Button
                  size="sm"
                  variant="outline"
                  disabled={(drafts[product.id] ?? product.clubPoints) === product.clubPoints}
                  onClick={() => setPoints.mutate({ id: product.id, clubPoints: drafts[product.id] ?? product.clubPoints })}
                >
                  Save
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b bg-muted/20 pb-3.5">
          <CardTitle className="text-base">Members holding points</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-4">
          {users?.length === 0 && <p className="text-sm text-muted-foreground">Nobody has earned points yet.</p>}
          {users?.map((user) => (
            <div key={user.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
              <span>
                <span className="font-medium">{user.name}</span>{" "}
                <span className="text-muted-foreground">({user.email})</span>
              </span>
              <span className="font-semibold text-primary">{user.clubPoints} pts</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
