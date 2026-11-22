/**
 * Vite plugin that exposes the validated site to the build:
 * - "virtual:site"                → { site, assets, siteDir } (server/build code)
 * - "virtual:site/analytics"      → { gaId } only, safe to import in browser scripts
 * - "virtual:section-components"  → { sectionComponents } for the variants the site uses
 *   (its components bring their styles, so unused variants add no CSS)
 * - "virtual:layout-components"   → { layoutComponents } the same for the footer variant (and v3.9 the
 *   article layout of a site with a blog)
 * - "virtual:navbar-style"         → imports the style file of the site's navbar variant (v3.5)
 * - "virtual:editor-bridge"       → { EditorBridge, editorOrigin }: the editor preview bridge, only
 *   when the build has an editor origin (v3.6); otherwise null and the bridge is not even imported
 * The site is re-validated whenever site.json or assets.json change (dev server).
 */
import path from "node:path";
import type { Plugin } from "vite";
import { layoutComponentPaths, navbarStylePaths, sectionComponentPaths } from "./components";
import { loadSite } from "./loader";
import type { Site } from "./schema/site";

const SITE_ID = "virtual:site";
const ANALYTICS_ID = "virtual:site/analytics";
const COMPONENTS_ID = "virtual:section-components";
const LAYOUT_COMPONENTS_ID = "virtual:layout-components";
const NAVBAR_STYLE_ID = "virtual:navbar-style";
const EDITOR_BRIDGE_ID = "virtual:editor-bridge";
const IDS = [SITE_ID, ANALYTICS_ID, COMPONENTS_ID, LAYOUT_COMPONENTS_ID, NAVBAR_STYLE_ID, EDITOR_BRIDGE_ID];

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

/**
 * Imports the component of each layout element's variant (footer: one per site). v3.9: the article
 * layout only for a site with a blog ("classic" when the site picks none).
 */
function layoutComponentsModule(site: Site): string {
  const entries = Object.entries(layoutComponentPaths).flatMap(([type, variants]) => {
    if (type === "article") return site.blog ? [[type, variants[site.layout.article?.variant ?? "classic"]] as const] : [];
    const variant = site.layout[type as "navbar" | "footer"].variant;
    return [[type, variants[variant]] as const];
  });

  return [
    ...entries.map(([, file], index) => `import Component${index} from ${JSON.stringify(file)};`),
    `export const layoutComponents = { ${entries.map(([type], index) => `${JSON.stringify(type)}: Component${index}`).join(", ")} };`,
  ].join("\n");
}

export function siteVitePlugin(siteDir: string, options: { gaId: string; editorOrigin: string }): Plugin {
  const resolved = (id: string) => `\0${id}`;

  return {
    name: "mytko-site",
    resolveId(id) {
      if (IDS.includes(id)) {
        return resolved(id);
      }
    },
    load(id) {
      if (!IDS.some((known) => id === resolved(known))) {
        return;
      }

      this.addWatchFile(path.join(siteDir, "site.json"));
      this.addWatchFile(path.join(siteDir, "assets", "assets.json"));

      const { site, assets } = loadSite(siteDir);

      if (id === resolved(ANALYTICS_ID)) {
        // Resolved in astro.config (env/.env override, then site.json), same as the CSP.
        return `export const gaId = ${JSON.stringify(options.gaId)};`;
      }

      if (id === resolved(EDITOR_BRIDGE_ID)) {
        // Resolved in astro.config (PREVIEW_EDITOR_ORIGIN): preview builds for the factory editor only.
        return options.editorOrigin
          ? `export { default as EditorBridge } from "@/components/EditorBridge.astro";\nexport const editorOrigin = ${JSON.stringify(options.editorOrigin)};`
          : `export const EditorBridge = null;\nexport const editorOrigin = "";`;
      }

      if (id === resolved(COMPONENTS_ID)) {
        return sectionComponentsModule(site);
      }

      if (id === resolved(LAYOUT_COMPONENTS_ID)) {
        return layoutComponentsModule(site);
      }

      if (id === resolved(NAVBAR_STYLE_ID)) {
        const file = navbarStylePaths[site.layout.navbar.variant];
        return file ? `import ${JSON.stringify(file)};` : "export {};";
      }

      return [
        `export const site = ${JSON.stringify(site)};`,
        `export const assets = ${JSON.stringify(assets)};`,
        `export const siteDir = ${JSON.stringify(siteDir)};`,
      ].join("\n");
    },
  };
}
