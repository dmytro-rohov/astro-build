/**
 * Vite plugin that exposes the validated site to the build:
 * - "virtual:site"                → { site, assets, siteDir } (server/build code)
 * - "virtual:site/analytics"      → { gaId } only, safe to import in browser scripts
 * - "virtual:section-components"  → { sectionComponents } for the variants the site uses
 *   (its components bring their styles, so unused variants add no CSS)
 * The site is re-validated whenever site.json or assets.json change (dev server).
 */
import path from "node:path";
import type { Plugin } from "vite";
import { sectionComponentPaths } from "./components";
import { loadSite } from "./loader";
import type { Site } from "./schema/site";

const SITE_ID = "virtual:site";
const ANALYTICS_ID = "virtual:site/analytics";
const COMPONENTS_ID = "virtual:section-components";

/** Imports the components of the section variants used on the site's pages, in registry order. */
function sectionComponentsModule(site: Site): string {
  const used = new Set(site.pages.flatMap((page) => page.sections.map((section) => `${section.type}/${section.variant}`)));
  const files: string[] = [];
  const entries: string[] = [];

  for (const [type, variants] of Object.entries(sectionComponentPaths)) {
    const variantEntries = Object.entries(variants)
      .filter(([variant]) => used.has(`${type}/${variant}`))
      .map(([variant, file]) => {
        // One component may serve several variants: import it once.
        const index = files.includes(file) ? files.indexOf(file) : files.push(file) - 1;
        return `${JSON.stringify(variant)}: Component${index}`;
      });

    if (variantEntries.length > 0) {
      entries.push(`${JSON.stringify(type)}: { ${variantEntries.join(", ")} }`);
    }
  }

  return [
    ...files.map((file, index) => `import Component${index} from ${JSON.stringify(file)};`),
    `export const sectionComponents = { ${entries.join(", ")} };`,
  ].join("\n");
}

export function siteVitePlugin(siteDir: string, options: { gaId: string }): Plugin {
  const resolved = (id: string) => `\0${id}`;

  return {
    name: "mytko-site",
    resolveId(id) {
      if (id === SITE_ID || id === ANALYTICS_ID || id === COMPONENTS_ID) {
        return resolved(id);
      }
    },
    load(id) {
      if (id !== resolved(SITE_ID) && id !== resolved(ANALYTICS_ID) && id !== resolved(COMPONENTS_ID)) {
        return;
      }

      this.addWatchFile(path.join(siteDir, "site.json"));
      this.addWatchFile(path.join(siteDir, "assets", "assets.json"));

      const { site, assets } = loadSite(siteDir);

      if (id === resolved(ANALYTICS_ID)) {
        // Resolved in astro.config (env/.env override, then site.json), same as the CSP.
        return `export const gaId = ${JSON.stringify(options.gaId)};`;
      }

      if (id === resolved(COMPONENTS_ID)) {
        return sectionComponentsModule(site);
      }

      return [
        `export const site = ${JSON.stringify(site)};`,
        `export const assets = ${JSON.stringify(assets)};`,
        `export const siteDir = ${JSON.stringify(siteDir)};`,
      ].join("\n");
    },
  };
}
