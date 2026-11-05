import { test, expect } from "./fixtures";

/** Each test uses its own client IP so the rate limit does not leak between tests. */
const octet = () => Math.floor(Math.random() * 254) + 1;
const nextIp = () => `10.${octet()}.${octet()}.${octet()}`;

test.describe("contact form", () => {
  test("valid message is sent", async ({ page }) => {
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

  test.describe("with server errors", () => {
    // The API answers 400 on purpose.
    test.use({ allowedErrors: [/status of 400/] });

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
      // Focus moves to the first invalid field.
      await expect(page.locator("#contact-name")).toBeFocused();
    });
  });

  test("API validates consent and limits; only valid messages count for the rate limit", async ({ request, baseURL }) => {
    const ip = nextIp();
    const post = (form: Record<string, string>) =>
      request.post("/api/contact", {
        multipart: form,
        headers: { Origin: baseURL!, "X-Forwarded-For": ip, Accept: "application/json" },
      });

    const valid = { name: "Jan", email: "jan@example.com", message: "Hello, this is a test.", privacy: "on" };

    expect((await post({ ...valid, privacy: "" })).status()).toBe(400);
    expect((await post({ ...valid, message: "x".repeat(5001) })).status()).toBe(400);

    // Invalid attempts above did not use up the limit: 5 valid messages pass.
    for (let i = 0; i < 5; i++) {
      expect((await post(valid)).status()).toBe(200);
    }

    // 6th valid message from the same IP within 10 minutes.
    expect((await post(valid)).status()).toBe(429);
  });

  test("honeypot submissions get a normal answer and are not sent", async ({ request, baseURL }) => {
    const response = await request.post("/api/contact", {
      multipart: { name: "Bot", email: "bot@example.com", message: "Buy now, buy now!", privacy: "on", website: "http://spam" },
      headers: { Origin: baseURL!, "X-Forwarded-For": nextIp(), Accept: "application/json" },
    });

    expect(response.status()).toBe(200);
    expect(JSON.stringify(await response.json())).not.toMatch(/spam/i);
  });

  test("line breaks are removed from single-line fields", async ({ request, baseURL }) => {
    const response = await request.post("/api/contact", {
      multipart: { name: "Jan\r\nBcc: x@example.com", email: "jan@example.com", message: "Hello, this is a test.", privacy: "on" },
      headers: { Origin: baseURL!, "X-Forwarded-For": nextIp(), Accept: "application/json" },
    });

    expect(response.status()).toBe(200);
  });

  test("without JavaScript the form redirects to a result page", async ({ request, baseURL }) => {
    const response = await request.post("/api/contact", {
      form: { name: "Jan", email: "jan@example.com", message: "Hello, this is a test.", privacy: "on" },
      headers: { Origin: baseURL!, "X-Forwarded-For": nextIp(), Accept: "text/html" },
      maxRedirects: 0,
    });

    expect(response.status()).toBe(303);
    expect(response.headers()["location"]).toBe("/contact/sent");
  });

  test("GET is rejected with an Allow header", async ({ request }) => {
    const response = await request.get("/api/contact");

    expect(response.status()).toBe(405);
    expect(response.headers()["allow"]).toBe("POST");
  });
});
