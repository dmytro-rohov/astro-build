/**
 * Generates the site's brand files from SITE_DIR/site.json:
 *
 * Icons — source: meta.icon (square SVG/PNG), otherwise a monogram (first letter
 * of meta.name on the accent color):
 * - public/favicon.ico (32×32, PNG inside an ICO container)
 * - public/favicon.svg (SVG sources and monograms)
 * - public/icons/icon-192.png, icon-512.png (manifest, JSON-LD logo)
 * - public/icons/apple-touch-icon.png (180×180, opaque)
 *
 * Open Graph — when meta.seo.image is not set:
 * - public/og-cover.jpg (1200×630): v3.12 the home page's hero photo cropped around its focal
 *   point; without one a card with the name, description and colors of the site.
 *   Text is converted to vector paths with fontkit, so the result does not
 *   depend on fonts installed on the machine.
 *
 * Logo (v3.12), for structured data, which wants a raster image of at least 112×112:
 * - public/icons/logo.png: meta.logo (SVG or PNG) at most 600 px, padded to 112 px each way.
 *   Without meta.logo an uploaded meta.icon serves (icon-512.png); a monogram is no logo.
 *
 * - src/design-system/appIcons.generated.ts (flags for BaseLayout)
 *
 * Usage: SITE_DIR=sites/_demo node scripts/build-app-icons.js
 */
import fs from "fs";
import path from "path";
import * as fontkit from "fontkit";
import fontverter from "fontverter";
import sharp from "sharp";

const SITE_DIR = path.resolve(process.env.SITE_DIR || "sites/_demo");
const ICONS_DIR = "public/icons";
const GENERATED = "src/design-system/appIcons.generated.ts";
// Inter variable font (latin) from the font library; bold is a variation of it.
const FONT_FILE = "node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2";
// fontkit cannot apply variations to WOFF2, so the font is converted to TrueType first.
const fontData = await fontverter.convert(fs.readFileSync(FONT_FILE), "truetype");
const loadFont = (weight) => fontkit.create(fontData).getVariation({ wght: weight });

// Defaults match the default theme (semantic action.primary / background.inverse).
const DEFAULT_ACCENT = "#2563eb";
const OG_BACKGROUND = "#111827";
const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
// Google's minimum for a logo in structured data, each way.
const LOGO_MIN = 112;

const site = JSON.parse(fs.readFileSync(path.join(SITE_DIR, "site.json"), "utf8"));
const assetsFile = path.join(SITE_DIR, "assets", "assets.json");
const assets = fs.existsSync(assetsFile) ? JSON.parse(fs.readFileSync(assetsFile, "utf8")) : {};

const accent = site.theme?.accent ?? DEFAULT_ACCENT;
const name = site.meta?.name ?? "Site";

function assetPath(ref) {
  if (typeof ref !== "string" || !ref.startsWith("asset:")) return undefined;

  const entry = assets[ref.slice("asset:".length)];
  return entry ? path.join(SITE_DIR, "assets", entry.file) : undefined;
}

/** Dark or white text, whichever reads better on the given background. */
function textColorOn(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const linear = (value) => (value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  const luminance = 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);

  return luminance > 0.4 ? "#111827" : "#ffffff";
}

/** SVG path data for a line of text, starting at the (x, y) baseline, `size` px. */
function textPath(font, text, x, y, size) {
  const scale = size / font.unitsPerEm;
  const run = font.layout(text);
  let cursor = x;
  let d = "";

  run.glyphs.forEach((glyph, index) => {
    const position = run.positions[index];
    const glyphPath = glyph.path
      .scale(scale, -scale)
      .translate(cursor + position.xOffset * scale, y - position.yOffset * scale);
    d += glyphPath.toSVG();
    cursor += position.xAdvance * scale;
  });

  return { d, width: cursor - x };
}

/** Greedy word wrap by measured width; at most `maxLines` lines (the last one ends with …). */
function wrap(font, text, size, maxWidth, maxLines) {
  const width = (value) => textPath(font, value, 0, 0, size).width;
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;

    if (width(candidate) <= maxWidth) {
      line = candidate;
      continue;
    }

    if (line) lines.push(line);
    line = word;
    if (lines.length === maxLines) break;
  }

  if (line && lines.length < maxLines) lines.push(line);

  if (lines.length === maxLines && lines.join(" ").length < words.join(" ").length) {
    let last = lines[maxLines - 1];
    while (last && width(`${last}…`) > maxWidth) last = last.split(" ").slice(0, -1).join(" ");
    lines[maxLines - 1] = `${last}…`;
  }

  return lines;
}

