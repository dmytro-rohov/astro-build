/**
 * Builds one site and writes a machine-readable report for the orchestrator.
 *
 * Usage: npm run site:report -- --site <dir> [--out <dir>] [--no-lighthouse] [--no-screenshots]
 * Output: <out>/report.json (+ <out>/dist, <out>/screenshots)
 * Exit code: 0 when every quality gate passes, 1 otherwise.
 *
 * report.json:
 * {
 *   engineVersion, schemaVersion, siteId, generatedAt, passed,
 *   validation: { ok, issues[], warnings[] },
 *   theme: { archetype, colorScheme, fontPair, accent, adjustments[] },
 *   build: { ok, outDir },
 *   pages: [{ id, slug, title, a11y: { violations[] }, lighthouse: { performance, accessibility, bestPractices, seo }, screenshots: { desktop, mobile } }],
 *   gates: { a11y, lighthouse, build }
 * }
 */
import fs from "node:fs";
import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "@playwright/test";
import * as chromeLauncher from "chrome-launcher";
import lighthouse from "lighthouse";
import { ENGINE_VERSION } from "../../src/site/engine";
import { loadSite, resolveSiteDir, SiteValidationError } from "../../src/site/loader";
import { SCHEMA_VERSION } from "../../src/site/schema/site";
import { getFlag } from "./args";
import { buildSite, distDir, pagesOf, serve, writeJson, type SiteContext } from "./lib";
import { takeScreenshots } from "./screenshot";

const THRESHOLDS = { performance: 0.9, accessibility: 0.95, bestPractices: 0.95, seo: 0.95 };
const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

const dir = resolveSiteDir(getFlag("site"));
const generatedAt = new Date().toISOString();

let loaded;

try {
  loaded = loadSite(dir);
} catch (error) {
  if (!(error instanceof SiteValidationError)) throw error;

  // Invalid site: the report still describes what is wrong.
  const out = path.resolve(getFlag("out") ?? ".generated/sites/invalid");
  writeJson(path.join(out, "report.json"), {
    engineVersion: ENGINE_VERSION,
    schemaVersion: SCHEMA_VERSION,
    siteDir: dir,
    generatedAt,
    passed: false,
    validation: { ok: false, issues: error.issues, warnings: [] },
  });
  console.error(`✖ ${dir}\n${error.message}\nReport: ${path.join(out, "report.json")}`);
  process.exit(1);
}

const context: SiteContext = {
  dir,
  out: path.resolve(getFlag("out") ?? path.join(".generated/sites", loaded.site.siteId)),
  loaded,
};

console.log(`▶ Building ${loaded.site.siteId}…`);
const buildOk = buildSite(context, true);

const theme = fs.existsSync("src/design-system/theme.generated.json")
  ? JSON.parse(fs.readFileSync("src/design-system/theme.generated.json", "utf8"))
  : undefined;

type PageReport = ReturnType<typeof pagesOf>[number] & {
  a11y?: { violations: { id: string; impact: string | null | undefined; nodes: number; scheme: string }[] };
  lighthouse?: Record<keyof typeof THRESHOLDS, number>;
  screenshots?: { desktop: string; mobile: string };
};

const pages: PageReport[] = pagesOf(context);

if (buildOk) {
  const server = await serve(context, 4593);

  try {
    // Accessibility (axe) in the schemes the site can show.
    const schemes = loaded.site.theme.colorScheme === "auto" ? ["light", "dark"] : [theme?.colorScheme ?? "light"];
    const browser = await chromium.launch();

    for (const page of pages) {
      const violations: NonNullable<PageReport["a11y"]>["violations"] = [];

      for (const scheme of schemes) {
        // axe needs a page from an explicit browser context.
        const browserContext = await browser.newContext({ colorScheme: scheme as "light" | "dark" });
        const tab = await browserContext.newPage();
        await tab.route(/googletagmanager\.com|google-analytics\.com/, (route) => route.abort());
        await tab.goto(server.url + page.slug);
        const result = await new AxeBuilder({ page: tab }).withTags(WCAG_TAGS).analyze();
        violations.push(...result.violations.map((violation) => ({ id: violation.id, impact: violation.impact, nodes: violation.nodes.length, scheme })));
        await browserContext.close();
      }

      page.a11y = { violations };
    }

    await browser.close();

    if (!process.argv.includes("--no-screenshots")) {
      for (const shot of await takeScreenshots(context, server.url)) {
        const page = pages.find((entry) => entry.id === shot.page);
        if (page) page.screenshots = { desktop: path.relative(context.out, shot.desktop), mobile: path.relative(context.out, shot.mobile) };
      }
    }

    if (!process.argv.includes("--no-lighthouse")) {
      const chrome = await chromeLauncher.launch({ chromePath: chromium.executablePath(), chromeFlags: ["--headless=new", "--no-sandbox"] });

      try {
        for (const page of pages) {
          // A run that errors (e.g. NO_FCP in a cold headless Chrome) has null scores — retry once.
          let result;
          for (let attempt = 0; attempt < 2; attempt++) {
            result = await lighthouse(server.url + page.slug, {
              port: chrome.port,
              output: "json",
              logLevel: "error",
              onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
            });
            if (!result?.lhr.runtimeError && result?.lhr.categories.performance?.score != null) break;
          }
          const categories = result?.lhr.categories ?? {};
          page.lighthouse = {
            performance: categories.performance?.score ?? 0,
            accessibility: categories.accessibility?.score ?? 0,
            bestPractices: categories["best-practices"]?.score ?? 0,
            seo: categories.seo?.score ?? 0,
          };
        }
      } finally {
        await chrome.kill();
      }
    }
  } finally {
    server.stop();
  }
}

const gates = {
  build: buildOk,
  a11y: buildOk && pages.every((page) => (page.a11y?.violations.length ?? 1) === 0),
  lighthouse:
    process.argv.includes("--no-lighthouse") ||
    (buildOk &&
      pages.every((page) =>
        (Object.keys(THRESHOLDS) as (keyof typeof THRESHOLDS)[]).every((key) => (page.lighthouse?.[key] ?? 0) >= THRESHOLDS[key]),
      )),
};
const passed = Object.values(gates).every(Boolean);

const reportFile = path.join(context.out, "report.json");
writeJson(reportFile, {
  engineVersion: ENGINE_VERSION,
  schemaVersion: SCHEMA_VERSION,
  siteId: loaded.site.siteId,
  siteDir: dir,
  generatedAt,
  passed,
  validation: { ok: true, issues: [], warnings: loaded.warnings },
  theme,
  build: { ok: buildOk, outDir: path.relative(context.out, distDir(context)) },
  thresholds: THRESHOLDS,
  pages,
  gates,
});

console.log(`${passed ? "✔" : "✖"} ${loaded.site.siteId}: build ${gates.build ? "ok" : "failed"}, a11y ${gates.a11y ? "ok" : "failed"}, lighthouse ${gates.lighthouse ? "ok" : "failed"} → ${reportFile}`);
process.exit(passed ? 0 : 1);
