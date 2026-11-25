"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import toast from "react-hot-toast";
import {
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  ShieldCheck,
  RotateCcw,
  Headphones,
  UserCheck,
  Mail,
  Phone,
  MapPin,
  ArrowRight,
  Heart,
  Truck,
  RefreshCcw,
  Lock,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useSubscribeNewsletter } from "@/lib/hooks/useStorefront";
import { useSiteSettings } from "@/lib/site-settings-context";
import { publicAssetUrl } from "@/lib/site-settings";
import { getApiErrorMessage } from "@/lib/utils";

const TRUST_FEATURES = [
  {
    icon: Truck,
    title: "Free Shipping",
    description: "On orders over ₹999",
  },
  {
    icon: RefreshCcw,
    title: "Easy Returns",
    description: "30-day return policy",
  },
  {
    icon: Lock,
    title: "Secure Payment",
    description: "100% secure checkout",
  },
  {
    icon: MessageCircle,
    title: "24/7 Support",
    description: "Dedicated help center",
  },
] as const;

const SOCIAL_LINKS = [
  { name: "facebook", Icon: Facebook },
  { name: "instagram", Icon: Instagram },
  { name: "twitter", Icon: Twitter },
  { name: "youtube", Icon: Youtube },
] as const;

export function SiteFooter() {
  const { general, links } = useSiteSettings();
  const t = useTranslations("footer");
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const subscribe = useSubscribeNewsletter();

  const footerLinks = links.filter((link) => link.placement === "footer");
  const logoUrl = publicAssetUrl(general.footerLogoUrl);

  return (
    <footer className="relative border-t bg-card">
      {/* ── Trust bar ── */}
      <div className="border-b bg-gradient-to-r from-primary/5 via-primary/3 to-primary/5">
        <div className="container grid grid-cols-2 gap-6 py-8 md:grid-cols-4">
          {TRUST_FEATURES.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-xs">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main footer ── */}
      <div className="container grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
        {/* Brand + newsletter */}
        <div className="space-y-5 lg:col-span-1">
          <Link href={`/${locale}`} className="inline-block">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={general.appName} className="h-10 max-w-[160px] object-contain" />
            ) : (
              <span className="text-2xl font-bold tracking-tight text-primary">
                {general.appName}
              </span>
            )}
          </Link>

          {general.footerText && (
            <p className="text-sm leading-relaxed text-muted-foreground">{general.footerText}</p>
          )}

          {/* Newsletter */}
          <div className="space-y-2">
            <p className="text-sm font-semibold">Subscribe to our newsletter</p>
            <form
              className="flex gap-2"
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await subscribe.mutateAsync(email);
                  setEmail("");
                  toast.success("You're subscribed! 🎉");
                } catch (err) {
                  toast.error(getApiErrorMessage(err, "Could not subscribe"));
                }
              }}
            >
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-10 rounded-xl"
              />
              <Button
                type="submit"
                size="sm"
                disabled={subscribe.isPending}
                className="h-10 rounded-xl px-4"
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
            <p className="text-xs text-muted-foreground">
              Get deals, updates and exclusive offers.
            </p>
          </div>

          {/* Social links */}
          <div className="flex items-center gap-2">
            {SOCIAL_LINKS.map(({ name, Icon }) => {
              const url = general.socialProfiles?.[name];
              return url && /^https?:\/\//i.test(url) ? (
                <a
                  key={name}
                  href={url}
                  aria-label={name}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-xl border bg-background text-muted-foreground transition-all hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ) : null;
            })}
          </div>
        </div>

        {/* Contact */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">
            Contact Us
          </h3>
          <ul className="space-y-3 text-sm text-muted-foreground">
            {general.address && (
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span className="leading-relaxed">{general.address}</span>
              </li>
            )}
            {general.supportPhone && (
              <li>
                <a
                  href={`tel:${general.supportPhone}`}
                  className="flex items-center gap-2.5 transition-colors hover:text-primary"
                >
                  <Phone className="h-4 w-4 shrink-0 text-primary" />
                  {general.supportPhone}
                </a>
              </li>
            )}
            {general.supportEmail && (
              <li>
                <a
                  href={`mailto:${general.supportEmail}`}
                  className="flex items-center gap-2.5 transition-colors hover:text-primary"
                >
                  <Mail className="h-4 w-4 shrink-0 text-primary" />
                  {general.supportEmail}
                </a>
              </li>
            )}
          </ul>
        </div>

        {/* Useful links */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">
            Quick Links
          </h3>
          <ul className="space-y-2.5 text-sm">
            {footerLinks.map((link) => (
              <li key={link.id}>
                <Link
                  href={link.url}
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href={`/${locale}/policies/terms`}
                className="text-muted-foreground transition-colors hover:text-primary"
              >
                Terms & Conditions
              </Link>
            </li>
            <li>
              <Link
                href={`/${locale}/policies/privacy`}
                className="text-muted-foreground transition-colors hover:text-primary"
              >
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link
                href={`/${locale}/delivery-info`}
                className="text-muted-foreground transition-colors hover:text-primary"
              >
                Delivery Info
              </Link>
            </li>
            <li>
              <Link
                href={`/${locale}/shipping-info`}
                className="text-muted-foreground transition-colors hover:text-primary"
              >
                Shipping Info
              </Link>
            </li>
          </ul>
        </div>

        {/* My Account */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">
            My Account
          </h3>
          <ul className="space-y-2.5 text-sm">
            {[
              { href: `/${locale}/dashboard/orders`, label: "Order History" },
              { href: `/${locale}/wishlist`, label: "Wishlist" },
              { href: `/${locale}/dashboard/wallet`, label: "Wallet" },
              { href: `/${locale}/compare`, label: "Compare Products" },
              { href: `/${locale}/track-order`, label: "Track Order" },
              { href: `/${locale}/customer-packages`, label: "Listing Packages" },
            ].map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
          <Button asChild variant="default" size="sm" className="mt-4 w-full rounded-xl">
            <Link href={`/${locale}/become-seller`}>
              <Heart className="h-3.5 w-3.5" />
              Become a Seller
            </Link>
          </Button>
        </div>
      </div>

      {/* ── Policy strip ── */}
      <div className="border-t border-border/40 bg-muted/20">
        <div className="container grid grid-cols-2 gap-3 py-5 text-xs text-muted-foreground sm:grid-cols-4">
          {[
            { href: `/${locale}/policies/seller`, label: "Seller Policy", icon: ShieldCheck },
            { href: `/${locale}/policies/return`, label: "Return Policy", icon: RotateCcw },
            { href: `/${locale}/policies/support`, label: "Support Policy", icon: Headphones },
            { href: `/${locale}/dashboard/profile`, label: "My Profile", icon: UserCheck },
          ].map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center justify-center gap-2 font-medium transition-colors hover:text-primary"
            >
              <Icon className="h-3.5 w-3.5 text-primary" />
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* ── Copyright bar ── */}
      <div className="border-t">
        <div className="container flex flex-col items-center justify-between gap-3 py-5 text-xs text-muted-foreground md:flex-row">
          <p>
            {t("copyright", { year: new Date().getFullYear(), appName: general.appName })}
            {" · "}
            <Link href={`/${locale}/policies/terms`} className="transition-colors hover:text-primary">
              Terms
            </Link>
            {" · "}
            <Link href={`/${locale}/policies/privacy`} className="transition-colors hover:text-primary">
              Privacy
            </Link>
          </p>
          <p className="flex items-center gap-1">
            Made with <Heart className="h-3 w-3 text-primary" /> by {general.appName}
          </p>
        </div>
      </div>
    </footer>
  );
}
