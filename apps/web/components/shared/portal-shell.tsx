"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import {
  Menu,
  ArrowLeft,
  ShieldCheck,
  Store,
  User as UserIcon,
  X,
  Home,
} from "lucide-react";
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

  const RoleIcon =
    basePath === "/admin" ? ShieldCheck : basePath === "/seller" ? Store : UserIcon;

  const initials = (user?.name ?? "U")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const toneClass =
    basePath === "/admin"
      ? "from-purple-600 to-purple-800"
      : basePath === "/seller"
        ? "from-primary to-orange-600"
        : "from-info to-blue-700";

  const SidebarInner = ({ onNavigate }: { onNavigate?: () => void }) => (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
      {/* User card */}
      <div className="relative shrink-0 overflow-hidden rounded-2xl">
        <div className={`bg-gradient-to-br ${toneClass} p-4 text-white`}>
          <div className="flex items-center gap-3">
            <Avatar className="h-11 w-11 ring-2 ring-white/30">
              <AvatarFallback className="bg-white/20 text-sm font-black text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{user?.name ?? "Account"}</p>
              <p className="truncate text-xs opacity-80">{user?.email ?? user?.phone}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <RoleIcon className="h-3.5 w-3.5 opacity-80" />
            <Badge className="rounded-full bg-white/20 px-2 py-0 text-[10px] font-bold capitalize text-white hover:bg-white/30">
              {user?.role ?? title}
            </Badge>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div className="min-h-0 flex-1 overflow-y-auto pe-0.5">
        <DashboardNav basePath={basePath} links={links} onNavigate={onNavigate} />
      </div>

      {/* Footer */}
      <div className="shrink-0 space-y-1">
        <Separator className="mb-2" />
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="w-full justify-start gap-2 rounded-xl text-muted-foreground hover:text-foreground"
        >
          <Link href={`/${locale}`} onClick={onNavigate}>
            <Home className="h-4 w-4" />
            Back to storefront
          </Link>
        </Button>
      </div>
    </div>
  );

  return (
    <div className="container py-6 lg:py-8">
      {/* Mobile header */}
      <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl border bg-card px-4 py-3 shadow-xs md:hidden">
        <div className="flex items-center gap-2">
          <div className={`flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br ${toneClass} text-white`}>
            <RoleIcon className="h-4 w-4" />
          </div>
          <span className="font-bold text-foreground">{title}</span>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="rounded-xl">
              <Menu className="h-4 w-4" />
              Menu
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex h-full w-72 flex-col gap-3 overflow-hidden p-4">
            <SheetHeader className="shrink-0">
              <div className="flex items-center justify-between">
                <SheetTitle className="font-bold">{title}</SheetTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </SheetHeader>
            <SidebarInner onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop layout */}
      <div className="grid gap-7 md:grid-cols-[256px_1fr] lg:grid-cols-[272px_1fr]">
        <aside className="hidden md:block">
          <div className="sticky top-28 flex max-h-[calc(100vh-9rem)] flex-col overflow-hidden rounded-2xl border bg-card p-3 shadow-xs">
            <SidebarInner />
          </div>
        </aside>
        <main className="min-w-0 animate-fade-in">{children}</main>
      </div>
    </div>
  );
}
