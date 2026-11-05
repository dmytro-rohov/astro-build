/**
 * Dev server for one site (live reload on site.json and asset changes).
 * Usage: npm run site:preview -- --site sites/_demo [--port 4321]
 */
import { spawnSync } from "node:child_process";
import { resolveSiteDir } from "../../src/site/loader";
import { getFlag } from "./args";
import { siteContext } from "./lib";

const { dir } = siteContext();
const port = getFlag("port") ?? "4321";
const env = { ...process.env, SITE_DIR: resolveSiteDir(dir) };

// Fonts, tokens and icons are generated for the site first, then Astro dev starts.
if (spawnSync("npm", ["run", "build:system"], { stdio: "inherit", env }).status !== 0) process.exit(1);
spawnSync("npx", ["astro", "dev", "--port", port], { stdio: "inherit", env });
