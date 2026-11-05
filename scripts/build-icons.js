import crypto from "crypto";
import fs from "fs";
import path from "path";
import { loadConfig, optimize } from "svgo";
import svgstore from "svgstore";

const RAW_DIR = "src/assets/icons/raw";
const OUTPUT_DIR = "public/icons";
// The sprite file name contains a content hash (sprite.1a2b3c4d.svg) so the
// server can cache it for a year; Icon.astro reads the name from SPRITE_MODULE.
const SPRITE_MODULE = "src/design-system/sprite.generated.ts";

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function cleanOldSprite() {
  for (const file of fs.readdirSync(OUTPUT_DIR)) {
    if (!/^sprite(\.[0-9a-f]{8})?\.svg$/.test(file)) continue;

    fs.unlinkSync(path.join(OUTPUT_DIR, file));
    console.log(`Removed old sprite: ${file}`);
  }
}

function hasViewBox(svg) {
  return /viewBox\s*=\s*["'][^"']+["']/i.test(svg);
}

function getSvgSize(svg) {
  const widthMatch = svg.match(/width\s*=\s*["']([\d.]+)(px)?["']/i);
  const heightMatch = svg.match(/height\s*=\s*["']([\d.]+)(px)?["']/i);

  if (!widthMatch || !heightMatch) {
    return null;
  }

  const width = Number(widthMatch[1]);
  const height = Number(heightMatch[1]);

  if (!Number.isFinite(width) || !Number.isFinite(height)) {
    return null;
  }

  return { width, height };
}

function addViewBoxIfMissing(svg, file) {
  if (hasViewBox(svg)) {
    return svg;
  }

  const size = getSvgSize(svg);

  if (!size) {
    console.warn(
      `Warning: ${file} has no viewBox and no numeric width/height. Add viewBox manually.`
    );

    return svg;
  }

  const viewBox = `viewBox="0 0 ${size.width} ${size.height}"`;

  console.warn(
    `Warning: ${file} had no viewBox. Added ${viewBox}.`
  );

  return svg.replace("<svg", `<svg ${viewBox}`);
}

ensureDir(OUTPUT_DIR);
cleanOldSprite();

// optimize() does not read config files by itself.
const svgoConfig = await loadConfig(path.resolve("svgo.config.js"));

if (!fs.existsSync(RAW_DIR)) {
  console.error(`Raw icons directory does not exist: ${RAW_DIR}`);
  process.exit(1);
}

const sprites = svgstore({
  inline: true,
  // Keep drawing attributes set on the root <svg> (stroke icons rely on them).
  copyAttrs: ["fill", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin"],
});

const files = fs
  .readdirSync(RAW_DIR)
  .filter((file) => file.endsWith(".svg"))
  .sort();

if (!files.length) {
  console.log("No SVG files found.");
  process.exit(0);
}

files.forEach((file) => {
  const filePath = path.join(RAW_DIR, file);
  const rawSvg = fs.readFileSync(filePath, "utf8");

  const svgWithViewBox = addViewBoxIfMissing(rawSvg, file);

  const result = optimize(svgWithViewBox, {
    ...svgoConfig,
    path: filePath,
  });

  const name = path.basename(file, ".svg");

  sprites.add(name, result.data);

  console.log(`Processed: ${file} -> #${name}`);
});

const spriteContent = sprites.toString({
  inline: false,
});

const hash = crypto.createHash("sha256").update(spriteContent).digest("hex").slice(0, 8);
const outputPath = path.join(OUTPUT_DIR, `sprite.${hash}.svg`);

fs.writeFileSync(outputPath, spriteContent);
fs.writeFileSync(
  SPRITE_MODULE,
  `/* AUTO-GENERATED FILE – DO NOT EDIT */
/* Source: scripts/build-icons.js */

export const spriteUrl = "/${path.relative("public", outputPath)}";

/** Icon names available in the sprite (used by the site.json schema). */
export const iconNames = ${JSON.stringify(files.map((file) => path.basename(file, ".svg")))} as const;
`,
);

console.log(`SVG sprite generated successfully: ${outputPath}`);