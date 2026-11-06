/**
 * Builds one site: validation, system assets (tokens, fonts, icons) and Astro.
 * Usage: npm run site:build -- --site sites/_demo [--out dist-sites/demo]
 * The output (default ./dist) is served by `node server.mjs` (OUT_DIR=<out>).
 * --out may be outside the project (the orchestrator's workspace).
 */
import { loadSite, resolveSiteDir, SiteValidationError } from "../../src/site/loader";
import { getFlag } from "./args";
import { runBuild } from "./lib";

const dir = resolveSiteDir(getFlag("site"));
const out = getFlag("out");

try {
  loadSite(dir);
} catch (error) {
  if (error instanceof SiteValidationError) {
    console.error(`✖ ${dir}\n${error.message}`);
    process.exit(1);
  }

  throw error;
}

process.exit(runBuild(dir, out ?? "dist") ? 0 : 1);
