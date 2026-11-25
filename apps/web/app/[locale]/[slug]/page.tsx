import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { fetchForMetadata, buildMetadata, notFoundMetadata } from "@/lib/seo";

interface CmsPage {
  slug: string;
  title: string;
  body: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string[];
  seoImageUrl?: string | null;
  updatedAt?: string;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}): Promise<Metadata> {
  const { slug, locale } = await params;
  const page = await fetchForMetadata<CmsPage>(`/cms/pages/${encodeURIComponent(slug)}`);

  if (!page) return notFoundMetadata();

  return buildMetadata({
    title: page.seoTitle || page.title,
    description: page.seoDescription,
    image: page.seoImageUrl,
    keywords: page.seoKeywords,
    path: `/${locale}/${slug}`,
    locale,
    type: "article",
  });
}

export default async function CmsPageRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await fetchForMetadata<CmsPage>(`/cms/pages/${encodeURIComponent(slug)}`);

  if (!page) notFound();

  return (
    <div className="container max-w-3xl space-y-4 py-10">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">{page.title}</h1>
        {page.updatedAt && (
          <p className="text-xs text-muted-foreground">
            Last updated {new Date(page.updatedAt).toLocaleDateString()}
          </p>
        )}
      </div>
      <Card>
        <CardContent className="p-6">
          <article
            className="prose prose-sm max-w-none leading-relaxed dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: page.body }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
