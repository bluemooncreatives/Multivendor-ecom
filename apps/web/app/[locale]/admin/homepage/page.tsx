"use client";

import { useState } from "react";
import {
  useAdminSliders,
  useCreateSlider,
  useDeleteSlider,
  useAdminBanners,
  useCreateBanner,
  useDeleteBanner,
  useAdminHomeCategories,
  useCreateHomeCategory,
  useDeleteHomeCategory,
  useToggleTopCategory,
  useToggleTopBrand,
} from "@/lib/hooks/useAdminCatalogExtras";
import { useCategories, useBrands } from "@/lib/hooks/useProducts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function AdminHomepagePage() {
  const { data: sliders } = useAdminSliders();
  const createSlider = useCreateSlider();
  const deleteSlider = useDeleteSlider();
  const { data: banners } = useAdminBanners();
  const createBanner = useCreateBanner();
  const deleteBanner = useDeleteBanner();
  const { data: homeCategories } = useAdminHomeCategories();
  const createHomeCategory = useCreateHomeCategory();
  const deleteHomeCategory = useDeleteHomeCategory();
  const { data: categories } = useCategories();
  const { data: brands } = useBrands();
  const toggleTopCategory = useToggleTopCategory();
  const toggleTopBrand = useToggleTopBrand();

  const [sliderUrl, setSliderUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [bannerPlacement, setBannerPlacement] = useState("home_top");
  const [homeCategoryId, setHomeCategoryId] = useState("");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Homepage builder</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hero sliders</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              createSlider.mutate({ imageUrl: sliderUrl });
              setSliderUrl("");
            }}
          >
            <Input placeholder="Image URL" value={sliderUrl} onChange={(e) => setSliderUrl(e.target.value)} required />
            <Button type="submit" disabled={createSlider.isPending}>
              Add
            </Button>
          </form>
          <div className="space-y-1">
            {sliders?.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-md border p-2 text-sm">
                <span className="truncate">{s.imageUrl}</span>
                <Button variant="ghost" size="sm" onClick={() => deleteSlider.mutate(s.id)}>
                  Remove
                </Button>
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
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              createBanner.mutate({ imageUrl: bannerUrl, placement: bannerPlacement });
              setBannerUrl("");
            }}
          >
            <Input placeholder="Image URL" value={bannerUrl} onChange={(e) => setBannerUrl(e.target.value)} required />
            <select
              className="h-10 rounded-md border bg-background px-3 text-sm"
              value={bannerPlacement}
              onChange={(e) => setBannerPlacement(e.target.value)}
            >
              <option value="home_top">Home top</option>
              <option value="home_middle">Home middle</option>
              <option value="category">Category page</option>
              <option value="checkout">Checkout</option>
            </select>
            <Button type="submit" disabled={createBanner.isPending}>
              Add
            </Button>
          </form>
          <div className="space-y-1">
            {banners?.map((b) => (
              <div key={b.id} className="flex items-center justify-between rounded-md border p-2 text-sm">
                <span className="truncate">
                  [{b.placement}] {b.imageUrl}
                </span>
                <Button variant="ghost" size="sm" onClick={() => deleteBanner.mutate(b.id)}>
                  Remove
                </Button>
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
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              createHomeCategory.mutate({ categoryId: homeCategoryId });
              setHomeCategoryId("");
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
          <CardTitle className="text-base">Top 10 categories & brands</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium">Categories</p>
            <div className="flex flex-wrap gap-2">
              {categories?.map((c) => (
                <Badge
                  key={c.id}
                  variant={(c as any).featured ? "secondary" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleTopCategory.mutate({ id: c.id, featured: !(c as any).featured })}
                >
                  {c.name}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">Brands</p>
            <div className="flex flex-wrap gap-2">
              {brands?.map((b) => (
                <Badge
                  key={b.id}
                  variant={(b as any).featured ? "secondary" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleTopBrand.mutate({ id: b.id, featured: !(b as any).featured })}
                >
                  {b.name}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
