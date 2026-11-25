"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import {
  useAdminSliders,
  useCreateSlider,
  useUpdateSlider,
  useDeleteSlider,
  useAdminBanners,
  useCreateBanner,
  useUpdateBanner,
  useDeleteBanner,
  useAdminHomeCategories,
  useCreateHomeCategory,
  useDeleteHomeCategory,
  useToggleTopCategory,
  useToggleTopBrand,
} from "@/lib/hooks/useAdminCatalogExtras";
import { useCategories, useBrands } from "@/lib/hooks/useProducts";
import { useUploadFile } from "@/lib/hooks/useCatalogForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/shared/page-header";
import { FormField } from "@/components/shared/form-field";
import { getApiErrorMessage } from "@/lib/utils";

export default function AdminHomepagePage() {
  const { data: sliders } = useAdminSliders();
  const createSlider = useCreateSlider();
  const updateSlider = useUpdateSlider();
  const deleteSlider = useDeleteSlider();
  const { data: banners } = useAdminBanners();
  const createBanner = useCreateBanner();
  const updateBanner = useUpdateBanner();
  const deleteBanner = useDeleteBanner();
  const upload = useUploadFile();
  const { data: homeCategories } = useAdminHomeCategories();
  const createHomeCategory = useCreateHomeCategory();
  const deleteHomeCategory = useDeleteHomeCategory();
  const { data: categories } = useCategories();
  const { data: brands } = useBrands();
  const toggleTopCategory = useToggleTopCategory();
  const toggleTopBrand = useToggleTopBrand();

  const [sliderUrl, setSliderUrl] = useState("");
  const [sliderLink, setSliderLink] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [bannerLink, setBannerLink] = useState("");
  const [bannerPlacement, setBannerPlacement] = useState("home_top");
  const [homeCategoryId, setHomeCategoryId] = useState("");

  async function uploadInto(file: File | null, set: (url: string) => void) {
    if (!file) return;
    try {
      const stored = await upload.mutateAsync({ file, kind: "image" });
      set(stored.url);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Upload failed"));
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Homepage builder" description="Curate storefront hero sliders, promotional banners, and top strips." />

      <Card>
        <CardHeader className="border-b bg-muted/20 pb-3.5">
          <CardTitle className="text-base">Hero sliders</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-5">
          <form
            className="grid gap-3 sm:grid-cols-3"
            onSubmit={(e) => {
              e.preventDefault();
              createSlider.mutate({ imageUrl: sliderUrl, linkUrl: sliderLink || undefined });
              setSliderUrl("");
              setSliderLink("");
            }}
          >
            <FormField label="Image">
              <Input type="file" accept="image/*" onChange={(e) => uploadInto(e.target.files?.[0] ?? null, setSliderUrl)} />
            </FormField>
            <FormField label="Links to">
              <Input placeholder="https://…" value={sliderLink} onChange={(e) => setSliderLink(e.target.value)} />
            </FormField>
            <div className="flex items-end">
              <Button type="submit" disabled={!sliderUrl || createSlider.isPending}>
                Add slide
              </Button>
            </div>
            {sliderUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={sliderUrl} alt="" className="h-16 w-auto rounded-md border object-contain sm:col-span-3" />
            )}
          </form>
          <div className="space-y-2">
            {sliders?.map((s) => (
              <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm">
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.imageUrl} alt="" className="h-10 w-16 rounded object-cover" />
                  <span className="truncate text-xs text-muted-foreground">{s.linkUrl ?? "No link"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Published</span>
                    <Switch checked={s.active} onCheckedChange={(v) => updateSlider.mutate({ id: s.id, active: v })} />
                  </label>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => deleteSlider.mutate(s.id)}>
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b bg-muted/20 pb-3.5">
          <CardTitle className="text-base">Banners</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-5">
          <form
            className="grid gap-3 sm:grid-cols-4"
            onSubmit={(e) => {
              e.preventDefault();
              createBanner.mutate({ imageUrl: bannerUrl, linkUrl: bannerLink || undefined, placement: bannerPlacement });
              setBannerUrl("");
              setBannerLink("");
            }}
          >
            <FormField label="Image">
              <Input type="file" accept="image/*" onChange={(e) => uploadInto(e.target.files?.[0] ?? null, setBannerUrl)} />
            </FormField>
            <FormField label="Links to">
              <Input placeholder="https://…" value={bannerLink} onChange={(e) => setBannerLink(e.target.value)} />
            </FormField>
            <FormField label="Position">
              <NativeSelect value={bannerPlacement} onChange={(e) => setBannerPlacement(e.target.value)}>
                <option value="home_top">Home banner 1 (top)</option>
                <option value="home_middle">Home banner 2 (middle)</option>
                <option value="category">Category page</option>
                <option value="checkout">Checkout</option>
              </NativeSelect>
            </FormField>
            <div className="flex items-end">
              <Button type="submit" disabled={!bannerUrl || createBanner.isPending}>
                Add banner
              </Button>
            </div>
            {bannerUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={bannerUrl} alt="" className="h-16 w-auto rounded-md border object-contain sm:col-span-4" />
            )}
          </form>
          <div className="space-y-2">
            {banners?.map((b) => (
              <div key={b.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm">
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={b.imageUrl} alt="" className="h-10 w-16 rounded object-cover" />
                  <Badge variant="outline">{b.placement}</Badge>
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Published</span>
                    <Switch checked={b.active} onCheckedChange={(v) => updateBanner.mutate({ id: b.id, active: v })} />
                  </label>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => deleteBanner.mutate(b.id)}>
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b bg-muted/20 pb-3.5">
          <CardTitle className="text-base">Homepage category showcase</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-5">
          <p className="text-sm text-muted-foreground">
            Up to three categories appear in this section ({homeCategories?.length ?? 0} of 3 used).
          </p>
          <form
            className="flex gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await createHomeCategory.mutateAsync({ categoryId: homeCategoryId });
                setHomeCategoryId("");
              } catch (err) {
                toast.error(getApiErrorMessage(err, "Could not add that category"));
              }
            }}
          >
            <div className="flex-1">
              <NativeSelect value={homeCategoryId} onChange={(e) => setHomeCategoryId(e.target.value)} required>
                <option value="">Select category</option>
                {categories?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <Button type="submit" disabled={createHomeCategory.isPending}>
              Add
            </Button>
          </form>
          <div className="space-y-2">
            {homeCategories?.map((hc: { id: string; categoryId?: { name?: string } }) => (
              <div key={hc.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                <span className="font-medium">{hc.categoryId?.name}</span>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => deleteHomeCategory.mutate(hc.id)}>
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b bg-muted/20 pb-3.5">
          <CardTitle className="text-base">Top 10 categories &amp; brands</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 pt-5">
          <p className="text-sm text-muted-foreground">
            Click to feature or unfeature. Each strip shows at most ten, so unfeature one before adding an eleventh.
          </p>
          <div className="space-y-2">
            <p className="text-sm font-semibold">
              Categories ({categories?.filter((c) => (c as { featured?: boolean }).featured).length ?? 0} of 10)
            </p>
            <div className="flex flex-wrap gap-2">
              {categories?.map((c) => {
                const featured = Boolean((c as { featured?: boolean }).featured);
                return (
                  <Badge
                    key={c.id}
                    variant={featured ? "default" : "outline"}
                    className="cursor-pointer py-1"
                    onClick={async () => {
                      try {
                        await toggleTopCategory.mutateAsync({ id: c.id, featured: !featured });
                      } catch (err) {
                        toast.error(getApiErrorMessage(err, "Could not update"));
                      }
                    }}
                  >
                    {c.name}
                  </Badge>
                );
              })}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold">
              Brands ({brands?.filter((b) => (b as { featured?: boolean }).featured).length ?? 0} of 10)
            </p>
            <div className="flex flex-wrap gap-2">
              {brands?.map((b) => {
                const featured = Boolean((b as { featured?: boolean }).featured);
                return (
                  <Badge
                    key={b.id}
                    variant={featured ? "default" : "outline"}
                    className="cursor-pointer py-1"
                    onClick={async () => {
                      try {
                        await toggleTopBrand.mutateAsync({ id: b.id, featured: !featured });
                      } catch (err) {
                        toast.error(getApiErrorMessage(err, "Could not update"));
                      }
                    }}
                  >
                    {b.name}
                  </Badge>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
