"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  ShoppingCart,
  User as UserIcon,
  Heart,
  Menu,
  ChevronRight,
  ChevronDown,
  Scale,
  Store,
  LayoutDashboard,
  ShieldCheck,
  LogOut,
  PackageSearch,
  Grid2X2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SearchBox } from "@/components/storefront/search-box";
import { useAuthStore, useCompareStore } from "@/lib/store";
import { useLogout } from "@/lib/hooks/useAuth";
import { useCart } from "@/lib/hooks/useCart";
import { useCategories } from "@/lib/hooks/useProducts";
import { useWishlist } from "@/lib/hooks/useWishlist";
import { useDisplayCurrency } from "@/lib/hooks/useDisplayCurrency";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { locales } from "@/i18n";
import { useSiteSettings } from "@/lib/site-settings-context";
import { publicAssetUrl } from "@/lib/site-settings";

function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -end-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground shadow-sm">
      {count > 99 ? "99+" : count}
    </span>
  );
}

export function SiteHeader() {
  const { general, links } = useSiteSettings();
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const { data: cart } = useCart();
  const { data: categories } = useCategories();
  const { data: wishlist } = useWishlist();
  const compareIds = useCompareStore((s) => s.productIds);
  const { code: currencyCode, setCode: setCurrencyCode, currencies } = useDisplayCurrency();
  const [menuOpen, setMenuOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  const itemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  const wishlistCount = wishlist?.length ?? 0;
  const topCategories = (categories ?? []).filter((c) => c.level === 0).slice(0, 12);

  function switchLocale(next: string) {
    const rest = pathname.split("/").slice(2).join("/");
    router.push(`/${next}/${rest}`);
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      {/* Top utility bar */}
      <div className="hidden border-b bg-muted/40 md:block">
        <div className="container flex h-9 items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <select
              aria-label="Language"
              className="cursor-pointer bg-transparent text-xs font-medium text-foreground focus:outline-none"
              value={locale}
              onChange={(e) => switchLocale(e.target.value)}
            >
              {locales.map((l) => (
                <option key={l} value={l}>
                  {l.toUpperCase()}
                </option>
              ))}
            </select>
            {currencies.length > 0 && (
              <>
                <span className="text-border">|</span>
                <select
                  aria-label="Currency"
                  className="cursor-pointer bg-transparent text-xs font-medium text-foreground focus:outline-none"
                  value={currencyCode}
                  onChange={(e) => setCurrencyCode(e.target.value)}
                >
                  {currencies.map((c) => (
                    <option key={c.id} value={c.code}>
                      {c.code}
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>

          <div className="flex items-center gap-4">
            {links
              .filter((link) => link.placement === "header")
              .map((link) => (
                <Link key={link.id} href={link.url} className="transition-colors hover:text-primary">
                  {link.label}
                </Link>
              ))}
            <Link href={`/${locale}/become-seller`} className="transition-colors hover:text-primary">
              Become a Seller
            </Link>
            <Link href={`/${locale}/track-order`} className="inline-flex items-center gap-1 transition-colors hover:text-primary">
              <PackageSearch className="h-3.5 w-3.5" />
              Track Order
            </Link>
            {user ? (
              <Link href={`/${locale}/dashboard`} className="font-medium text-foreground transition-colors hover:text-primary">
                My Account
              </Link>
            ) : (
              <>
                <Link href={`/${locale}/login`} className="transition-colors hover:text-primary">
                  Login
                </Link>
                <Link href={`/${locale}/register`} className="font-medium text-primary hover:underline">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main header row */}
      <div className="container flex h-16 items-center gap-3">
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0 md:hidden" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 overflow-y-auto p-5">
            <SheetHeader className="pb-4 text-start">
              <SheetTitle className="text-primary">{general.appName}</SheetTitle>
            </SheetHeader>
            <SearchBox placeholder={t("searchPlaceholder")} className="relative mb-4" />
            <nav className="flex flex-col gap-1 text-sm font-medium">
              <Link href={`/${locale}/products`} onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2 hover:bg-accent">
                {t("shop")}
              </Link>
              <Link href={`/${locale}/categories`} onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2 hover:bg-accent">
                {t("categories")}
              </Link>
              <Link href={`/${locale}/brands`} onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2 hover:bg-accent">
                Brands
              </Link>
              <Link href={`/${locale}/classifieds`} onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2 hover:bg-accent">
                Classifieds
              </Link>
              <Link href={`/${locale}/wishlist`} onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2 hover:bg-accent">
                Wishlist
              </Link>
              <Link href={`/${locale}/compare`} onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2 hover:bg-accent">
                Compare
              </Link>
              <Link href={`/${locale}/track-order`} onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2 hover:bg-accent">
                Track Order
              </Link>
              <Separator className="my-2" />
              {user ? (
                <>
                  <Link href={`/${locale}/dashboard`} onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2 hover:bg-accent">
                    My Account
                  </Link>
                  {user.role === "seller" && (
                    <Link href={`/${locale}/seller`} onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2 hover:bg-accent">
                      Seller Portal
                    </Link>
                  )}
                  {(user.role === "admin" || user.role === "staff") && (
                    <Link href={`/${locale}/admin`} onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2 hover:bg-accent">
                      Admin Portal
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <Link href={`/${locale}/login`} onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2 hover:bg-accent">
                    Login
                  </Link>
                  <Link href={`/${locale}/register`} onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2 text-primary hover:bg-accent">
                    Register
                  </Link>
                </>
              )}
            </nav>
          </SheetContent>
        </Sheet>

        <Link href={`/${locale}`} className="shrink-0 text-xl font-bold tracking-tight text-primary">
          {publicAssetUrl(general.logoUrl) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={general.logoUrl} alt={general.appName} className="h-9 max-w-40 object-contain" />
          ) : (
            general.appName
          )}
        </Link>

        {/* Categories mega-menu popover */}
        <Popover open={categoriesOpen} onOpenChange={setCategoriesOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="hidden shrink-0 gap-1.5 lg:inline-flex">
              <Grid2X2 className="h-4 w-4 text-primary" />
              Categories
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-[540px] p-4">
            <div className="mb-3 flex items-center justify-between border-b pb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Browse Categories
              </span>
              <Link
                href={`/${locale}/categories`}
                className="text-xs font-medium text-primary hover:underline"
                onClick={() => setCategoriesOpen(false)}
              >
                See All
              </Link>
            </div>
            <ul className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {topCategories.map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/${locale}/category/${cat.slug}`}
                    className="flex items-center justify-between rounded-md px-2.5 py-2 text-sm transition-colors hover:bg-accent hover:text-primary"
                    onClick={() => setCategoriesOpen(false)}
                  >
                    <span className="truncate">{cat.name}</span>
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground rtl:rotate-180" />
                  </Link>
                </li>
              ))}
            </ul>
          </PopoverContent>
        </Popover>

        <SearchBox placeholder={t("searchPlaceholder")} className="relative hidden max-w-xl flex-1 md:block" />

        <nav className="ms-auto hidden items-center gap-5 text-sm font-medium lg:flex">
          <Link href={`/${locale}/products`} className="transition-colors hover:text-primary">
            {t("shop")}
          </Link>
          <Link href={`/${locale}/categories`} className="transition-colors hover:text-primary">
            {t("categories")}
          </Link>
          <Link href={`/${locale}/brands`} className="transition-colors hover:text-primary">
            Brands
          </Link>
          <Link href={`/${locale}/classifieds`} className="transition-colors hover:text-primary">
            Classifieds
          </Link>
        </nav>

        <div className="ms-auto flex items-center gap-1 lg:ms-2">
          <ThemeToggle />

          <Button variant="ghost" size="icon" asChild>
            <Link href={`/${locale}/wishlist`} className="relative" aria-label="Wishlist">
              <Heart className="h-5 w-5" />
              <CountBadge count={wishlistCount} />
            </Link>
          </Button>

          <Button variant="ghost" size="icon" asChild>
            <Link href={`/${locale}/compare`} className="relative" aria-label="Compare">
              <Scale className="h-5 w-5" />
              <CountBadge count={compareIds.length} />
            </Link>
          </Button>

          <Button variant="ghost" size="icon" asChild>
            <Link href={`/${locale}/cart`} className="relative" aria-label="Cart">
              <ShoppingCart className="h-5 w-5" />
              <CountBadge count={itemCount} />
            </Link>
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Account menu">
                  <UserIcon className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="truncate text-sm font-medium">{user.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{user.email ?? user.phone}</p>
                    <Badge variant="outline" className="w-fit text-[10px] capitalize">
                      {user.role}
                    </Badge>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={`/${locale}/dashboard`}>
                    <LayoutDashboard className="h-4 w-4" />
                    Customer Dashboard
                  </Link>
                </DropdownMenuItem>
                {user.role === "seller" && (
                  <DropdownMenuItem asChild>
                    <Link href={`/${locale}/seller`}>
                      <Store className="h-4 w-4" />
                      Seller Portal
                    </Link>
                  </DropdownMenuItem>
                )}
                {(user.role === "admin" || user.role === "staff") && (
                  <DropdownMenuItem asChild>
                    <Link href={`/${locale}/admin`}>
                      <ShieldCheck className="h-4 w-4" />
                      Admin Portal
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logout.mutate()} className="text-destructive focus:text-destructive">
                  <LogOut className="h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/${locale}/login`} aria-label="Login">
                <UserIcon className="h-5 w-5" />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
