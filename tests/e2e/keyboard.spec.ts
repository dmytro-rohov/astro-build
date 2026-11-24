import { test, expect } from "./fixtures";

test("skip link is the first focusable element and jumps to main", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");

  const skipLink = page.locator(".skip-link");
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toBeVisible();

  await page.keyboard.press("Enter");
  expect(new URL(page.url()).hash).toBe("#main-content");
});

test.describe("mobile menu", () => {
  test.beforeEach(async ({ isMobile, page }) => {
    test.skip(!isMobile, "menu toggle is visible on small screens only");
    await page.goto("/");
    await page.locator("[data-consent-reject]").click();
  });

  test("Enter opens it and Tab goes straight into the links", async ({ page }) => {
    const toggle = page.locator("[data-navbar-toggle]");
    await toggle.focus();
    await page.keyboard.press("Enter");
    await expect(toggle).toHaveAttribute("aria-expanded", "true");

    // No waiting: the links must be focusable immediately after opening.
    await page.keyboard.press("Tab");
    await expect(page.locator("#navbar-menu a").first()).toBeFocused();
  });

  test("Escape closes it and returns focus to the toggle", async ({ page }) => {
    const toggle = page.locator("[data-navbar-toggle]");
    await toggle.focus();
    await page.keyboard.press("Enter");
    await page.keyboard.press("Tab");

    await page.keyboard.press("Escape");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(toggle).toBeFocused();
    await expect(page.locator("#navbar-menu a").first()).toBeHidden();
  });

  test("clicking the empty part of the full-screen menu closes it", async ({ page }) => {
    const toggle = page.locator("[data-navbar-toggle]");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");

    // v3.2: the menu covers the screen under the header; below the links it closes on click.
    const menu = page.locator("#navbar-menu");
    const box = await menu.boundingBox();
    await menu.click({ position: { x: 20, y: (box?.height ?? 400) - 20 } });
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  // v3.12 (WCAG 2.4.3).
  test("while open, the page behind it is inert", async ({ page }) => {
    const toggle = page.locator("[data-navbar-toggle]");
    await toggle.click();
    await expect(page.locator("main")).toHaveJSProperty("inert", true);
    await expect(page.locator("footer.site-footer")).toHaveJSProperty("inert", true);

    await toggle.click();
    await expect(page.locator("main")).toHaveJSProperty("inert", false);
  });

  test("a section link of this page closes the menu and puts focus on the section's heading", async ({ page }) => {
    const section = page.locator("main [data-section-type]").nth(1);
    const id = await section.getAttribute("id");
    // The demo's menu lists pages: its first link becomes a link to a section of this page.
    await page.locator("#navbar-menu a").first().evaluate((link, hash) => link.setAttribute("href", `/#${hash}`), id);

    await page.locator("[data-navbar-toggle]").click();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");

    await expect(page.locator("[data-navbar-toggle]")).toHaveAttribute("aria-expanded", "false");
    await expect(section.locator("h1, h2").first()).toBeFocused();
  });

  test("the menu covers the screen under the header and the page does not scroll", async ({ page }) => {
    await page.locator("[data-navbar-toggle]").click();
    const header = await page.locator(".site-header").boundingBox();
    const viewport = page.viewportSize();
    // After the slide-in animation the menu starts right under the header.
    await expect.poll(async () => Math.round((await page.locator("#navbar-menu").boundingBox())?.y ?? 0)).toBe(Math.round((header?.y ?? 0) + (header?.height ?? 0)));
    const menu = await page.locator("#navbar-menu").boundingBox();
    expect(Math.round(menu?.width ?? 0)).toBe(viewport?.width);
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflow)).toBe("hidden");
  });
});

// v3.3: the demo site's header has hideOnScroll.
test.describe("header that hides on scroll", () => {
  test("slides away when scrolling down and comes back when scrolling up", async ({ page }) => {
    await page.goto("/");
    await page.locator("[data-consent-reject]").click();
    const header = page.locator(".site-header");

    await page.evaluate(() => window.scrollBy(0, 1200));
    await expect(header).toHaveAttribute("data-hidden", "");
    await expect.poll(async () => (await header.boundingBox())?.y ?? 0).toBeLessThan(0);

    await page.evaluate(() => window.scrollBy(0, -300));
    await expect(header).not.toHaveAttribute("data-hidden");
    await expect.poll(async () => Math.round((await header.boundingBox())?.y ?? -1)).toBe(0);
  });

  test("comes back when keyboard focus moves into it", async ({ page }) => {
    await page.goto("/");
    await page.locator("[data-consent-reject]").click();
    await page.evaluate(() => window.scrollBy(0, 1200));
    const header = page.locator(".site-header");
    await expect(header).toHaveAttribute("data-hidden", "");

    await page.locator(".site-header a").first().focus();
    await expect(header).not.toHaveAttribute("data-hidden");
  });
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("navigation links are visible on a phone", async ({ page, isMobile }) => {
    test.skip(!isMobile, "checks the small-screen layout");
    await page.goto("/");

    await expect(page.locator("[data-navbar-toggle]")).toBeHidden();
    for (const link of await page.locator("#navbar-menu a").all()) {
      await expect(link).toBeVisible();
    }
  });
});

test("keyboard focus is visible on form controls", async ({ page }) => {
  await page.goto("/contact");
  await page.locator("[data-consent-reject]").click();

  // Reach elements with the keyboard: :focus-visible follows keyboard navigation.
  await page.locator("#contact-message").focus();

  for (let step = 0; step < 6; step++) {
    await page.keyboard.press("Tab");

    const focus = await page.evaluate(() => {
      const element = document.activeElement as HTMLElement;
      const style = getComputedStyle(element);
      const control = element.matches("input[type=checkbox]")
        ? getComputedStyle(element.nextElementSibling ?? element)
        : style;

      return {
        name: element.tagName + (element.id ? `#${element.id}` : ""),
        visible: style.outlineStyle !== "none" || control.outlineStyle !== "none" || control.boxShadow !== "none",
        isSubmit: element.matches('button[type="submit"]'),
      };
    });

    expect(focus.visible, focus.name).toBe(true);

    if (focus.isSubmit) {
      return;
    }
  }

  throw new Error("Submit button was not reached with Tab");
});
