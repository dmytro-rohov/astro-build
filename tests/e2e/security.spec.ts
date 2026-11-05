import { test, expect } from "./fixtures";

test("security headers are set on pages", async ({ request }) => {
  const response = await request.get("/");
  const headers = response.headers();

  expect(headers["content-security-policy"]).toContain("default-src 'self'");
  expect(headers["content-security-policy"]).not.toContain("unsafe-inline");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["permissions-policy"]).toContain("camera=()");
});

test("hashed assets are cached as immutable", async ({ page, request }) => {
  await page.goto("/");
  const asset = await page.locator('link[rel="stylesheet"][href^="/_astro/"]').first().getAttribute("href");
  expect(asset).toBeTruthy();

  const response = await request.get(asset!);
  expect(response.headers()["cache-control"]).toContain("immutable");
});

test("no inline style attributes (blocked by CSP)", async ({ page }) => {
  for (const path of ["/", "/contact", "/playground"]) {
    await page.goto(path);
    const inline = await page.locator("[style]").evaluateAll((elements) =>
      elements.map((element) => element.tagName + "." + element.className),
    );

    expect(inline, path).toEqual([]);
  }
});
