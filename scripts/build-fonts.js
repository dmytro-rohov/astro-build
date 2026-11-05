/**
 * Builds web fonts from src/assets/fonts/raw/ — pure Node, no Python needed.
 *
 * For every raw font file it writes subsetted WOFF2 files to public/fonts/,
 * and generates:
 * - src/styles/abstracts/_fonts.scss — @font-face rules, plus a metric-matched
 *   "<Family> Fallback" face (local Arial) that limits layout shift (CLS)
 *   while the web font loads
 * - src/design-system/fonts.generated.ts — files to <link rel="preload">
 *
 * File naming: <family>-<weight or style name>.<ext>, e.g. inter-regular.woff2,
 * inter-bold.woff2, roboto-500-italic.ttf.
 *
 * Output file names contain a content hash (inter-400-latin.1a2b3c4d.woff2),
 * so the server can cache them for a year.
 *
 * Usage: node scripts/build-fonts.js [auto|latin|cyrillic|all]
 *   auto (default) — latin + latin-ext, plus cyrillic when the site language
 *                    (`lang` in SITE_DIR/site.json) uses Cyrillic script.
 */
import crypto from "crypto";
import fs from "fs";
import path from "path";
import subsetFont from "subset-font";
import * as fontkit from "fontkit";

const RAW_DIR = "src/assets/fonts/raw";
const OUTPUT_DIR = "public/fonts";
const SCSS_OUTPUT = "src/styles/abstracts/_fonts.scss";
const PRELOAD_OUTPUT = "src/design-system/fonts.generated.ts";

// Same ranges as Google Fonts (latin + latin-ext, cyrillic + cyrillic-ext):
// include typographic quotes „ ” ’, dashes – —, ellipsis …, € and ™.
const subsets = {
  latin: [
    "U+0000-00FF", "U+0131", "U+0152-0153", "U+02BB-02BC", "U+02C6", "U+02DA", "U+02DC",
    "U+0304", "U+0308", "U+0329", "U+2000-206F", "U+20AC", "U+2122", "U+2191", "U+2193",
    "U+2212", "U+2215", "U+FEFF", "U+FFFD",
  ].join(","),
  // Loaded by the browser only when a page uses these characters (e.g. ą ę ł ż ș).
  "latin-ext": [
    "U+0100-02BA", "U+02BD-02C5", "U+02C7-02CC", "U+02CE-02D7", "U+02DD-02FF",
    "U+1E00-1E9F", "U+1EF2-1EFF", "U+2020", "U+20A0-20AB", "U+20AD-20C0", "U+2113",
    "U+2C60-2C7F", "U+A720-A7FF",
  ].join(","),
  cyrillic: [
    "U+0301", "U+0400-045F", "U+0490-0491", "U+04B0-04B1", "U+2116",
    "U+0460-052F", "U+1C80-1C8A", "U+20B4", "U+2DE0-2DFF", "U+A640-A69F", "U+FE2E-FE2F",
  ].join(","),
};

// Languages written in Cyrillic script (ISO 639-1).
const CYRILLIC_LANGUAGES = ["uk", "ru", "be", "bg", "sr", "mk", "kk", "ky", "mn", "tg"];

// Arial metrics, used as the local fallback font. xWidthAvg is the average
// character width weighted by English letter frequency (as in Capsize).
const FALLBACK = {
  name: "Arial",
  unitsPerEm: 2048,
  xWidthAvg: 904,
};

// Letter frequency weights used to compare average character widths.
const LETTER_WEIGHTS = {
  a: 0.0668, b: 0.0122, c: 0.0228, d: 0.0348, e: 0.1039, f: 0.0182, g: 0.0165,
  h: 0.0499, i: 0.057, j: 0.0013, k: 0.0063, l: 0.0329, m: 0.0197, n: 0.0552,
  o: 0.0614, p: 0.0158, q: 0.0008, r: 0.049, s: 0.0518, t: 0.0741, u: 0.0226,
  v: 0.008, w: 0.0193, x: 0.0012, y: 0.0162, z: 0.0006, " ": 0.1818,
};

const mode = process.argv[2] || "auto";

if (!["auto", "latin", "cyrillic", "all"].includes(mode)) {
  console.error(`Invalid mode: ${mode}`);
  console.error(`Use one of: auto, latin, cyrillic, all`);
  process.exit(1);
}

