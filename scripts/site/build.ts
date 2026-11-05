/**
 * Builds one site: validation, system assets (tokens, fonts, icons) and Astro.
 * Usage: npm run site:build -- --site sites/_demo [--out dist-sites/demo]
 * The output (default ./dist) is served by `node server.mjs` (or `--out` dir).
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { loadSite, resolveSiteDir, SiteValidationError } from "../../src/site/loader";
import { getFlag } from "./args";

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

const env = { ...process.env, SITE_DIR: dir, ...(out ? { OUT_DIR: path.resolve(out) } : {}) };
const result = spawnSync("npm", ["run", "build"], { stdio: "inherit", env });

process.exit(result.status ?? 1);
