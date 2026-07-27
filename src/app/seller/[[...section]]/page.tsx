import { WorkspacePage } from "@/components/workspace-page";
export default async function SellerPage({ params, searchParams }: { params: Promise<{ section?: string[] }>; searchParams: Promise<{ q?: string }> }) { const [{ section }, { q }] = await Promise.all([params, searchParams]); return <WorkspacePage workspace="seller" path={section?.join("/") || "dashboard"} search={q || ""} /> }
