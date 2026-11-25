"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { X } from "lucide-react";
import {
  useChildCategories,
  useBrandsForCategory,
  useAttributesForCategory,
  useColors,
  useGenerateSkuCombinations,
  useUploadFile,
  useUploadFiles,
  type ProductFormInput,
  type ProductVariantInput,
} from "@/lib/hooks/useCatalogForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FormField, ToggleCard } from "@/components/shared/form-field";
import { getApiErrorMessage, slugify } from "@/lib/utils";

export { slugify };

export const emptyProduct: ProductFormInput = {
  name: "",
  slug: "",
  categoryId: "",
  subCategoryId: null,
  subSubCategoryId: null,
  brandId: null,
  description: "",
  images: [],
  thumbnailUrl: null,
  basePrice: 0,
  purchasePrice: 0,
  unit: "pc",
  barcode: null,
  discount: 0,
  discountType: "percent",
  tax: null,
  taxType: "percent",
  shippingType: "free",
  shippingCost: 0,
  variants: [],
  colors: [],
  choiceOptions: [],
  minOrderQty: 1,
  isDigital: false,
  digitalFileUrl: null,
  refundable: true,
  videoProvider: null,
  videoLink: null,
  pdfSpecUrl: null,
  metaTitle: null,
  metaDescription: null,
  metaImageUrl: null,
  clubPoints: 0,
  tags: [],
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toFormInput(product: any): ProductFormInput {
  const idOf = (v: unknown) => (v == null ? null : typeof v === "string" ? v : String((v as { id?: string }).id ?? v));

  return {
    ...emptyProduct,
    ...product,
    categoryId: idOf(product.categoryId) ?? "",
    subCategoryId: idOf(product.subCategoryId),
    subSubCategoryId: idOf(product.subSubCategoryId),
    brandId: idOf(product.brandId),
    colors: (product.colors ?? []).map((c: unknown) => idOf(c)).filter(Boolean) as string[],
    choiceOptions: (product.choiceOptions ?? []).map((o: { name: string; values: string[] }) => ({
      name: o.name,
      values: o.values ?? [],
    })),
    variants: (product.variants ?? []).map(
      (v: { sku: string; attributes?: Record<string, string>; price: number; comparePrice?: number; stock: number; imageUrl?: string }) => ({
        sku: v.sku,
        attributes: v.attributes ?? {},
        price: v.price,
        comparePrice: v.comparePrice,
        stock: v.stock,
        imageUrl: v.imageUrl,
      }),
    ),
    images: product.images ?? [],
    tags: product.tags ?? [],
  };
}

interface ProductFormProps {
  value: ProductFormInput;
  onChange: (value: ProductFormInput) => void;
  onSubmit: (value: ProductFormInput) => void;
  scope: "seller" | "admin";
  submitting?: boolean;
  submitLabel?: string;
}

export function ProductForm({ value, onChange, onSubmit, scope, submitting, submitLabel }: ProductFormProps) {
  const set = <K extends keyof ProductFormInput>(key: K, next: ProductFormInput[K]) =>
    onChange({ ...value, [key]: next });

  const { data: roots } = useChildCategories(null);
  const { data: subs } = useChildCategories(value.categoryId, Boolean(value.categoryId));
  const { data: subSubs } = useChildCategories(value.subCategoryId, Boolean(value.subCategoryId));

  const deepestCategoryId = value.subSubCategoryId ?? value.subCategoryId ?? value.categoryId ?? null;
  const { data: brands } = useBrandsForCategory(deepestCategoryId);
  const { data: attributes } = useAttributesForCategory(deepestCategoryId);
  const { data: colors } = useColors();

  const generateSkus = useGenerateSkuCombinations(scope);
  const uploadOne = useUploadFile();
  const uploadMany = useUploadFiles();

  const [tagInput, setTagInput] = useState("");
  const [selectedValues, setSelectedValues] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (value.choiceOptions.length > 0) {
      setSelectedValues(Object.fromEntries(value.choiceOptions.map((o) => [o.name, o.values])));
    }
  }, [value.choiceOptions]);

  const selectedColorNames = useMemo(
    () => (colors ?? []).filter((c) => value.colors.includes(c.id)).map((c) => c.name),
    [colors, value.colors],
  );

  async function handleGenerate() {
    const attributeMap: Record<string, string[]> = { ...selectedValues };
    if (selectedColorNames.length > 0) attributeMap.Color = selectedColorNames;

    const nonEmpty = Object.fromEntries(Object.entries(attributeMap).filter(([, v]) => v.length > 0));
    if (Object.keys(nonEmpty).length === 0) {
      toast.error("Pick at least one colour or attribute value first");
      return;
    }

    try {
      const variants = await generateSkus.mutateAsync({
        baseSku: value.slug || slugify(value.name) || "sku",
        basePrice: value.basePrice,
        attributes: nonEmpty,
      });
      onChange({
        ...value,
        variants,
        choiceOptions: Object.entries(nonEmpty).map(([name, values]) => ({ name, values })),
      });
      toast.success(`Generated ${variants.length} variant${variants.length === 1 ? "" : "s"}`);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not generate variants"));
    }
  }

  function updateVariant(index: number, patch: Partial<ProductVariantInput>) {
    set(
      "variants",
      value.variants.map((v, i) => (i === index ? { ...v, ...patch } : v)),
    );
  }

  async function handleImageUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    try {
      const stored = await uploadMany.mutateAsync({ files: Array.from(files), kind: "image" });
      const urls = stored.map((s) => s.url);
      onChange({
        ...value,
        images: [...value.images, ...urls],
        thumbnailUrl: value.thumbnailUrl ?? urls[0] ?? null,
      });
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Upload failed"));
    }
  }

  async function handleSingleUpload(file: File | null, kind: "image" | "document" | "digital", field: keyof ProductFormInput) {
    if (!file) return;
    try {
      const stored = await uploadOne.mutateAsync({ file, kind });
      set(field, stored.url as never);
      toast.success("Uploaded");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Upload failed"));
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const variants =
      value.variants.length > 0
        ? value.variants
        : [
            {
              sku: value.slug || slugify(value.name),
              attributes: {},
              price: value.basePrice,
              stock: value.isDigital ? 999_999 : 0,
            },
          ];
    onSubmit({ ...value, variants });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Tabs defaultValue="basic">
        <TabsList>
          <TabsTrigger value="basic">Basics</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="variants">Variants</TabsTrigger>
          <TabsTrigger value="pricing">Pricing &amp; tax</TabsTrigger>
          <TabsTrigger value="shipping">Shipping</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>

        <TabsContent value="basic">
          <Card>
            <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
              <FormField label="Name" required>
                <Input
                  value={value.name}
                  onChange={(e) =>
                    onChange({
                      ...value,
                      name: e.target.value,
                      slug: value.slug === slugify(value.name) || !value.slug ? slugify(e.target.value) : value.slug,
                    })
                  }
                  required
                />
              </FormField>
              <FormField label="Slug" required>
                <Input value={value.slug} onChange={(e) => set("slug", e.target.value)} required />
              </FormField>

              <FormField label="Category" required>
                <SelectField
                  value={value.categoryId}
                  onChange={(v) => onChange({ ...value, categoryId: v, subCategoryId: null, subSubCategoryId: null, brandId: null })}
                  placeholder="Select category"
                  options={(roots ?? []).map((c) => ({ value: c.id, label: c.name }))}
                  required
                />
              </FormField>
              <FormField label="Sub-category">
                <SelectField
                  value={value.subCategoryId ?? ""}
                  onChange={(v) => onChange({ ...value, subCategoryId: v || null, subSubCategoryId: null })}
                  placeholder={value.categoryId ? "Optional" : "Choose a category first"}
                  options={(subs ?? []).map((c) => ({ value: c.id, label: c.name }))}
                  disabled={!value.categoryId}
                />
              </FormField>
              <FormField label="Sub-sub-category">
                <SelectField
                  value={value.subSubCategoryId ?? ""}
                  onChange={(v) => set("subSubCategoryId", v || null)}
                  placeholder={value.subCategoryId ? "Optional" : "Choose a sub-category first"}
                  options={(subSubs ?? []).map((c) => ({ value: c.id, label: c.name }))}
                  disabled={!value.subCategoryId}
                />
              </FormField>
              <FormField label="Brand">
                <SelectField
                  value={value.brandId ?? ""}
                  onChange={(v) => set("brandId", v || null)}
                  placeholder="No brand"
                  options={(brands ?? []).map((b) => ({ value: b.id, label: b.name }))}
                />
              </FormField>

              <FormField label="Unit">
                <Input value={value.unit} onChange={(e) => set("unit", e.target.value)} placeholder="pc, kg, litre…" />
              </FormField>
              <FormField label="Barcode">
                <Input
                  value={value.barcode ?? ""}
                  onChange={(e) => set("barcode", e.target.value || null)}
                  placeholder="Scanned at the POS"
                />
              </FormField>
              <FormField label="Minimum order quantity">
                <Input
                  type="number"
                  min={1}
                  value={value.minOrderQty}
                  onChange={(e) => set("minOrderQty", Number(e.target.value))}
                />
              </FormField>
              <FormField label="Club points earned">
                <Input
                  type="number"
                  min={0}
                  value={value.clubPoints}
                  onChange={(e) => set("clubPoints", Number(e.target.value))}
                />
              </FormField>

              <div className="space-y-2 sm:col-span-2">
                <Label>Tags</Label>
                {value.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {value.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        {tag}
                        <button
                          type="button"
                          aria-label={`Remove ${tag}`}
                          onClick={() => set("tags", value.tags.filter((t) => t !== tag))}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Type a tag and press Enter"
                  onKeyDown={(e) => {
                    if (e.key !== "Enter") return;
                    e.preventDefault();
                    const tag = tagInput.trim();
                    if (tag && !value.tags.includes(tag)) set("tags", [...value.tags, tag]);
                    setTagInput("");
                  }}
                />
              </div>

              <FormField label="Description" className="sm:col-span-2">
                <Textarea rows={6} value={value.description} onChange={(e) => set("description", e.target.value)} />
              </FormField>

              <ToggleCard
                label="Digital product"
                hint="Buyers download a file instead of receiving a shipment."
                checked={value.isDigital}
                onCheckedChange={(v) => set("isDigital", v)}
              />
              <ToggleCard
                label="Refundable"
                hint="Customers may open a refund request for this product."
                checked={value.refundable}
                onCheckedChange={(v) => set("refundable", v)}
              />

              {value.isDigital && (
                <FormField
                  label="Digital file"
                  hint={
                    value.digitalFileUrl
                      ? "Stored. Buyers receive a signed, expiring link — the file is never served directly."
                      : undefined
                  }
                  className="sm:col-span-2"
                >
                  <Input
                    type="file"
                    accept=".pdf,.zip,.epub,.mp3,.mp4,.jpg,.jpeg,.png"
                    onChange={(e) => handleSingleUpload(e.target.files?.[0] ?? null, "digital", "digitalFileUrl")}
                  />
                </FormField>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="media">
          <Card>
            <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Gallery images</Label>
                <Input type="file" accept="image/*" multiple onChange={(e) => handleImageUpload(e.target.files)} />
                <div className="flex flex-wrap gap-3 pt-2">
                  {value.images.map((url) => (
                    <div key={url} className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="h-20 w-20 rounded-lg border object-cover" />
                      <button
                        type="button"
                        aria-label="Remove image"
                        className="absolute -end-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border bg-background shadow-sm hover:text-destructive"
                        onClick={() =>
                          onChange({
                            ...value,
                            images: value.images.filter((i) => i !== url),
                            thumbnailUrl: value.thumbnailUrl === url ? null : value.thumbnailUrl,
                          })
                        }
                      >
                        <X className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        className="mt-1 block w-full text-center text-[11px] font-medium text-primary underline"
                        onClick={() => set("thumbnailUrl", url)}
                      >
                        {value.thumbnailUrl === url ? "Thumbnail" : "Set thumbnail"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <FormField label="Video provider">
                <SelectField
                  value={value.videoProvider ?? ""}
                  onChange={(v) => set("videoProvider", (v || null) as ProductFormInput["videoProvider"])}
                  placeholder="None"
                  options={[
                    { value: "youtube", label: "YouTube" },
                    { value: "vimeo", label: "Vimeo" },
                    { value: "dailymotion", label: "Dailymotion" },
                  ]}
                />
              </FormField>
              <FormField label="Video link">
                <Input
                  type="url"
                  value={value.videoLink ?? ""}
                  onChange={(e) => set("videoLink", e.target.value || null)}
                  disabled={!value.videoProvider}
                />
              </FormField>

              <FormField
                label="Specification PDF"
                hint={value.pdfSpecUrl ? "A specification sheet is attached." : undefined}
                className="sm:col-span-2"
              >
                <Input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => handleSingleUpload(e.target.files?.[0] ?? null, "document", "pdfSpecUrl")}
                />
              </FormField>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="variants">
          <Card>
            <CardHeader className="border-b bg-muted/20 pb-3.5">
              <CardTitle className="text-base">Colours &amp; options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 pt-5">
              <div className="space-y-2">
                <Label>Colours</Label>
                <div className="flex flex-wrap gap-2">
                  {(colors ?? []).map((color) => {
                    const active = value.colors.includes(color.id);
                    return (
                      <button
                        key={color.id}
                        type="button"
                        onClick={() =>
                          set("colors", active ? value.colors.filter((c) => c !== color.id) : [...value.colors, color.id])
                        }
                        className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                          active ? "border-primary bg-primary/10 ring-2 ring-primary/30" : "hover:bg-accent"
                        }`}
                      >
                        <span className="h-3 w-3 rounded-full border" style={{ backgroundColor: color.hex }} />
                        {color.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {(attributes ?? []).map((attribute) => (
                <div key={attribute.id} className="space-y-2">
                  <Label>{attribute.name}</Label>
                  <div className="flex flex-wrap gap-2">
                    {attribute.values.map((option) => {
                      const active = (selectedValues[attribute.name] ?? []).includes(option);
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() =>
                            setSelectedValues((prev) => {
                              const current = prev[attribute.name] ?? [];
                              return {
                                ...prev,
                                [attribute.name]: active ? current.filter((v) => v !== option) : [...current, option],
                              };
                            })
                          }
                          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                            active ? "border-primary bg-primary/10 ring-2 ring-primary/30" : "hover:bg-accent"
                          }`}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              <Button type="button" variant="outline" onClick={handleGenerate} disabled={generateSkus.isPending}>
                Generate variant combinations
              </Button>

              {value.variants.length > 0 && (
                <div className="rounded-lg border">
                  <Table className="min-w-[640px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Variant</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Compare at</TableHead>
                        <TableHead>Stock</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {value.variants.map((variant, index) => (
                        <TableRow key={variant.sku}>
                          <TableCell className="font-medium">
                            {Object.entries(variant.attributes)
                              .map(([k, v]) => `${k}: ${v}`)
                              .join(", ") || "Default"}
                          </TableCell>
                          <TableCell>
                            <Input value={variant.sku} onChange={(e) => updateVariant(index, { sku: e.target.value })} />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={0}
                              value={variant.price}
                              onChange={(e) => updateVariant(index, { price: Number(e.target.value) })}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={0}
                              value={variant.comparePrice ?? ""}
                              onChange={(e) =>
                                updateVariant(index, {
                                  comparePrice: e.target.value === "" ? undefined : Number(e.target.value),
                                })
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={0}
                              value={variant.stock}
                              onChange={(e) => updateVariant(index, { stock: Number(e.target.value) })}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing">
          <Card>
            <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
              <FormField label="Base price" required>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={value.basePrice}
                  onChange={(e) => set("basePrice", Number(e.target.value))}
                  required
                />
              </FormField>
              <FormField label="Purchase price" hint="Your cost. Used for profit reporting; never shown to shoppers.">
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={value.purchasePrice}
                  onChange={(e) => set("purchasePrice", Number(e.target.value))}
                />
              </FormField>
              <FormField label="Discount">
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={value.discount}
                  onChange={(e) => set("discount", Number(e.target.value))}
                />
              </FormField>
              <FormField label="Discount type">
                <SelectField
                  value={value.discountType}
                  onChange={(v) => set("discountType", v as "flat" | "percent")}
                  options={[
                    { value: "percent", label: "Percent" },
                    { value: "flat", label: "Flat amount" },
                  ]}
                />
              </FormField>
              <FormField label="Tax" hint="Leave empty to use the store-wide tax rate.">
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={value.tax ?? ""}
                  onChange={(e) => set("tax", e.target.value === "" ? null : Number(e.target.value))}
                />
              </FormField>
              <FormField label="Tax type">
                <SelectField
                  value={value.taxType}
                  onChange={(v) => set("taxType", v as "flat" | "percent")}
                  options={[
                    { value: "percent", label: "Percent" },
                    { value: "flat", label: "Flat amount" },
                  ]}
                />
              </FormField>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shipping">
          <Card>
            <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
              <FormField label="Shipping" hint="Applies when the store runs product-wise shipping.">
                <SelectField
                  value={value.shippingType}
                  onChange={(v) => set("shippingType", v as "free" | "flat_rate")}
                  options={[
                    { value: "free", label: "Free shipping" },
                    { value: "flat_rate", label: "Flat rate" },
                  ]}
                />
              </FormField>
              <FormField label="Shipping cost">
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={value.shippingCost}
                  onChange={(e) => set("shippingCost", Number(e.target.value))}
                  disabled={value.shippingType === "free"}
                />
              </FormField>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo">
          <Card>
            <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
              <FormField label="Meta title" hint="Defaults to the product name when empty.">
                <Input
                  value={value.metaTitle ?? ""}
                  onChange={(e) => set("metaTitle", e.target.value || null)}
                  maxLength={200}
                />
              </FormField>
              <FormField label="Meta image">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleSingleUpload(e.target.files?.[0] ?? null, "image", "metaImageUrl")}
                />
              </FormField>
              <FormField label="Meta description" className="sm:col-span-2">
                <Textarea
                  rows={3}
                  maxLength={500}
                  value={value.metaDescription ?? ""}
                  onChange={(e) => set("metaDescription", e.target.value || null)}
                />
              </FormField>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Button type="submit" size="lg" disabled={submitting}>
        {submitLabel ?? "Save product"}
      </Button>
    </form>
  );
}

function SelectField({
  value,
  onChange,
  options,
  placeholder,
  disabled,
  required,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}) {
  return (
    <NativeSelect
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      required={required}
    >
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </NativeSelect>
  );
}
