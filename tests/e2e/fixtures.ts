import { test as base, expect } from "@playwright/test";

/**
 * Shared test setup:
 * - Google Analytics requests are blocked (no real traffic from tests)
 * - console errors and CSP violations are collected and fail the test
 */
export const test = base.extend<{ pageErrors: string[]; allowedErrors: RegExp[] }>({
  /** Console errors a test expects, e.g. the 404 status of a missing page. */
  allowedErrors: [[], { option: true }],

  // `auto`: runs for every test, even ones that do not mention pageErrors.
  pageErrors: [async ({ page, allowedErrors }, use) => {
    const errors: string[] = [];

    await page.route(/googletagmanager\.com|google-analytics\.com/, (route) =>
      route.fulfill({ status: 200, contentType: "text/javascript", body: "" }),
    );

    page.on("console", (message) => {
      if (message.type() === "error") {
        errors.push(`console: ${message.text()}`);
      }
    });

    page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));

    await page.addInitScript(() => {
      document.addEventListener("securitypolicyviolation", (event) => {
        console.error(`CSP violation: ${event.violatedDirective} ${event.blockedURI}`);
      });
    });

    await use(errors);

    const unexpected = errors.filter((error) => !allowedErrors.some((pattern) => pattern.test(error)));
    expect(unexpected, "page should have no console errors or CSP violations").toEqual([]);
  }, { auto: true }],
});

export { expect };

/** Pages every test suite should cover. */
export const PAGES = ["/", "/contact", "/privacy", "/playground"] as const;
