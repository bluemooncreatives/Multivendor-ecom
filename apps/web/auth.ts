import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";

// NextAuth here only performs the OAuth handshake (Google/Facebook) — it is
// NOT the app's session mechanism. Once a provider confirms the user's identity,
// the jwt callback exchanges that verified profile for our own JWT access/refresh
// pair via the API's internal-secret-gated /auth/social bridge, and the client
// syncs those tokens into the existing Zustand auth store (see TokenSync /
// SocialSessionSync) — matching the same JWT-based auth used everywhere else.
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Facebook({
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile && (account.provider === "google" || account.provider === "facebook")) {
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
});
