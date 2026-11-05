/**
 * Tests for ANY site built from site.json (SITE_DIR): every page loads with one
 * h1 and valid JSON-LD, nothing overflows at phone/tablet/desktop widths, axe
 * passes. Used for the generated catalog (every variant with min/max content,
 * scripts/site/test-catalog.sh) and the fixture sites (scripts/site/test-fixtures.sh).
 * Runs only when SITE_SMOKE=1.
 */
import fs from "node:fs";
import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "./fixtures";

const enabled = process.env.SITE_SMOKE === "1";
const siteDir = path.resolve(process.env.SITE_DIR ?? ".generated/catalog");
const pages: { slug: string }[] = enabled ? JSON.parse(fs.readFileSync(path.join(siteDir, "site.json"), "utf8")).pages : [];

test.describe(`site ${path.basename(siteDir)}`, () => {
  test.skip(!enabled, "set SITE_SMOKE=1 with SITE_DIR pointing at a site directory");
  test.use({ viewport: { width: 1440, height: 900 } });

  for (const { slug } of pages) {
    test(`${slug}: loads with one h1, valid JSON-LD and unique ids`, async ({ page }) => {
      const response = await page.goto(slug);
      expect(response?.status()).toBe(200);
      await expect(page.locator("h1")).toHaveCount(1);

      for (const block of await page.locator('script[type="application/ld+json"]').allTextContents()) {
        expect(JSON.parse(block)["@context"]).toBe("https://schema.org");
      }

      // Duplicate ids break the skip link, aria-controls and <label for>.
      const duplicates = await page.evaluate(() => {
        const ids = [...document.querySelectorAll("[id]")].map((element) => element.id);
        return [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
      });
      expect(duplicates, "duplicate ids").toEqual([]);
    });

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

            // A collapsed container (e.g. the section itself turned into a grid) is a layout bug too.
            const expected = Math.min(section.clientWidth - 64, 560);
            if (box.width < expected) {
              found.push(`${section.id}: container is only ${Math.round(box.width)}px wide (expected at least ${expected}px)`);
              continue;
            }

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
