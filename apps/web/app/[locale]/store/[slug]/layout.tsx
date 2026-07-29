import type { Metadata } from "next";
import { fetchForMetadata, buildMetadata, notFoundMetadata } from "@/lib/seo";

interface ShopMeta {
  name: string;
  description?: string;
  logoUrl?: string;
  bannerUrl?: string;
  verified: boolean;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}): Promise<Metadata> {
  const { slug, locale } = await params;
  const shop = await fetchForMetadata<ShopMeta>(`/seller/shops/${encodeURIComponent(slug)}`);

  if (!shop) return notFoundMetadata("Store not found");

  return buildMetadata({
    title: shop.name,
    description: shop.description || `Browse everything ${shop.name} has for sale.`,
    image: shop.bannerUrl || shop.logoUrl,
    path: `/${locale}/store/${slug}`,
    locale,
    // Unverified storefronts stay out of search results until they are approved.
    noIndex: !shop.verified,
  });
}

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return children;
}
