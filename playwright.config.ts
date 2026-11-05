import { defineConfig, devices } from "@playwright/test";

const PORT = 4330;
export const BASE_URL = `http://localhost:${PORT}`;

/**
 * End-to-end tests run against a production build of the site.
 * The build uses test values: a fake GA ID (so the cookie banner is active —
 * Google requests are blocked in tests) and console delivery for the contact form.
 */
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",

  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
  },

  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],

  webServer: {
    command: "npm run build && node server.mjs",
    url: BASE_URL,
    timeout: 240_000,
    reuseExistingServer: !process.env.CI,
    env: {
      // Site under test (default: the demo site).
      SITE_DIR: process.env.SITE_DIR ?? "sites/_demo",
      PORT: String(PORT),
      HOST: "localhost",
      SITE_URL: BASE_URL,
      PUBLIC_GA_MEASUREMENT_ID: "G-TEST000000",
      CONTACT_DELIVERY_MODE: "console",
    },
  },
});
