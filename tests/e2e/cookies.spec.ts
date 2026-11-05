import { test, expect } from "./fixtures";

const STORAGE_KEY = "site-analytics-consent";

test.describe("cookie consent", () => {
  test("banner shows on first visit without taking focus", async ({ page, pageErrors }) => {
    void pageErrors;
    await page.goto("/");

    const banner = page.locator("[data-cookie-consent]");
    await expect(banner).toBeVisible();
    expect(await page.evaluate(() => document.activeElement?.tagName)).toBe("BODY");
    await expect(page.locator("script[data-ga-measurement-id]")).toHaveCount(0);
  });

  test("reject stores the choice and does not load analytics", async ({ page, pageErrors }) => {
    void pageErrors;
    await page.goto("/");
    await page.locator("[data-consent-reject]").click();

    await expect(page.locator("[data-cookie-consent]")).toBeHidden();
    await expect(page.locator("script[data-ga-measurement-id]")).toHaveCount(0);

    const stored = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
    expect(JSON.parse(stored ?? "{}").status).toBe("denied");

    await page.reload();
    await expect(page.locator("[data-cookie-consent]")).toBeHidden();
  });

  test("accept loads analytics only after consent", async ({ page, pageErrors }) => {
    void pageErrors;
    await page.goto("/");
    await expect(page.locator("script[data-ga-measurement-id]")).toHaveCount(0);

    await page.locator("[data-consent-accept]").click();

    await expect(page.locator("[data-cookie-consent]")).toBeHidden();
    await expect(page.locator("script[data-ga-measurement-id]")).toHaveCount(1);
  });

  test("consent can be changed from the footer", async ({ page, pageErrors }) => {
    void pageErrors;
    await page.goto("/");
    await page.locator("[data-consent-reject]").click();

    await page.locator("footer [data-cookie-settings]").click();

    const banner = page.locator("[data-cookie-consent]");
    await expect(banner).toBeVisible();
    await expect(banner).toBeFocused();
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
