import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { test, expect, PAGES } from "./fixtures";

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const THEMES = ["light", "dark"] as const;

async function expectNoViolations(page: Page, path: string, theme: (typeof THEMES)[number]) {
  await page.goto(path);
  await page.evaluate((value) => {
    document.documentElement.dataset.theme = value;
  }, theme);
  // Wait for color transitions to finish before measuring contrast.
  await page.waitForTimeout(400);

  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  const summary = results.violations.map(
    (violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(" ")).join(", ")}`,
  );

  expect(summary).toEqual([]);
}

for (const theme of THEMES) {
  for (const path of PAGES) {
    test(`${path} has no WCAG AA violations (${theme})`, async ({ page }) => {
      await expectNoViolations(page, path, theme);
    });
  }
}

test.describe("missing page", () => {
  // The page answers 404 on purpose.
  test.use({ allowedErrors: [/status of 404/] });

  for (const theme of THEMES) {
    test(`404 page has no WCAG AA violations (${theme})`, async ({ page }) => {
      await expectNoViolations(page, "/this-page-does-not-exist", theme);
    });
  }
});
