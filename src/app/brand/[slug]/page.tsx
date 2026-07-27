import { CatalogPage } from "@/components/catalog-page";
import { getBrands } from "@/lib/catalog";
import { titleFromSlug } from "@/lib/utils";

export default async function BrandPage({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const brand = (await getBrands()).find((item) => item.slug === slug); return <CatalogPage title={brand?.name || titleFromSlug(slug)} brand={slug}/>; }
