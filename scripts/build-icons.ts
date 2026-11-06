/**
 * Builds the SVG sprite for the site in SITE_DIR from the engine's icon set
 * (src/design-system/icons/library.ts — Lucide, ISC license):
 * - only the icons the engine renders plus every "icon" used in site.json,
 *   so a site downloads a few KB, not the whole set (ICONS=all: every icon)
 * - public/icons/sprite.<hash>.svg — hashed, cached for a year by server.mjs
 * - src/design-system/sprite.generated.ts — sprite URL for Icon.astro
 * - public/icons/LICENSE-lucide.txt
 *
 * Usage: SITE_DIR=sites/_demo tsx scripts/build-icons.ts
 */
import crypto from "node:crypto";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { loadConfig, optimize } from "svgo";
import svgstore from "svgstore";
import { ENGINE_ICONS, ICON_NAMES, icons, lucideName, type IconName } from "../src/design-system/icons/library";

const OUTPUT_DIR = "public/icons";
const SPRITE_MODULE = "src/design-system/sprite.generated.ts";
const SITE_DIR = path.resolve(process.env.SITE_DIR || "sites/_demo");
const require = createRequire(import.meta.url);
const LUCIDE_DIR = path.join(path.dirname(require.resolve("lucide-static/package.json")), "icons");

/** Every string under an "icon" key in site.json. */
function usedIcons(value: unknown, found = new Set<string>()): Set<string> {
  if (Array.isArray(value)) value.forEach((item) => usedIcons(item, found));
  else if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      if (key === "icon" && typeof item === "string") found.add(item);
      else usedIcons(item, found);
    }
  }
  return found;
}

const site = JSON.parse(fs.readFileSync(path.join(SITE_DIR, "site.json"), "utf8"));
const wanted =
  process.env.ICONS === "all"
    ? [...ICON_NAMES]
    : [...new Set<string>([...ENGINE_ICONS, ...usedIcons(site)])].filter((name): name is IconName => name in icons).sort();

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
for (const file of fs.readdirSync(OUTPUT_DIR)) {
  if (/^sprite(\.[0-9a-f]{8})?\.svg$/.test(file)) fs.unlinkSync(path.join(OUTPUT_DIR, file));
}

// optimize() does not read config files by itself.
const svgoConfig = await loadConfig(path.resolve("svgo.config.js"));
const sprites = svgstore({
  inline: true,
  // Keep drawing attributes set on the root <svg> (stroke icons rely on them).
  copyAttrs: ["fill", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin"],
});

for (const name of wanted) {
  const file = path.join(LUCIDE_DIR, `${lucideName(name)}.svg`);
  const svg = fs.readFileSync(file, "utf8").replace(/<!--[\s\S]*?-->/g, "").replace(/\sclass="[^"]*"/, "");
  sprites.add(name, optimize(svg, { ...svgoConfig, path: file }).data);
}

const spriteContent = sprites.toString({ inline: false });
const hash = crypto.createHash("sha256").update(spriteContent).digest("hex").slice(0, 8);
const outputPath = path.join(OUTPUT_DIR, `sprite.${hash}.svg`);

fs.writeFileSync(outputPath, spriteContent);
fs.copyFileSync(path.join(LUCIDE_DIR, "..", "LICENSE"), path.join(OUTPUT_DIR, "LICENSE-lucide.txt"));
fs.writeFileSync(
  SPRITE_MODULE,
  `/* AUTO-GENERATED FILE – DO NOT EDIT */
/* Source: scripts/build-icons.ts */

export const spriteUrl = "/${path.relative("public", outputPath)}";

/** Icons in this site's sprite. */
export const spriteIcons = ${JSON.stringify(wanted)} as const;
`,
);

console.log(`SVG sprite: ${wanted.length} of ${ICON_NAMES.length} icons → ${outputPath}`);
