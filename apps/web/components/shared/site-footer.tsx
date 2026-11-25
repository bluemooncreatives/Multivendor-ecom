"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { Facebook, Instagram, Twitter, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSubscribeNewsletter } from "@/lib/hooks/useStorefront";
import { useSiteSettings } from "@/lib/site-settings-context";
import { publicAssetUrl } from "@/lib/site-settings";

export function SiteFooter() {
  const { general, links } = useSiteSettings();
  const t = useTranslations("footer");
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const subscribe = useSubscribeNewsletter();

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
          <span className="text-xl font-bold text-primary">{publicAssetUrl(general.footerLogoUrl) ? <img src={general.footerLogoUrl} alt={general.appName} className="h-10 max-w-40 object-contain" /> : general.appName}</span>
          {general.footerText && <p className="text-sm text-muted-foreground">{general.footerText}</p>}
          <form
            className="flex gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await subscribe.mutateAsync(email);
                setEmail("");
                toast.success("You're subscribed");
              } catch (err) {
                const response = (err as { response?: { data?: { message?: string } } })?.response;
                toast.error(response?.data?.message ?? "Could not subscribe");
              }
            }}
          >
            <Input
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button type="submit" disabled={subscribe.isPending}>
              Subscribe
            </Button>
          </form>
        </div>

        <div className="space-y-2 text-sm">
          <h3 className="font-semibold">Contact Info</h3>
          {general.address && <p className="text-muted-foreground">{general.address}</p>}
          {general.supportPhone && <p className="text-muted-foreground">{general.supportPhone}</p>}
          {general.supportEmail && <p className="text-muted-foreground">{general.supportEmail}</p>}
        </div>

        <div className="space-y-2 text-sm">
          <h3 className="font-semibold">Useful Links</h3>
          <ul className="space-y-1 text-muted-foreground">
            {links.filter((link) => link.placement === "footer").map((link) => <li key={link.id}><Link href={link.url} className="hover:text-primary">{link.label}</Link></li>)}
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
            {t("copyright", { year: new Date().getFullYear(), appName: general.appName })}
            {" · "}
            <Link href={`/${locale}/policies/terms`} className="hover:text-primary">Terms</Link>
            {" · "}
            <Link href={`/${locale}/policies/privacy`} className="hover:text-primary">Privacy</Link>
          </p>
          <div className="flex items-center gap-3">
            {([["facebook", Facebook], ["instagram", Instagram], ["twitter", Twitter], ["youtube", Youtube]] as const).map(([name, Icon]) => {
              const url = general.socialProfiles?.[name];
              return url && /^https?:\/\//i.test(url) ? <a key={name} href={url} aria-label={name} target="_blank" rel="noopener noreferrer"><Icon className="h-4 w-4" /></a> : null;
            })}
          </div>
        </div>
      </div>
    </footer>
  );
}
