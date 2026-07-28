import { useTranslations } from "next-intl";

export function SiteFooter() {
  const t = useTranslations("footer");

  return (
    <footer className="border-t py-8">
      <div className="container flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground md:flex-row">
        <p>{t("copyright", { year: new Date().getFullYear() })}</p>
        <p>{t("tagline")}</p>
      </div>
    </footer>
  );
}
