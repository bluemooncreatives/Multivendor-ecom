"use client";

import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { useBulkImportProducts, type BulkImportResult } from "@/lib/hooks/useSeller";
import { downloadCsv } from "@/lib/hooks/useAdminCommerce";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function BulkUploadPage() {
  const bulkImport = useBulkImportProducts();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<BulkImportResult | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;
    try {
      const res = await bulkImport.mutateAsync(file);
      setResult(res);
      toast.success(`Imported ${res.created} product(s)`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Bulk import failed");
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Bulk product upload</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">CSV format</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>Upload a CSV with these columns:</p>
          <code className="block overflow-x-auto rounded-md bg-muted p-2 text-xs">
            name,slug,categorySlug,subCategorySlug,subSubCategorySlug,brandSlug,description,basePrice,purchasePrice,stock,sku,unit,barcode,discount,discountType,tax,taxType,shippingType,shippingCost,minOrderQty,videoProvider,videoLink,metaTitle,metaDescription,tags
          </code>
          <p>
            Only <code>name</code>, <code>slug</code>, <code>categorySlug</code>, <code>basePrice</code> and{" "}
            <code>sku</code> are required — leave any other column blank to take the default. The sub-category columns
            must name categories in the same branch as <code>categorySlug</code>. <code>tags</code> is comma-separated
            inside the cell. Each row becomes one product with a single variant.
          </p>
          <p>
            Exporting your catalog produces this exact header, so you can export, edit and re-upload without reshaping
            anything.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Reference sheets</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {/* Look up the exact slugs the importer expects rather than guessing them. */}
          <Button variant="outline" size="sm" onClick={() => downloadCsv("/catalog/admin/categories/export", "categories.csv")}>
            Categories
          </Button>
          <Button variant="outline" size="sm" onClick={() => downloadCsv("/catalog/admin/brands/export", "brands.csv")}>
            Brands
          </Button>
          <Button variant="outline" size="sm" onClick={() => downloadCsv("/catalog/seller/products/export", "my-products.csv")}>
            My current catalog
          </Button>
        </CardContent>
      </Card>

      <form className="flex items-center gap-3" onSubmit={handleSubmit}>
        <input ref={fileInputRef} type="file" accept=".csv" required className="text-sm" />
        <Button type="submit" disabled={bulkImport.isPending}>
          Upload
        </Button>
      </form>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Import result</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>{result.created} product(s) created.</p>
            {result.skipped.length > 0 && (
              <div>
                <p className="font-medium text-destructive">{result.skipped.length} row(s) skipped:</p>
                <ul className="list-disc ps-5 text-muted-foreground">
                  {result.skipped.map((s, i) => (
                    <li key={i}>
                      Row {s.row}: {s.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
