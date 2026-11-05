/**
 * Vite plugin that exposes the validated site to the build:
 * - "virtual:site"            → { site, assets, siteDir } (server/build code)
 * - "virtual:site/analytics"  → { gaId } only, safe to import in browser scripts
 * The site is re-validated whenever site.json or assets.json change (dev server).
 */
import path from "node:path";
import type { Plugin } from "vite";
import { loadSite } from "./loader";

const SITE_ID = "virtual:site";
const ANALYTICS_ID = "virtual:site/analytics";

export function siteVitePlugin(siteDir: string): Plugin {
  const resolved = (id: string) => `\0${id}`;

  return {
    name: "mytko-site",
    resolveId(id) {
      if (id === SITE_ID || id === ANALYTICS_ID) {
        return resolved(id);
      }
    },
    load(id) {
      if (id !== resolved(SITE_ID) && id !== resolved(ANALYTICS_ID)) {
        return;
      }

      this.addWatchFile(path.join(siteDir, "site.json"));
      this.addWatchFile(path.join(siteDir, "assets", "assets.json"));

      const { site, assets } = loadSite(siteDir);

      if (id === resolved(ANALYTICS_ID)) {
        // Env override keeps test and preview builds independent of site.json.
        const gaId = process.env.PUBLIC_GA_MEASUREMENT_ID || site.analytics.gaId || "";
        return `export const gaId = ${JSON.stringify(gaId)};`;
      }

      return [
        `export const site = ${JSON.stringify(site)};`,
        `export const assets = ${JSON.stringify(assets)};`,
        `export const siteDir = ${JSON.stringify(siteDir)};`,
      ].join("\n");
    },
  };
}
