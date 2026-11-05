/**
 * Generates browser and app icons from public/favicon.svg:
 * - public/favicon.ico (32×32, PNG inside an ICO container)
 * - public/icons/apple-touch-icon.png (180×180, opaque background)
 * - public/icons/icon-192.png and icon-512.png (web app manifest, JSON-LD logo)
 *
 * Usage: node scripts/build-app-icons.js
 */
import fs from "fs";
import path from "path";
import sharp from "sharp";

const SOURCE = "public/favicon.svg";
const ICONS_DIR = "public/icons";
// Apple touch icons should not be transparent.
const APPLE_BACKGROUND = "#ffffff";

if (!fs.existsSync(SOURCE)) {
  console.error(`Missing ${SOURCE}`);
  process.exit(1);
}

fs.mkdirSync(ICONS_DIR, { recursive: true });

const svg = fs.readFileSync(SOURCE);
const render = (size) => sharp(svg, { density: 384 }).resize(size, size);

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

const outputs = [
  ["icon-192.png", 192],
  ["icon-512.png", 512],
];

for (const [file, size] of outputs) {
  await render(size).png().toFile(path.join(ICONS_DIR, file));
  console.log(`Generated ${ICONS_DIR}/${file}`);
}

// Apple: icon at ~80% size on an opaque square, as iOS adds its own rounding.
const appleSize = 180;
const appleInner = Math.round(appleSize * 0.8);
const appleIcon = await render(appleInner).png().toBuffer();

await sharp({
  create: {
    width: appleSize,
    height: appleSize,
    channels: 4,
    background: APPLE_BACKGROUND,
  },
})
  .composite([{ input: appleIcon, gravity: "center" }])
  .png()
  .toFile(path.join(ICONS_DIR, "apple-touch-icon.png"));

console.log(`Generated ${ICONS_DIR}/apple-touch-icon.png`);

const faviconPng = await render(32).png().toBuffer();
fs.writeFileSync("public/favicon.ico", pngToIco(faviconPng, 32));
console.log("Generated public/favicon.ico");
