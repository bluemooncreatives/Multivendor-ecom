import type { Metadata } from "next";
import { fetchForMetadata, buildMetadata, notFoundMetadata } from "@/lib/seo";

interface CategoryMeta {
  id: string;
  name: string;
  slug: string;
  bannerUrl?: string;
  iconUrl?: string;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}): Promise<Metadata> {
  const { slug, locale } = await params;

  // There is no by-slug category endpoint, so resolve from the (small, cached)
  // category list rather than adding a round trip per request.
  const data = await fetchForMetadata<{ items: CategoryMeta[] }>("/catalog/categories", 3600);
  const category = data?.items.find((c) => c.slug === slug);

  if (!category) return notFoundMetadata("Category not found");

  return buildMetadata({
    title: category.name,
    description: `Shop ${category.name}. Browse the full range and compare prices across sellers.`,
    image: category.bannerUrl || category.iconUrl,
    path: `/${locale}/category/${slug}`,
    locale,
  });
}

export default function CategoryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
