"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { Facebook, Instagram, Twitter, Youtube, ShieldCheck, RotateCcw, Headphones, UserCheck, Mail, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSubscribeNewsletter } from "@/lib/hooks/useStorefront";
import { useSiteSettings } from "@/lib/site-settings-context";
import { publicAssetUrl } from "@/lib/site-settings";
import { getApiErrorMessage } from "@/lib/utils";

const TRUST_LINKS = [
  { href: "/policies/seller", label: "Seller Policy", icon: ShieldCheck },
  { href: "/policies/return", label: "Return Policy", icon: RotateCcw },
  { href: "/policies/support", label: "Support Policy", icon: Headphones },
  { href: "/dashboard/profile", label: "My Profile", icon: UserCheck },
] as const;

export function SiteFooter() {
  const { general, links } = useSiteSettings();
  const t = useTranslations("footer");
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const subscribe = useSubscribeNewsletter();

  return (
    <footer className="border-t bg-card">
      {/* Policy & quick-trust bar */}
      <div className="border-b bg-muted/30">
        <div className="container grid grid-cols-2 gap-4 py-5 text-sm sm:grid-cols-4">
          {TRUST_LINKS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={`/${locale}${item.href}`}
                className="flex items-center justify-center gap-2 font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                <Icon className="h-4 w-4 text-primary" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="container grid gap-8 py-12 md:grid-cols-4">
        <div className="space-y-4">
          <Link href={`/${locale}`} className="inline-block text-xl font-bold tracking-tight text-primary">
            {publicAssetUrl(general.footerLogoUrl) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={general.footerLogoUrl} alt={general.appName} className="h-10 max-w-40 object-contain" />
            ) : (
              general.appName
            )}
          </Link>
          {general.footerText && <p className="text-sm leading-relaxed text-muted-foreground">{general.footerText}</p>}
          <form
            className="flex gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await subscribe.mutateAsync(email);
                setEmail("");
                toast.success("You're subscribed");
              } catch (err) {
                toast.error(getApiErrorMessage(err, "Could not subscribe"));
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

        <div className="space-y-3 text-sm">
          <h3 className="font-semibold text-foreground">Contact Info</h3>
          <div className="space-y-2 text-muted-foreground">
            {general.address && (
              <p className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary/70" />
                <span>{general.address}</span>
              </p>
            )}
            {general.supportPhone && (
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-primary/70" />
                <span>{general.supportPhone}</span>
              </p>
            )}
            {general.supportEmail && (
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-primary/70" />
                <span>{general.supportEmail}</span>
              </p>
            )}
          </div>
        </div>

        <div className="space-y-3 text-sm">
          <h3 className="font-semibold text-foreground">Useful Links</h3>
          <ul className="space-y-2 text-muted-foreground">
            {links
              .filter((link) => link.placement === "footer")
              .map((link) => (
                <li key={link.id}>
                  <Link href={link.url} className="transition-colors hover:text-primary">
                    {link.label}
                  </Link>
                </li>
              ))}
            <li>
              <Link href={`/${locale}/policies/terms`} className="transition-colors hover:text-primary">
                Terms &amp; Conditions
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/policies/privacy`} className="transition-colors hover:text-primary">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/delivery-info`} className="transition-colors hover:text-primary">
                Delivery Info
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/shipping-info`} className="transition-colors hover:text-primary">
                Shipping Info
              </Link>
            </li>
          </ul>
        </div>

        <div className="space-y-3 text-sm">
          <h3 className="font-semibold text-foreground">My Account</h3>
          <ul className="space-y-2 text-muted-foreground">
            <li>
              <Link href={`/${locale}/dashboard/orders`} className="transition-colors hover:text-primary">
                Order History
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/wishlist`} className="transition-colors hover:text-primary">
                Wishlist
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/dashboard/wallet`} className="transition-colors hover:text-primary">
                Wallet
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/customer-packages`} className="transition-colors hover:text-primary">
                Listing Packages
              </Link>
            </li>
          </ul>
          <Button asChild size="sm" className="mt-2">
            <Link href={`/${locale}/become-seller`}>Become a Seller</Link>
          </Button>
        </div>
      </div>

      <div className="border-t bg-muted/20">
        <div className="container flex flex-col items-center justify-between gap-4 py-4 text-xs text-muted-foreground md:flex-row">
          <p>
            {t("copyright", { year: new Date().getFullYear(), appName: general.appName })}
            {" · "}
            <Link href={`/${locale}/policies/terms`} className="hover:text-primary">
              Terms
            </Link>
            {" · "}
            <Link href={`/${locale}/policies/privacy`} className="hover:text-primary">
              Privacy
            </Link>
          </p>
          <div className="flex items-center gap-3">
            {([
              ["facebook", Facebook],
              ["instagram", Instagram],
              ["twitter", Twitter],
              ["youtube", Youtube],
            ] as const).map(([name, Icon]) => {
              const url = general.socialProfiles?.[name];
              return url && /^https?:\/\//i.test(url) ? (
                <a
                  key={name}
                  href={url}
                  aria-label={name}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-primary"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ) : null;
            })}
          </div>
        </div>
      </div>
    </footer>
  );
}
