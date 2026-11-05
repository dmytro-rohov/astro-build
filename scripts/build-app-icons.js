/**
 * Generates browser and app icons from ONE source file:
 *   src/assets/brand/app-icon.svg  (preferred)  or  src/assets/brand/app-icon.png
 * (square; a PNG should be at least 512×512 with a transparent background).
 *
 * Outputs:
 * - public/favicon.ico (32×32, PNG inside an ICO container)
 * - public/favicon.svg (only when the source is SVG)
 * - public/icons/icon-32.png, icon-192.png, icon-512.png (manifest, JSON-LD logo)
 * - public/icons/apple-touch-icon.png (180×180, opaque)
 * - src/design-system/appIcons.generated.ts (which <link> tags BaseLayout renders)
 *
 * Usage: node scripts/build-app-icons.js
 */
import fs from "fs";
import path from "path";
import sharp from "sharp";

const BRAND_DIR = "src/assets/brand";
const ICONS_DIR = "public/icons";
const GENERATED = "src/design-system/appIcons.generated.ts";

const source = ["app-icon.svg", "app-icon.png"]
  .map((file) => path.join(BRAND_DIR, file))
  .find((file) => fs.existsSync(file));

if (!source) {
  console.error(`Missing icon source: ${BRAND_DIR}/app-icon.svg or app-icon.png`);
  process.exit(1);
}

const isSvg = source.endsWith(".svg");
const input = fs.readFileSync(source);
const render = (size) =>
  sharp(input, isSvg ? { density: 384 } : {}).resize(size, size, { fit: "contain", background: "#0000" });

fs.mkdirSync(ICONS_DIR, { recursive: true });

/** Wraps one PNG in an ICO container (supported by all current browsers). */
function pngToIco(png, size) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(1, 4); // image count

  const entry = Buffer.alloc(16);
  entry.writeUInt8(size >= 256 ? 0 : size, 0); // width
  entry.writeUInt8(size >= 256 ? 0 : size, 1); // height
  entry.writeUInt8(0, 2); // palette
  entry.writeUInt8(0, 3); // reserved
  entry.writeUInt16LE(1, 4); // color planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32LE(png.length, 8); // image size
  entry.writeUInt32LE(header.length + entry.length, 12); // image offset

  return Buffer.concat([header, entry, png]);
}

/**
 * Background for the Apple icon: the icon's own color a little inside the
 * left edge, so iOS rounding never shows white corners. Falls back to white.
 */
async function sampleBackground() {
  const { data, info } = await render(256).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const index = (Math.round(info.height / 2) * info.width + Math.round(info.width * 0.1)) * 4;
  const [r, g, b, a] = data.slice(index, index + 4);

  return a > 200 ? { r, g, b, alpha: 1 } : "#ffffff";
}

for (const size of [32, 192, 512]) {
  const file = path.join(ICONS_DIR, `icon-${size}.png`);
  await render(size).png().toFile(file);
  console.log(`Generated ${file}`);
}

// Apple: the icon on an opaque square; iOS adds its own corner rounding.
const appleSize = 180;
const appleIcon = await render(appleSize).png().toBuffer();

await sharp({
  create: {
    width: appleSize,
    height: appleSize,
    channels: 4,
    background: await sampleBackground(),
  },
})
  .composite([{ input: appleIcon }])
  .png()
  .toFile(path.join(ICONS_DIR, "apple-touch-icon.png"));

console.log(`Generated ${ICONS_DIR}/apple-touch-icon.png`);

const faviconPng = await render(32).png().toBuffer();
fs.writeFileSync("public/favicon.ico", pngToIco(faviconPng, 32));
console.log("Generated public/favicon.ico");

if (isSvg) {
  fs.copyFileSync(source, "public/favicon.svg");
  console.log("Copied public/favicon.svg");
} else if (fs.existsSync("public/favicon.svg")) {
  fs.unlinkSync("public/favicon.svg");
  console.log("Removed public/favicon.svg (source is PNG)");
}

fs.writeFileSync(
  GENERATED,
  `/* AUTO-GENERATED FILE – DO NOT EDIT */
/* Source: scripts/build-app-icons.js */

/** True when the icon source is SVG and /favicon.svg exists. */
export const hasSvgFavicon = ${isSvg};
`,
);
console.log(`Generated ${GENERATED}`);
