import { defineConfig } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";
const apiRoot = path.resolve(import.meta.dirname, "..");
const root = path.resolve(apiRoot, "../..");

export default defineConfig({
  testDir: import.meta.dirname, testMatch: "**/*.spec.ts", workers: 1, fullyParallel: false,
  timeout: 60000, expect: { timeout: 15000 },
  reporter: [["list"], ["json", { outputFile: path.join(root, "docs/migration/browser-results.json") }]],
  outputDir: path.join(apiRoot, ".browser-results"),
  use: { baseURL: "http://localhost:3000", browserName: "chromium", headless: true, trace: "retain-on-failure",
    channel: process.env.PLAYWRIGHT_CHANNEL ?? (fs.existsSync("C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe") ? "msedge" : undefined) },
  webServer: [
    { command: "node --import tsx e2e/fixture.ts", cwd: apiRoot, stdout: "pipe", url: "http://localhost:4000/api/v1/health", timeout: 480000, reuseExistingServer: false },
    { command: "npm run start -w apps/web -- --port 3000", cwd: root, url: "http://localhost:3000/en", timeout: 120000, reuseExistingServer: false,
      env: { NEXT_PUBLIC_API_URL: "http://localhost:4000/api/v1", NEXT_PUBLIC_APP_URL: "http://localhost:3000", INTERNAL_API_SECRET: "browser-internal-secret-only", AUTH_SECRET: "browser-nextauth-secret-only", AUTH_TRUST_HOST: "true" } },
  ],
});
