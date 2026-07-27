"use client";

import Link from "next/link";
import { useCart } from "@/components/cart-provider";
import { Icon } from "@/components/icon";
import { usePreferences } from "@/components/preferences-provider";
import type { SessionUser } from "@/lib/types";

export function Header({ user, classifiedEnabled = false }: { user: SessionUser | null; classifiedEnabled?: boolean }) {
  const { count } = useCart();
  const preferences = usePreferences();
  const t = preferences.translate;
  return <>
    <div className="announcement"><span>{t("Support local businesses. Shop from verified sellers across India.")}</span><div className="preference-controls"><label><span className="sr-only">Language</span><select aria-label="Language" disabled={preferences.busy} value={preferences.language.code} onChange={(event)=>preferences.changeLanguage(event.target.value)}>{preferences.languages.map((language)=><option value={language.code} key={language.code}>{language.name}</option>)}</select></label><label><span className="sr-only">Currency</span><select aria-label="Currency" disabled={preferences.busy} value={preferences.currency.code} onChange={(event)=>preferences.changeCurrency(event.target.value)}>{preferences.currencies.map((currency)=><option value={currency.code} key={currency.code}>{currency.code === "Rupee" ? "INR" : currency.code} ({currency.symbol})</option>)}</select></label><Link href="/seller/register">{t("Sell on V4Local")}</Link></div></div>
    <header className="site-header">
      <div className="header-inner">
        <Link href="/" className="brand" aria-label="V4Local home"><span className="brand-mark">V4</span><span>local<small>Vocal for local</small></span></Link>
        <form className="search-form" action="/search"><Icon name="search" /><input name="q" placeholder={t("Search products, brands and shops")} aria-label={t("Search products")} /><button>{t("Search")}</button></form>
        <nav className="header-actions" aria-label="Account actions">
          <Link href={user ? (user.role === "admin" || user.role === "staff" ? "/admin" : user.role === "seller" ? "/seller/dashboard" : "/dashboard") : "/login"}><Icon name="user" /><span>{user ? user.name.split(" ")[0] : t("Sign in")}</span></Link>
          <Link href="/wishlists"><Icon name="heart" /><span>{t("Wishlist")}</span></Link>
          <Link href="/cart" className="cart-link"><Icon name="bag" /><span>{t("Cart")}</span>{count > 0 && <b>{count}</b>}</Link>
        </nav>
      </div>
      <div className="main-nav"><div className="nav-inner"><Link href="/categories"><Icon name="grid"/> {t("All categories")}</Link><Link href="/products">{t("All products")}</Link><Link href="/products?deal=1">{t("Today's deals")}</Link><Link href="/brands">{t("Brands")}</Link><Link href="/shops">{t("Local shops")}</Link>{classifiedEnabled&&<Link href="/customer-products">{t("Classified ads")}</Link>}<Link href="/track_your_order">{t("Track order")}</Link></div></div>
    </header>
  </>;
}
