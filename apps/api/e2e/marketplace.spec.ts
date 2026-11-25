import { test, expect, type BrowserContext } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
const webRoot = path.resolve(import.meta.dirname, "../../web/app/[locale]");
const API = "http://localhost:4000/api/v1";
const sessions = new Map<string, { user: unknown; accessToken: string; refreshToken: string }>();

async function session(context: BrowserContext, role: string) {
  const cached = sessions.get(role);
  if (cached) {
    await context.addInitScript((state) => localStorage.setItem("auth-store", JSON.stringify({ state, version: 0 })), cached);
    return;
  }
  const login = await context.request.post(`${API}/auth/login`, { data: { email: `${role}@browser.test`, password: "Browser-password-123" } });
  expect(login.ok()).toBeTruthy();
  const tokens = await login.json();
  const me = await (await context.request.get(`${API}/auth/me`, { headers: { Authorization: `Bearer ${tokens.accessToken}` } })).json();
  sessions.set(role, { user: me, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
  await context.addInitScript(({ user, accessToken, refreshToken }) => {
    localStorage.setItem("auth-store", JSON.stringify({ state: { user, accessToken, refreshToken }, version: 0 }));
  }, { user: me, ...tokens });
}

test("customer can sign in through the browser", async ({ page }) => {
  await page.goto("/en/login");
  await page.getByLabel("Email address", { exact: true }).fill("customer@browser.test");
  await page.getByLabel("Password", { exact: true }).fill("Browser-password-123");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/en\/dashboard/);
});

test("review pagination and sanitized CMS content work after hydration", async ({ page }) => {
  await page.goto("/en/product/browser-product");
  await page.getByRole("button", { name: /Reviews/ }).click();
  const more = page.getByRole("button", { name: "Load more reviews" });
  await expect(more).toBeVisible();
  await more.click();
  await expect(more).toBeHidden();
  await expect(page.locator("main p").filter({ hasText: /^Browser review \d+$/ })).toHaveCount(25);
  const comments = await page.locator("main p").filter({ hasText: /^Browser review \d+$/ }).allTextContents();
  expect(new Set(comments).size).toBe(25);
  await expect(page.getByText("Browser review 1", { exact: true })).toBeVisible();
  await page.goto("/en/browser-page");
  await expect(page.getByRole("heading", { name: "Browser CMS content" })).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { cmsUnsafe?: boolean }).cmsUnsafe)).toBeUndefined();
  expect(await page.locator("main [onerror]").count()).toBe(0);
  await page.goto("/en/policies/return");
  await expect(page.getByText("Browser policy content", { exact: true })).toBeVisible();
});

test("POS displays the authoritative quote and records a registered customer's sale", async ({ page, context }) => {
  await session(context, "admin");
  await page.goto("/en/admin/pos");
  await page.getByPlaceholder("Scan a barcode, or type a name or SKU").fill("Browser product");
  await page.getByRole("button", { name: /BROWSER-SKU/ }).click();
  await page.getByPlaceholder("Find by name, phone or email (3+ characters)").fill("customer@browser.test");
  await page.getByRole("button", { name: /Browser customer.*customer@browser.test/ }).click();
  await expect(page.getByRole("button", { name: "Complete sale" })).toBeEnabled();
  await expect(page.getByText("₹82.50", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Complete sale" }).click();
  await expect(page.getByRole("button", { name: "Open last receipt" })).toBeVisible();
});

function pageRoutes(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => entry.isDirectory()
    ? pageRoutes(path.join(directory, entry.name))
    : entry.name === "page.tsx" ? [path.relative(webRoot, directory).replaceAll(path.sep, "/")] : []);
}



for (const route of pageRoutes(webRoot).filter((route) => !route.includes("payment-gateways"))) {
  test(`page hydration: /en/${route}`, async ({ page, context }) => {
    const fixtureProduct = await (await context.request.get(`${API}/catalog/products/browser-product`)).json();
    const role = route.startsWith("admin") ? "admin" : route.startsWith("seller") ? "seller" : "customer";
    if (["admin", "seller", "dashboard"].some((prefix) => route.startsWith(prefix))) await session(context, role);
    const slugs: Record<string, string> = { product: "browser-product", category: "browser-category", store: "browser-shop", "flash-deal": "browser-campaign", classifieds: "browser-classified" };
    const resolved = route.replace("[slug]", slugs[route.split("/")[0]!] ?? "browser-page").replace("[id]", fixtureProduct.id);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const response = await page.goto(`/en/${resolved}`);
    expect(response?.status()).toBe(200);
    await expect(page.locator("body")).not.toContainText("Application error");
    await page.waitForLoadState("networkidle");
    expect(errors).toEqual([]);
  });
}

test("runtime translation overrides reach the storefront", async ({ page }) => {
  test.setTimeout(120000);
  await expect.poll(async () => {
    await page.goto("/en");
    return page.getByRole("link", { name: "Browse test catalogue", exact: true }).count();
  }, { timeout: 90000, intervals: [1000, 2000, 5000] }).toBeGreaterThan(0);
  await expect(page).toHaveTitle("Browser marketplace");
  await expect(page.locator("footer")).not.toContainText("123 Market Street");
  await expect(page.locator("header").getByRole("link", { name: "Browser marketplace", exact: true })).toBeVisible();
  await expect(page.locator("header").getByRole("link", { name: "Browser header link", exact: true })).toBeVisible();
  await expect(page.locator("footer").getByRole("link", { name: "Browser footer link", exact: true })).toBeVisible();
});

for (const locale of ["hi", "ar"]) {
  test(`locale branding and document direction: ${locale}`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`/${locale}`);
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await expect(page.locator("html")).toHaveAttribute("dir", locale === "ar" ? "rtl" : "ltr");
    await expect(page.locator("header").getByRole("link", { name: "Browser marketplace", exact: true })).toBeVisible();
    await expect(page.locator("footer p").filter({ hasText: "©" })).toContainText("Browser marketplace");
    expect(errors).toEqual([]);
  });
}
