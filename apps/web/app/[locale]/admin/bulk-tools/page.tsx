"use client";

import { useState } from "react";
import { Download, Upload } from "lucide-react";
import { useImportCustomers } from "@/lib/hooks/useAdminPeople";
import { downloadCsv, useImportAdminProducts } from "@/lib/hooks/useAdminCommerce";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/shared/page-header";
import { FormField } from "@/components/shared/form-field";

export default function AdminBulkToolsPage() {
  const importCustomers = useImportCustomers();
  const importProducts = useImportAdminProducts();
  const [file, setFile] = useState<File | null>(null);
  const [productFile, setProductFile] = useState<File | null>(null);
  const [sellerId, setSellerId] = useState("");

  return (
    <div className="space-y-6">
      <PageHeader title="Bulk import & export" description="Export marketplace CSV sheets or bulk-import products and customers." />

      <Card>
        <CardHeader className="border-b bg-muted/20 pb-3.5">
          <CardTitle className="text-base">Export data</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2 pt-4">
          <Button variant="outline" onClick={() => downloadCsv("/catalog/admin/products/export", "products.csv")}>
            <Download className="h-4 w-4" />
            Products
          </Button>
          <Button variant="outline" onClick={() => downloadCsv("/catalog/admin/categories/export", "categories.csv")}>
            <Download className="h-4 w-4" />
            Categories
          </Button>
          <Button variant="outline" onClick={() => downloadCsv("/catalog/admin/brands/export", "brands.csv")}>
            <Download className="h-4 w-4" />
            Brands
          </Button>
          <Button variant="outline" onClick={() => downloadCsv("/catalog/admin/sellers/export", "sellers.csv")}>
            <Download className="h-4 w-4" />
            Sellers
          </Button>
          <Button variant="outline" onClick={() => downloadCsv("/catalog/admin/customers/export", "customers.csv")}>
            <Download className="h-4 w-4" />
            Customers
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b bg-muted/20 pb-3.5">
          <CardTitle className="text-base">Import products</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <p className="text-sm text-muted-foreground">
            Uses the same column set as the seller bulk upload. Leave the seller field empty to create admin-owned
            In-House products, which publish immediately; naming a seller files the rows under that vendor instead.
          </p>

          <form
            className="flex flex-wrap items-end gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (productFile) importProducts.mutate({ file: productFile, sellerId: sellerId || undefined });
            }}
          >
            <FormField label="CSV file" htmlFor="product-csv">
              <Input
                id="product-csv"
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => setProductFile(e.target.files?.[0] ?? null)}
                required
              />
            </FormField>
            <FormField label="Seller ID (optional)" htmlFor="product-seller">
              <Input
                id="product-seller"
                value={sellerId}
                onChange={(e) => setSellerId(e.target.value)}
                placeholder="Leave empty for In-House"
              />
            </FormField>
            <Button type="submit" disabled={!productFile || importProducts.isPending}>
              <Upload className="h-4 w-4" />
              {importProducts.isPending ? "Importing…" : "Import"}
            </Button>
          </form>

          {importProducts.data && (
            <div className="space-y-2 rounded-lg border bg-muted/20 p-3 text-sm">
              <p className="font-semibold">Imported {importProducts.data.created} product(s).</p>
              {importProducts.data.skipped.length > 0 && (
                <ul className="space-y-0.5 text-xs text-muted-foreground">
                  {importProducts.data.skipped.map((row) => (
                    <li key={row.row}>
                      Row {row.row}: {row.reason}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b bg-muted/20 pb-3.5">
          <CardTitle className="text-base">Import customers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <p className="text-sm text-muted-foreground">
            Upload a CSV with the columns <code>name</code>, <code>email</code>, and optionally <code>phone</code> and{" "}
            <code>password</code>. Rows without a password get an unguessable random one, so those accounts can only be
            entered via the password-reset flow.
          </p>

          <form
            className="flex flex-wrap items-end gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (file) importCustomers.mutate(file);
            }}
          >
            <FormField label="CSV file" htmlFor="csv">
              <Input
                id="csv"
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                required
              />
            </FormField>
            <Button type="submit" disabled={!file || importCustomers.isPending}>
              <Upload className="h-4 w-4" />
              {importCustomers.isPending ? "Importing…" : "Import"}
            </Button>
          </form>

          {importCustomers.data && (
            <div className="space-y-2 rounded-lg border bg-muted/20 p-3 text-sm">
              <p className="font-semibold">Imported {importCustomers.data.created} customer(s).</p>
              {importCustomers.data.skipped.length > 0 && (
                <div>
                  <p className="text-muted-foreground">Skipped {importCustomers.data.skipped.length} row(s):</p>
                  <ul className="mt-1 space-y-0.5 text-xs">
                    {importCustomers.data.skipped.map((row) => (
                      <li key={row.row}>
                        Row {row.row}: {row.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          {importCustomers.isError && <p className="text-sm text-destructive">Import failed. Check the file is valid CSV.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
