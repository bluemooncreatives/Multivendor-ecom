"use client";

import { useState } from "react";
import { ShoppingBag, DollarSign, Percent, Receipt } from "lucide-react";
import {
  useStockReport,
  useSalesReport,
  useSellerSalesReport,
  useWishlistReport,
  useProductSalesReport,
  useSellerAccountsReport,
} from "@/lib/hooks/useAdminCatalogExtras";
import { useCategories } from "@/lib/hooks/useProducts";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { FormField } from "@/components/shared/form-field";
import { formatPrice } from "@/lib/format";

const TABS = ["Sales", "Products", "Stock", "Sellers", "Seller accounts", "Wishlist"] as const;

export default function AdminReportsPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Sales");
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
      <PageHeader title="Reports" description="Inspect marketplace sales, inventory levels, seller performance, and wishlists." />

      <div className="flex flex-wrap gap-2 border-b pb-3">
        {TABS.map((t) => (
          <Button key={t} type="button" size="sm" variant={tab === t ? "default" : "ghost"} onClick={() => setTab(t)}>
            {t}
          </Button>
        ))}
      </div>

      {["Products", "Stock", "Wishlist"].includes(tab) && (
        <Card>
          <CardContent className="grid gap-3 pt-5 sm:grid-cols-2">
            <FormField label="Category" htmlFor="report-category">
              <NativeSelect id="report-category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="">All categories</option>
                {categories?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </NativeSelect>
            </FormField>
            {tab === "Products" && (
              <FormField label="Listings" htmlFor="report-scope">
                <NativeSelect
                  id="report-scope"
                  value={scope}
                  onChange={(e) => setScope(e.target.value as typeof scope)}
                >
                  <option value="all">All listings</option>
                  <option value="in_house">In-house only</option>
                  <option value="seller">Seller listings only</option>
                </NativeSelect>
              </FormField>
            )}
          </CardContent>
        </Card>
      )}

      {tab === "Seller accounts" && (
        <Card className="sm:max-w-xs">
          <CardContent className="pt-5">
            <FormField label="Verification status" htmlFor="report-verification">
              <NativeSelect id="report-verification" value={verification} onChange={(e) => setVerification(e.target.value)}>
                <option value="">Any status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </NativeSelect>
            </FormField>
          </CardContent>
        </Card>
      )}

      {tab === "Sales" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Orders" value={sales?.orders ?? 0} icon={ShoppingBag} tone="primary" />
          <StatCard label="Revenue" value={formatPrice(sales?.revenue ?? 0)} icon={DollarSign} tone="success" />
          <StatCard label="Discounts" value={formatPrice(sales?.discount ?? 0)} icon={Percent} tone="warning" />
          <StatCard label="Tax collected" value={formatPrice(sales?.tax ?? 0)} icon={Receipt} tone="default" />
        </div>
      )}

      {tab === "Stock" && (
        <Card className="divide-y overflow-hidden">
          {stock?.slice(0, 100).map((row: { productName: string; sku: string; available: number }, i: number) => (
            <div key={i} className="flex items-center justify-between px-5 py-3 text-sm">
              <span className="font-medium">
                {row.productName} <span className="font-mono text-xs text-muted-foreground">({row.sku})</span>
              </span>
              <span className={row.available <= 5 ? "font-semibold text-destructive" : "text-muted-foreground"}>
                {row.available} available
              </span>
            </div>
          ))}
        </Card>
      )}

      {tab === "Sellers" && (
        <Card className="divide-y overflow-hidden">
          {sellers?.map((row: { sellerName: string; sales: number; commission: number; refunds: number }, i: number) => (
            <div key={i} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm">
              <span className="font-semibold">{row.sellerName}</span>
              <span className="text-muted-foreground">
                Sales {formatPrice(row.sales)} · Commission {formatPrice(row.commission)} · Refunds {formatPrice(row.refunds)}
              </span>
            </div>
          ))}
        </Card>
      )}

      {tab === "Products" && (
        <Card className="divide-y overflow-hidden">
          {(productSales ?? []).length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">No products match that scope.</p>
          ) : (
            productSales?.map((row: { id: string; name: string; numOfSale: number; addedBy: string }) => (
              <div key={row.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <span>
                  <span className="font-medium">{row.name}</span>{" "}
                  <span className="text-xs text-muted-foreground">{row.addedBy === "admin" ? "In house" : "Seller"}</span>
                </span>
                <span className="font-semibold text-muted-foreground">{row.numOfSale} sold</span>
              </div>
            ))
          )}
        </Card>
      )}

      {tab === "Seller accounts" && (
        <Card className="divide-y overflow-hidden">
          {(sellerAccounts ?? []).length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">No sellers match that status.</p>
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
                <div key={row.shopId} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm">
                  <div>
                    <p className="font-semibold">{row.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {row.seller?.name} · {row.seller?.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <StatusBadge status={row.verificationStatus} />
                    <span>
                      {row.publishedProducts}/{row.products} published · {row.remainingUploads} upload(s) left
                    </span>
                  </div>
                </div>
              ),
            )
          )}
        </Card>
      )}

      {tab === "Wishlist" && (
        <Card className="divide-y overflow-hidden">
          {wishlist?.map((row: { name: string; count: number }, i: number) => (
            <div key={i} className="flex items-center justify-between px-5 py-3 text-sm">
              <span className="font-medium">{row.name}</span>
              <span className="text-muted-foreground">{row.count} wishlist adds</span>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
