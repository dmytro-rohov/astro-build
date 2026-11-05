/**
 * Boundary tests on the generated catalog site (scripts/site/make-catalog.ts):
 * every variant with minimum and maximum content must not overflow its
 * container at phone, tablet and desktop widths, and must pass axe.
 * Runs only when CATALOG=1 (see scripts/site/test-catalog.sh).
 */
import fs from "node:fs";
import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "./fixtures";

const enabled = process.env.CATALOG === "1";
const siteDir = path.resolve(process.env.SITE_DIR ?? ".generated/catalog");
const pages: { slug: string }[] = enabled ? JSON.parse(fs.readFileSync(path.join(siteDir, "site.json"), "utf8")).pages : [];

test.describe("catalog boundaries", () => {
  test.skip(!enabled, "set CATALOG=1 with SITE_DIR pointing at a generated catalog site");
  test.use({ viewport: { width: 1440, height: 900 } });

  for (const { slug } of pages) {
    test(`${slug}: nothing overflows at 320, 768 and 1440 px`, async ({ page }) => {
      for (const width of [320, 768, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(slug);

        const problems = await page.evaluate(() => {
          const found: string[] = [];
          const root = document.documentElement;

          if (root.scrollWidth > root.clientWidth + 1) {
            found.push(`page scrolls horizontally (${root.scrollWidth} > ${root.clientWidth})`);
          }

          for (const section of document.querySelectorAll<HTMLElement>("[data-section-type]")) {
            const container = section.querySelector<HTMLElement>(".container");
            if (!container) continue;

            const box = container.getBoundingClientRect();

            for (const element of container.querySelectorAll<HTMLElement>("*")) {
              if (element.closest("[aria-hidden='true'], .visually-hidden, svg")) continue;

              const rect = element.getBoundingClientRect();
              if (!rect.width || !rect.height) continue;

              if (rect.left < box.left - 1 || rect.right > box.right + 1) {
                found.push(`${section.id}: <${element.tagName.toLowerCase()} class="${element.className}"> sticks out of the container`);
                break;
              }
            }
          }

          return found;
        });

        expect(problems, `width ${width}px`).toEqual([]);
      }
    });

    test(`${slug}: no WCAG AA violations`, async ({ page }) => {
      await page.goto(slug);
      await page.waitForTimeout(300);

      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
      expect(results.violations.map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
