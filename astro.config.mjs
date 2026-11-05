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

const { SITE_URL = "http://localhost:4321" } = loadEnv(
  process.env.NODE_ENV ?? "development",
  process.cwd(),
  "",
);

const siteUrl = new URL(SITE_URL);
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
  output: "server",
  // One URL form everywhere: canonical, sitemap and links have no trailing slash.
  trailingSlash: "never",

  adapter: node({
    mode: "standalone",
  }),

  vite: {
    resolve: {
      alias: {
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

    // Content Security Policy. Astro adds hashes for its own scripts and styles,
    // so inline code needs no 'unsafe-inline'. Google hosts are needed only
    // after the visitor accepts analytics.
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' data: https://www.googletagmanager.com https://*.google-analytics.com",
        "connect-src 'self' https://www.googletagmanager.com https://*.google-analytics.com https://*.analytics.google.com",
        "font-src 'self'",
        "manifest-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
      ],
      scriptDirective: {
        resources: ["'self'", "https://www.googletagmanager.com"],
      },
    },
  },
});
