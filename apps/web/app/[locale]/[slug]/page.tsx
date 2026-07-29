import type { Metadata } from "next";
import { notFound } from "next/navigation";
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

/**
 * Catch-all for admin-authored CMS pages, restoring the legacy `/{slug}` route.
 *
 * This must remain the *last* segment matcher under [locale]: Next resolves
 * static segments (/cart, /checkout, …) before a dynamic one, so those keep
 * working, but any new fixed route has to be a real directory rather than
 * relying on this to dispatch it.
 */
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

  // An unknown slug is a genuine 404 rather than an empty page — this route is
  // the last matcher, so anything reaching it and missing does not exist.
  if (!page) notFound();

  return (
    <div className="container max-w-3xl space-y-4 py-10">
      <h1 className="text-2xl font-bold">{page.title}</h1>
      {page.updatedAt && (
        <p className="text-xs text-muted-foreground">
          Last updated {new Date(page.updatedAt).toLocaleDateString()}
        </p>
      )}
      {/*
        Body is authored by staff through the admin CMS, not by the public, so it
        is trusted markup. It is rendered as HTML to preserve the formatting the
        editor produced; anyone able to write here can already change the site.
      */}
      <article
        className="prose prose-sm max-w-none rounded-lg bg-card p-6 leading-relaxed shadow-sm dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: page.body }}
      />
    </div>
  );
}
