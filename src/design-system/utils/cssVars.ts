/**
 * Generates design tokens for the site in SITE_DIR:
 * - src/styles/abstracts/_tokens.scss — CSS custom properties: light (:root),
 *   dark ([data-theme="dark"] and prefers-color-scheme), inverse sections
 *   (the opposite scheme's palette), archetype shape tokens, font stacks
 * - src/design-system/cssVars.ts — union type of token names
 * - src/design-system/theme.generated.json — resolved theme (for build reports)
 *
 * Colors come from the archetype and site.json theme; failing contrast stops here.
 * Usage: SITE_DIR=sites/_demo tsx src/design-system/utils/cssVars.ts
 */
import fs from "fs";
import path from "path";
import { loadSite, resolveSiteDir, SiteValidationError } from "../../site/loader";
import { fontPairs, fontStack } from "../fonts/library";
import { accentPalette, resolveTheme, type SemanticPalette } from "../theme";
import { shapeTokens } from "../theme/shape";
import { tokens } from "../tokens/index";

type TokenValue = string | number;
interface TokenObject {
  [key: string]: TokenValue | TokenObject;
}

function toKebab(str: string) {
  return str.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
}

function flatten(obj: TokenObject, prefix = ""): Record<string, TokenValue> {
  const result: Record<string, TokenValue> = {};

  for (const [key, value] of Object.entries(obj)) {
    const kebabKey = toKebab(key);
    const newKey = prefix ? `${prefix}-${kebabKey}` : kebabKey;

    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      Object.assign(result, flatten(value as TokenObject, newKey));
    } else {
      result[newKey] = value as TokenValue;
    }
  }

  return result;
}

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

const allTokens = {
  ...tokens,
  color: { ...theme.light, primitive: tokens.color.primitive },
  fontFamily: { ...tokens.fontFamily, base: fontStack(pair.body), heading: fontStack(pair.heading) },
};

const flatTokens = { ...flatten(allTokens as unknown as TokenObject), ...shapeTokens(theme.archetype) };
const colorVars = (palette: SemanticPalette) => flatten({ color: palette } as unknown as TokenObject);

const lines = (values: Record<string, TokenValue>, indent = "  ") =>
  Object.entries(values)
    .map(([key, value]) => `${indent}--${key}: ${value};`)
    .join("\n");

// Inverse sections use the OTHER scheme's palette, so headings, links, cards
// and buttons inside them keep the contrast that was checked for that scheme.
const css = `/* AUTO-GENERATED FILE – DO NOT EDIT */
/* Source: src/design-system/utils/cssVars.ts · site: ${site.siteId} · archetype: ${theme.archetypeId} */

:root {
  color-scheme: light;
${lines(flatTokens)}
}

:root .section--tone-inverse {
  color-scheme: dark;
${lines(colorVars(theme.dark))}
}

:root .section--tone-accent {
${lines(colorVars(accentPalette(theme.light)))}
}

:root[data-theme="dark"] {
  color-scheme: dark;
${lines(colorVars(theme.dark))}
}

:root[data-theme="dark"] .section--tone-accent {
${lines(colorVars(accentPalette(theme.dark)))}
}

:root[data-theme="dark"] .section--tone-inverse {
  color-scheme: light;
${lines(colorVars(theme.light))}
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme]) {
    color-scheme: dark;
${lines(colorVars(theme.dark), "    ")}
  }

  :root:not([data-theme]) .section--tone-inverse {
    color-scheme: light;
${lines(colorVars(theme.light), "    ")}
  }

  :root:not([data-theme]) .section--tone-accent {
${lines(colorVars(accentPalette(theme.dark)), "    ")}
  }
}
`;

const spacingKeys = Object.keys(tokens.spacing)
  .map((key) => `"${key}"`)
  .join(", ");

const scssMap = `$tokens: (
${Object.keys(flatTokens)
  .map((key) => `  "${key}": var(--${key})`)
  .join(",\n")}
);

// Spacing token names, used to generate layout modifier classes.
$spacing-keys: (${spacingKeys});
`;

const tsTypes = `/* AUTO-GENERATED FILE – DO NOT EDIT */
/* Source: src/design-system/utils/cssVars.ts */

export type CssToken =
${Object.keys(flatTokens)
  .map((token) => `  | "${token}"`)
  .join("\n")};

export type CssVar = \`var(--\${CssToken})\`;
`;

const outputDir = path.resolve("src/styles/abstracts");
fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(path.join(outputDir, "_tokens.scss"), `${css}\n${scssMap}`);
fs.writeFileSync(path.resolve("src/design-system/cssVars.ts"), tsTypes);
fs.writeFileSync(
  path.resolve("src/design-system/theme.generated.json"),
  `${JSON.stringify(
    {
      siteId: site.siteId,
      archetype: theme.archetypeId,
      colorScheme: theme.colorScheme,
      fontPair: theme.fontPair,
      accent: theme.accent,
      adjustments: theme.adjustments,
    },
    null,
    2,
  )}\n`,
);

for (const adjustment of theme.adjustments) {
  console.warn(
    `⚠ Accent ${adjustment.from} adjusted to ${adjustment.to} (${adjustment.scheme} scheme) to meet WCAG AA contrast.`,
  );
}

console.log(`✅ Tokens generated for "${site.siteId}" (archetype ${theme.archetypeId}, fonts ${theme.fontPair}).`);