/** Site language from SITE_DIR/site.json (validated later by the Astro build). */
function readSiteLanguage() {
  const siteFile = path.resolve(process.env.SITE_DIR || "sites/_demo", "site.json");

  try {
    return JSON.parse(fs.readFileSync(siteFile, "utf8")).lang ?? "en";
  } catch {
    console.warn(`Could not read ${siteFile}; building fonts for "en".`);
    return "en";
  }
}

const siteLanguage = readSiteLanguage();
const usesCyrillic = CYRILLIC_LANGUAGES.includes(siteLanguage.split("-")[0]);

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function toSlug(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Detect CSS font-family from the first part of the file name.
 *
 * Examples:
 * inter-regular.woff2    -> Inter
 * Roboto-Bold.ttf        -> Roboto
 * Montserrat-Medium.ttf  -> Montserrat
 */
function detectFamilyName(fileName) {
  const baseName = path.parse(fileName).name;

  const firstPart = baseName
    .split(/[-_\s]/)
    .filter(Boolean)[0];

  if (!firstPart) {
    console.error(`Cannot detect font family from file name: ${fileName}`);
    process.exit(1);
  }

  return firstPart.charAt(0).toUpperCase() + firstPart.slice(1);
}

function detectWeight(name) {
  const lower = name.toLowerCase();

  if (lower.includes("thin") || lower.includes("100")) return 100;
  if (lower.includes("extralight") || lower.includes("extra-light") || lower.includes("200")) return 200;
  if (lower.includes("light") || lower.includes("300")) return 300;
  if (lower.includes("regular") || lower.includes("400")) return 400;
  if (lower.includes("medium") || lower.includes("500")) return 500;
  if (lower.includes("semibold") || lower.includes("semi-bold") || lower.includes("600")) return 600;
  if (lower.includes("extrabold") || lower.includes("extra-bold") || lower.includes("800")) return 800;
  if (lower.includes("black") || lower.includes("900")) return 900;
  if (lower.includes("bold") || lower.includes("700")) return 700;

  return 400;
}

function detectStyle(name) {
  return name.toLowerCase().includes("italic") ? "italic" : "normal";
}

/** "U+0000-00FF,U+0100-017F" -> string with every character in the ranges. */
function unicodeRangeToText(range) {
  let text = "";

  for (const part of range.split(",")) {
    const [start, end = start] = part.replace(/U\+/gi, "").split("-");

    for (let code = parseInt(start, 16); code <= parseInt(end, 16); code++) {
      text += String.fromCodePoint(code);
    }
  }

  return text;
}

const percent = (value) => `${(value * 100).toFixed(2)}%`;

/** @font-face for a local fallback whose metrics match the web font. */
function createFallbackFace(familyName, fontBuffer) {
  const font = fontkit.create(fontBuffer);

  let avgWidth = 0;

  for (const [char, weight] of Object.entries(LETTER_WEIGHTS)) {
    avgWidth += font.glyphForCodePoint(char.codePointAt(0)).advanceWidth * weight;
  }

  if (!avgWidth) {
    return "";
  }

  const sizeAdjust =
    avgWidth / font.unitsPerEm / (FALLBACK.xWidthAvg / FALLBACK.unitsPerEm);
  const em = font.unitsPerEm * sizeAdjust;

  return `@font-face {
  font-family: "${familyName} Fallback";
  src: local("${FALLBACK.name}");
  size-adjust: ${percent(sizeAdjust)};
  ascent-override: ${percent(font.ascent / em)};
  descent-override: ${percent(Math.abs(font.descent) / em)};
  line-gap-override: ${percent(font.lineGap / em)};
}

`;
}

function cleanGeneratedFonts() {
  ensureDir(OUTPUT_DIR);

  const files = fs
    .readdirSync(OUTPUT_DIR)
    .filter((file) => file.endsWith(".woff2"));

  files.forEach((file) => {
    fs.unlinkSync(path.join(OUTPUT_DIR, file));
  });

  if (files.length) {
    console.log(`Removed ${files.length} old generated font file(s).`);
  }
}

function getFontFiles() {
  if (!fs.existsSync(RAW_DIR)) {
    console.error(`Raw fonts directory does not exist: ${RAW_DIR}`);
    process.exit(1);
  }

  return fs
    .readdirSync(RAW_DIR)
    .filter((file) => /\.(ttf|otf|woff|woff2)$/i.test(file))
    .sort();
}

function getModesToBuild() {
  const latin = ["latin", "latin-ext"];

  if (mode === "auto") {
    return usesCyrillic ? [...latin, "cyrillic"] : latin;
  }

  // A cyrillic-only build would miss digits, spaces and punctuation.
  return mode === "latin" ? latin : [...latin, "cyrillic"];
}

// The regular face of this subset is preloaded: it renders most of the text.
const primarySubset = usesCyrillic ? "cyrillic" : "latin";

cleanGeneratedFonts();

const fonts = getFontFiles();

if (!fonts.length) {
  console.log("No font files found.");
  process.exit(0);
}

const usedVariants = new Set();
const fallbackFamilies = new Map();
const preloads = [];
const modesToBuild = getModesToBuild();

let faces = "";

for (const file of fonts) {
  const inputPath = path.join(RAW_DIR, file);
  const baseName = path.parse(file).name;

  const familyName = detectFamilyName(file);
  const familySlug = toSlug(familyName);

  const weight = detectWeight(baseName);
  const style = detectStyle(baseName);

  const variantKey = `${familyName}-${weight}-${style}`;

  if (usedVariants.has(variantKey)) {
    console.error(`Duplicate font variant detected: ${variantKey}`);
    console.error(`Problematic file: ${file}`);
    console.error(`Keep only one file per family/weight/style in ${RAW_DIR}.`);
    process.exit(1);
  }

  usedVariants.add(variantKey);

  const source = fs.readFileSync(inputPath);

  // Fallback metrics come from the regular (400, normal) face of each family.
  if (weight === 400 && style === "normal" && !fallbackFamilies.has(familyName)) {
    fallbackFamilies.set(familyName, source);
  }

  for (const subsetName of modesToBuild) {
    const stylePart = style === "italic" ? "-italic" : "";

    const subset = await subsetFont(source, unicodeRangeToText(subsets[subsetName]), {
      targetFormat: "woff2",
    });

    const hash = crypto.createHash("sha256").update(subset).digest("hex").slice(0, 8);
    const outputFile = `${familySlug}-${weight}${stylePart}-${subsetName}.${hash}.woff2`;
    const outputPath = path.join(OUTPUT_DIR, outputFile);

    console.log(`Generating ${outputFile}`);

    fs.writeFileSync(outputPath, subset);

    if (subset.length < 2000) {
      console.warn(
        `Warning: ${outputFile} is very small (${subset.length} bytes). ` +
          `The source font may not contain glyphs for the "${subsetName}" subset.`
      );
    }

    if (subsetName === primarySubset && weight === 400 && style === "normal") {
      preloads.push(`/fonts/${outputFile}`);
    }

    faces += `@font-face {
  font-family: "${familyName}";
  src: url("/fonts/${outputFile}") format("woff2");
  font-weight: ${weight};
  font-style: ${style};
  font-display: swap;
  unicode-range: ${subsets[subsetName]};
}

`;
  }
}

let scssOutput = `/* AUTO-GENERATED FILE – DO NOT EDIT */\n`;
scssOutput += `/* Source: scripts/build-fonts.js */\n\n`;
scssOutput += faces;

for (const [familyName, source] of fallbackFamilies) {
  scssOutput += createFallbackFace(familyName, source);
}

ensureDir(path.dirname(SCSS_OUTPUT));
fs.writeFileSync(SCSS_OUTPUT, scssOutput.trimEnd() + "\n");

fs.writeFileSync(
  PRELOAD_OUTPUT,
  `/* AUTO-GENERATED FILE – DO NOT EDIT */
/* Source: scripts/build-fonts.js */

/** Font files preloaded in BaseLayout. */
export const fontPreloads: string[] = ${JSON.stringify(preloads, null, 2)};
`
);

console.log("Fonts built successfully.");
console.log(`Generated SCSS: ${SCSS_OUTPUT}`);
console.log(`Generated preload list: ${PRELOAD_OUTPUT}`);
