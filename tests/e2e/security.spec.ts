import { test, expect } from "./fixtures";

const EXPECTED_HEADERS = {
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "referrer-policy": "strict-origin-when-cross-origin",
  "cross-origin-opener-policy": "same-origin",
};

test("security headers are set on every kind of response", async ({ page, request }) => {
  await page.goto("/");
  const font = await page.locator('link[rel="preload"][as="font"]').getAttribute("href");

  // Prerendered page, prerendered 404, API route and a static file.
  for (const path of ["/", "/this-page-does-not-exist", "/api/contact", font!]) {
    const headers = (await request.get(path)).headers();

    for (const [name, value] of Object.entries(EXPECTED_HEADERS)) {
      expect(headers[name], `${name} on ${path}`).toBe(value);
    }

    expect(headers["permissions-policy"], path).toContain("camera=()");
  }
});

test("pages carry a strict Content Security Policy", async ({ page }) => {
  await page.goto("/");
  const csp = await page.locator('meta[http-equiv="content-security-policy"]').getAttribute("content");

  expect(csp).toContain("default-src 'self'");
  expect(csp).toContain("object-src 'none'");
  expect(csp).not.toContain("unsafe-inline");
});

test("hashed assets, fonts and the icon sprite are cached as immutable", async ({ page, request }) => {
  await page.goto("/");

  const urls = [
    await page.locator('link[rel="stylesheet"][href^="/_astro/"]').first().getAttribute("href"),
    await page.locator('link[rel="preload"][as="font"]').getAttribute("href"),
  ];

  // Footer contact icons come from the sprite.
  const sprite = await page.locator("footer svg use").first().getAttribute("href");
  urls.push(sprite!.split("#")[0]);

  for (const url of urls) {
    expect(url).toBeTruthy();
    expect((await request.get(url!)).headers()["cache-control"], url!).toContain("immutable");
  }
});

test("on-demand image endpoint is disabled", async ({ request }) => {
  const response = await request.get("/_image?href=%2Ffavicon.ico&w=4000&h=4000&f=png");
  expect(response.status()).toBe(404);
});

test("no inline style attributes (blocked by CSP)", async ({ page }) => {
  for (const path of ["/", "/contact", "/privacy"]) {
    await page.goto(path);
    const inline = await page.locator("[style]").evaluateAll((elements) =>
      elements.map((element) => element.tagName + "." + element.className),
    );

    expect(inline, path).toEqual([]);
  }
});
