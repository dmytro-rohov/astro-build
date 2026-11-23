/**
 * Generates design tokens for the site in SITE_DIR:
 * - src/styles/abstracts/_tokens.scss — CSS custom properties: light (:root),
 *   dark ([data-theme="dark"] and prefers-color-scheme), inverse sections
 *   (the opposite scheme's palette), archetype shape tokens, font stacks
 * - src/design-system/cssVars.ts — union type of token names
 * - src/design-system/theme.generated.json — resolved theme (for build reports)
 *
 * Colors come from the archetype and site.json theme; failing contrast stops here.
 * v3.11: the site's button styles (theme.buttons) as --button-<kind>-<name> (theme/buttons.ts).
 * Usage: SITE_DIR=sites/_demo tsx src/design-system/utils/cssVars.ts
 */
import fs from "fs";
import path from "path";
import { loadSite, resolveSiteDir, SiteValidationError } from "../../site/loader";
import { fontPairs, fontStack } from "../fonts/library";
import { accentPalette, resolveTheme, type SemanticPalette } from "../theme";
import { BUTTON_KINDS, buttonColorVars, buttonVars, vanishingKinds } from "../theme/buttons";
import { relativeLuminance } from "../theme/color";
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

/**
 * Partner logos (logo-cloud) are made for light backgrounds: on a dark palette
 * the muted row turns them into light silhouettes, and grid tiles stay light.
 * v3.3: logos are blended into what is behind them ("logo-blend"), so a white plate
 * behind a logo disappears: multiplied on light; on dark the logo is inverted by its
 * lightness first (dark ink turns light, the white plate black) and screened — inner
 * details stay cut out instead of filling up like a silhouette.
 */
const logoVars = (palette: SemanticPalette): Record<string, TokenValue> =>
  relativeLuminance(palette.background.primary) < 0.2
    ? {
        "logo-filter": "grayscale(1) invert(1) brightness(1.8)",
        "logo-filter-hover": "grayscale(1) invert(1) brightness(2)",
        "logo-blend": "screen",
        "logo-opacity": "0.8",
        "logo-tile": "#f5f5f4",
      }
    : { "logo-filter": "grayscale(1)", "logo-filter-hover": "none", "logo-blend": "multiply", "logo-opacity": "0.75", "logo-tile": palette.background.surface };

const shape = shapeTokens(theme.archetype);
const flatTokens = { ...flatten(allTokens as unknown as TokenObject), ...logoVars(theme.light), ...shape };

// Shape tokens built from color tokens (card and image borders) are re-declared in every
// re-scoped palette: a custom property resolves where it is declared, so on :root alone they
// would keep the light palette's border color inside inverse and accent sections.
const colorShape = Object.fromEntries(Object.entries(shape).filter(([, value]) => String(value).includes("var(--color-")));
const colorVars = (palette: SemanticPalette) => ({ ...flatten({ color: palette } as unknown as TokenObject), ...logoVars(palette), ...colorShape });

// v3.11: the site's button styles (theme.buttons) on :root, only what it sets. A part of the page with
// its own palette (inverse and accent sections, bars, footers, the other color scheme) re-declares
// each kind's colors: the site's where they stay visible there, "initial" where they would vanish
// (the theme's buttons adapted to that part stay). The site's own scheme needs nothing.
const buttons = site.theme.buttons;
const ownButtonVars = buttonVars(buttons);
const buttonScope = (palette: SemanticPalette): Record<string, TokenValue> => {
  const vanishing = vanishingKinds(buttons, palette);
  return Object.fromEntries(
    BUTTON_KINDS.flatMap((kind) =>
      buttonColorVars(kind)
        .filter((name) => name in ownButtonVars)
        .map((name) => [name, vanishing.includes(kind) ? "initial" : ownButtonVars[name]]),
    ),
  );
};
const scoped = (palette: SemanticPalette) => ({ ...colorVars(palette), ...buttonScope(palette) });

const lines = (values: Record<string, TokenValue>, indent = "  ") =>
  Object.entries(values)
    .map(([key, value]) => `${indent}--${key}: ${value};`)
    .join("\n");

// Inverse sections use the OTHER scheme's palette, so headings, links, cards
// and buttons inside them keep the contrast that was checked for that scheme.
// v3.5: the brand-bar navbar takes the accent palette, the dark-bar navbar the dark one.
const css = `/* AUTO-GENERATED FILE – DO NOT EDIT */
/* Source: src/design-system/utils/cssVars.ts · site: ${site.siteId} · archetype: ${theme.archetypeId} */

:root {
  color-scheme: light;
${lines(flatTokens)}
${lines(ownButtonVars)}
}

:root .section--tone-inverse {
  color-scheme: dark;
${lines(scoped(theme.dark))}
}

/* Footer (v3.5): tone "brand" and its brand surfaces (cta band, cards' contact card) get the accent palette like accent sections. */
:root .section--tone-accent,
:root .site-footer--tone-brand,
:root .site-footer__brand-surface,
:root .site-header--brand-bar {
${lines(scoped(accentPalette(theme.light)))}
}

:root[data-theme="dark"] {
  color-scheme: dark;
${lines(colorVars(theme.dark))}
}

:root[data-theme="dark"] .section--tone-accent,
:root[data-theme="dark"] .site-footer--tone-brand,
:root[data-theme="dark"] .site-footer__brand-surface,
:root[data-theme="dark"] .site-header--brand-bar {
${lines(scoped(accentPalette(theme.dark)))}
}

:root[data-theme="dark"] .section--tone-inverse {
  color-scheme: light;
${lines(scoped(theme.light))}
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme]) {
    color-scheme: dark;
${lines(scoped(theme.dark), "    ")}
  }

  :root:not([data-theme]) .section--tone-inverse {
    color-scheme: light;
${lines(scoped(theme.light), "    ")}
  }

  :root:not([data-theme]) .section--tone-accent,
  :root:not([data-theme]) .site-footer--tone-brand,
  :root:not([data-theme]) .site-footer__brand-surface,
  :root:not([data-theme]) .site-header--brand-bar {
${lines(scoped(accentPalette(theme.dark)), "    ")}
  }
}

/* Cover hero, the photo viewer, the dark-bar navbar, dark footers and the footer's photo band:
   always the dark palette (light text over dark), also in dark sites. */
:root .section.s-hero--cover-image,
:root .lightbox,
:root .site-footer--tone-dark,
:root .site-footer__band--image,
:root .site-header--dark-bar {
  color-scheme: dark;
${lines(scoped(theme.dark))}
}

/* Light footers: the light palette, also in dark sites. */
:root .site-footer--tone-light {
  color-scheme: light;
${lines(scoped(theme.light))}
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
