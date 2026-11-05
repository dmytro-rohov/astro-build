/**
 * Loads and validates a site directory (SITE_DIR): site.json + assets/assets.json.
 * Runs in Node (astro.config, build scripts, CLI, tests) — no Vite or Astro imports.
 * Any problem throws a SiteValidationError with one readable line per issue.
 */
import fs from "node:fs";
import path from "node:path";
import { imageSize } from "image-size";
import type { z } from "zod";
import { schemaVersionProblem } from "./migrations";
import { sectionTypes } from "./registry";
import { SPOTLIGHT_ITEMS } from "../sections/testimonials/schema";
import type { ImageSlot } from "./schema/fields";
import { AssetsSchema, type Assets } from "./schema/assets";
import { META_IMAGE_SLOTS, SiteSchema, type Site } from "./schema/site";
import { findImageSlots, valuesAt } from "./schema/slots";
import { fontFamilies, fontPairs, pairScripts, scriptsForLanguage } from "../design-system/fonts/library";
import { checkContrast, resolveTheme } from "../design-system/theme";

export const DEFAULT_SITE_DIR = "sites/_demo";

export type LoadedSite = {
  /** Absolute path of the site directory. */
  dir: string;
  site: Site;
  assets: Assets;
  /** Non-blocking notes for the build report (legal review, missing data…). */
  warnings: string[];
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

const formatPath = (at: (string | number)[]) =>
  at.reduce<string>((result, key) => (typeof key === "number" ? `${result}[${key}]` : result ? `${result}.${key}` : key), "");

/** Size and proportion checks for every image used in a slot. */
function checkImageSlots(site: Site, assets: Assets, dir: string): string[] {
  const issues: string[] = [];
  const uses: { ref: unknown; slot: ImageSlot; at: (string | number)[] }[] = [];

  uses.push(
    { ref: site.meta.logo, slot: META_IMAGE_SLOTS.logo, at: ["meta", "logo"] },
    { ref: site.meta.icon, slot: META_IMAGE_SLOTS.icon, at: ["meta", "icon"] },
    { ref: site.meta.seo.image, slot: META_IMAGE_SLOTS.ogImage, at: ["meta", "seo", "image"] },
  );

  site.pages.forEach((page, pageIndex) => {
    uses.push({ ref: page.seo.image, slot: META_IMAGE_SLOTS.ogImage, at: ["pages", pageIndex, "seo", "image"] });

    page.sections.forEach((section, sectionIndex) => {
      const type = sectionTypes.find((candidate) => candidate.type === section.type);
      if (!type) return;

      for (const { path, slot } of findImageSlots(type.content)) {
        for (const found of valuesAt(section.content, path)) {
          uses.push({ ref: found.value, slot, at: ["pages", pageIndex, "sections", sectionIndex, "content", ...found.at] });
        }
      }
    });
  });

  for (const { ref, slot, at } of uses) {
    if (typeof ref !== "string") continue;

    const entry = assets[ref.replace(/^asset:/, "")];
    if (!entry) continue; // reported as an unknown asset

    const where = formatPath(at);
    const isSvg = /\.svg$/i.test(entry.file);

    if (isSvg) {
      if (!slot.svg) issues.push(`${where}: "${ref}" is an SVG; this slot needs a photo (JPG, PNG, WebP or AVIF).`);
      continue;
    }

    let size: { width?: number; height?: number };

    try {
      size = imageSize(fs.readFileSync(path.join(dir, "assets", entry.file)));
    } catch {
      issues.push(`${where}: "${ref}" (${entry.file}) is not a readable image.`);
      continue;
    }

    const width = size.width ?? 0;
    const height = size.height ?? 0;

    // Width left after cropping to the slot's proportions.
    const croppedWidth = slot.aspect ? Math.min(width, Math.floor((height * slot.aspect[0]) / slot.aspect[1])) : width;

    if (croppedWidth < slot.minWidth) {
      const ratio = slot.aspect ? ` cropped to ${slot.aspect[0]}:${slot.aspect[1]}` : "";
      issues.push(
        `${where}: "${ref}" is ${width}×${height}px; this slot needs at least ${slot.minWidth}px width${ratio} (got ${croppedWidth}px).`,
      );
    }
  }

  return issues;
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
  const raw = readJson(siteFile);
  const versionProblem = schemaVersionProblem(raw);

  if (versionProblem) throw new SiteValidationError("site.json", [versionProblem]);

  const parsed = SiteSchema.safeParse(raw);

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

  if (!issues.length) {
    issues.push(...checkImageSlots(site, assets, dir));
  }

  // Fonts must cover the language's script (e.g. Cyrillic for "uk").
  const theme = resolveTheme(site.theme);
  const missingScripts = scriptsForLanguage(site.lang).filter((script) => !pairScripts(theme.fontPair).includes(script));

  if (missingScripts.length) {
    const pair = fontPairs[theme.fontPair];
    const suitable = Object.keys(fontPairs).filter((id) =>
      scriptsForLanguage(site.lang).every((script) => pairScripts(id as keyof typeof fontPairs).includes(script)),
    );
    issues.push(
      `theme.fontPair: "${theme.fontPair}" (${fontFamilies[pair.heading].family} + ${fontFamilies[pair.body].family}) has no ${missingScripts.join(", ")} glyphs needed for lang "${site.lang}". Use one of: ${suitable.join(", ")}.`,
    );
  }

  // Generated colors are adjusted automatically; manual overrides must pass as they are.
  for (const failure of checkContrast(theme)) {
    issues.push(
      `theme.overrides.${failure.scheme}: ${failure.foreground} on ${failure.background} has contrast ${failure.ratio}:1, WCAG AA needs ${failure.required}:1.`,
    );
  }

  if (issues.length) {
    throw new SiteValidationError("site.json", issues);
  }

  const warnings = [
    "privacy: the privacy policy is generated from a template — have it reviewed (controller, legal bases, retention) before launch.",
    ...(site.business.email ? [] : ["business.email: no public email — the privacy policy and contact sections show no email address."]),
    ...(site.meta.url || process.env.SITE_URL ? [] : ["meta.url: not set — canonical links and the sitemap use http://localhost:4321."]),
    // Only the schemes the site can show (both for "auto").
    ...theme.adjustments
      .filter((adjustment) => theme.colorScheme === "auto" || adjustment.scheme === theme.colorScheme)
      .map((adjustment) => `theme.accent: ${adjustment.from} was adjusted to ${adjustment.to} (${adjustment.scheme} scheme) to meet WCAG AA.`),
    ...site.pages.flatMap((page, pageIndex) =>
      page.sections.flatMap((section, sectionIndex) =>
        section.type === "testimonials" && section.variant === "spotlight" && section.content.items.length > SPOTLIGHT_ITEMS
          ? [`pages[${pageIndex}].sections[${sectionIndex}]: the "spotlight" variant shows the first ${SPOTLIGHT_ITEMS} of ${section.content.items.length} testimonials — use "cards" to show all.`]
          : [],
      ),
    ),
  ];

  return { dir, site, assets, warnings };
}
