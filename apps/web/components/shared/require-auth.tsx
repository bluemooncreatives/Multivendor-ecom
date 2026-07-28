"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useAuthStore } from "@/lib/store";

// Client-side route guard: the auth store rehydrates from localStorage after the
// first paint, so we wait one tick before deciding there's no session and redirecting.
type AllowedRole = "seller" | "admin" | "staff";

export function RequireAuth({ children, roles }: { children: React.ReactNode; roles?: AllowedRole[] }) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const locale = useLocale();
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const denied = !!(roles && user && !roles.includes(user.role as AllowedRole));

  useEffect(() => {
    const timeout = setTimeout(() => setChecked(true), 50);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!checked) return;
    if (!accessToken) {
      router.replace(`/${locale}/login`);
    } else if (denied) {
      router.replace(`/${locale}`);
    }
  }, [checked, accessToken, denied, locale, router]);

  if (!accessToken || denied) return null;
  return <>{children}</>;
}
