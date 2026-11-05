import { test, expect } from "./fixtures";

/** Each test uses its own client IP so the rate limit does not leak between tests. */
const octet = () => Math.floor(Math.random() * 254) + 1;
const nextIp = () => `10.${octet()}.${octet()}.${octet()}`;

test.describe("contact form", () => {
  test("valid message is sent", async ({ page, pageErrors }) => {
    void pageErrors;
    await page.setExtraHTTPHeaders({ "X-Forwarded-For": nextIp() });
    await page.goto("/contact");
    await page.locator("[data-consent-reject]").click();

    await page.locator("#contact-name").fill("Jan Kowalski");
    await page.locator("#contact-email").fill("jan@example.com");
    await page.locator("#contact-message").fill("Hello, this is a test message.");
    // Click the visible checkbox, as a visitor would (the native input is visually hidden).
    const consent = page.locator("#contact-privacy + .checkbox__control");
    await consent.evaluate((element) => element.scrollIntoView({ block: "center" }));
    await consent.click();
    await expect(page.locator("#contact-privacy")).toBeChecked();
    await page.locator('button[type="submit"]').click();

    await expect(page.locator("[data-contact-status]")).toHaveAttribute("data-state", "success");
    await expect(page.locator("#contact-name")).toHaveValue("");
  });

  test("server errors are shown next to the fields", async ({ page }) => {
    await page.setExtraHTTPHeaders({ "X-Forwarded-For": nextIp() });
    await page.goto("/contact");
    await page.locator("[data-consent-reject]").click();

    // Skip browser validation to test the server response.
    await page.locator("form[data-contact-form]").evaluate((form) => form.setAttribute("novalidate", ""));
    await page.locator("#contact-email").fill("not-an-email");
    await page.locator('button[type="submit"]').click();

    await expect(page.locator("[data-contact-status]")).toHaveAttribute("data-state", "error");
    await expect(page.locator('[data-error-for="email"]')).not.toBeEmpty();
    await expect(page.locator('[data-error-for="privacy"]')).not.toBeEmpty();
    await expect(page.locator("#contact-email")).toHaveAttribute("aria-invalid", "true");
  });

  test("API validates consent and limits, and rate limits", async ({ request, baseURL }) => {
    const ip = nextIp();
    const post = (form: Record<string, string>) =>
      request.post("/api/contact", {
        multipart: form,
        headers: { Origin: baseURL!, "X-Forwarded-For": ip },
      });

    const valid = { name: "Jan", email: "jan@example.com", message: "Hello, this is a test.", privacy: "on" };

    const noConsent = await post({ ...valid, privacy: "" });
    expect(noConsent.status()).toBe(400);

    const tooLong = await post({ ...valid, message: "x".repeat(5001) });
    expect(tooLong.status()).toBe(400);

    for (let i = 0; i < 3; i++) {
      expect((await post(valid)).status()).toBe(200);
    }

    // 6th request from the same IP within 10 minutes.
    expect((await post(valid)).status()).toBe(429);
  });
});
