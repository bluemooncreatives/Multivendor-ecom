"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
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
  Search,
  Bell,
  Sparkles,
  Tag,
  Zap,
  X,
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { cn } from "@/lib/utils";

function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -end-1.5 -top-1.5 flex h-5 min-w-5 animate-bounce-in items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground shadow-colored shadow-sm ring-2 ring-background">
      {count > 99 ? "99+" : count}
    </span>
  );
}

function NavIcon({
  href,
  label,
  icon: Icon,
  count,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  count?: number;
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      asChild
      className="relative h-10 w-10 rounded-xl hover:bg-accent"
    >
      <Link href={href} aria-label={label}>
        <Icon className="h-5 w-5" />
        {count !== undefined && <CountBadge count={count} />}
      </Link>
    </Button>
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
  const [scrolled, setScrolled] = useState(false);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const itemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  const wishlistCount = wishlist?.length ?? 0;
  const topCategories = (categories ?? []).filter((c) => c.level === 0).slice(0, 15);

  const userInitials = (user?.name ?? "U")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function switchLocale(next: string) {
    const rest = pathname.split("/").slice(2).join("/");
    router.push(`/${next}/${rest}`);
  }

  const logoUrl = publicAssetUrl(general.logoUrl);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "border-b bg-background/95 backdrop-blur-xl shadow-sm"
          : "border-b border-transparent bg-background/80 backdrop-blur-md",
      )}
    >
      {/* ── Top utility strip ── */}
      <div className="hidden border-b border-border/60 bg-muted/40 md:block">
        <div className="container flex h-9 items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            {/* Language selector */}
            <select
              aria-label="Language"
              className="cursor-pointer bg-transparent text-xs font-medium text-foreground transition-colors hover:text-primary focus:outline-none"
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
                  className="cursor-pointer bg-transparent text-xs font-medium text-foreground transition-colors hover:text-primary focus:outline-none"
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

            <span className="text-border">|</span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <Sparkles className="h-3 w-3 text-primary" />
              Free shipping on orders over ₹999
            </span>
          </div>

          <div className="flex items-center gap-5">
            {links
              .filter((link) => link.placement === "header")
              .map((link) => (
                <Link
                  key={link.id}
                  href={link.url}
                  className="transition-colors hover:text-primary"
                >
                  {link.label}
                </Link>
              ))}
            <Link
              href={`/${locale}/become-seller`}
              className="flex items-center gap-1 font-medium text-primary transition-colors hover:text-primary/80"
            >
              <Store className="h-3 w-3" />
              Become a Seller
            </Link>
            <Link
              href={`/${locale}/track-order`}
              className="flex items-center gap-1 transition-colors hover:text-primary"
            >
              <PackageSearch className="h-3 w-3" />
              Track Order
            </Link>
            {user ? (
              <Link
                href={`/${locale}/dashboard`}
                className="font-medium text-foreground transition-colors hover:text-primary"
              >
                My Account
              </Link>
            ) : (
              <>
                <Link href={`/${locale}/login`} className="transition-colors hover:text-primary">
                  Login
                </Link>
                <Link
                  href={`/${locale}/register`}
                  className="font-semibold text-primary hover:underline"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Main header ── */}
      <div className="container">
        <div className="flex h-[68px] items-center gap-3">
          {/* Mobile menu trigger */}
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 rounded-xl md:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex w-80 flex-col gap-0 overflow-hidden p-0">
              <SheetHeader className="border-b p-5">
                <div className="flex items-center justify-between">
                  <SheetTitle className="text-lg font-bold text-primary">
                    {general.appName}
                  </SheetTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setMenuOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto p-4">
                <SearchBox
                  placeholder={t("searchPlaceholder")}
                  className="relative mb-4"
                />

                <nav className="flex flex-col gap-1">
                  {[
                    { href: `/${locale}/products`, label: t("shop"), icon: Tag },
                    { href: `/${locale}/categories`, label: t("categories"), icon: Grid2X2 },
                    { href: `/${locale}/brands`, label: "Brands", icon: Sparkles },
                    { href: `/${locale}/classifieds`, label: "Classifieds", icon: PackageSearch },
                    { href: `/${locale}/wishlist`, label: "Wishlist", icon: Heart },
                    { href: `/${locale}/compare`, label: "Compare", icon: Scale },
                    { href: `/${locale}/track-order`, label: "Track Order", icon: PackageSearch },
                  ].map(({ href, label, icon: Icon }) => (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent hover:text-foreground"
                    >
                      <Icon className="h-4 w-4 text-primary" />
                      {label}
                    </Link>
                  ))}
                </nav>

                <Separator className="my-4" />

                {user ? (
                  <nav className="flex flex-col gap-1">
                    <Link
                      href={`/${locale}/dashboard`}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
                    >
                      <LayoutDashboard className="h-4 w-4 text-primary" />
                      My Account
                    </Link>
                    {user.role === "seller" && (
                      <Link
                        href={`/${locale}/seller`}
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
                      >
                        <Store className="h-4 w-4 text-primary" />
                        Seller Portal
                      </Link>
                    )}
                    {(user.role === "admin" || user.role === "staff") && (
                      <Link
                        href={`/${locale}/admin`}
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
                      >
                        <ShieldCheck className="h-4 w-4 text-primary" />
                        Admin Portal
                      </Link>
                    )}
                    <button
                      onClick={() => { logout.mutate(); setMenuOpen(false); }}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </nav>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Button asChild variant="default" className="w-full">
                      <Link href={`/${locale}/login`} onClick={() => setMenuOpen(false)}>
                        Sign In
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full">
                      <Link href={`/${locale}/register`} onClick={() => setMenuOpen(false)}>
                        Create Account
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <Link
            href={`/${locale}`}
            className="shrink-0 font-bold tracking-tight text-primary"
          >
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={general.appName}
                width={160}
                height={40}
                className="h-9 w-auto object-contain"
                priority
              />
            ) : (
              <span className="text-xl">{general.appName}</span>
            )}
          </Link>

          {/* Categories mega menu — desktop */}
          <div className="relative hidden lg:block">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-border/70 font-medium"
              onClick={() => setCategoryMenuOpen(!categoryMenuOpen)}
            >
              <Grid2X2 className="h-4 w-4" />
              Categories
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 text-muted-foreground transition-transform duration-200",
                  categoryMenuOpen && "rotate-180",
                )}
              />
            </Button>

            {categoryMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setCategoryMenuOpen(false)}
                />
                <div className="absolute start-0 top-[calc(100%+8px)] z-50 w-[600px] animate-zoom-in rounded-2xl border bg-popover p-4 shadow-xl">
                  <div className="mb-3 flex items-center justify-between border-b pb-3">
                    <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      Browse All Categories
                    </span>
                    <Link
                      href={`/${locale}/categories`}
                      className="text-xs font-semibold text-primary hover:underline"
                      onClick={() => setCategoryMenuOpen(false)}
                    >
                      View All →
                    </Link>
                  </div>
                  <ul className="grid grid-cols-3 gap-1">
                    {topCategories.map((cat) => (
                      <li key={cat.id}>
                        <Link
                          href={`/${locale}/category/${cat.slug}`}
                          className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-all hover:bg-accent hover:text-primary"
                          onClick={() => setCategoryMenuOpen(false)}
                        >
                          <span className="truncate font-medium">{cat.name}</span>
                          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60 rtl:rotate-180" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>

          {/* Search box — desktop */}
          <SearchBox
            placeholder={t("searchPlaceholder")}
            className="relative hidden max-w-2xl flex-1 md:block"
          />

          {/* Nav links */}
          <nav className="ms-auto hidden items-center gap-1 lg:flex">
            {[
              { href: `/${locale}/products`, label: t("shop") },
              { href: `/${locale}/brands`, label: "Brands" },
              { href: `/${locale}/classifieds`, label: "Classifieds" },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "rounded-xl px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-primary",
                  pathname.startsWith(href) && "text-primary",
                )}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Action icons */}
          <div className="ms-auto flex items-center gap-1 lg:ms-2">
            {/* Mobile search */}
            <Button
              variant="ghost"
              size="icon"
              className="relative h-10 w-10 rounded-xl hover:bg-accent md:hidden"
              onClick={() => setSearchOpen(!searchOpen)}
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </Button>

            <ThemeToggle />

            <NavIcon
              href={`/${locale}/wishlist`}
              label="Wishlist"
              icon={Heart}
              count={wishlistCount}
            />

            <NavIcon
              href={`/${locale}/compare`}
              label="Compare"
              icon={Scale}
              count={compareIds.length}
            />

            {/* Cart */}
            <Button
              variant="ghost"
              asChild
              className="relative h-10 w-10 rounded-xl hover:bg-accent"
              size="icon"
            >
              <Link href={`/${locale}/cart`} aria-label="Cart">
                <ShoppingCart className="h-5 w-5" />
                <CountBadge count={itemCount} />
              </Link>
            </Button>

            {/* User menu */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-10 w-10 rounded-xl hover:bg-accent"
                    aria-label="Account menu"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60 rounded-2xl p-2 shadow-xl">
                  <DropdownMenuLabel className="rounded-xl bg-muted/50 p-3 font-normal">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary/10 text-sm font-bold text-primary">
                          {userInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{user.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {user.email ?? user.phone}
                        </p>
                        <Badge variant="outline" className="mt-1 h-4 px-1.5 text-[10px] capitalize">
                          {user.role}
                        </Badge>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="my-1" />
                  <DropdownMenuItem asChild className="cursor-pointer rounded-xl px-3 py-2.5">
                    <Link href={`/${locale}/dashboard`}>
                      <LayoutDashboard className="h-4 w-4 text-primary" />
                      Customer Dashboard
                    </Link>
                  </DropdownMenuItem>
                  {user.role === "seller" && (
                    <DropdownMenuItem asChild className="cursor-pointer rounded-xl px-3 py-2.5">
                      <Link href={`/${locale}/seller`}>
                        <Store className="h-4 w-4 text-primary" />
                        Seller Portal
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {(user.role === "admin" || user.role === "staff") && (
                    <DropdownMenuItem asChild className="cursor-pointer rounded-xl px-3 py-2.5">
                      <Link href={`/${locale}/admin`}>
                        <ShieldCheck className="h-4 w-4 text-primary" />
                        Admin Portal
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="my-1" />
                  <DropdownMenuItem
                    onClick={() => logout.mutate()}
                    className="cursor-pointer rounded-xl px-3 py-2.5 text-destructive focus:bg-destructive/10 focus:text-destructive"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild variant="default" size="sm" className="ml-1 rounded-xl">
                <Link href={`/${locale}/login`}>
                  <UserIcon className="h-4 w-4" />
                  Sign In
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Mobile search bar (expandable) */}
        {searchOpen && (
          <div className="animate-fade-in border-t pb-3 pt-3 md:hidden">
            <SearchBox placeholder={t("searchPlaceholder")} className="relative w-full" />
          </div>
        )}
      </div>

      {/* ── Promo strip ── */}
      <div className="hidden border-t border-border/40 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 md:block">
        <div className="container flex h-9 items-center gap-6 overflow-x-auto text-xs">
          <Link
            href={`/${locale}/products`}
            className="flex shrink-0 items-center gap-1.5 font-medium transition-colors hover:text-primary"
          >
            {t("shop")}
          </Link>
          <Link
            href={`/${locale}/categories`}
            className="flex shrink-0 items-center gap-1.5 font-medium transition-colors hover:text-primary"
          >
            {t("categories")}
          </Link>
          <Link
            href={`/${locale}/brands`}
            className="flex shrink-0 items-center gap-1.5 font-medium transition-colors hover:text-primary"
          >
            Brands
          </Link>
          <Link
            href={`/${locale}/delivery-info`}
            className="flex shrink-0 items-center gap-1.5 transition-colors hover:text-primary"
          >
            Delivery Info
          </Link>
          <Link
            href={`/${locale}/policies/return`}
            className="flex shrink-0 items-center gap-1.5 transition-colors hover:text-primary"
          >
            Returns
          </Link>
          <div className="ms-auto flex shrink-0 items-center gap-1.5 font-medium text-primary">
            <Zap className="h-3 w-3" />
            Flash Deals Live
          </div>
        </div>
      </div>
    </header>
  );
}
