/**
 * Builds web fonts for the site in SITE_DIR from @fontsource-variable packages:
 * - copies only the families of theme.fontPair and only the needed subsets
 *   (latin, latin-ext; plus cyrillic for Cyrillic languages) to public/fonts/,
 *   with a content hash in each file name (cached for a year by server.mjs)
 * - src/styles/abstracts/_fonts.scss — @font-face rules (variable weight range,
 *   unicode-range) and a metric-matched "<Family> Fallback" per family
 * - src/design-system/fonts.generated.ts — files to <link rel="preload">
 * - public/fonts/LICENSES.txt — OFL licenses of the shipped fonts
 *
 * Usage: SITE_DIR=sites/_demo tsx scripts/build-fonts.ts
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import * as fontkit from "fontkit";
import { fontFamilies, fontPairs, scriptsForLanguage, type FontFamilyId } from "../src/design-system/fonts/library";
import { resolveTheme } from "../src/design-system/theme";
import { loadSite, resolveSiteDir, SiteValidationError } from "../src/site/loader";

const OUTPUT_DIR = "public/fonts";
const SCSS_OUTPUT = "src/styles/abstracts/_fonts.scss";
const PRELOAD_OUTPUT = "src/design-system/fonts.generated.ts";

// Metrics of the local fallback fonts. xWidthAvg: average character width
// weighted by English letter frequency (as in Capsize).
const FALLBACKS = {
  "sans-serif": { name: "Arial", unitsPerEm: 2048, xWidthAvg: 904 },
  serif: { name: "Times New Roman", unitsPerEm: 2048, xWidthAvg: 819 },
} as const;

const LETTER_WEIGHTS: Record<string, number> = {
  a: 0.0668, b: 0.0122, c: 0.0228, d: 0.0348, e: 0.1039, f: 0.0182, g: 0.0165,
  h: 0.0499, i: 0.057, j: 0.0013, k: 0.0063, l: 0.0329, m: 0.0197, n: 0.0552,
  o: 0.0614, p: 0.0158, q: 0.0008, r: 0.049, s: 0.0518, t: 0.0741, u: 0.0226,
  v: 0.008, w: 0.0193, x: 0.0012, y: 0.0162, z: 0.0006, " ": 0.1818,
};

type Face = { file: string; subset: string; weight: string; unicodeRange: string };

let site;

try {
  ({ site } = loadSite(resolveSiteDir()));
} catch (error) {
  if (error instanceof SiteValidationError) {
    console.error(`✖ ${resolveSiteDir()}\n${error.message}`);
    process.exit(1);
  }

  throw error;
}

const theme = resolveTheme(site.theme);
const pair = fontPairs[theme.fontPair];
const usesCyrillic = scriptsForLanguage(site.lang).includes("cyrillic");
// latin-ext is always included: browsers download it only when a page needs it.
const subsets = usesCyrillic ? ["latin", "latin-ext", "cyrillic"] : ["latin", "latin-ext"];
const primarySubset = usesCyrillic ? "cyrillic" : "latin";

function packageDir(id: FontFamilyId) {
  return path.resolve("node_modules/@fontsource-variable", fontFamilies[id].package);
}

/** Normal-style variable faces from the package CSS (wght axis). */
function readFaces(id: FontFamilyId): Face[] {
  const dir = packageDir(id);
  const pkg = fontFamilies[id].package;
  const cssFile = ["wght.css", "index.css"].map((file) => path.join(dir, file)).find((file) => fs.existsSync(file));

  if (!cssFile) throw new Error(`No CSS found for @fontsource-variable/${pkg}. Is it installed?`);

  const css = fs.readFileSync(cssFile, "utf8");

  return [...css.matchAll(/@font-face\s*{([^}]*)}/g)]
    .map(([, body]) => ({
      file: body.match(/url\(\.\/files\/([^)]+\.woff2)\)/)?.[1] ?? "",
      weight: body.match(/font-weight:\s*([^;]+);/)?.[1].trim() ?? "400",
      unicodeRange: body.match(/unicode-range:\s*([^;]+);/)?.[1].trim() ?? "",
      style: body.match(/font-style:\s*([^;]+);/)?.[1].trim(),
    }))
    .filter((face) => face.style === "normal" && face.file.endsWith("-wght-normal.woff2"))
    .map((face) => ({ ...face, subset: face.file.slice(pkg.length + 1, -"-wght-normal.woff2".length) }));
}

