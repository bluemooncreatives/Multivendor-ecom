"use client";

import { useEffect, useRef, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { SessionProvider, useSession } from "next-auth/react";
import { Toaster } from "react-hot-toast";
import { api, setAccessToken } from "@/lib/api";
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

// After a Google/Facebook OAuth handshake, auth.ts's jwt callback has already
// exchanged the verified profile for our own JWT pair and attached it to the
// NextAuth session. This picks that up exactly once and folds it into the same
// Zustand store password-login uses, so the rest of the app never needs to know
// whether a session started via password or OAuth.
function SocialSessionSync() {
  const { data: session } = useSession();
  const setSession = useAuthStore((s) => s.setSession);
  const currentAccessToken = useAuthStore((s) => s.accessToken);
  const synced = useRef<string | null>(null);

  useEffect(() => {
    const token = (session as { accessToken?: string; refreshToken?: string } | null)?.accessToken;
    const refreshToken = (session as { refreshToken?: string } | null)?.refreshToken;
    if (!token || token === synced.current || token === currentAccessToken) return;

    synced.current = token;
    setAccessToken(token);
    api
      .get("/auth/me", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setSession(res.data, token, refreshToken ?? null))
      .catch(() => {
        synced.current = null;
      });
  }, [session, currentAccessToken, setSession]);

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
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <QueryClientProvider client={client}>
          <TokenSync />
          <SocialSessionSync />
          {children}
          <Toaster position="top-center" />
        </QueryClientProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
