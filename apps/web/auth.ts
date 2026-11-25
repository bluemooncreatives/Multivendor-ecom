import NextAuth, { type NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import Twitter from "next-auth/providers/twitter";

const SOCIAL_PROVIDERS = ["google", "facebook", "twitter"] as const;

async function configuredProviders(): Promise<NextAuthConfig["providers"]> {
  try {
    const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
    const response = await fetch(`${api}/auth/social/config`, { cache: "no-store",
      headers: { "x-internal-secret": process.env.INTERNAL_API_SECRET ?? "" }, signal: AbortSignal.timeout(5000) });
    if (!response.ok) return [];
    const config = await response.json() as { id: string; clientId: string; clientSecret: string }[];
    const providers: NextAuthConfig["providers"] = [];
    for (const provider of config) {
      const options = { clientId: provider.clientId, clientSecret: provider.clientSecret };
      if (provider.id === "google") providers.push(Google(options));
      if (provider.id === "facebook") providers.push(Facebook(options));
      if (provider.id === "twitter") providers.push(Twitter(options));
    }
    return providers;
  } catch { return []; }
}

// NextAuth here only performs the OAuth handshake (Google/Facebook) — it is
// NOT the app's session mechanism. Once a provider confirms the user's identity,
// the jwt callback exchanges that verified profile for our own JWT access/refresh
// pair via the API's internal-secret-gated /auth/social bridge, and the client
// syncs those tokens into the existing Zustand auth store (see TokenSync /
// SocialSessionSync) — matching the same JWT-based auth used everywhere else.
export const { handlers, auth, signIn, signOut } = NextAuth(async () => ({
  providers: await configuredProviders(),
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile && (SOCIAL_PROVIDERS as readonly string[]).includes(account.provider)) {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/social`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-internal-secret": process.env.INTERNAL_API_SECRET ?? "",
            },
            body: JSON.stringify({
              provider: account.provider,
              providerId: account.providerAccountId,
              email: profile.email,
              name: profile.name,
              avatarUrl: (profile as { picture?: string }).picture,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            token.accessToken = data.accessToken;
            token.refreshToken = data.refreshToken;
          }
        } catch {
          // Social login bridge unreachable — session proceeds without our JWT;
          // the client-side sync simply won't find tokens and the user stays logged out.
        }
      }
      return token;
    },
    async session({ session, token }) {
      return { ...session, accessToken: token.accessToken, refreshToken: token.refreshToken };
    },
  },
}));
