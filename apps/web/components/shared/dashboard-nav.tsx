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

  // Preserve insertion order of groups for sectioned sidebars (e.g. Admin).
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
    <nav className="flex flex-col gap-4" aria-label="Portal navigation">
      {groups.map((group, idx) => (
        <div key={group.title ?? idx} className="space-y-1">
          {group.title && (
            <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
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
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                {Icon && <Icon className={cn("h-4 w-4 shrink-0", active && "text-primary")} />}
                <span className="truncate">{link.label}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
