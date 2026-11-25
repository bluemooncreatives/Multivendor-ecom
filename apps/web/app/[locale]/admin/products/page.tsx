"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Download, Package } from "lucide-react";
import { usePendingProducts, useModerateProduct } from "@/lib/hooks/useAdmin";
import {
  useAdminProducts,
  useCreateAdminProduct,
  useUpdateAdminProduct,
  useUpdateProductFlags,
  downloadCsv,
  type AdminProduct,
} from "@/lib/hooks/useAdminCommerce";
import { ProductForm, toFormInput, emptyProduct } from "@/components/catalog/product-form";
import type { ProductFormInput } from "@/lib/hooks/useCatalogForm";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { SearchInput } from "@/components/shared/search-input";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { EmptyState } from "@/components/shared/empty-state";
import { CardGridSkeleton, TableSkeleton } from "@/components/shared/loading-state";
import { formatPrice } from "@/lib/format";
import { getApiErrorMessage } from "@/lib/utils";

export default function AdminProductsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Moderate seller submissions, manage catalog placement, or publish In-House items."
        actions={
          <Button variant="outline" size="sm" onClick={() => downloadCsv("/catalog/admin/products/export", "products.csv")}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        }
      />

      <Tabs defaultValue="moderation">
        <TabsList>
          <TabsTrigger value="moderation">Moderation queue</TabsTrigger>
          <TabsTrigger value="catalog">All products</TabsTrigger>
          <TabsTrigger value="in-house">Add In-House product</TabsTrigger>
        </TabsList>

        <TabsContent value="moderation">
          <ModerationQueue />
        </TabsContent>
        <TabsContent value="catalog">
          <CatalogBrowser />
        </TabsContent>
        <TabsContent value="in-house">
          <InHouseProductForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ModerationQueue() {
  const { data: products, isLoading } = usePendingProducts();
  const moderate = useModerateProduct();

  if (isLoading) return <CardGridSkeleton count={4} columns="sm:grid-cols-2" />;
  if (!products || products.length === 0) {
    return <EmptyState icon={Package} title="Moderation queue empty" description="No products awaiting review." />;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {products.map((product: AdminProduct) => (
        <Card key={product.id}>
          <CardHeader className="border-b bg-muted/20 pb-3">
            <CardTitle className="text-base">{product.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            <p className="text-lg font-bold text-primary">{formatPrice(product.basePrice, product.currency)}</p>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => moderate.mutate({ id: product.id, approved: true })}>
                Approve
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => moderate.mutate({ id: product.id, approved: false })}
              >
                Reject
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function CatalogBrowser() {
  const [filters, setFilters] = useState<{ q: string; approvalStatus: string; page: number }>({
    q: "",
    approvalStatus: "",
    page: 1,
  });
  const { data, isLoading } = useAdminProducts({
    q: filters.q || undefined,
    approvalStatus: filters.approvalStatus || undefined,
    page: filters.page,
  });
  const updateFlags = useUpdateProductFlags();
  const updateProduct = useUpdateAdminProduct();

  const [editing, setEditing] = useState<{ id: string; form: ProductFormInput } | null>(null);

  async function handleSave(value: ProductFormInput) {
    if (!editing) return;
    try {
      await updateProduct.mutateAsync({ ...value, id: editing.id });
      setEditing(null);
      toast.success("Product saved");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not save product"));
    }
  }

  if (editing) {
    return (
      <div className="space-y-4">
        <Button variant="outline" size="sm" onClick={() => setEditing(null)}>
          Back to catalog
        </Button>
        <ProductForm
          scope="admin"
          value={editing.form}
          onChange={(form) => setEditing({ ...editing, form })}
          onSubmit={handleSave}
          submitting={updateProduct.isPending}
          submitLabel="Save changes"
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <SearchInput
          className="w-full max-w-xs"
          placeholder="Search by name"
          value={filters.q}
          onChange={(q) => setFilters({ ...filters, q, page: 1 })}
        />
        <div className="w-44">
          <NativeSelect
            value={filters.approvalStatus}
            onChange={(e) => setFilters({ ...filters, approvalStatus: e.target.value, page: 1 })}
          >
            <option value="">Any status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </NativeSelect>
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton rows={6} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState icon={Package} title="No matching products" description="No products match those filters." />
      ) : (
        <>
          <Card className="overflow-hidden">
            <Table className="min-w-[720px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Placement</TableHead>
                  <TableHead className="text-end">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{product.addedBy === "admin" ? "In House" : "Seller"}</Badge>
                    </TableCell>
                    <TableCell className="font-semibold">{formatPrice(product.basePrice, product.currency)}</TableCell>
                    <TableCell>
                      <StatusBadge status={product.published ? "live" : product.approvalStatus} />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant={product.featured ? "secondary" : "ghost"}
                          size="sm"
                          onClick={() => updateFlags.mutate({ id: product.id, featured: !product.featured })}
                        >
                          {product.featured ? "Unfeature" : "Feature"}
                        </Button>
                        <Button
                          variant={product.todaysDeal ? "secondary" : "ghost"}
                          size="sm"
                          onClick={() => updateFlags.mutate({ id: product.id, todaysDeal: !product.todaysDeal })}
                        >
                          {product.todaysDeal ? "Undeal" : "Deal"}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditing({ id: product.id, form: toFormInput(product) })}
                      >
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          <PaginationBar
            page={data.page}
            total={data.total}
            hasNext={data.items.length > 0 && data.page * 20 < data.total}
            onPageChange={(page) => setFilters({ ...filters, page })}
            itemLabel="products"
          />
        </>
      )}
    </div>
  );
}

function InHouseProductForm() {
  const createProduct = useCreateAdminProduct();
  const [form, setForm] = useState<ProductFormInput>(emptyProduct);

  async function handleSubmit(value: ProductFormInput) {
    try {
      await createProduct.mutateAsync(value);
      setForm(emptyProduct);
      toast.success("In-House product published");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not create product"));
    }
  }

  return (
    <div className="space-y-4">
      <Alert variant="info">
        <AlertDescription>
          In-House products are owned by the store rather than a vendor. They publish immediately without moderation and
          carry no seller commission.
        </AlertDescription>
      </Alert>
      <ProductForm
        scope="admin"
        value={form}
        onChange={setForm}
        onSubmit={handleSubmit}
        submitting={createProduct.isPending}
        submitLabel="Publish product"
      />
    </div>
  );
}
