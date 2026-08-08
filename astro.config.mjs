// @ts-check
import { defineConfig } from "astro/config";
import node from "@astrojs/node";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://domain-name.pl",
  output: "server",

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

  integrations: [
    sitemap({
      filter: (page) => {
        const pathname = new URL(page).pathname;

        return ![
          "/privacy",
        ].includes(pathname);
      },
    }),
  ],

  security: {
    checkOrigin: true,
    allowedDomains: [
      {
        protocol: "https",
        hostname: "domain-name.pl",
      },
      {
        protocol: "https",
        hostname: "www.domain-name.pl",
      },
    ],
  },
});