import path from "node:path";
import { config } from "dotenv";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// The monorepo keeps a single shared .env at the workspace root (apps/api loads
// it the same way) — Next.js only auto-loads .env files from its own app
// directory, so without this, NEXTAUTH_SECRET/GOOGLE_CLIENT_SECRET/
// INTERNAL_API_SECRET etc. would silently be undefined at runtime.
config({ path: path.resolve(__dirname, "../../.env") });

const withNextIntl = createNextIntlPlugin("./i18n.ts");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "**.s3.amazonaws.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default withNextIntl(nextConfig);
