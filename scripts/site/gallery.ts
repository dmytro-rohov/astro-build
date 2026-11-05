/**
 * Visual QA gallery: every section variant (min and max content) × every
 * archetype × light and dark scheme, as element screenshots in one HTML page.
 *
 * Usage: npm run gallery [-- --archetypes default,bold] [--out dist-gallery]
 * Open dist-gallery/index.html in a browser (local tool, not deployed).
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";
import { ARCHETYPE_IDS } from "../../src/design-system/archetypes";
import { loadSite } from "../../src/site/loader";
import { getFlag } from "./args";
import { buildSite, serve, type SiteContext } from "./lib";

const out = path.resolve(getFlag("out") ?? "dist-gallery");
const archetypes = (getFlag("archetypes")?.split(",") ?? ARCHETYPE_IDS) as string[];

type Shot = { archetype: string; scheme: string; type: string; variant: string; mode: string; file: string };
const shots: Shot[] = [];

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(path.join(out, "img"), { recursive: true });

const browser = await chromium.launch();

for (const archetype of archetypes) {
  const dir = path.resolve(".generated", `gallery-${archetype}`);
  console.log(`▶ ${archetype}`);

  const generated = spawnSync("npx", ["tsx", "scripts/site/make-catalog.ts", "--out", dir, "--archetype", archetype], { stdio: "inherit" });
  if (generated.status !== 0) process.exit(1);

  const context: SiteContext = { dir, out: path.join(dir, "build"), loaded: loadSite(dir) };
  if (!buildSite(context, true)) process.exit(1);

  const server = await serve(context, 4594);

  try {
    for (const scheme of ["light", "dark"] as const) {
      const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

      for (const sitePage of context.loaded.site.pages) {
        await page.goto(server.url + sitePage.slug);
        await page.evaluate((value) => (document.documentElement.dataset.theme = value), scheme);
        await page.evaluate(() => document.fonts.ready);
        await page.evaluate(async () => {
          for (let y = 0; y < document.documentElement.scrollHeight; y += window.innerHeight / 2) {
            window.scrollTo(0, y);
            await new Promise((resolve) => setTimeout(resolve, 60));
          }
          window.scrollTo(0, 0);
          await Promise.all([...document.images].map((image) => image.decode().catch(() => undefined)));
        });
        await page.waitForTimeout(250);

        for (const section of sitePage.sections) {
          const mode = section.id.endsWith("-min") ? "min" : "max";
          const file = `img/${archetype}-${scheme}-${section.id}.png`;

          await page.locator(`[id="${section.id}"]`).screenshot({ path: path.join(out, file) });
          shots.push({ archetype, scheme, type: section.type, variant: section.variant, mode, file });
        }
      }

      await page.close();
    }
  } finally {
    server.stop();
  }
}

await browser.close();

const options = (key: keyof Shot) => [...new Set(shots.map((shot) => shot[key]))];
const select = (key: keyof Shot, label: string) =>
  `<label>${label} <select data-filter="${key}"><option value="">all</option>${options(key)
    .map((value) => `<option>${value}</option>`)
    .join("")}</select></label>`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="robots" content="noindex">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Section gallery — Astro Starter v3</title>
<style>
  body { margin: 0; font: 14px/1.4 system-ui, sans-serif; background: #f3f4f6; color: #111827; }
  header { position: sticky; top: 0; display: flex; flex-wrap: wrap; gap: 12px; padding: 12px 16px; background: #fff; border-bottom: 1px solid #e5e7eb; z-index: 1; }
  main { display: grid; gap: 24px; padding: 16px; }
  figure { margin: 0; background: #fff; border: 1px solid #e5e7eb; }
  figcaption { padding: 6px 10px; font-weight: 600; }
  img { display: block; width: 100%; height: auto; }
  [hidden] { display: none; }
</style>
</head>
<body>
<header>
  <strong>${shots.length} screenshots</strong>
  ${select("type", "Type")} ${select("variant", "Variant")} ${select("archetype", "Archetype")} ${select("scheme", "Scheme")} ${select("mode", "Content")}
</header>
<main>
${shots
  .map(
    (shot) =>
      `<figure data-type="${shot.type}" data-variant="${shot.variant}" data-archetype="${shot.archetype}" data-scheme="${shot.scheme}" data-mode="${shot.mode}">
  <figcaption>${shot.type} / ${shot.variant} · ${shot.archetype} · ${shot.scheme} · ${shot.mode} content</figcaption>
  <img loading="lazy" src="${shot.file}" alt="">
</figure>`,
  )
  .join("\n")}
</main>
<script>
  const filters = [...document.querySelectorAll("[data-filter]")];
  const update = () => {
    for (const figure of document.querySelectorAll("figure")) {
      figure.hidden = filters.some((filter) => filter.value && figure.dataset[filter.dataset.filter] !== filter.value);
    }
  };
  filters.forEach((filter) => filter.addEventListener("change", update));
</script>
</body>
</html>
`;

fs.writeFileSync(path.join(out, "index.html"), html);
console.log(`✔ Gallery: ${shots.length} screenshots → ${path.join(out, "index.html")}`);
