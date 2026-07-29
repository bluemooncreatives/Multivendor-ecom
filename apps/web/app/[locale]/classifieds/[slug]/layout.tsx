import type { Metadata } from "next";
import { fetchForMetadata, buildMetadata, notFoundMetadata } from "@/lib/seo";

interface ClassifiedMeta {
  title: string;
  description?: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaImageUrl?: string | null;
  images?: string[];
  tags?: string[];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}): Promise<Metadata> {
  const { slug, locale } = await params;
  const item = await fetchForMetadata<ClassifiedMeta>(`/addons/classifieds/slug/${encodeURIComponent(slug)}`);

  if (!item) return notFoundMetadata("Listing not found");

  return buildMetadata({
    title: item.metaTitle || item.title,
    description: item.metaDescription || item.description,
    image: item.metaImageUrl || item.images?.[0],
    keywords: item.tags,
    path: `/${locale}/classifieds/${slug}`,
    locale,
    type: "article",
  });
}

export default function ClassifiedLayout({ children }: { children: React.ReactNode }) {
  return children;
}
