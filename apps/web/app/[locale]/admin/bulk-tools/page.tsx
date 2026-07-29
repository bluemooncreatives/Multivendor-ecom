"use client";

import { useState } from "react";
import { useImportCustomers } from "@/lib/hooks/useAdminPeople";
import { downloadCsv, useImportAdminProducts } from "@/lib/hooks/useAdminCommerce";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminBulkToolsPage() {
  const importCustomers = useImportCustomers();
  const importProducts = useImportAdminProducts();
  const [file, setFile] = useState<File | null>(null);
  const [productFile, setProductFile] = useState<File | null>(null);
  const [sellerId, setSellerId] = useState("");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Bulk import & export</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Export data</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => downloadCsv("/catalog/admin/products/export", "products.csv")}>
            Products
          </Button>
          <Button variant="outline" onClick={() => downloadCsv("/catalog/admin/categories/export", "categories.csv")}>
            Categories
          </Button>
          <Button variant="outline" onClick={() => downloadCsv("/catalog/admin/brands/export", "brands.csv")}>
            Brands
          </Button>
          <Button variant="outline" onClick={() => downloadCsv("/catalog/admin/sellers/export", "sellers.csv")}>
            Sellers
          </Button>
          <Button variant="outline" onClick={() => downloadCsv("/catalog/admin/customers/export", "customers.csv")}>
            Customers
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Import products</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Uses the same column set as the seller bulk upload. Leave the seller field empty to create admin-owned
            In-House products, which publish immediately; naming a seller files the rows under that vendor instead.
          </p>

          <form
            className="flex flex-wrap items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (productFile) importProducts.mutate({ file: productFile, sellerId: sellerId || undefined });
            }}
          >
            <div className="space-y-1">
              <Label htmlFor="product-csv">CSV file</Label>
              <input
                id="product-csv"
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => setProductFile(e.target.files?.[0] ?? null)}
                className="block text-sm"
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="product-seller">Seller ID (optional)</Label>
              <Input
                id="product-seller"
                value={sellerId}
                onChange={(e) => setSellerId(e.target.value)}
                placeholder="Leave empty for In-House"
              />
            </div>
            <Button type="submit" disabled={!productFile || importProducts.isPending}>
              {importProducts.isPending ? "Importing…" : "Import"}
            </Button>
          </form>

          {importProducts.data && (
            <div className="space-y-2 rounded-md border p-3 text-sm">
              <p className="font-medium">Imported {importProducts.data.created} product(s).</p>
              {importProducts.data.skipped.length > 0 && (
                <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
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
        <CardHeader>
          <CardTitle className="text-base">Import customers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Upload a CSV with the columns <code>name</code>, <code>email</code>, and optionally <code>phone</code> and{" "}
            <code>password</code>. Rows without a password get an unguessable random one, so those accounts can only be entered via
            the password-reset flow.
          </p>

          <form
            className="flex flex-wrap items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (file) importCustomers.mutate(file);
            }}
          >
            <div className="space-y-1">
              <Label htmlFor="csv">CSV file</Label>
              <input
                id="csv"
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="block text-sm"
                required
              />
            </div>
            <Button type="submit" disabled={!file || importCustomers.isPending}>
              {importCustomers.isPending ? "Importing…" : "Import"}
            </Button>
          </form>

          {importCustomers.data && (
            <div className="space-y-2 rounded-md border p-3 text-sm">
              <p className="font-medium">Imported {importCustomers.data.created} customer(s).</p>
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
