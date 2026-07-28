"use client";

import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { useBulkImportProducts, type BulkImportResult } from "@/lib/hooks/useSeller";
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
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Upload a CSV with these columns:</p>
          <code className="block rounded-md bg-muted p-2 text-xs">
            name,slug,categorySlug,description,basePrice,stock,sku,tags
          </code>
          <p>
            <code>categorySlug</code> must match an existing category's slug. <code>tags</code> is optional,
            comma-separated inside the cell. Each row becomes one product with a single variant.
          </p>
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
