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

  test("clicking outside closes it", async ({ page }) => {
    const toggle = page.locator("[data-navbar-toggle]");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");

    await page.locator("main h1").click();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
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
