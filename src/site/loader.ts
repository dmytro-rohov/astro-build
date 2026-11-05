/**
 * Loads and validates a site directory (SITE_DIR): site.json + assets/assets.json.
 * Runs in Node (astro.config, build scripts, CLI, tests) — no Vite or Astro imports.
 * Any problem throws a SiteValidationError with one readable line per issue.
 */
import fs from "node:fs";
import path from "node:path";
import type { z } from "zod";
import { AssetsSchema, type Assets } from "./schema/assets";
import { SiteSchema, type Site } from "./schema/site";

export const DEFAULT_SITE_DIR = "sites/_demo";

export type LoadedSite = {
  /** Absolute path of the site directory. */
  dir: string;
  site: Site;
  assets: Assets;
};

export class SiteValidationError extends Error {
  constructor(
    public readonly file: string,
    public readonly issues: string[],
  ) {
    super(`Invalid ${file}:\n${issues.map((issue) => `  - ${issue}`).join("\n")}`);
    this.name = "SiteValidationError";
  }
}

/** Absolute site directory from an explicit path, SITE_DIR or the demo site. */
export function resolveSiteDir(dir = process.env.SITE_DIR || DEFAULT_SITE_DIR): string {
  return path.resolve(process.cwd(), dir);
}

/** "pages[0].sections[2].content.title: Too big…" */
export function formatIssues(issues: z.core.$ZodIssue[]): string[] {
  return issues.map((issue) => {
    const where = issue.path.reduce<string>(
      (result, key) => (typeof key === "number" ? `${result}[${key}]` : result ? `${result}.${String(key)}` : String(key)),
      "",
    );

    return where ? `${where}: ${issue.message}` : issue.message;
  });
}

function readJson(file: string): unknown {
  if (!fs.existsSync(file)) {
    throw new SiteValidationError(path.basename(file), [`File not found: ${file}`]);
  }

  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    throw new SiteValidationError(path.basename(file), [`Not valid JSON: ${(error as Error).message}`]);
  }
}

/** Every "asset:<id>" string anywhere in the site, with its path. */
function collectAssetRefs(value: unknown, at: string, found: { id: string; at: string }[] = []) {
  if (typeof value === "string" && value.startsWith("asset:")) {
    found.push({ id: value.slice("asset:".length), at });
  } else if (Array.isArray(value)) {
    value.forEach((item, index) => collectAssetRefs(item, `${at}[${index}]`, found));
  } else if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      collectAssetRefs(item, at ? `${at}.${key}` : key, found);
    }
  }

  return found;
}

function availableLanguages(): string[] {
  const dictionaries = path.resolve(process.cwd(), "src/i18n/dictionaries");

  return fs
    .readdirSync(dictionaries)
    .filter((file) => file.endsWith(".ts") && file !== "index.ts")
    .map((file) => file.replace(/\.ts$/, ""));
}

export function loadSite(dir = resolveSiteDir()): LoadedSite {
  const siteFile = path.join(dir, "site.json");
  const parsed = SiteSchema.safeParse(readJson(siteFile));

  if (!parsed.success) {
    throw new SiteValidationError("site.json", formatIssues(parsed.error.issues));
  }

  const site = parsed.data;
  const issues: string[] = [];

  const languages = availableLanguages();
  if (!languages.includes(site.lang)) {
    issues.push(`lang: no dictionary for "${site.lang}". Add src/i18n/dictionaries/${site.lang}.ts or use one of: ${languages.join(", ")}.`);
  }

  const assetsFile = path.join(dir, "assets", "assets.json");
  let assets: Assets = {};

  if (fs.existsSync(assetsFile)) {
    const parsedAssets = AssetsSchema.safeParse(readJson(assetsFile));

    if (!parsedAssets.success) {
      throw new SiteValidationError("assets/assets.json", formatIssues(parsedAssets.error.issues));
    }

    assets = parsedAssets.data;

    for (const [id, entry] of Object.entries(assets)) {
      if (!fs.existsSync(path.join(dir, "assets", entry.file))) {
        issues.push(`assets/assets.json: "${id}" points to a missing file assets/${entry.file}.`);
      }
    }
  }

  for (const ref of collectAssetRefs(site, "")) {
    if (!assets[ref.id]) {
      issues.push(`${ref.at}: unknown asset "asset:${ref.id}" (add it to assets/assets.json).`);
    }
  }

  if (issues.length) {
    throw new SiteValidationError("site.json", issues);
  }

  return { dir, site, assets };
}