function monogramSvg() {
  const font = loadFont(700);
  const letter = (name.trim()[0] ?? "S").toUpperCase();
  const size = 300;
  const { d, width } = textPath(font, letter, 0, 0, size);
  const capHeight = ((font.capHeight || font.unitsPerEm * 0.7) * size) / font.unitsPerEm;
  const x = (512 - width) / 2;
  const y = (512 + capHeight) / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="112" fill="${accent}"/>
  <path transform="translate(${x.toFixed(1)} ${y.toFixed(1)})" d="${d}" fill="${textColorOn(accent)}"/>
</svg>
`;
}

/** Wraps one PNG in an ICO container (supported by all current browsers). */
function pngToIco(png, size) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);

  const entry = Buffer.alloc(16);
  entry.writeUInt8(size >= 256 ? 0 : size, 0);
  entry.writeUInt8(size >= 256 ? 0 : size, 1);
  entry.writeUInt8(0, 2);
  entry.writeUInt8(0, 3);
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(png.length, 8);
  entry.writeUInt32LE(header.length + entry.length, 12);

  return Buffer.concat([header, entry, png]);
}

async function buildIcons() {
  const iconFile = assetPath(site.meta?.icon);
  const isSvg = !iconFile || iconFile.endsWith(".svg");
  const input = iconFile ? fs.readFileSync(iconFile) : Buffer.from(monogramSvg());

  const render = (size) =>
    sharp(input, isSvg ? { density: 384 } : {}).resize(size, size, { fit: "contain", background: "#0000" });

  fs.mkdirSync(ICONS_DIR, { recursive: true });

  for (const size of [192, 512]) {
    await render(size).png().toFile(path.join(ICONS_DIR, `icon-${size}.png`));
  }

  // Apple: opaque square using the icon's own color near the left edge.
  const sample = await render(256).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const index = (Math.round(sample.info.height / 2) * sample.info.width + Math.round(sample.info.width * 0.1)) * 4;
  const [r, g, b, a] = sample.data.subarray(index, index + 4);

  await sharp({
    create: { width: 180, height: 180, channels: 4, background: a > 200 ? { r, g, b, alpha: 1 } : "#ffffff" },
  })
    .composite([{ input: await render(180).png().toBuffer() }])
    .png()
    .toFile(path.join(ICONS_DIR, "apple-touch-icon.png"));

  fs.writeFileSync("public/favicon.ico", pngToIco(await render(32).png().toBuffer(), 32));

  if (isSvg) {
    fs.writeFileSync("public/favicon.svg", input);
  } else if (fs.existsSync("public/favicon.svg")) {
    fs.unlinkSync("public/favicon.svg");
  }

  return isSvg;
}

/** v3.12: the logo for structured data (see the top of the file); its public path, or null. */
async function buildLogo() {
  const output = path.join(ICONS_DIR, "logo.png");
  const logoFile = assetPath(site.meta?.logo);
  if (fs.existsSync(output)) fs.unlinkSync(output);

  if (!logoFile) return assetPath(site.meta?.icon) ? "/icons/icon-512.png" : null;

  const isSvg = logoFile.endsWith(".svg");
  const { data, info } = await sharp(fs.readFileSync(logoFile), isSvg ? { density: 384 } : {})
    .resize({ width: 600, height: 600, fit: "inside", withoutEnlargement: !isSvg })
    .png()
    .toBuffer({ resolveWithObject: true });
  // A wide logo is short: transparent space up to 112 px keeps it sharp (no upscaling).
  const pad = (size) => Math.max(0, Math.ceil((LOGO_MIN - size) / 2));

  await sharp(data)
    .extend({ top: pad(info.height), bottom: pad(info.height), left: pad(info.width), right: pad(info.width), background: "#0000" })
    .png()
    .toFile(output);

  return "/icons/logo.png";
}

/** v3.12: the photo of the home page's hero (its first section), with the focal point; undefined without one. */
function heroPhoto() {
  const hero = site.pages?.find((page) => page.slug === "/")?.sections?.[0];
  const ref = hero?.type === "hero" ? hero.content?.image : undefined;
  const file = assetPath(ref);

  return file ? { file, focal: assets[ref.slice("asset:".length)]?.focal ?? { x: 50, y: 50 } } : undefined;
}

/** The photo scaled to cover 1200×630 and cropped around its focal point. */
async function photoCover({ file, focal }) {
  // Turned by its EXIF orientation first, so the sizes below are the visible ones.
  const { data, info } = await sharp(file).rotate().toBuffer({ resolveWithObject: true });
  const scale = Math.max(OG_WIDTH / info.width, OG_HEIGHT / info.height);
  const width = Math.max(OG_WIDTH, Math.round(info.width * scale));
  const height = Math.max(OG_HEIGHT, Math.round(info.height * scale));
  const clamp = (value, max) => Math.min(Math.max(Math.round(value), 0), max);

  await sharp(data)
    .resize(width, height)
    .extract({
      left: clamp((width * focal.x) / 100 - OG_WIDTH / 2, width - OG_WIDTH),
      top: clamp((height * focal.y) / 100 - OG_HEIGHT / 2, height - OG_HEIGHT),
      width: OG_WIDTH,
      height: OG_HEIGHT,
    })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile("public/og-cover.jpg");
}

/** What /og-cover.jpg shows: "photo" (the hero photo), "card" (the text card) or null (meta.seo.image is used). */
async function buildOgImage() {
  if (site.meta?.seo?.image) {
    if (fs.existsSync("public/og-cover.jpg")) fs.unlinkSync("public/og-cover.jpg");
    return null;
  }

  const photo = heroPhoto();
  if (photo) {
    await photoCover(photo);
    return "photo";
  }

  const bold = loadFont(700);
  const regular = loadFont(400);

  const left = 96;
  const maxWidth = 1200 - left * 2;
  const titleLines = wrap(bold, name, 84, maxWidth, 2);
  const descriptionLines = wrap(regular, site.meta?.description ?? "", 36, maxWidth, 3);

  const blockHeight = titleLines.length * 96 + 32 + descriptionLines.length * 50;
  let y = (630 - blockHeight) / 2 + 78;
  let paths = "";

  for (const line of titleLines) {
    paths += `<path d="${textPath(bold, line, left, y, 84).d}" fill="#ffffff"/>`;
    y += 96;
  }

  y += 10;

  for (const line of descriptionLines) {
    paths += `<path d="${textPath(regular, line, left, y, 36).d}" fill="#d1d5db"/>`;
    y += 50;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="${OG_BACKGROUND}"/>
  <rect x="0" y="0" width="24" height="630" fill="${accent}"/>
  ${paths}
</svg>`;

  await sharp(Buffer.from(svg)).jpeg({ quality: 85, mozjpeg: true }).toFile("public/og-cover.jpg");
  return "card";
}

const hasSvgFavicon = await buildIcons();
const ogCover = await buildOgImage();
const brandLogo = await buildLogo();

fs.writeFileSync(
  GENERATED,
  `/* AUTO-GENERATED FILE – DO NOT EDIT */
/* Source: scripts/build-app-icons.js */

/** True when /favicon.svg exists (SVG icon source or monogram). */
export const hasSvgFavicon = ${hasSvgFavicon};

/** True when /og-cover.jpg was generated (no meta.seo.image in site.json). */
export const hasGeneratedOgImage = ${ogCover !== null};

/** v3.12: what /og-cover.jpg shows: the hero photo, the text card, or nothing (meta.seo.image is used). */
export const ogCover: "photo" | "card" | null = ${JSON.stringify(ogCover)};

/** v3.12: the raster logo for structured data; null when the site has only the generated monogram. */
export const brandLogo: string | null = ${JSON.stringify(brandLogo)};
`,
);

console.log(`Brand files generated for "${site.siteId}"${ogCover ? ` (Open Graph image: ${ogCover})` : ""}${brandLogo ? `, logo ${brandLogo}` : ""}.`);
