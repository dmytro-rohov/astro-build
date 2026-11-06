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

const ROOT = process.cwd();

const isInside = (dir: string, parent: string) => {
  const relative = path.relative(parent, dir);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
};

/**
 * Full build (system assets + Astro) of the site in `siteDir` into `outDir`.
 *
 * Astro imports its prerender chunks from the output directory, so a build
 * straight into a folder outside the project cannot resolve node_modules
 * ("Cannot find package …"). Such builds go to a staging folder inside the
 * project and are moved afterwards; a Node-server build (contact "local") gets
 * a node_modules link so `node server.mjs` runs from there too.
 */
export function runBuild(siteDir: string, outDir: string, quiet = false): boolean {
  const target = path.resolve(outDir);
  const staging = isInside(target, ROOT) ? target : path.join(ROOT, ".generated", "staging", path.basename(target));

  fs.rmSync(staging, { recursive: true, force: true });
  const result = spawnSync("npm", ["run", "build"], {
    stdio: quiet ? "pipe" : "inherit",
    env: { ...process.env, SITE_DIR: siteDir, OUT_DIR: staging },
  });

  if (result.status !== 0) {
    if (quiet) {
      process.stderr.write(result.stdout?.toString() ?? "");
      process.stderr.write(result.stderr?.toString() ?? "");
    }
    return false;
  }

  if (staging !== target) {
    fs.rmSync(target, { recursive: true, force: true });
    fs.mkdirSync(path.dirname(target), { recursive: true });
    try {
      fs.renameSync(staging, target);
    } catch {
      // Another filesystem: copy, then remove the staging folder.
      fs.cpSync(staging, target, { recursive: true });
      fs.rmSync(staging, { recursive: true, force: true });
    }

    if (fs.existsSync(path.join(target, "server", "entry.mjs"))) {
      fs.symlinkSync(path.join(ROOT, "node_modules"), path.join(target, "node_modules"), "junction");
    }
  }

  return true;
}

/** Full build of one site into `out/dist`. */
export const buildSite = (context: SiteContext, quiet = false) => runBuild(context.dir, distDir(context), quiet);

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
