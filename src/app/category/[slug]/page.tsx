import { CatalogPage } from "@/components/catalog-page";
import { getCategories } from "@/lib/catalog";
import { titleFromSlug } from "@/lib/utils";

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const category = (await getCategories()).find((item) => item.slug === slug); return <CatalogPage title={category?.name || titleFromSlug(slug)} category={slug}/>; }
