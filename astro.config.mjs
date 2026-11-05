// @ts-check
import { defineConfig } from "astro/config";
import { loadEnv } from "vite";
import node from "@astrojs/node";
import sitemap from "@astrojs/sitemap";
import {
  noindexPaths,
  normalizePath,
  sitemapExcludedPaths,
} from "./src/config/indexing.ts";
import { loadSite, resolveSiteDir, SiteValidationError } from "./src/site/loader.ts";
import { siteVitePlugin } from "./src/site/vite-plugin.ts";
import { cspForSite } from "./src/site/csp.ts";

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

const siteUrl = new URL(env.SITE_URL || siteData.meta.url || "http://localhost:4321");

// Analytics: site.json analytics.gaId; PUBLIC_GA_MEASUREMENT_ID overrides it (test builds).
const gaId = env.PUBLIC_GA_MEASUREMENT_ID || siteData.analytics.gaId || "";
const csp = cspForSite(siteData, gaId);
const protocol = siteUrl.protocol.replace(":", "");
const hostname = siteUrl.hostname.replace(/^www\./, "");
const isLocalhost = ["localhost", "127.0.0.1"].includes(hostname);

const allowedDomains = isLocalhost
  ? [{ protocol, hostname }]
  : [
      { protocol, hostname },
      { protocol, hostname: `www.${hostname}` },
    ];

export default defineConfig({
  site: siteUrl.origin,
  // Build output; `npm run site:build -- --out <dir>` sets OUT_DIR.
  outDir: env.OUT_DIR || "./dist",
  // Pages are prerendered at build time (fast, cacheable, images generated once).
  // Routes with `export const prerender = false` (the contact API) run on demand.
  output: "static",
  // One URL form everywhere: canonical, sitemap and links have no trailing slash.
  trailingSlash: "never",

  adapter: node({
    mode: "standalone",
  }),

  vite: {
    plugins: [siteVitePlugin(siteDir, { gaId })],
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
    sitemap({
      filter: (page) => {
        const pathname = normalizePath(new URL(page).pathname);

        return ![...noindexPaths, ...sitemapExcludedPaths].includes(pathname);
      },
    }),
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
