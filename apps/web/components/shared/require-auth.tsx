"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useAuthStore } from "@/lib/store";

// Client-side route guard: the auth store rehydrates from localStorage after the
// first paint, so we wait one tick before deciding there's no session and redirecting.
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const locale = useLocale();
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setChecked(true), 50);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (checked && !accessToken) {
      router.replace(`/${locale}/login`);
    }
  }, [checked, accessToken, locale, router]);

  if (!accessToken) return null;
  return <>{children}</>;
}
