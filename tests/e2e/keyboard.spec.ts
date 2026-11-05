import { test, expect } from "./fixtures";

test("skip link is the first focusable element and jumps to main", async ({ page, pageErrors }) => {
  void pageErrors;
  await page.goto("/");
  await page.keyboard.press("Tab");

  const skipLink = page.locator(".skip-link");
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toBeVisible();

  await page.keyboard.press("Enter");
  expect(new URL(page.url()).hash).toBe("#main-content");
});

test("mobile menu opens, closes with Escape and keeps focus order", async ({ page, isMobile, pageErrors }) => {
  void pageErrors;
  test.skip(!isMobile, "menu toggle is visible on small screens only");

  await page.goto("/");
  await page.locator("[data-consent-reject]").click();

  const toggle = page.locator("[data-navbar-toggle]");
  await toggle.focus();
  await page.keyboard.press("Enter");
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#navbar-menu a").first()).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator("#navbar-menu a").first()).toBeHidden();
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
