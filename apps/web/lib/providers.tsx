"use client";

import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "react-hot-toast";
import { setAccessToken } from "@/lib/api";
import { useAuthStore } from "@/lib/store";

// The Zustand auth store persists accessToken to localStorage, but the axios
// instance keeps its own in-memory copy (never localStorage, to avoid an XSS
// payload trivially reading it back out) — this keeps the two in sync on every
// load and after login/logout, since the in-memory copy resets on full reload.
function TokenSync() {
  const accessToken = useAuthStore((s) => s.accessToken);
  useEffect(() => {
    setAccessToken(accessToken);
  }, [accessToken]);
  return null;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
      }),
  );

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={client}>
        <TokenSync />
        {children}
        <Toaster position="top-center" />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
