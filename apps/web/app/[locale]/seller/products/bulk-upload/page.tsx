"use client";

import { useRef, useState } from "react";
import { useLocale } from "next-intl";
import toast from "react-hot-toast";
import { Download, Upload } from "lucide-react";
import { useBulkImportProducts, type BulkImportResult } from "@/lib/hooks/useSeller";
import { downloadCsv } from "@/lib/hooks/useAdminCommerce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { getApiErrorMessage } from "@/lib/utils";

export default function BulkUploadPage() {
  const locale = useLocale();
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
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Bulk import failed"));
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bulk product upload"
        description="Import or update products in bulk using a CSV spreadsheet."
        backHref={`/${locale}/seller/products`}
        backLabel="Back to products"
      />

      <Card>
        <CardHeader className="border-b bg-muted/20 pb-3">
          <CardTitle className="text-base">CSV format</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-4 text-sm text-muted-foreground">
          <p>Upload a CSV with these columns:</p>
          <code className="block overflow-x-auto rounded-lg border bg-muted/50 p-3 text-xs text-foreground">
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
        <CardHeader className="border-b bg-muted/20 pb-3">
          <CardTitle className="text-base">Reference sheets</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2 pt-4">
          <Button variant="outline" size="sm" onClick={() => downloadCsv("/catalog/admin/categories/export", "categories.csv")}>
            <Download className="h-3.5 w-3.5" />
            Categories
          </Button>
          <Button variant="outline" size="sm" onClick={() => downloadCsv("/catalog/admin/brands/export", "brands.csv")}>
            <Download className="h-3.5 w-3.5" />
            Brands
          </Button>
          <Button variant="outline" size="sm" onClick={() => downloadCsv("/catalog/seller/products/export", "my-products.csv")}>
            <Download className="h-3.5 w-3.5" />
            My current catalog
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b bg-muted/20 pb-3">
          <CardTitle className="text-base">Upload CSV file</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <form className="flex flex-wrap items-center gap-3" onSubmit={handleSubmit}>
            <Input ref={fileInputRef} type="file" accept=".csv" required className="max-w-sm" />
            <Button type="submit" disabled={bulkImport.isPending}>
              <Upload className="h-4 w-4" />
              Upload
            </Button>
          </form>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader className="border-b bg-muted/20 pb-3">
            <CardTitle className="text-base">Import result</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-4 text-sm">
            <p className="font-medium">{result.created} product(s) created.</p>
            {result.skipped.length > 0 && (
              <div>
                <p className="font-medium text-destructive">{result.skipped.length} row(s) skipped:</p>
                <ul className="mt-1 list-disc ps-5 text-muted-foreground">
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
