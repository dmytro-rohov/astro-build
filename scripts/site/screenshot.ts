/**
 * PNG screenshots (desktop 1440×900 and mobile Pixel 7, full page) of every page.
 * Usage: npm run site:screenshot -- --site sites/_demo [--out dir] [--no-build]
 * Output: <out>/screenshots/<page-id>-desktop.png, <page-id>-mobile.png
 */
import path from "node:path";
import { chromium, devices } from "@playwright/test";
import { buildSite, pagesOf, serve, siteContext, type SiteContext } from "./lib";

export async function takeScreenshots(context: SiteContext, baseUrl: string) {
  const browser = await chromium.launch();
  const files: { page: string; desktop: string; mobile: string }[] = [];

  try {
    const profiles = {
      desktop: { viewport: { width: 1440, height: 900 } },
      mobile: devices["Pixel 7"],
    };
    const contexts = {
      desktop: await browser.newContext(profiles.desktop),
      mobile: await browser.newContext(profiles.mobile),
    };

    for (const page of pagesOf(context)) {
      const entry = { page: page.id, desktop: "", mobile: "" };

      for (const name of ["desktop", "mobile"] as const) {
        const tab = await contexts[name].newPage();
        await tab.route(/googletagmanager\.com|google-analytics\.com/, (route) => route.abort());
        await tab.goto(baseUrl + page.slug, { waitUntil: "networkidle" });
        await tab.evaluate(() => document.fonts.ready);
        // Lazy images below the fold load only when scrolled into view: scroll through the page first.
        await tab.evaluate(async () => {
          for (let y = 0; y < document.documentElement.scrollHeight; y += window.innerHeight / 2) {
            window.scrollTo(0, y);
            await new Promise((resolve) => setTimeout(resolve, 60));
          }
          window.scrollTo(0, 0);
          // decode() never settles for an image that was not requested — cap the wait.
          const loaded = Promise.all([...document.images].map((image) => image.decode().catch(() => undefined)));
          await Promise.race([loaded, new Promise((resolve) => setTimeout(resolve, 3000))]);
        });
        // The cookie banner is not part of the design review.
        await tab.locator("[data-consent-reject]").click({ timeout: 1000 }).catch(() => {});

        const file = path.join(context.out, "screenshots", `${page.id}-${name}.png`);
        await tab.screenshot({ path: file, fullPage: true });
        entry[name] = file;
        await tab.close();
      }

      files.push(entry);
    }
  } finally {
    await browser.close();
  }

  return files;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const context = siteContext();

  if (!process.argv.includes("--no-build") && !buildSite(context)) process.exit(1);

  const server = await serve(context, 4592);
  try {
    const files = await takeScreenshots(context, server.url);
    console.log(`✔ ${files.length * 2} screenshots in ${path.join(context.out, "screenshots")}`);
  } finally {
    server.stop();
  }
}
