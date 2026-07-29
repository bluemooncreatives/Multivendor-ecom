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
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

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
      <h1 className="text-2xl font-bold">Club points</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Conversion settings</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4 md:grid-cols-3"
            onSubmit={(e) => {
              e.preventDefault();
              saveConfig.mutate(form);
            }}
          >
            <div className="space-y-1">
              <Label htmlFor="rate">Wallet value of one point</Label>
              <Input
                id="rate"
                type="number"
                min={0}
                step="0.01"
                value={form.convertRate}
                onChange={(e) => setForm({ ...form, convertRate: Number(e.target.value) })}
              />
              <p className="text-xs text-muted-foreground">Set to 0 to disable conversion entirely.</p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="min">Minimum points to convert</Label>
              <Input
                id="min"
                type="number"
                min={0}
                value={form.minConvertPoints}
                onChange={(e) => setForm({ ...form, minConvertPoints: Number(e.target.value) })}
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={saveConfig.isPending}>
                Save
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Assign points in bulk</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4 md:grid-cols-3"
            onSubmit={(e) => {
              e.preventDefault();
              bulkSet.mutate({ clubPoints: bulk.clubPoints, categoryId: bulk.categoryId || undefined });
            }}
          >
            <div className="space-y-1">
              <Label htmlFor="bulk-points">Points per unit</Label>
              <Input
                id="bulk-points"
                type="number"
                min={0}
                value={bulk.clubPoints}
                onChange={(e) => setBulk({ ...bulk, clubPoints: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="bulk-category">Limit to category</Label>
              <select
                id="bulk-category"
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={bulk.categoryId}
                onChange={(e) => setBulk({ ...bulk, categoryId: e.target.value })}
              >
                <option value="">Every product</option>
                {categories?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button type="submit" variant="outline" disabled={bulkSet.isPending}>
                Apply to {bulk.categoryId ? "category" : "all products"}
              </Button>
            </div>
          </form>
          {bulkSet.data && (
            <p className="mt-2 text-sm text-muted-foreground">
              Updated {bulkSet.data.updated} of {bulkSet.data.matched} matching products.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">Points per product</CardTitle>
          <label className="flex items-center gap-2 text-sm font-normal">
            <input type="checkbox" checked={assignedOnly} onChange={(e) => setAssignedOnly(e.target.checked)} />
            Only products with points
          </label>
        </CardHeader>
        <CardContent className="space-y-2">
          {products?.length === 0 && <p className="text-sm text-muted-foreground">No products to show.</p>}
          {products?.map((product) => (
            <div key={product.id} className="flex items-center justify-between gap-2 rounded-md border p-2 text-sm">
              <span>{product.name}</span>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  className="w-24"
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
        <CardHeader>
          <CardTitle className="text-base">Members holding points</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {users?.length === 0 && <p className="text-sm text-muted-foreground">Nobody has earned points yet.</p>}
          {users?.map((user) => (
            <div key={user.id} className="flex items-center justify-between rounded-md border p-2 text-sm">
              <span>
                {user.name} <span className="text-muted-foreground">({user.email})</span>
              </span>
              <span className="font-medium">{user.clubPoints} pts</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
