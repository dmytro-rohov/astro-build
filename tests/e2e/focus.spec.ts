import { test, expect, PAGES } from "./fixtures";
import { focusRingProblems } from "./focus-ring";

// v3.12 (WCAG 2.4.7, 1.4.11): every keyboard stop shows its focus ring with 3:1 against what it is drawn
// on, also the cookie banner's buttons and the brand-colored call to action at the end of each post.
for (const path of PAGES) {
  test(`${path}: every focus ring shows`, async ({ page, isMobile }) => {
    test.skip(isMobile, "keyboard focus is checked in the desktop layout");
    await page.goto(path);
    // Color transitions settle first.
    await page.waitForTimeout(400);

    expect(await focusRingProblems(page)).toEqual([]);
  });
}
