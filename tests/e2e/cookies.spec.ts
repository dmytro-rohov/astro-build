import { test, expect } from "./fixtures";

const STORAGE_KEY = "site-analytics-consent";

test.describe("cookie consent", () => {
  test("banner shows on first visit without taking focus", async ({ page }) => {
    await page.goto("/");

    const banner = page.locator("[data-cookie-consent]");
    await expect(banner).toBeVisible();
    expect(await page.evaluate(() => document.activeElement?.tagName)).toBe("BODY");
    await expect(page.locator("script[data-ga-measurement-id]")).toHaveCount(0);
  });

  test("reject stores the choice and does not load analytics", async ({ page }) => {
    await page.goto("/");
    await page.locator("[data-consent-reject]").click();

    await expect(page.locator("[data-cookie-consent]")).toBeHidden();
    await expect(page.locator("script[data-ga-measurement-id]")).toHaveCount(0);

    const stored = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
    expect(JSON.parse(stored ?? "{}").status).toBe("denied");

    await page.reload();
    await expect(page.locator("[data-cookie-consent]")).toBeHidden();
  });

  test("accept loads analytics only after consent", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("script[data-ga-measurement-id]")).toHaveCount(0);

    await page.locator("[data-consent-accept]").click();

    await expect(page.locator("[data-cookie-consent]")).toBeHidden();
    await expect(page.locator("script[data-ga-measurement-id]")).toHaveCount(1);
  });

  test("consent can be changed from the footer", async ({ page }) => {
    await page.goto("/");
    await page.locator("[data-consent-reject]").click();

    await page.locator("footer [data-cookie-settings]").click();

    const banner = page.locator("[data-cookie-consent]");
    await expect(banner).toBeVisible();
    await expect(banner).toBeFocused();
  });

  // v3.12 (WCAG 2.4.11, 2.4.3).
  test("the banner comes right after the skip link; Escape minimises it to a button that brings it back", async ({ page }) => {
    await page.goto("/");
    const banner = page.locator("[data-cookie-consent]");
    await expect(banner).toBeVisible();

    await page.keyboard.press("Tab");
    await expect(page.locator(".skip-link")).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(banner.locator(".cookie-consent__privacy-link")).toBeFocused();
    // Its title names the region without adding a heading to the page.
    await expect(banner.locator("h2")).toHaveCount(0);

    await page.keyboard.press("Escape");
    await expect(banner).toBeHidden();
    const reopen = page.locator("[data-cookie-reopen]");
    await expect(reopen).toBeFocused();
    // No choice was made: nothing stored, the next page shows only the small button.
    expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBeNull();
    await page.reload();
    await expect(reopen).toBeVisible();
    await expect(banner).toBeHidden();

    await reopen.click();
    await expect(banner).toBeVisible();
    await expect(banner).toBeFocused();
  });

  test("a choice made from Cookie settings returns focus there", async ({ page }) => {
    await page.goto("/");
    await page.locator("[data-consent-reject]").click();

    const settings = page.locator("footer [data-cookie-settings]");
    await settings.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("[data-cookie-consent]")).toBeFocused();

    await page.locator("[data-consent-accept]").focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("[data-cookie-consent]")).toBeHidden();
    await expect(settings).toBeFocused();
  });

  test("while it is shown, focused elements scroll above it", async ({ page }) => {
    await page.goto("/");
    const banner = page.locator("[data-cookie-consent]");
    await expect(banner).toBeVisible();

    await expect.poll(() => page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).scrollPaddingBottom) || 0)).toBeGreaterThan(0);
    const padding = await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).scrollPaddingBottom));
    const box = await banner.boundingBox();
    const viewport = page.viewportSize();
    expect(padding).toBeGreaterThanOrEqual((viewport?.height ?? 0) - (box?.y ?? 0));
    // Never taller than the screen; the page has room to scroll its last elements above it.
    expect(box?.height ?? 0).toBeLessThanOrEqual(viewport?.height ?? 0);
    expect(await page.evaluate(() => parseFloat(getComputedStyle(document.body).paddingBottom))).toBeGreaterThan(0);

    await page.locator("[data-consent-reject]").click();
    await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).scrollPaddingBottom)).toBe("auto");
  });

  test("reject and accept buttons have the same visual weight", async ({ page }) => {
    await page.goto("/");

    const styles = await page.locator("[data-cookie-consent] button").evaluateAll((buttons) =>
      buttons.map((button) => {
        const style = getComputedStyle(button);
        return `${style.backgroundColor}|${style.color}|${style.fontSize}`;
      }),
    );

    expect(new Set(styles).size).toBe(1);
  });
});
