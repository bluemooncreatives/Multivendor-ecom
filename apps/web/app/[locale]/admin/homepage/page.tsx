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
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

function apiError(err: unknown, fallback: string) {
  return (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? fallback;
}

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

  // Uploads go through the shared endpoint and set the pending image URL, so an
  // admin can pick a file instead of having to host it somewhere first.
  async function uploadInto(file: File | null, set: (url: string) => void) {
    if (!file) return;
    try {
      const stored = await upload.mutateAsync({ file, kind: "image" });
      set(stored.url);
    } catch (err) {
      toast.error(apiError(err, "Upload failed"));
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Homepage builder</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hero sliders</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <form
            className="grid gap-3 sm:grid-cols-3"
            onSubmit={(e) => {
              e.preventDefault();
              createSlider.mutate({ imageUrl: sliderUrl, linkUrl: sliderLink || undefined });
              setSliderUrl("");
              setSliderLink("");
            }}
          >
            <div className="space-y-1">
              <Label>Image</Label>
              <Input type="file" accept="image/*" onChange={(e) => uploadInto(e.target.files?.[0] ?? null, setSliderUrl)} />
            </div>
            <div className="space-y-1">
              <Label>Links to</Label>
              <Input placeholder="https://…" value={sliderLink} onChange={(e) => setSliderLink(e.target.value)} />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={!sliderUrl || createSlider.isPending}>
                Add slide
              </Button>
            </div>
            {sliderUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={sliderUrl} alt="" className="h-16 w-auto rounded border object-contain sm:col-span-3" />
            )}
          </form>
          <div className="space-y-1">
            {sliders?.map((s) => (
              <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-2 text-sm">
                <div className="flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.imageUrl} alt="" className="h-10 w-16 rounded object-cover" />
                  <span className="truncate text-xs text-muted-foreground">{s.linkUrl ?? "No link"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Published</span>
                    <Switch checked={s.active} onCheckedChange={(v) => updateSlider.mutate({ id: s.id, active: v })} />
                  </label>
                  <Button variant="ghost" size="sm" onClick={() => deleteSlider.mutate(s.id)}>
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Banners</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <form
            className="grid gap-3 sm:grid-cols-4"
            onSubmit={(e) => {
              e.preventDefault();
              createBanner.mutate({ imageUrl: bannerUrl, linkUrl: bannerLink || undefined, placement: bannerPlacement });
              setBannerUrl("");
              setBannerLink("");
            }}
          >
            <div className="space-y-1">
              <Label>Image</Label>
              <Input type="file" accept="image/*" onChange={(e) => uploadInto(e.target.files?.[0] ?? null, setBannerUrl)} />
            </div>
            <div className="space-y-1">
              <Label>Links to</Label>
              <Input placeholder="https://…" value={bannerLink} onChange={(e) => setBannerLink(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Position</Label>
              <select
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={bannerPlacement}
                onChange={(e) => setBannerPlacement(e.target.value)}
              >
                <option value="home_top">Home banner 1 (top)</option>
                <option value="home_middle">Home banner 2 (middle)</option>
                <option value="category">Category page</option>
                <option value="checkout">Checkout</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={!bannerUrl || createBanner.isPending}>
                Add banner
              </Button>
            </div>
            {bannerUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={bannerUrl} alt="" className="h-16 w-auto rounded border object-contain sm:col-span-4" />
            )}
          </form>
          <div className="space-y-1">
            {banners?.map((b) => (
              <div key={b.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-2 text-sm">
                <div className="flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={b.imageUrl} alt="" className="h-10 w-16 rounded object-cover" />
                  <Badge variant="outline">{b.placement}</Badge>
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Published</span>
                    <Switch checked={b.active} onCheckedChange={(v) => updateBanner.mutate({ id: b.id, active: v })} />
                  </label>
                  <Button variant="ghost" size="sm" onClick={() => deleteBanner.mutate(b.id)}>
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Homepage category showcase</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
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
                toast.error(apiError(err, "Could not add that category"));
              }
            }}
          >
            <select
              className="h-10 flex-1 rounded-md border bg-background px-3 text-sm"
              value={homeCategoryId}
              onChange={(e) => setHomeCategoryId(e.target.value)}
              required
            >
              <option value="">Select category</option>
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <Button type="submit" disabled={createHomeCategory.isPending}>
              Add
            </Button>
          </form>
          <div className="space-y-1">
            {homeCategories?.map((hc: any) => (
              <div key={hc.id} className="flex items-center justify-between rounded-md border p-2 text-sm">
                <span>{hc.categoryId?.name}</span>
                <Button variant="ghost" size="sm" onClick={() => deleteHomeCategory.mutate(hc.id)}>
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top 10 categories &amp; brands</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Click to feature or unfeature. Each strip shows at most ten, so unfeature one before adding an eleventh.
          </p>
          <div>
            <p className="mb-2 text-sm font-medium">
              Categories ({categories?.filter((c) => (c as { featured?: boolean }).featured).length ?? 0} of 10)
            </p>
            <div className="flex flex-wrap gap-2">
              {categories?.map((c) => {
                const featured = Boolean((c as { featured?: boolean }).featured);
                return (
                  <Badge
                    key={c.id}
                    variant={featured ? "secondary" : "outline"}
                    className="cursor-pointer"
                    onClick={async () => {
                      try {
                        await toggleTopCategory.mutateAsync({ id: c.id, featured: !featured });
                      } catch (err) {
                        toast.error(apiError(err, "Could not update"));
                      }
                    }}
                  >
                    {c.name}
                  </Badge>
                );
              })}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">
              Brands ({brands?.filter((b) => (b as { featured?: boolean }).featured).length ?? 0} of 10)
            </p>
            <div className="flex flex-wrap gap-2">
              {brands?.map((b) => {
                const featured = Boolean((b as { featured?: boolean }).featured);
                return (
                  <Badge
                    key={b.id}
                    variant={featured ? "secondary" : "outline"}
                    className="cursor-pointer"
                    onClick={async () => {
                      try {
                        await toggleTopBrand.mutateAsync({ id: b.id, featured: !featured });
                      } catch (err) {
                        toast.error(apiError(err, "Could not update"));
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
