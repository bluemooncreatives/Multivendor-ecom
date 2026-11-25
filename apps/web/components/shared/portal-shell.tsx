"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { Menu, ArrowLeft, ShieldCheck, Store, User as UserIcon } from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { DashboardNav, type NavLinkItem } from "@/components/shared/dashboard-nav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

interface PortalShellProps {
  title: string;
  basePath: string;
  links: NavLinkItem[];
  children: ReactNode;
}

/** Shared responsive sidebar + mobile sheet shell for Customer, Seller, and Admin portals. */
export function PortalShell({ title, basePath, links, children }: PortalShellProps) {
  const [open, setOpen] = useState(false);
  const locale = useLocale();
  const user = useAuthStore((s) => s.user);

  const RoleIcon = basePath === "/admin" ? ShieldCheck : basePath === "/seller" ? Store : UserIcon;
  const initials = (user?.name ?? "U")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const sidebarContent = (onNavigate?: () => void) => (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
      <div className="flex shrink-0 items-center gap-3 rounded-xl border bg-card p-3 shadow-sm">
        <Avatar className="h-9 w-9">
          <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{user?.name ?? "Account"}</p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <RoleIcon className="h-3 w-3 text-primary" />
            <span className="capitalize">{user?.role ?? title}</span>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pe-1">
        <DashboardNav basePath={basePath} links={links} onNavigate={onNavigate} />
      </div>

      <div className="shrink-0 space-y-2">
        <Separator />
        <Button variant="ghost" size="sm" asChild className="w-full justify-start text-muted-foreground">
          <Link href={`/${locale}`} onClick={onNavigate}>
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            Back to storefront
          </Link>
        </Button>
      </div>
    </div>
  );

  return (
    <div className="container py-6 lg:py-8">
      {/* Mobile portal header */}
      <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3 shadow-sm md:hidden">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <RoleIcon className="h-3 w-3" />
            {title}
          </Badge>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm">
              <Menu className="h-4 w-4" />
              Menu
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex h-full w-72 flex-col gap-3 overflow-hidden p-4">
            <SheetHeader className="shrink-0 pb-1">
              <SheetTitle>{title}</SheetTitle>
            </SheetHeader>
            {sidebarContent(() => setOpen(false))}
          </SheetContent>
        </Sheet>
      </div>

      <div className="grid gap-8 md:grid-cols-[240px_1fr] lg:grid-cols-[260px_1fr]">
        <aside className="hidden md:block">
          <div className="sticky top-28 flex max-h-[calc(100vh-8rem)] flex-col overflow-hidden">
            {sidebarContent()}
          </div>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
