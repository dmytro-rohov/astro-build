import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintPluginAstro from "eslint-plugin-astro";
import globals from "globals";

export default [
  {
    ignores: [
      "dist/**",
      "playwright-report/**",
      ".generated/**",
      "dist-catalog/**",
      "dist-gallery/**",
      "test-results/**",
      ".lighthouseci/**",
      "node_modules/**",
      ".astro/**",
      "public/icons/sprite.*.svg",
      "src/styles/abstracts/_tokens.scss",
      "src/styles/abstracts/_fonts.scss",
    ],
  },

  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...eslintPluginAstro.configs["flat/recommended"],

  {
    files: [
      "*.config.js",
      "*.config.mjs",
      "astro.config.mjs",
      "scripts/**/*.js",
      "lighthouserc.cjs",
      "server.mjs",
    ],

    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  {
    files: ["src/**/*.{astro,js,ts}"],

    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },
  {
  files: ["**/*.{ts,tsx,astro}"],
  rules: {
    "no-undef": "off",
  },
},

  // Unit tests deliberately edit raw site.json objects to break them.
  {
    files: ["tests/unit/**/*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },

  // Lighthouse CI loads its config with require(), so it stays CommonJS.
  {
    files: ["**/*.cjs"],
    languageOptions: {
      sourceType: "commonjs",
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
];