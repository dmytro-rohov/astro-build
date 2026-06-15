import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const RAW_DIR = "src/assets/fonts/raw";
const OUTPUT_DIR = "public/fonts";
const SCSS_OUTPUT = "src/styles/abstracts/_fonts.scss";

const subsets = {
  latin: "U+0000-00FF,U+0100-017F",
  cyrillic: "U+0400-04FF,U+0500-052F"
};

const mode = process.argv[2] || "all";

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function detectWeight(name) {
  const lower = name.toLowerCase();

  if (lower.includes("100")) return 100;
  if (lower.includes("200")) return 200;
  if (lower.includes("300")) return 300;
  if (lower.includes("medium") || lower.includes("500")) return 500;
  if (lower.includes("semibold") || lower.includes("600")) return 600;
  if (lower.includes("bold") || lower.includes("700")) return 700;
  if (lower.includes("800")) return 800;
  if (lower.includes("900")) return 900;

  return 400;
}

function cleanFamilyName(name) {
  return name
    .replace(/-?\d{3,4}/g, "")
    .replace(/regular|bold|medium|semibold|latin|ext/gi, "")
    .replace(/[-_]/g, " ")
    .trim()
    .replace(/\b\w/g, c => c.toUpperCase());
}

const fonts = fs.readdirSync(RAW_DIR).filter(file =>
  /\.(ttf|otf|woff|woff2)$/i.test(file)
);

let scssOutput = `/* AUTO-GENERATED FILE – DO NOT EDIT */\n\n`;

let mainFontFamily = null;

fonts.forEach(file => {
  const inputPath = path.join(RAW_DIR, file);
  const baseName = path.parse(file).name;
  const weight = detectWeight(baseName);
  const familyName = cleanFamilyName(baseName);

  if (!mainFontFamily) {
    mainFontFamily = familyName;
  }

  const modesToBuild = mode === "all" ? ["latin", "cyrillic"] : [mode];

  modesToBuild.forEach(sub => {
    const outputFile = `${baseName}-${sub}.woff2`;
    const outputPath = path.join(OUTPUT_DIR, outputFile);

    const command = `
      pyftsubset "${inputPath}" \
      --flavor=woff2 \
      --layout-features='*' \
      --unicodes='${subsets[sub]}' \
      --output-file="${outputPath}"
    `;

    console.log(`⚙️ Generating ${outputFile}`);
    execSync(command, { stdio: "inherit" });

    scssOutput += `
@font-face {
  font-family: '${familyName}';
  src:
    local('${familyName}'),
    url('/fonts/${outputFile}') format('woff2');
  font-weight: ${weight};
  font-style: normal;
  font-display: swap;
  unicode-range: ${subsets[sub]};
}
`;
  });
});

scssOutput += `
:root {
  --main-font: '${mainFontFamily}', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
}
`;

fs.writeFileSync(SCSS_OUTPUT, scssOutput);

console.log("✅ Fonts built & SCSS generated.");
