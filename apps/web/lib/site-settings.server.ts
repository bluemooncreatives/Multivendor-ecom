import { cache } from "react";
import { unstable_rethrow } from "next/navigation";
import { emptySiteSettings, type SiteSettings } from "./site-settings";

export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  try {
    const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
    const response = await fetch(`${api}/cms/site-settings`, { next: { revalidate: 60 }, signal: AbortSignal.timeout(3000) });
    if (!response.ok) return emptySiteSettings;
    return await response.json() as SiteSettings;
  } catch (error) { unstable_rethrow(error); return emptySiteSettings; }
});
