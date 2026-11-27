import type { ElementHandle, Page } from "@playwright/test";

type Block = ElementHandle<HTMLElement>;
import { test, expect } from "./fixtures";

// v3.14: entrance animations (theme.motion, widgets/Reveal.astro, styles/components/_reveal.scss). The demo
// site does not set theme.motion, so it is "subtle"; the other levels rewrite the page's <html data-motion>.
async function withMotion(page: Page, motion: string) {
  await page.route(
    (url) => url.pathname === "/",
    async (route) => {
      const response = await route.fetch();
      const body = (await response.text()).replace(/data-motion="[a-z]+"/, `data-motion="${motion}"`);
      await route.fulfill({ response, body });
    },
  );
}

const opacity = (block: Block) => block.evaluate((element) => getComputedStyle(element).opacity);
const state = (block: Block) => block.getAttribute("data-reveal");
const toCenter = (block: Block) => block.evaluate((element) => element.scrollIntoView({ block: "center" }));

async function firstWaiting(page: Page) {
  await expect.poll(() => page.locator('[data-reveal=""]').count()).toBeGreaterThan(3);
  return (await page.locator('[data-reveal=""]').first().elementHandle()) as Block;
}

test.describe("entrance animations (theme.motion)", () => {
  test("subtle: only blocks below the first screen wait; they come in when scrolled to", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-motion", "subtle");
    const block = await firstWaiting(page);
    const fold = await page.evaluate(() => window.innerHeight * 0.9);
    const tops = await page.locator('[data-reveal=""]').evaluateAll((blocks) => blocks.map((element) => (element as HTMLElement).getBoundingClientRect().top));
    expect(Math.min(...tops)).toBeGreaterThanOrEqual(fold - 1);
    await expect(page.locator('.s-hero [data-reveal], .s-custom [data-reveal], [data-reveal="shown"]')).toHaveCount(0);
    expect(await opacity(block)).toBe("0");

    await toCenter(block);
    await expect.poll(() => state(block)).toBe("in");
    await expect.poll(() => opacity(block)).toBe("1");
  });

  test("lively: a block goes out at the top and comes back", async ({ page }) => {
    await withMotion(page, "lively");
    await page.goto("/");
    const block = await firstWaiting(page);
    await toCenter(block);
    await expect.poll(() => state(block)).toBe("in");

    await block.evaluate((element) => window.scrollBy(0, element.getBoundingClientRect().bottom - window.innerHeight * 0.02));
    await expect.poll(() => state(block)).toBe("out");
    await expect.poll(() => opacity(block)).toBe("0");

    await toCenter(block);
    await expect.poll(() => state(block)).toBe("back");
    await expect.poll(() => opacity(block)).toBe("1");
  });

  test("none, and visitors who reduce motion: nothing is marked, nothing is hidden", async ({ page }) => {
    await withMotion(page, "none");
    await page.goto("/");
    await expect(page.locator("[data-reveal]")).toHaveCount(0);

    await page.unrouteAll();
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-motion", "subtle");
    await expect(page.locator("[data-reveal]")).toHaveCount(0);
  });

  test("keyboard focus and the editor show a waiting block as it is", async ({ page }) => {
    await page.goto("/");
    await firstWaiting(page);
    const withLink = (await page.locator('[data-reveal=""]').filter({ has: page.locator("a[href], button") }).first().elementHandle()) as Block;
    await withLink.evaluate((element) => element.querySelector<HTMLElement>("a[href], button")?.focus({ preventScroll: true }));
    expect(await opacity(withLink)).toBe("1");

    const other = (await page.locator('[data-reveal=""]').last().elementHandle()) as Block;
    expect(await opacity(other)).toBe("0");
    await page.evaluate(() => (document.documentElement.dataset.editor = ""));
    expect(await opacity(other)).toBe("1");
  });
});
