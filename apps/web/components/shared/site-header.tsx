"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ShoppingCart, User as UserIcon, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/lib/store";
import { useCart } from "@/lib/hooks/useCart";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { locales } from "@/i18n";

export function SiteHeader() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data: cart } = useCart();
  const itemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  function switchLocale(next: string) {
    const rest = pathname.split("/").slice(2).join("/");
    router.push(`/${next}/${rest}`);
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="container flex h-16 items-center gap-4">
        <Link href={`/${locale}`} className="text-lg font-bold shrink-0">
          PHPStore
        </Link>

        <nav className="hidden gap-4 text-sm font-medium md:flex">
          <Link href={`/${locale}/products`}>{t("shop")}</Link>
          <Link href={`/${locale}/categories`}>{t("categories")}</Link>
          <Link href={`/${locale}/deals`}>{t("deals")}</Link>
        </nav>

        <form
          className="relative ms-auto hidden max-w-sm flex-1 md:block"
          onSubmit={(e) => {
            e.preventDefault();
            const q = new FormData(e.currentTarget).get("q");
            router.push(`/${locale}/products?q=${encodeURIComponent(String(q ?? ""))}`);
          }}
        >
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input name="q" placeholder={t("searchPlaceholder")} className="ps-9" />
        </form>

        <select
          aria-label="Language"
          className="ms-auto rounded-md border bg-background px-2 py-1 text-sm md:ms-0"
          value={locale}
          onChange={(e) => switchLocale(e.target.value)}
        >
          {locales.map((l) => (
            <option key={l} value={l}>
              {l.toUpperCase()}
            </option>
          ))}
        </select>

        <ThemeToggle />

        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${locale}/cart`} className="relative">
            <ShoppingCart className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute -end-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                {itemCount}
              </span>
            )}
          </Link>
        </Button>

        <Button variant="ghost" size="icon" asChild>
          <Link href={user ? `/${locale}/dashboard` : `/${locale}/login`}>
            <UserIcon className="h-5 w-5" />
          </Link>
        </Button>
      </div>
    </header>
  );
}
