"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
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
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

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

// Maps a product loaded from the API onto form state. Every field falls back to
// the `emptyProduct` default, so a product created before a field existed still
// opens cleanly in the editor instead of rendering uncontrolled inputs.
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
        // Mongoose serialises the Map as a plain object; guard against null.
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
  /** Which SKU-combination endpoint to call — the two are permission-scoped differently. */
  scope: "seller" | "admin";
  submitting?: boolean;
  submitLabel?: string;
}

export function ProductForm({ value, onChange, onSubmit, scope, submitting, submitLabel }: ProductFormProps) {
  const set = <K extends keyof ProductFormInput>(key: K, next: ProductFormInput[K]) =>
    onChange({ ...value, [key]: next });

  // --- Taxonomy cascade -------------------------------------------------------
  // Three dependent selects. Choosing a coarser level clears the finer ones so the
  // form can never submit a sub-category that belongs to a different root.
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

  // Attribute name -> chosen values, the input to the combination generator.
  const [selectedValues, setSelectedValues] = useState<Record<string, string[]>>({});

  // Re-seed the picker from a loaded product so the edit page shows the option
  // sets that produced the existing variants.
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
      toast.error(errorMessage(err, "Could not generate variants"));
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
        // First image uploaded doubles as the thumbnail until one is set explicitly.
        thumbnailUrl: value.thumbnailUrl ?? urls[0] ?? null,
      });
    } catch (err) {
      toast.error(errorMessage(err, "Upload failed"));
    }
  }

  async function handleSingleUpload(file: File | null, kind: "image" | "document" | "digital", field: keyof ProductFormInput) {
    if (!file) return;
    try {
      const stored = await uploadOne.mutateAsync({ file, kind });
      set(field, stored.url as never);
      toast.success("Uploaded");
    } catch (err) {
      toast.error(errorMessage(err, "Upload failed"));
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // A product must ship with at least one variant; if the seller never used the
    // generator, fall back to a single default built from the base price.
    const variants =
      value.variants.length > 0
        ? value.variants
        : [
            {
              sku: value.slug || slugify(value.name),
              attributes: {},
              price: value.basePrice,
              // Digital goods aren't stock-limited; a large fixed count stands in
              // for "always available".
              stock: value.isDigital ? 999_999 : 0,
            },
          ];

    onSubmit({ ...value, variants });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Tabs defaultValue="basic">
        <TabsList>
          <TabsTrigger value="basic">Basics</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="variants">Variants</TabsTrigger>
          <TabsTrigger value="pricing">Pricing &amp; tax</TabsTrigger>
          <TabsTrigger value="shipping">Shipping</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>

        {/* --- Basics ---------------------------------------------------------- */}
        <TabsContent value="basic">
          <Card>
            <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
              <Field label="Name" required>
                <Input
                  value={value.name}
                  onChange={(e) =>
                    onChange({
                      ...value,
                      name: e.target.value,
                      // Track the name until the slug is edited by hand.
                      slug: value.slug === slugify(value.name) || !value.slug ? slugify(e.target.value) : value.slug,
                    })
                  }
                  required
                />
              </Field>
              <Field label="Slug" required>
                <Input value={value.slug} onChange={(e) => set("slug", e.target.value)} required />
              </Field>

              <Field label="Category" required>
                <NativeSelect
                  value={value.categoryId}
                  onChange={(v) => onChange({ ...value, categoryId: v, subCategoryId: null, subSubCategoryId: null, brandId: null })}
                  placeholder="Select category"
                  options={(roots ?? []).map((c) => ({ value: c.id, label: c.name }))}
                  required
                />
              </Field>
              <Field label="Sub-category">
                <NativeSelect
                  value={value.subCategoryId ?? ""}
                  onChange={(v) => onChange({ ...value, subCategoryId: v || null, subSubCategoryId: null })}
                  placeholder={value.categoryId ? "Optional" : "Choose a category first"}
                  options={(subs ?? []).map((c) => ({ value: c.id, label: c.name }))}
                  disabled={!value.categoryId}
                />
              </Field>
              <Field label="Sub-sub-category">
                <NativeSelect
                  value={value.subSubCategoryId ?? ""}
                  onChange={(v) => set("subSubCategoryId", v || null)}
                  placeholder={value.subCategoryId ? "Optional" : "Choose a sub-category first"}
                  options={(subSubs ?? []).map((c) => ({ value: c.id, label: c.name }))}
                  disabled={!value.subCategoryId}
                />
              </Field>
              <Field label="Brand">
                <NativeSelect
                  value={value.brandId ?? ""}
                  onChange={(v) => set("brandId", v || null)}
                  placeholder="No brand"
                  options={(brands ?? []).map((b) => ({ value: b.id, label: b.name }))}
                />
              </Field>

              <Field label="Unit">
                <Input value={value.unit} onChange={(e) => set("unit", e.target.value)} placeholder="pc, kg, litre…" />
              </Field>
              <Field label="Barcode">
                <Input
                  value={value.barcode ?? ""}
                  onChange={(e) => set("barcode", e.target.value || null)}
                  placeholder="Scanned at the POS"
                />
              </Field>
              <Field label="Minimum order quantity">
                <Input
                  type="number"
                  min={1}
                  value={value.minOrderQty}
                  onChange={(e) => set("minOrderQty", Number(e.target.value))}
                />
              </Field>
              <Field label="Club points earned">
                <Input
                  type="number"
                  min={0}
                  value={value.clubPoints}
                  onChange={(e) => set("clubPoints", Number(e.target.value))}
                />
              </Field>

              <div className="space-y-2 sm:col-span-2">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {value.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="gap-1">
                      {tag}
                      <button
                        type="button"
                        aria-label={`Remove ${tag}`}
                        onClick={() => set("tags", value.tags.filter((t) => t !== tag))}
                      >
                        &#10005;
                      </button>
                    </Badge>
                  ))}
                </div>
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Type a tag and press Enter"
                  onKeyDown={(e) => {
                    if (e.key !== "Enter") return;
                    e.preventDefault(); // Enter would otherwise submit the whole form
                    const tag = tagInput.trim();
                    if (tag && !value.tags.includes(tag)) set("tags", [...value.tags, tag]);
                    setTagInput("");
                  }}
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label>Description</Label>
                <Textarea rows={6} value={value.description} onChange={(e) => set("description", e.target.value)} />
              </div>

              <ToggleRow
                label="Digital product"
                hint="Buyers download a file instead of receiving a shipment."
                checked={value.isDigital}
                onChange={(v) => set("isDigital", v)}
              />
              <ToggleRow
                label="Refundable"
                hint="Customers may open a refund request for this product."
                checked={value.refundable}
                onChange={(v) => set("refundable", v)}
              />

              {value.isDigital && (
                <div className="space-y-2 sm:col-span-2">
                  <Label>Digital file</Label>
                  <Input
                    type="file"
                    accept=".pdf,.zip,.epub,.mp3,.mp4,.jpg,.jpeg,.png"
                    onChange={(e) => handleSingleUpload(e.target.files?.[0] ?? null, "digital", "digitalFileUrl")}
                  />
                  {value.digitalFileUrl && (
                    <p className="text-xs text-muted-foreground">
                      Stored. Buyers receive a signed, expiring link — the file is never served directly.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- Media ----------------------------------------------------------- */}
        <TabsContent value="media">
          <Card>
            <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Gallery images</Label>
                <Input type="file" accept="image/*" multiple onChange={(e) => handleImageUpload(e.target.files)} />
                <div className="flex flex-wrap gap-2 pt-2">
                  {value.images.map((url) => (
                    <div key={url} className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="h-20 w-20 rounded border object-cover" />
                      <button
                        type="button"
                        aria-label="Remove image"
                        className="absolute -end-1 -top-1 rounded-full border bg-background px-1 text-xs"
                        onClick={() =>
                          onChange({
                            ...value,
                            images: value.images.filter((i) => i !== url),
                            thumbnailUrl: value.thumbnailUrl === url ? null : value.thumbnailUrl,
                          })
                        }
                      >
                        &#10005;
                      </button>
                      <button
                        type="button"
                        className="mt-1 block w-full text-center text-[10px] underline"
                        onClick={() => set("thumbnailUrl", url)}
                      >
                        {value.thumbnailUrl === url ? "Thumbnail" : "Set thumbnail"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <Field label="Video provider">
                <NativeSelect
                  value={value.videoProvider ?? ""}
                  onChange={(v) => set("videoProvider", (v || null) as ProductFormInput["videoProvider"])}
                  placeholder="None"
                  options={[
                    { value: "youtube", label: "YouTube" },
                    { value: "vimeo", label: "Vimeo" },
                    { value: "dailymotion", label: "Dailymotion" },
                  ]}
                />
              </Field>
              <Field label="Video link">
                <Input
                  type="url"
                  value={value.videoLink ?? ""}
                  onChange={(e) => set("videoLink", e.target.value || null)}
                  disabled={!value.videoProvider}
                />
              </Field>

              <div className="space-y-2 sm:col-span-2">
                <Label>Specification PDF</Label>
                <Input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => handleSingleUpload(e.target.files?.[0] ?? null, "document", "pdfSpecUrl")}
                />
                {value.pdfSpecUrl && <p className="text-xs text-muted-foreground">A specification sheet is attached.</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- Variants -------------------------------------------------------- */}
        <TabsContent value="variants">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Colours &amp; options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                        className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${active ? "border-primary ring-2 ring-primary" : ""}`}
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
                          className={`rounded-full border px-3 py-1 text-xs ${active ? "border-primary ring-2 ring-primary" : ""}`}
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
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead>
                      <tr className="border-b text-start text-xs uppercase text-muted-foreground">
                        <th className="py-2 text-start">Variant</th>
                        <th className="py-2 text-start">SKU</th>
                        <th className="py-2 text-start">Price</th>
                        <th className="py-2 text-start">Compare at</th>
                        <th className="py-2 text-start">Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {value.variants.map((variant, index) => (
                        <tr key={variant.sku} className="border-b">
                          <td className="py-2 pe-2">
                            {Object.entries(variant.attributes)
                              .map(([k, v]) => `${k}: ${v}`)
                              .join(", ") || "Default"}
                          </td>
                          <td className="py-2 pe-2">
                            <Input value={variant.sku} onChange={(e) => updateVariant(index, { sku: e.target.value })} />
                          </td>
                          <td className="py-2 pe-2">
                            <Input
                              type="number"
                              min={0}
                              value={variant.price}
                              onChange={(e) => updateVariant(index, { price: Number(e.target.value) })}
                            />
                          </td>
                          <td className="py-2 pe-2">
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
                          </td>
                          <td className="py-2">
                            <Input
                              type="number"
                              min={0}
                              value={variant.stock}
                              onChange={(e) => updateVariant(index, { stock: Number(e.target.value) })}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- Pricing --------------------------------------------------------- */}
        <TabsContent value="pricing">
          <Card>
            <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
              <Field label="Base price" required>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={value.basePrice}
                  onChange={(e) => set("basePrice", Number(e.target.value))}
                  required
                />
              </Field>
              <Field label="Purchase price" hint="Your cost. Used for profit reporting; never shown to shoppers.">
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={value.purchasePrice}
                  onChange={(e) => set("purchasePrice", Number(e.target.value))}
                />
              </Field>
              <Field label="Discount">
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={value.discount}
                  onChange={(e) => set("discount", Number(e.target.value))}
                />
              </Field>
              <Field label="Discount type">
                <NativeSelect
                  value={value.discountType}
                  onChange={(v) => set("discountType", v as "flat" | "percent")}
                  options={[
                    { value: "percent", label: "Percent" },
                    { value: "flat", label: "Flat amount" },
                  ]}
                />
              </Field>
              <Field label="Tax" hint="Leave empty to use the store-wide tax rate.">
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={value.tax ?? ""}
                  onChange={(e) => set("tax", e.target.value === "" ? null : Number(e.target.value))}
                />
              </Field>
              <Field label="Tax type">
                <NativeSelect
                  value={value.taxType}
                  onChange={(v) => set("taxType", v as "flat" | "percent")}
                  options={[
                    { value: "percent", label: "Percent" },
                    { value: "flat", label: "Flat amount" },
                  ]}
                />
              </Field>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- Shipping -------------------------------------------------------- */}
        <TabsContent value="shipping">
          <Card>
            <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
              <Field label="Shipping" hint="Applies when the store runs product-wise shipping.">
                <NativeSelect
                  value={value.shippingType}
                  onChange={(v) => set("shippingType", v as "free" | "flat_rate")}
                  options={[
                    { value: "free", label: "Free shipping" },
                    { value: "flat_rate", label: "Flat rate" },
                  ]}
                />
              </Field>
              <Field label="Shipping cost">
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={value.shippingCost}
                  onChange={(e) => set("shippingCost", Number(e.target.value))}
                  disabled={value.shippingType === "free"}
                />
              </Field>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- SEO ------------------------------------------------------------- */}
        <TabsContent value="seo">
          <Card>
            <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
              <Field label="Meta title" hint="Defaults to the product name when empty.">
                <Input
                  value={value.metaTitle ?? ""}
                  onChange={(e) => set("metaTitle", e.target.value || null)}
                  maxLength={200}
                />
              </Field>
              <Field label="Meta image">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleSingleUpload(e.target.files?.[0] ?? null, "image", "metaImageUrl")}
                />
              </Field>
              <div className="space-y-2 sm:col-span-2">
                <Label>Meta description</Label>
                <Textarea
                  rows={3}
                  maxLength={500}
                  value={value.metaDescription ?? ""}
                  onChange={(e) => set("metaDescription", e.target.value || null)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Button type="submit" disabled={submitting}>
        {submitLabel ?? "Save product"}
      </Button>
    </form>
  );
}

// --- Small local primitives ---------------------------------------------------

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-md border p-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function NativeSelect({
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
    <select
      className="h-10 w-full rounded-md border bg-background px-3 text-sm disabled:opacity-50"
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
    </select>
  );
}

function errorMessage(err: unknown, fallback: string) {
  const response = (err as { response?: { data?: { message?: string } } })?.response;
  return response?.data?.message ?? fallback;
}
