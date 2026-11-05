/**
 * Lighthouse CI: quality gates for performance, accessibility, best practices and SEO.
 * Runs against the production build (npm run build first). Uses Playwright's Chromium.
 */
const { chromium } = require("@playwright/test");

const PORT = 4331;

module.exports = {
  ci: {
    collect: {
      startServerCommand: `node scripts/serve-dist.js ${PORT}`,
      startServerReadyPattern: "Server listening",
      url: [`http://localhost:${PORT}/`, `http://localhost:${PORT}/contact`],
      numberOfRuns: 1,
      chromePath: chromium.executablePath(),
      settings: {
        chromeFlags: "--headless=new --no-sandbox",
      },
    },
    assert: {
      assertions: {
        "categories:performance": ["error", { minScore: 0.9 }],
        "categories:accessibility": ["error", { minScore: 0.95 }],
        "categories:best-practices": ["error", { minScore: 0.95 }],
        "categories:seo": ["error", { minScore: 0.95 }],
      },
    },
    upload: {
      target: "filesystem",
      outputDir: ".lighthouseci",
    },
  },
};
