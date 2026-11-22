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

/** Port for serve(): --port or SITE_PORT, else 0 — a free port chosen by the system. */
const servePort = () => Number(getFlag("port") ?? process.env.SITE_PORT ?? 0);

/**
 * Starts server.mjs for a built site and resolves with its URL once it listens. Reports may run in
 * parallel (the generator), so the port is a free one unless --port / SITE_PORT asks for one. The
 * URL comes from the child's own "listening" line: requests reach this site, never another server
 * on a taken port. A child that exits before or while serving stops the run loudly.
 */
export function serve(context: SiteContext, port = servePort()): Promise<{ url: string; stop: () => void }> {
  const site = context.loaded.site.siteId;
  const child: ChildProcess = spawn("node", ["server.mjs", String(port)], {
    env: { ...process.env, OUT_DIR: distDir(context), HOST: "localhost", SITE_DIR: context.dir },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  let serving = false;
  let stopped = false;
  const stop = () => {
    stopped = true;
    child.kill();
  };

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      stop();
      reject(new Error(`Server for ${site} did not start:\n${output.trim()}`));
    }, 15_000);

    // Kept reading while serving, so the child never blocks on a full pipe.
    const read = (chunk: Buffer) => {
      if (serving) return;
      output += chunk;
      const url = /Server listening on (http:\/\/\S+)/.exec(output)?.[1];
      if (!url) return;
      serving = true;
      clearTimeout(timer);
      resolve({ url, stop });
    };
    child.stdout?.on("data", read);
    child.stderr?.on("data", read);
    child.on("error", reject);

    child.on("exit", (code, signal) => {
      if (stopped) return;
      clearTimeout(timer);
      const error = `✖ Server for ${site} exited ${serving ? "while serving" : "before it listened"} (${signal ?? `code ${code}`}):\n${output.trim()}`;
      if (!serving) reject(new Error(error));
      else {
        console.error(error);
        process.exit(1);
      }
    });
  });
}

/** Every page of the site: pages[] and v3.9 the blog's posts (their own pages). */
export const pagesOf = (context: SiteContext) => {
  const { pages, blog } = context.loaded.site;
  return [
    ...pages.map((page) => ({ id: page.id, slug: page.slug, title: page.title })),
    ...(blog?.posts ?? []).map((post) => ({ id: `post-${post.id}`, slug: `${blog!.path}/${post.slug}`, title: post.title })),
  ];
};

export function writeJson(file: string, data: unknown) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}
