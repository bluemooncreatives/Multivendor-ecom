"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ShoppingCart, User as UserIcon, Heart, Menu, X, ChevronRight, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchBox } from "@/components/storefront/search-box";
import { useAuthStore, useCompareStore } from "@/lib/store";
import { useCart } from "@/lib/hooks/useCart";
import { useCategories } from "@/lib/hooks/useProducts";
import { useWishlist } from "@/lib/hooks/useWishlist";
import { useDisplayCurrency } from "@/lib/hooks/useDisplayCurrency";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { locales } from "@/i18n";

export function SiteHeader() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data: cart } = useCart();
  const { data: categories } = useCategories();
  const { data: wishlist } = useWishlist();
  const compareIds = useCompareStore((s) => s.productIds);
  const { code: currencyCode, setCode: setCurrencyCode, currencies } = useDisplayCurrency();
  const [menuOpen, setMenuOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  const itemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  const wishlistCount = wishlist?.length ?? 0;
  const topCategories = (categories ?? []).filter((c) => c.level === 0).slice(0, 11);

  function switchLocale(next: string) {
    const rest = pathname.split("/").slice(2).join("/");
    router.push(`/${next}/${rest}`);
  }

  return (
    <header className="sticky top-0 z-40 bg-background shadow-sm">
      {/* Top utility bar */}
      <div className="hidden border-b bg-secondary/40 md:block">
        <div className="container flex h-9 items-center justify-between text-xs text-muted-foreground">
          <select
            aria-label="Language"
            className="bg-transparent text-xs"
            value={locale}
            onChange={(e) => switchLocale(e.target.value)}
          >
            {locales.map((l) => (
              <option key={l} value={l}>
                {l.toUpperCase()}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-4">
            {currencies.length > 0 && (
              <select
                aria-label="Currency"
                className="bg-transparent text-xs"
                value={currencyCode}
                onChange={(e) => setCurrencyCode(e.target.value)}
              >
                {currencies.map((c) => (
                  <option key={c.id} value={c.code}>
                    {c.code}
                  </option>
                ))}
              </select>
            )}
            <Link href={`/${locale}/track-order`} className="hover:text-primary">
              Track Order
            </Link>
            {user ? (
              <Link href={`/${locale}/dashboard`} className="hover:text-primary">
                My Account
              </Link>
            ) : (
              <>
                <Link href={`/${locale}/login`} className="hover:text-primary">
                  Login
                </Link>
                <Link href={`/${locale}/register`} className="hover:text-primary">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main header row */}
      <div className="container flex h-16 items-center gap-3">
        <button
          type="button"
          className="shrink-0 rounded-md p-2 hover:bg-accent md:hidden"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link href={`/${locale}`} className="shrink-0 text-xl font-bold text-primary">
          PHPStore
        </Link>

        <button
          type="button"
          className="hidden shrink-0 items-center gap-1 rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent lg:flex"
          onClick={() => setCategoriesOpen((v) => !v)}
        >
          <Menu className="h-4 w-4" />
          Categories
        </button>

        <SearchBox placeholder={t("searchPlaceholder")} className="relative hidden max-w-xl flex-1 md:block" />

        <nav className="ms-auto hidden gap-4 text-sm font-medium lg:flex">
          <Link href={`/${locale}/products`}>{t("shop")}</Link>
          <Link href={`/${locale}/categories`}>{t("categories")}</Link>
          <Link href={`/${locale}/brands`}>Brands</Link>
        </nav>

        <ThemeToggle />

        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${locale}/wishlist`} className="relative">
            <Heart className="h-5 w-5" />
            {wishlistCount > 0 && (
              <span className="absolute -end-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                {wishlistCount}
              </span>
            )}
          </Link>
        </Button>

        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${locale}/compare`} className="relative">
            <Scale className="h-5 w-5" />
            {compareIds.length > 0 && (
              <span className="absolute -end-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                {compareIds.length}
              </span>
            )}
          </Link>
        </Button>

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

      {/* Category mega-menu flyout */}
      {categoriesOpen && (
        <div className="border-t bg-background shadow-md">
          <div className="container py-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Categories</span>
              <Link
                href={`/${locale}/categories`}
                className="text-sm text-primary hover:underline"
                onClick={() => setCategoriesOpen(false)}
              >
                See All
              </Link>
            </div>
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {topCategories.map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/${locale}/category/${cat.slug}`}
                    className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-accent hover:text-primary"
                    onClick={() => setCategoriesOpen(false)}
                  >
                    {cat.name}
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Mobile slide-out menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMenuOpen(false)} />
          <div className="absolute inset-y-0 start-0 w-72 overflow-y-auto bg-background p-4 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-lg font-bold text-primary">PHPStore</span>
              <button type="button" onClick={() => setMenuOpen(false)} aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            <SearchBox placeholder={t("searchPlaceholder")} className="relative mb-4" />
            <nav className="flex flex-col gap-1 text-sm font-medium">
              <Link href={`/${locale}/products`} onClick={() => setMenuOpen(false)} className="rounded-md px-2 py-2 hover:bg-accent">
                {t("shop")}
              </Link>
              <Link href={`/${locale}/categories`} onClick={() => setMenuOpen(false)} className="rounded-md px-2 py-2 hover:bg-accent">
                {t("categories")}
              </Link>
              <Link href={`/${locale}/brands`} onClick={() => setMenuOpen(false)} className="rounded-md px-2 py-2 hover:bg-accent">
                Brands
              </Link>
              <Link href={`/${locale}/wishlist`} onClick={() => setMenuOpen(false)} className="rounded-md px-2 py-2 hover:bg-accent">
                Wishlist
              </Link>
              <Link href={`/${locale}/track-order`} onClick={() => setMenuOpen(false)} className="rounded-md px-2 py-2 hover:bg-accent">
                Track Order
              </Link>
              {user ? (
                <Link href={`/${locale}/dashboard`} onClick={() => setMenuOpen(false)} className="rounded-md px-2 py-2 hover:bg-accent">
                  My Account
                </Link>
              ) : (
                <>
                  <Link href={`/${locale}/login`} onClick={() => setMenuOpen(false)} className="rounded-md px-2 py-2 hover:bg-accent">
                    Login
                  </Link>
                  <Link href={`/${locale}/register`} onClick={() => setMenuOpen(false)} className="rounded-md px-2 py-2 hover:bg-accent">
                    Register
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
