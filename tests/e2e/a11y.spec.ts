import AxeBuilder from "@axe-core/playwright";
import { test, expect, PAGES } from "./fixtures";

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

for (const theme of ["light", "dark"] as const) {
  for (const path of [...PAGES, "/this-page-does-not-exist"]) {
    test(`${path} has no WCAG AA violations (${theme})`, async ({ page }) => {
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
    });
  }
}
