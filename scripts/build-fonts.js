import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const RAW_DIR = "src/assets/fonts/raw";
const OUTPUT_DIR = "public/fonts";
const SCSS_OUTPUT = "src/styles/abstracts/_fonts.scss";

const subsets = {
  latin: "U+0000-00FF,U+0100-017F",
  cyrillic: "U+0400-04FF,U+0500-052F",
};

const mode = process.argv[2] || "latin";

if (!["latin", "cyrillic", "all"].includes(mode)) {
  console.error(`Invalid mode: ${mode}`);
  console.error(`Use one of: latin, cyrillic, all`);
  process.exit(1);
}

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
 * Inter-Regular.ttf      -> Inter
 * Roboto-Bold.ttf        -> Roboto
 * Montserrat-Medium.ttf  -> Montserrat
 *
 * This allows multiple font families in RAW_DIR, as long as files are named consistently.
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

  return firstPart;
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
  return mode === "all" ? ["latin", "cyrillic"] : [mode];
}

cleanGeneratedFonts();

const fonts = getFontFiles();

if (!fonts.length) {
  console.log("No font files found.");
  process.exit(0);
}

const usedVariants = new Set();
const modesToBuild = getModesToBuild();

let scssOutput = `/* AUTO-GENERATED FILE – DO NOT EDIT */\n`;
scssOutput += `/* Source: scripts/build-fonts.js */\n\n`;

fonts.forEach((file) => {
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

  modesToBuild.forEach((subsetName) => {
    const stylePart = style === "italic" ? "-italic" : "";
    const outputFile = `${familySlug}-${weight}${stylePart}-${subsetName}.woff2`;
    const outputPath = path.join(OUTPUT_DIR, outputFile);

    const command = [
      `pyftsubset "${inputPath}"`,
      `--flavor=woff2`,
      `--layout-features='*'`,
      `--unicodes='${subsets[subsetName]}'`,
      `--output-file="${outputPath}"`,
    ].join(" ");

    console.log(`Generating ${outputFile}`);
    execSync(command, { stdio: "inherit" });

    const stat = fs.statSync(outputPath);

    if (stat.size < 2000) {
      console.warn(
        `Warning: ${outputFile} is very small (${stat.size} bytes). ` +
          `The source font may not contain glyphs for the "${subsetName}" subset.`
      );
    }

    scssOutput += `@font-face {
  font-family: "${familyName}";
  src: url("/fonts/${outputFile}") format("woff2");
  font-weight: ${weight};
  font-style: ${style};
  font-display: swap;
  unicode-range: ${subsets[subsetName]};
}

`;
  });
});

ensureDir(path.dirname(SCSS_OUTPUT));
fs.writeFileSync(SCSS_OUTPUT, scssOutput);

console.log("Fonts built successfully.");
console.log(`Generated SCSS: ${SCSS_OUTPUT}`);