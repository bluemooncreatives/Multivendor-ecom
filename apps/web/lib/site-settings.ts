export interface SiteSettings {
  general: {
    appName: string; defaultCurrency?: string; logoUrl?: string; footerLogoUrl?: string; faviconUrl?: string;
    address?: string; footerText?: string; supportEmail?: string; supportPhone?: string;
    socialProfiles?: Partial<Record<"facebook" | "instagram" | "twitter" | "youtube" | "linkedin", string>>;
  };
  seo: { metaTitle?: string; metaDescription?: string; metaKeywords?: string[]; metaImageUrl?: string; author?: string };
  links: { id: string; label: string; url: string; placement: "header" | "footer"; order: number }[];
}

export const emptySiteSettings: SiteSettings = { general: { appName: "Marketplace", defaultCurrency: "INR" }, seo: {}, links: [] };

export function publicAssetUrl(url?: string) {
  return url && ((url.startsWith("/") && !url.startsWith("//")) || /^https?:\/\//i.test(url)) ? url : undefined;
}
