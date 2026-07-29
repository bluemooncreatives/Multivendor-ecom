import type { Metadata } from "next";
import { fetchForMetadata, buildMetadata, notFoundMetadata } from "@/lib/seo";

interface ProductMeta {
  name: string;
  description?: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaImageUrl?: string | null;
  thumbnailUrl?: string | null;
  images?: string[];
  tags?: string[];
  published: boolean;
}

// The page itself is a client component, so metadata is generated here in the
// layout — the route's only server-rendered boundary.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}): Promise<Metadata> {
  const { slug, locale } = await params;
  const product = await fetchForMetadata<ProductMeta>(`/catalog/products/${encodeURIComponent(slug)}`);

  if (!product) return notFoundMetadata("Product not found");

  return buildMetadata({
    // Seller-authored meta fields win; otherwise fall back to the listing itself.
    title: product.metaTitle || product.name,
    description: product.metaDescription || product.description,
    image: product.metaImageUrl || product.thumbnailUrl || product.images?.[0],
    keywords: product.tags,
    path: `/${locale}/product/${slug}`,
    locale,
    type: "product",
  });
}

export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return children;
}