const percent = (value: number) => `${(value * 100).toFixed(2)}%`;

function fallbackFace(id: FontFamilyId, latinFile: string): string {
  const { family, category } = fontFamilies[id];
  const fallback = FALLBACKS[category];
  const font = fontkit.create(fs.readFileSync(latinFile));

  let avgWidth = 0;
  for (const [char, weight] of Object.entries(LETTER_WEIGHTS)) {
    avgWidth += font.glyphForCodePoint(char.codePointAt(0)!).advanceWidth * weight;
  }

  const sizeAdjust = avgWidth / font.unitsPerEm / (fallback.xWidthAvg / fallback.unitsPerEm);
  const em = font.unitsPerEm * sizeAdjust;

  return `@font-face {
  font-family: "${family} Fallback";
  src: local("${fallback.name}");
  size-adjust: ${percent(sizeAdjust)};
  ascent-override: ${percent(font.ascent / em)};
  descent-override: ${percent(Math.abs(font.descent) / em)};
  line-gap-override: ${percent(font.lineGap / em)};
}
`;
}

fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const families = [...new Set([pair.heading, pair.body])] as FontFamilyId[];
const preloads: string[] = [];
const licenses: string[] = [];
let scss = `/* AUTO-GENERATED FILE – DO NOT EDIT */\n/* Source: scripts/build-fonts.ts · pair: ${theme.fontPair} */\n\n`;

for (const id of families) {
  const { family, package: pkg } = fontFamilies[id];
  const faces = readFaces(id).filter((face) => subsets.includes(face.subset));

  for (const face of faces) {
    const source = path.join(packageDir(id), "files", face.file);
    const data = fs.readFileSync(source);
    const hash = crypto.createHash("sha256").update(data).digest("hex").slice(0, 8);
    const outputFile = `${pkg}-${face.subset}.${hash}.woff2`;

    fs.writeFileSync(path.join(OUTPUT_DIR, outputFile), data);

    scss += `@font-face {
  font-family: "${family}";
  src: url("/fonts/${outputFile}") format("woff2");
  font-weight: ${face.weight};
  font-style: normal;
  font-display: swap;
  unicode-range: ${face.unicodeRange};
}

`;

    if (face.subset === primarySubset) preloads.push(`/fonts/${outputFile}`);
  }

  const latin = faces.find((face) => face.subset === "latin");
  if (latin) scss += `${fallbackFace(id, path.join(packageDir(id), "files", latin.file))}\n`;

  licenses.push(`${family} — @fontsource-variable/${pkg}\n\n${fs.readFileSync(path.join(packageDir(id), "LICENSE"), "utf8").trim()}`);
  console.log(`Fonts: ${family} (${faces.map((face) => face.subset).join(", ")})`);
}

fs.mkdirSync(path.dirname(SCSS_OUTPUT), { recursive: true });
fs.writeFileSync(SCSS_OUTPUT, scss.trimEnd() + "\n");
fs.writeFileSync(path.join(OUTPUT_DIR, "LICENSES.txt"), `${licenses.join("\n\n---\n\n")}\n`);
fs.writeFileSync(
  PRELOAD_OUTPUT,
  `/* AUTO-GENERATED FILE – DO NOT EDIT */
/* Source: scripts/build-fonts.ts */

/** Font files preloaded in BaseLayout (main script of heading and body fonts). */
export const fontPreloads: string[] = ${JSON.stringify(preloads, null, 2)};
`,
);

console.log(`Fonts built for "${site.siteId}" (${theme.fontPair}).`);
