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

export function siteVitePlugin(siteDir: string, options: { gaId: string }): Plugin {
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
        // Resolved in astro.config (env/.env override, then site.json), same as the CSP.
        return `export const gaId = ${JSON.stringify(options.gaId)};`;
      }

      return [
        `export const site = ${JSON.stringify(site)};`,
        `export const assets = ${JSON.stringify(assets)};`,
        `export const siteDir = ${JSON.stringify(siteDir)};`,
      ].join("\n");
    },
  };
}
