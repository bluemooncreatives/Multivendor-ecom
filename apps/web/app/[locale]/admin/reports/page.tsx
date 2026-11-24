"use client";

import { useState } from "react";
import {
  useStockReport,
  useSalesReport,
  useSellerSalesReport,
  useWishlistReport,
  useProductSalesReport,
  useSellerAccountsReport,
} from "@/lib/hooks/useAdminCatalogExtras";
import { useCategories } from "@/lib/hooks/useProducts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

// The legacy report set: stock, in-house sales, seller accounts, seller sales and
// wishlists. "Products" and "Seller accounts" had no equivalent here before.
const TABS = ["Sales", "Products", "Stock", "Sellers", "Seller accounts", "Wishlist"] as const;

export default function AdminReportsPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Sales");
  // Category scope, as every legacy product-based report offered.
  const [categoryId, setCategoryId] = useState<string>("");
  const [scope, setScope] = useState<"all" | "in_house" | "seller">("all");
  const [verification, setVerification] = useState<string>("");

  const { data: categories } = useCategories();
  const { data: sales } = useSalesReport();
  const { data: stock } = useStockReport(categoryId || undefined);
  const { data: sellers } = useSellerSalesReport();
  const { data: wishlist } = useWishlistReport(categoryId || undefined);
  const { data: productSales } = useProductSalesReport({
    categoryId: categoryId || undefined,
    scope: scope === "all" ? undefined : scope,
  });
  const { data: sellerAccounts } = useSellerAccountsReport(verification || undefined);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Reports</h1>
      <div className="flex gap-2 border-b pb-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn("rounded-md px-3 py-1.5 text-sm font-medium", tab === t ? "bg-primary text-primary-foreground" : "hover:bg-accent")}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Scope controls, shown only for the reports they apply to. */}
      {["Products", "Stock", "Wishlist"].includes(tab) && (
        <div className="grid gap-3 rounded-md border p-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="report-category">Category</Label>
            <select
              id="report-category"
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">All categories</option>
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          {tab === "Products" && (
            <div className="space-y-1">
              <Label htmlFor="report-scope">Listings</Label>
              <select
                id="report-scope"
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={scope}
                onChange={(e) => setScope(e.target.value as typeof scope)}
              >
                <option value="all">All listings</option>
                <option value="in_house">In-house only</option>
                <option value="seller">Seller listings only</option>
              </select>
            </div>
          )}
        </div>
      )}

      {tab === "Seller accounts" && (
        <div className="space-y-1 rounded-md border p-3 sm:max-w-xs">
          <Label htmlFor="report-verification">Verification status</Label>
          <select
            id="report-verification"
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            value={verification}
            onChange={(e) => setVerification(e.target.value)}
          >
            <option value="">Any status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      )}

      {tab === "Sales" && (
        <div className="grid gap-4 sm:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Orders</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">{sales?.orders ?? 0}</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Revenue</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">{formatPrice(sales?.revenue ?? 0)}</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Discounts</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">{formatPrice(sales?.discount ?? 0)}</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Tax collected</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">{formatPrice(sales?.tax ?? 0)}</CardContent>
          </Card>
        </div>
      )}

      {tab === "Stock" && (
        <div className="divide-y rounded-md border">
          {stock?.slice(0, 100).map((row: any, i: number) => (
            <div key={i} className="flex items-center justify-between p-3 text-sm">
              <span>
                {row.productName} ({row.sku})
              </span>
              <span className={row.available <= 5 ? "font-semibold text-destructive" : "text-muted-foreground"}>
                {row.available} available
              </span>
            </div>
          ))}
        </div>
      )}

      {tab === "Sellers" && (
        <div className="divide-y rounded-md border">
          {sellers?.map((row: any, i: number) => (
            <div key={i} className="flex items-center justify-between p-3 text-sm">
              <span>{row.sellerName}</span>
              <span>
                Sales {formatPrice(row.sales)} · Commission {formatPrice(row.commission)} · Refunds {formatPrice(row.refunds)}
              </span>
            </div>
          ))}
        </div>
      )}

      {tab === "Products" && (
        <div className="divide-y rounded-md border">
          {(productSales ?? []).length === 0 ? (
            <p className="p-3 text-sm text-muted-foreground">No products match that scope.</p>
          ) : (
            productSales?.map((row: { id: string; name: string; numOfSale: number; addedBy: string }) => (
              <div key={row.id} className="flex items-center justify-between p-3 text-sm">
                <span>
                  {row.name}{" "}
                  <span className="text-xs text-muted-foreground">{row.addedBy === "admin" ? "In house" : "Seller"}</span>
                </span>
                <span className="text-muted-foreground">{row.numOfSale} sold</span>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "Seller accounts" && (
        <div className="divide-y rounded-md border">
          {(sellerAccounts ?? []).length === 0 ? (
            <p className="p-3 text-sm text-muted-foreground">No sellers match that status.</p>
          ) : (
            sellerAccounts?.map(
              (row: {
                shopId: string;
                name: string;
                verificationStatus: string;
                products: number;
                publishedProducts: number;
                remainingUploads: number;
                seller: { name?: string; email?: string } | null;
              }) => (
                <div key={row.shopId} className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
                  <span>
                    {row.name}
                    <span className="block text-xs text-muted-foreground">
                      {row.seller?.name} · {row.seller?.email}
                    </span>
                  </span>
                  <span className="text-muted-foreground">
                    {row.verificationStatus} · {row.publishedProducts}/{row.products} published ·{" "}
                    {row.remainingUploads} upload(s) left
                  </span>
                </div>
              ),
            )
          )}
        </div>
      )}

      {tab === "Wishlist" && (
        <div className="divide-y rounded-md border">
          {wishlist?.map((row: any, i: number) => (
            <div key={i} className="flex items-center justify-between p-3 text-sm">
              <span>{row.name}</span>
              <span className="text-muted-foreground">{row.count} wishlist adds</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
