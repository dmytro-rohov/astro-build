// @ts-check
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "astro/config";
import { loadEnv } from "vite";
import node from "@astrojs/node";
import sitemap from "@astrojs/sitemap";
import {
  noindexPaths,
  normalizePath,
  parseNoindex,
  sitemapExcludedPaths,
} from "./src/config/indexing.ts";
import { loadSite, resolveSiteDir, SiteValidationError } from "./src/site/loader.ts";
import { siteVitePlugin } from "./src/site/vite-plugin.ts";
import { cspForSite } from "./src/site/csp.ts";
import { previewEditorOrigin } from "./src/site/editor-bridge.ts";
import { sitemapDates } from "./src/site/sitemap.ts";

const env = loadEnv(process.env.NODE_ENV ?? "development", process.cwd(), "");

// The site to build: SITE_DIR (env or .env), the demo site by default.
const siteDir = resolveSiteDir(env.SITE_DIR || undefined);
process.env.SITE_DIR = siteDir;

let loaded;

try {
  loaded = loadSite(siteDir);
} catch (error) {
  if (error instanceof SiteValidationError) {
    // One readable line per problem, then stop the build.
    console.error(`\n✖ ${siteDir}\n${error.message}\n`);
    process.exit(1);
  }

  throw error;
}

const { site: siteData } = loaded;

// Pages marked noindex in site.json are also left out of the sitemap.
for (const page of siteData.pages) {
  if (page.seo.noindex) noindexPaths.push(page.slug);
}

// v3.9: so are blog posts marked noindex.
const blog = siteData.blog;
for (const post of blog?.posts ?? []) {
  if (blog && post.seo.noindex) noindexPaths.push(`${blog.path}/${post.slug}`);
}

const siteUrl = new URL(env.SITE_URL || siteData.meta.url || "http://localhost:4321");

// v3.12: <lastmod> where the site knows when a page changed (src/site/sitemap.ts).
const lastmod = sitemapDates(siteData);

// Analytics: site.json analytics.gaId; PUBLIC_GA_MEASUREMENT_ID overrides it (test builds).
const gaId = env.PUBLIC_GA_MEASUREMENT_ID || siteData.analytics.gaId || "";
const csp = cspForSite(siteData, gaId);

// v3.6: PREVIEW_EDITOR_ORIGIN (e.g. https://factory.mytko.dev) makes a preview build for the
// factory editor, with the editor bridge (src/components/EditorBridge.astro). Never set in production.
let editorOrigin;

try {
  editorOrigin = previewEditorOrigin(env.PREVIEW_EDITOR_ORIGIN);
} catch (error) {
  console.error(`\n✖ ${error instanceof Error ? error.message : error}\n`);
  process.exit(1);
}

// v3.12: SITE_NOINDEX=1 builds a site for no search engine (the factory's previews): noindex on every
// page, no canonical, no sitemap (src/config/indexing.ts).
let noindex;

try {
  noindex = parseNoindex(env.SITE_NOINDEX);
} catch (error) {
  console.error(`\n✖ ${error instanceof Error ? error.message : error}\n`);
  process.exit(1);
}

// contact.mode "local": Node server with /api/contact. "remote": a purely static
// site (no adapter) whose form posts to the shared form service.
const isLocalContact = siteData.contact.mode === "local";
const protocol = siteUrl.protocol.replace(":", "");
const hostname = siteUrl.hostname.replace(/^www\./, "");
const isLocalhost = ["localhost", "127.0.0.1"].includes(hostname);

const allowedDomains = isLocalhost
  ? [{ protocol, hostname }]
  : [
      { protocol, hostname },
      { protocol, hostname: `www.${hostname}` },
    ];

/**
 * v3.12: @astrojs/sitemap writes the home page as "https://host" (trailingSlash "never"); its canonical link is
 * "https://host/". Listed after the sitemap integration, so it runs once the sitemap files are written.
 * @type {import("astro").AstroIntegration}
 */
const sitemapHome = {
  name: "mytko-sitemap-home",
  hooks: {
    "astro:build:done": async ({ dir }) => {
      const outDir = fileURLToPath(dir);
      const home = `<loc>${siteUrl.origin}</loc>`;

      for (const file of (await readdir(outDir)).filter((name) => /^sitemap-\d+\.xml$/.test(name))) {
        const xml = await readFile(path.join(outDir, file), "utf8");
        if (xml.includes(home)) await writeFile(path.join(outDir, file), xml.replace(home, `<loc>${siteUrl.origin}/</loc>`));
      }
    },
  },
};

export default defineConfig({
  site: siteUrl.origin,
  // Build output; `npm run site:build -- --out <dir>` sets OUT_DIR.
  outDir: env.OUT_DIR || "./dist",
  // Pages are prerendered at build time (fast, cacheable, images generated once).
  // Routes with `export const prerender = false` (the contact API) run on demand.
  output: "static",
  // One URL form everywhere: canonical, sitemap and links have no trailing slash.
  trailingSlash: "never",

  adapter: isLocalContact ? node({ mode: "standalone" }) : undefined,

  vite: {
    plugins: [siteVitePlugin(siteDir, { gaId, editorOrigin, noindex })],
    server: {
      // SITE_DIR may live outside the project (client sites repository).
      fs: { allow: [process.cwd(), siteDir] },
    },
    resolve: {
      alias: {
        // Assets of the site being built.
        "@site": siteDir,
        "@": "/src",
        "@components": "/src/components",
        "@styles": "/src/styles",
        "@scripts": "/scripts",
        "@assets": "/src/assets",
      },
    },
  },

  // No Markdown code blocks in the starter; Shiki's inline styles conflict with CSP.
  markdown: {
    syntaxHighlight: false,
  },

  integrations: [
    {
      name: "mytko-contact-api",
      hooks: {
        "astro:config:setup": ({ injectRoute }) => {
          if (isLocalContact) {
            injectRoute({ pattern: "/api/contact", entrypoint: "./src/site/routes/contact-api.ts", prerender: false });
          }
        },
      },
    },
    // v3.12: a SITE_NOINDEX build writes no sitemap at all.
    ...(noindex
      ? []
      : [
          sitemap({
            filter: (page) => {
              const pathname = normalizePath(new URL(page).pathname);

              return ![...noindexPaths, ...sitemapExcludedPaths].includes(pathname);
            },
            // v3.12: lastmod where the site knows the date.
            serialize: (item) => {
              const date = lastmod.get(normalizePath(new URL(item.url).pathname));

              return date ? { ...item, lastmod: date } : item;
            },
          }),
          sitemapHome,
        ]),
  ],

  security: {
    checkOrigin: true,
    allowedDomains,

    // Content Security Policy from site.json (src/site/csp.ts). Astro adds hashes
    // for its own scripts and styles, so inline code needs no 'unsafe-inline'.
    csp: {
      directives: csp.directives,
      scriptDirective: {
        resources: csp.scriptResources,
      },
    },
  },
});
