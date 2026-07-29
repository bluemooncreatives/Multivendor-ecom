import type { Metadata } from "next";
import { fetchForMetadata, buildMetadata, notFoundMetadata } from "@/lib/seo";

interface FlashDealMeta {
  title: string;
  bannerUrl?: string;
  endsAt: string;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}): Promise<Metadata> {
  const { slug, locale } = await params;
  const deal = await fetchForMetadata<FlashDealMeta>(`/flash-deals/slug/${encodeURIComponent(slug)}`, 60);

  if (!deal) return notFoundMetadata("Flash deal not found");

  return buildMetadata({
    title: deal.title,
    description: `Limited-time offers, ending ${new Date(deal.endsAt).toLocaleDateString()}.`,
    image: deal.bannerUrl,
    path: `/${locale}/flash-deal/${slug}`,
    locale,
  });
}

export default function FlashDealLayout({ children }: { children: React.ReactNode }) {
  return children;
}
