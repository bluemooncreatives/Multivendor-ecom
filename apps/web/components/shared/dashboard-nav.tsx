"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NavLinkItem {
  href: string;
  label: string;
  icon?: LucideIcon;
  group?: string;
  badge?: string | number;
}

export function DashboardNav({
  basePath,
  links,
  onNavigate,
}: {
  basePath: string;
  links: NavLinkItem[];
  onNavigate?: () => void;
}) {
  const locale = useLocale();
  const pathname = usePathname();

  // Group links preserving insertion order
  const groups: { title?: string; items: NavLinkItem[] }[] = [];
  for (const link of links) {
    const last = groups[groups.length - 1];
    if (!last || last.title !== link.group) {
      groups.push({ title: link.group, items: [link] });
    } else {
      last.items.push(link);
    }
  }

  return (
    <nav className="flex flex-col gap-3" aria-label="Portal navigation">
      {groups.map((group, idx) => (
        <div key={group.title ?? idx} className="space-y-0.5">
          {group.title && (
            <p className="mb-1.5 px-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
              {group.title}
            </p>
          )}
          {group.items.map((link) => {
            const href = `/${locale}${basePath}${link.href}`;
            const active =
              link.href === ""
                ? pathname === href
                : pathname === href || pathname.startsWith(`${href}/`);
            const Icon = link.icon;

            return (
              <Link
                key={href}
                href={href}
                onClick={onNavigate}
                className={cn(
                  "group flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-foreground text-background shadow-sm"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                )}
              >
                {Icon && (
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors",
                      active ? "text-background" : "text-muted-foreground/70 group-hover:text-foreground/80",
                    )}
                  />
                )}
                <span className="flex-1 truncate">{link.label}</span>
                {link.badge !== undefined && (
                  <span
                    className={cn(
                      "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold",
                      active
                        ? "bg-background/20 text-background"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
