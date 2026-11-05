import { test, expect, PAGES } from "./fixtures";

for (const path of PAGES) {
  test(`${path} renders with valid SEO basics`, async ({ page }) => {
    const response = await page.goto(path);

    expect(response?.status()).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", /.+/);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page).toHaveTitle(/.+/);

    const description = await page.locator('meta[name="description"]').getAttribute("content");
    expect(description?.length).toBeGreaterThan(10);

    // Canonical only on indexable pages (noindex pages such as /playground have none).
    const noindex = /noindex/.test((await page.locator('meta[name="robots"]').getAttribute("content")) ?? "");
    const canonical = page.locator('link[rel="canonical"]');

    if (noindex) {
      await expect(canonical).toHaveCount(0);
    } else {
      await expect(canonical).toHaveAttribute("href", new URL(path, page.url()).toString());
    }

    // Every JSON-LD block must be valid JSON with a schema.org context.
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(blocks.length).toBeGreaterThan(0);

    for (const block of blocks) {
      expect(JSON.parse(block)["@context"]).toBe("https://schema.org");
    }
  });
}

test("playground is noindex", async ({ page }) => {
  await page.goto("/playground");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});

test.describe("missing page", () => {
  test.use({ allowedErrors: [/status of 404/] });

  test("unknown page returns 404 with noindex", async ({ page }) => {
  const response = await page.goto("/this-page-does-not-exist");

  expect(response?.status()).toBe(404);
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});
});

test("trailing slash redirects to the canonical URL", async ({ page }) => {
  await page.goto("/contact/");
  expect(new URL(page.url()).pathname).toBe("/contact");
});

test("robots.txt, sitemap and manifest", async ({ request }) => {
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("Sitemap:");
  expect(robots).toContain("Disallow: /api/");

  const sitemap = await (await request.get("/sitemap-0.xml")).text();
  expect(sitemap).toContain("/contact</loc>");
  expect(sitemap).not.toContain("/playground");
  expect(sitemap).not.toContain("/privacy");

  const manifest = await (await request.get("/site.webmanifest")).json();
  expect(manifest.icons.length).toBeGreaterThan(0);

  for (const icon of ["/favicon.ico", "/icons/icon-192.png", "/icons/icon-512.png", "/icons/apple-touch-icon.png"]) {
    expect((await request.get(icon)).status(), icon).toBe(200);
  }
});

test("#features anchor exists and only the current page is marked in the menu", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#features")).toHaveCount(1);
  await expect(page.locator('#navbar-menu [aria-current="page"]')).toHaveCount(1);
  await expect(page.locator('#navbar-menu [aria-current="page"]')).toHaveAttribute("href", "/");
});
