"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Facebook, Instagram, Twitter, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SiteFooter() {
  const t = useTranslations("footer");
  const locale = useLocale();

  return (
    <footer className="border-t bg-secondary/30">
      {/* Quick-link bar */}
      <div className="border-b bg-background">
        <div className="container grid grid-cols-2 gap-4 py-4 text-sm sm:grid-cols-4">
          <Link href={`/${locale}/policies/seller`} className="text-center hover:text-primary">
            Seller Policy
          </Link>
          <Link href={`/${locale}/policies/return`} className="text-center hover:text-primary">
            Return Policy
          </Link>
          <Link href={`/${locale}/policies/support`} className="text-center hover:text-primary">
            Support Policy
          </Link>
          <Link href={`/${locale}/dashboard/profile`} className="text-center hover:text-primary">
            My Profile
          </Link>
        </div>
      </div>

      <div className="container grid gap-8 py-10 md:grid-cols-4">
        <div className="space-y-3">
          <span className="text-xl font-bold text-primary">PHPStore</span>
          <p className="text-sm text-muted-foreground">{t("tagline")}</p>
          <form
            className="flex gap-2"
            onSubmit={(e) => e.preventDefault()}
          >
            <Input type="email" placeholder="Your email" required />
            <Button type="submit">Subscribe</Button>
          </form>
        </div>

        <div className="space-y-2 text-sm">
          <h3 className="font-semibold">Contact Info</h3>
          <p className="text-muted-foreground">123 Market Street, New Delhi, India</p>
          <p className="text-muted-foreground">+91 98765 43210</p>
          <p className="text-muted-foreground">support@phpstore.example</p>
        </div>

        <div className="space-y-2 text-sm">
          <h3 className="font-semibold">Useful Links</h3>
          <ul className="space-y-1 text-muted-foreground">
            <li><Link href={`/${locale}/policies/terms`} className="hover:text-primary">Terms &amp; Conditions</Link></li>
            <li><Link href={`/${locale}/policies/privacy`} className="hover:text-primary">Privacy Policy</Link></li>
            <li><Link href={`/${locale}/delivery-info`} className="hover:text-primary">Delivery Info</Link></li>
            <li><Link href={`/${locale}/shipping-info`} className="hover:text-primary">Shipping Info</Link></li>
          </ul>
        </div>

        <div className="space-y-2 text-sm">
          <h3 className="font-semibold">My Account</h3>
          <ul className="space-y-1 text-muted-foreground">
            <li><Link href={`/${locale}/dashboard/orders`} className="hover:text-primary">Order History</Link></li>
            <li><Link href={`/${locale}/wishlist`} className="hover:text-primary">Wishlist</Link></li>
            <li><Link href={`/${locale}/dashboard/wallet`} className="hover:text-primary">Wallet</Link></li>
          </ul>
          <Link href={`/${locale}/become-seller`}>
            <Button size="sm" className="mt-2">Become a Seller</Button>
          </Link>
        </div>
      </div>

      <div className="border-t">
        <div className="container flex flex-col items-center justify-between gap-4 py-4 text-sm text-muted-foreground md:flex-row">
          <p>
            {t("copyright", { year: new Date().getFullYear() })}
            {" · "}
            <Link href={`/${locale}/policies/terms`} className="hover:text-primary">Terms</Link>
            {" · "}
            <Link href={`/${locale}/policies/privacy`} className="hover:text-primary">Privacy</Link>
          </p>
          <div className="flex items-center gap-3">
            <Facebook className="h-4 w-4" />
            <Instagram className="h-4 w-4" />
            <Twitter className="h-4 w-4" />
            <Youtube className="h-4 w-4" />
          </div>
        </div>
      </div>
    </footer>
  );
}
