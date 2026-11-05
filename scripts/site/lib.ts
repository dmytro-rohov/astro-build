/** Shared helpers for the site CLI (build, serve, list pages). */
import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { loadSite, resolveSiteDir, SiteValidationError, type LoadedSite } from "../../src/site/loader";
import { getFlag } from "./args";

export type SiteContext = { dir: string; out: string; loaded: LoadedSite };

/** Resolves --site and --out (default: .generated/sites/<siteId>) and validates the site. */
export function siteContext(): SiteContext {
  const dir = resolveSiteDir(getFlag("site"));

  try {
    const loaded = loadSite(dir);
    const out = path.resolve(getFlag("out") ?? path.join(".generated/sites", loaded.site.siteId));
    return { dir, out, loaded };
  } catch (error) {
    if (error instanceof SiteValidationError) {
      console.error(`✖ ${dir}\n${error.message}`);
      process.exit(1);
    }

    throw error;
  }
}

/** Full build (system assets + Astro) of one site into `out/dist`. */
export function buildSite(context: SiteContext, quiet = false): boolean {
  const result = spawnSync("npm", ["run", "build"], {
    stdio: quiet ? "pipe" : "inherit",
    env: { ...process.env, SITE_DIR: context.dir, OUT_DIR: distDir(context) },
  });

  if (result.status !== 0 && quiet) {
    process.stderr.write(result.stdout?.toString() ?? "");
    process.stderr.write(result.stderr?.toString() ?? "");
  }

  return result.status === 0;
}

export const distDir = (context: SiteContext) => path.join(context.out, "dist");

/** Starts server.mjs for a built site and resolves when it answers. */
export async function serve(context: SiteContext, port: number): Promise<{ url: string; stop: () => void }> {
  const child: ChildProcess = spawn("node", ["server.mjs", String(port)], {
    env: { ...process.env, OUT_DIR: distDir(context), HOST: "localhost", SITE_DIR: context.dir },
    stdio: "ignore",
  });
  const url = `http://localhost:${port}`;

  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      if ((await fetch(url)).ok) return { url, stop: () => child.kill() };
    } catch {
      // not up yet
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  child.kill();
  throw new Error(`Server for ${context.loaded.site.siteId} did not start on ${url}`);
}

export const pagesOf = (context: SiteContext) => context.loaded.site.pages.map((page) => ({ id: page.id, slug: page.slug, title: page.title }));

export function writeJson(file: string, data: unknown) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}
