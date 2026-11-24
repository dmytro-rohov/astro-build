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

    // Canonical only on indexable pages (noindex pages such as /contact/sent have none).
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

test("contact result pages are noindex", async ({ page }) => {
  await page.goto("/contact/sent");
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
  expect(sitemap).not.toContain("/contact/sent");
  expect(sitemap).not.toContain("/privacy");
  // v3.12: the home page as in its canonical link, lastmod from the posts' dates.
  expect(sitemap).toMatch(/<loc>https?:\/\/[^<]+\/<\/loc>/);
  expect(sitemap).toMatch(/\/blog\/why-fast-pages-win<\/loc><lastmod>2026-11-12/);

  const manifest = await (await request.get("/site.webmanifest")).json();
  expect(manifest.icons.length).toBeGreaterThan(0);

  for (const icon of ["/favicon.ico", "/icons/icon-192.png", "/icons/icon-512.png", "/icons/apple-touch-icon.png"]) {
    expect((await request.get(icon)).status(), icon).toBe(200);
  }
});

test("Open Graph image is served", async ({ page, request }) => {
  await page.goto("/");
  const url = await page.locator('meta[property="og:image"]').getAttribute("content");
  const response = await request.get(new URL(url!).pathname);

  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toMatch(/^image\//);
});

test("#features anchor exists and only the current page is marked in the menu", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#features")).toHaveCount(1);
  await expect(page.locator('#navbar-menu [aria-current="page"]')).toHaveCount(1);
  await expect(page.locator('#navbar-menu [aria-current="page"]')).toHaveAttribute("href", "/");
});

test("factory signature: source comment, generator, humans.txt and the secret footer mark", async ({ page, request }) => {
  const response = await page.goto("/");
  const html = (await response?.text()) ?? "";
  expect(html).toMatch(/<!--\n\n {2}┏┳┓/);
  await expect(page.locator('meta[name="generator"]').first()).toHaveAttribute("content", /^Mytko Website Factory \d+\.\d+\.\d+$/);
  await expect(page.locator('link[rel="author"]')).toHaveAttribute("href", "/humans.txt");

  const humans = await request.get("/humans.txt");
  expect(humans.status()).toBe(200);
  expect(humans.headers()["content-type"]).toContain("text/plain");
  expect(await humans.text()).toContain("Mytko Website Factory");

  const card = page.locator("#factory-signature");
  await expect(card).toBeHidden();
  await page.locator(".factory-credit__mark").click();
  await expect(card).toBeVisible();
  await expect(card.locator(".factory-signature__link")).toHaveAttribute("href", "https://factory.mytko.dev");
  await card.locator(".factory-signature__close").click();
  await expect(card).toBeHidden();
});

test("blog: posts list with category buttons, post page with BlogPosting and the menu link, RSS feed", async ({ page, request }) => {
  await page.goto("/blog");
  const buttons = page.locator("[data-posts-category]");
  await expect(buttons).toHaveCount(3);
  await page.getByRole("button", { name: "News" }).click();
  await expect(page.locator("#blog-posts [data-post]:visible")).toHaveCount(1);
  await page.getByRole("button", { name: "All" }).click();
  await expect(page.locator("#blog-posts [data-post]:visible")).toHaveCount(2);

  await page.goto("/blog/why-fast-pages-win");
  await expect(page.locator("h1")).toHaveText("Why fast pages win more clients");
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute("content", "article");
  // v3.12: with the time and the zone (noon in the business time zone).
  await expect(page.locator('meta[property="article:published_time"]')).toHaveAttribute("content", /^2026-11-12T12:00:00[+-]\d\d:\d\d$/);
  const graph = JSON.parse((await page.locator('script[type="application/ld+json"]').first().textContent()) ?? "{}")["@graph"] as { "@type": string }[];
  expect(graph.map((node) => node["@type"])).toEqual(expect.arrayContaining(["BlogPosting", "BreadcrumbList"]));
  await expect(page.locator('.navbar a[href="/blog"]').first()).toHaveAttribute("aria-current", "true");
  await expect(page.locator(".article-toc a")).not.toHaveCount(0);

  const feed = await request.get("/rss.xml");
  expect(feed.status()).toBe(200);
  // A static file: the server types it by its extension (feed readers take application/xml).
  expect(feed.headers()["content-type"]).toMatch(/xml/);
  const xml = await feed.text();
  expect(xml).toMatch(/<link>https?:\/\/[^<]+\/blog\/why-fast-pages-win<\/link>/);
  expect(xml.match(/<item>/g)).toHaveLength(2);
});
