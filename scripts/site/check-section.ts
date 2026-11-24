/**
 * v3.13: the quality gates of one section, for a layout the engine has never seen (custom sections): the factory runs it
 * after its AI wrote a layout and sends the issues back to the AI until it passes.
 *
 * Usage: npm run site:check-section -- --site <dir> --section <id> [--out <dir>] [--no-build] [--port n]
 * Output: <out>/section.json and <out>/section-<width>.jpg; exit code 0 when every gate passes.
 *
 * Gates, at 320, 390, 768 and 1440 px:
 * - drawn: the section is there and has a height;
 * - fits: the page never scrolls sideways and nothing in the section sticks out of its container (slider items scroll
 *   inside their track by design), images are loaded;
 * - a11y: axe WCAG 2.2 AA on the section (contrast included), in every scheme the site can show.
 * section.json: { engineVersion, siteId, section { id, type, variant, page }, passed, issues[] (one readable line each,
 * for the AI), validation, build, widths [{ width, height, shot }], a11y { violations[] } }
 */
import fs from "node:fs";
import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { chromium, type Page } from "@playwright/test";
import { ENGINE_VERSION } from "../../src/site/engine";
import { loadSite, resolveSiteDir, SiteValidationError } from "../../src/site/loader";
import { getFlag } from "./args";
import { buildSite, distDir, serve, writeJson, type SiteContext } from "./lib";

const WIDTHS = [320, 390, 768, 1440];
const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

const dir = resolveSiteDir(getFlag("site"));
const sectionId = getFlag("section") ?? "";
const out = path.resolve(getFlag("out") ?? path.join(".generated/sections", sectionId || "section"));
const report = (data: Record<string, unknown>, passed: boolean) => {
  writeJson(path.join(out, "section.json"), { engineVersion: ENGINE_VERSION, generatedAt: new Date().toISOString(), passed, ...data });
  console.log(`${passed ? "✔" : "✖"} section ${sectionId}: ${passed ? "passed" : "failed"} → ${path.join(out, "section.json")}`);
  process.exit(passed ? 0 : 1);
};

if (!/^[a-z][a-z0-9-]{0,47}$/.test(sectionId)) {
  console.error("Usage: npm run site:check-section -- --site <dir> --section <id> [--out <dir>] [--no-build]");
  process.exit(2);
}

fs.mkdirSync(out, { recursive: true });

let loaded;
try {
  loaded = loadSite(dir);
} catch (error) {
  if (!(error instanceof SiteValidationError)) throw error;
  report({ issues: error.issues, validation: { ok: false, issues: error.issues } }, false);
}
const site = loaded!.site;

const page = site.pages.find((candidate) => candidate.sections.some((section) => section.id === sectionId));
const section = page?.sections.find((candidate) => candidate.id === sectionId);
if (!page || !section) report({ issues: [`No section "${sectionId}" on the site.`], validation: { ok: true, issues: [] } }, false);

const context: SiteContext = { dir, out, loaded: loaded! };
const reuse = process.argv.includes("--no-build") && fs.existsSync(path.join(distDir(context), "index.html"));
const buildOk = reuse || buildSite(context, true);
const about = { siteId: site.siteId, section: { id: sectionId, type: section!.type, variant: section!.variant, page: page!.slug }, validation: { ok: true, issues: [], warnings: loaded!.warnings } };
if (!buildOk) report({ ...about, issues: ["The site did not build (see the build output)."], build: { ok: false } }, false);

const issues: string[] = [];
const widths: { width: number; height: number; shot: string }[] = [];
const violations: { id: string; impact: string | null | undefined; help: string; targets: string[]; scheme: string }[] = [];

/** Problems of the section at the page's current width: what sticks out, what did not load. */
const measure = (tab: Page, id: string) =>
  tab.evaluate((id) => {
    const found: string[] = [];
    const root = document.documentElement;
    const section = document.getElementById(id);
    if (!section) return { height: 0, found: ["the section is not on the page"] };

    if (root.scrollWidth > root.clientWidth + 1) found.push(`the page scrolls sideways (${root.scrollWidth} px wide on a ${root.clientWidth} px screen)`);

    const container = section.querySelector<HTMLElement>(".container") ?? section;
    const box = container.getBoundingClientRect();
    // No helper functions in here: tsx would wrap them in a __name() the page does not have.

    for (const element of container.querySelectorAll<HTMLElement>("*")) {
      if (element.closest("[aria-hidden='true'], .visually-hidden, .visually-hidden-inline, svg, [data-slider-track] > *")) continue;
      const rect = element.getBoundingClientRect();
      if (!rect.width || !rect.height) continue;
      const over = Math.max(box.left - rect.left, rect.right - box.right);
      if (over > 1) {
        found.push(`<${element.tagName.toLowerCase()} class="${typeof element.className === "string" ? element.className : ""}"> sticks out of the section by ${Math.round(over)} px`);
        break;
      }
    }

    for (const image of section.querySelectorAll("img")) {
      if (!image.complete || !image.naturalWidth) found.push(`<img class="${image.className}"> did not load`);
    }

    return { height: Math.round(section.getBoundingClientRect().height), found };
  }, id);

const server = await serve(context);

try {
  const browser = await chromium.launch();

  for (const width of WIDTHS) {
    const tab = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
    await tab.route(/googletagmanager\.com|google-analytics\.com/, (route) => route.abort());
    await tab.goto(server.url + page!.slug);
    await tab.locator("[data-consent-reject]").first().click({ timeout: 2000 }).catch(() => undefined);

    const element = tab.locator(`#${sectionId}`);
    await element.scrollIntoViewIfNeeded().catch(() => undefined);
    // Lazy images below the fold: loaded once in view.
    await tab.waitForFunction((id) => [...(document.getElementById(id)?.querySelectorAll("img") ?? [])].every((image) => image.complete), sectionId, { timeout: 8000 }).catch(() => undefined);

    const { height, found } = await measure(tab, sectionId);
    if (height < 40) found.push(`the section is only ${height} px high`);
    issues.push(...found.map((problem) => `${width} px: ${problem}`));

    const shot = `section-${width}.jpg`;
    if (height > 0) await element.screenshot({ path: path.join(out, shot), type: "jpeg", quality: 80 }).catch(() => undefined);
    widths.push({ width, height, shot });
    await tab.close();
  }

  const schemes = site.theme.colorScheme === "auto" ? (["light", "dark"] as const) : ([site.theme.colorScheme === "dark" ? "dark" : "light"] as const);
  for (const scheme of schemes) {
    const browserContext = await browser.newContext({ colorScheme: scheme, viewport: { width: 1440, height: 900 } });
    const tab = await browserContext.newPage();
    await tab.goto(server.url + page!.slug);
    await tab.waitForTimeout(300);
    const result = await new AxeBuilder({ page: tab }).include(`#${sectionId}`).withTags(WCAG_TAGS).analyze();
    for (const violation of result.violations) {
      const targets = violation.nodes.map((node) => node.target.join(" "));
      violations.push({ id: violation.id, impact: violation.impact, help: violation.help, targets, scheme });
      issues.push(`a11y (${scheme}): ${violation.id}, ${violation.help}: ${targets.slice(0, 3).join(", ")}`);
    }
    await browserContext.close();
  }

  await browser.close();
} finally {
  server.stop();
}

report({ ...about, issues, build: { ok: true, reused: reuse }, widths, a11y: { violations } }, issues.length === 0);
