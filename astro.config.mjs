// @ts-check
import { defineConfig } from "astro/config";
import node from "@astrojs/node";

export default defineConfig({
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
        "@assets": "/src/assets",
      },
    },
  },
});