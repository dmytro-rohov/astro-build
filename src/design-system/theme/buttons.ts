/**
 * v3.11: the site's own button styles (site.json theme.buttons). One look per kind of button, for
 * every button of that kind on the site:
 * - primary: the main action;
 * - secondary: a quieter button;
 * - ghost: a button that looks like a link.
 *
 * Every property is optional: what a site does not set stays the theme's design. The properties
 * become CSS custom properties --button-<kind>-<name> (styles/components/_button.scss reads them
 * with the theme's tokens as the fallback).
 *
 * Pure (only ./color): the token generator, the loader's warnings, the editor bridge's live preview
 * and the factory panel (the catalog's button-styles.mjs) all use this module, so the panel, the
 * preview and the built site agree.
 */
import { adjustForContrast, contrast, hexToOklch, withLightness } from "./color";

export const BUTTON_KINDS = ["primary", "secondary", "ghost"] as const;
export type ButtonKind = (typeof BUTTON_KINDS)[number];

/** Corner radius in rem, or a pill. */
export const BUTTON_RADII = ["0", "0.25", "0.5", "0.75", "1", "1.5", "pill"] as const;
export type ButtonRadius = (typeof BUTTON_RADII)[number];

/** The site's fonts are variable: every one of these weights exists. */
export const BUTTON_WEIGHTS = [400, 500, 600, 700] as const;
export type ButtonWeight = (typeof BUTTON_WEIGHTS)[number];

export const BUTTON_SHADOWS = ["none", "soft", "strong"] as const;
export type ButtonShadow = (typeof BUTTON_SHADOWS)[number];

/** On hover: "lift" (the theme's own: one pixel up), "glow" (a soft ring), or nothing. */
export const BUTTON_HOVER_EFFECTS = ["lift", "glow", "none"] as const;
export type ButtonHoverEffect = (typeof BUTTON_HOVER_EFFECTS)[number];

/**
 * The number properties. Padding is added inside the button's minimum height, so a button never
 * gets smaller than the theme's (44 px for the usual size; WCAG 2.5.8 asks for 24 px).
 */
export const BUTTON_RANGES = {
  paddingX: { min: 0.5, max: 2.5, step: 0.125, unit: "rem" },
  paddingY: { min: 0, max: 1.25, step: 0.125, unit: "rem" },
  borderWidth: { min: 0, max: 3, step: 1, unit: "px" },
  letterSpacing: { min: 0, max: 0.12, step: 0.01, unit: "em" },
} as const;

/** Backgrounds and borders may be transparent; text is always a color. */
export const TRANSPARENT = "transparent";

/** Minimum contrast: text (WCAG 1.4.3) and a button's shape against what is around it (1.4.11). */
export const TEXT_CONTRAST = 4.5;
export const SHAPE_CONTRAST = 3;

export type ButtonColors = { text?: string; background?: string; border?: string };
export type ButtonStyle = ButtonColors & {
  hover?: ButtonColors;
  paddingX?: number;
  paddingY?: number;
  borderWidth?: number;
  radius?: ButtonRadius;
  weight?: ButtonWeight;
  uppercase?: boolean;
  letterSpacing?: number;
  shadow?: ButtonShadow;
  hoverEffect?: ButtonHoverEffect;
};
export type ButtonStyles = Partial<Record<ButtonKind, ButtonStyle>>;

/** A button's six colors, at rest and on hover. */
export type ButtonPaint = { text: string; background: string; border: string; hoverText: string; hoverBackground: string; hoverBorder: string };

/** The palette tokens a button's look comes from (a theme's SemanticPalette, or a section's re-scoped one). */
export type ButtonPalette = {
  background: { primary: string; muted: string };
  border: { default: string };
  action: { primary: string; primaryHover: string; primaryText: string; secondary: string; secondaryHover: string; secondaryText: string };
};

/** Button sizes: the side padding set is the usual size's (md); small and large ones scale like the theme's. */
export const BUTTON_SIZE_SCALE = { sm: 2 / 3, md: 1, lg: 4 / 3 } as const;

const opaque = (color: string | undefined): color is string => Boolean(color) && color !== TRANSPARENT;
const round = (value: number, digits = 4) => Number(value.toFixed(digits));

/**
 * A shade for hover: a little darker, or lighter on a very dark color (like the theme's own). Near black the steps
 * of OKLCH lightness hardly show, so a dark color goes at least to a dark grey that does.
 */
export function hoverShade(color: string): string {
  const lightness = hexToOklch(color).l;
  return withLightness(color, lightness >= 0.3 ? lightness - 0.07 : Math.min(0.97, Math.max(lightness + 0.1, 0.27)));
}

/**
 * The colors a site sets for a kind and what follows from them: hover colors not set follow the
 * resting ones (the background a shade darker), and a primary button's border follows its
 * background (as in the theme). Only these are returned: the rest stays the theme's.
 */
export function setColors(kind: ButtonKind, style: ButtonStyle = {}): Partial<ButtonPaint> {
  const hover = style.hover ?? {};
  const background = style.background;
  const border = style.border ?? (kind === "primary" ? background : undefined);
  const hoverBackground = hover.background ?? (background === undefined ? undefined : opaque(background) ? hoverShade(background) : TRANSPARENT);
  const hoverBorder = hover.border ?? (style.border === undefined && kind === "primary" ? hoverBackground : border);
  const colors: Partial<ButtonPaint> = { text: style.text, background, border, hoverText: hover.text ?? style.text, hoverBackground, hoverBorder };

  return Object.fromEntries(Object.entries(colors).filter(([, value]) => value !== undefined)) as Partial<ButtonPaint>;
}

/** The theme's own colors for a kind (what _button.scss shows without a site style). */
export function themePaint(kind: ButtonKind, palette: ButtonPalette): ButtonPaint {
  const { action } = palette;
  if (kind === "primary") {
    return { text: action.primaryText, background: action.primary, border: action.primary, hoverText: action.primaryText, hoverBackground: action.primaryHover, hoverBorder: action.primaryHover };
  }
  if (kind === "secondary") {
    return { text: action.secondaryText, background: action.secondary, border: palette.border.default, hoverText: action.secondaryText, hoverBackground: action.secondaryHover, hoverBorder: palette.border.default };
  }
  return { text: action.primary, background: TRANSPARENT, border: TRANSPARENT, hoverText: action.primary, hoverBackground: palette.background.muted, hoverBorder: TRANSPARENT };
}

/** A kind's colors on a palette: the site's where it sets them, the theme's elsewhere. */
export function buttonPaint(kind: ButtonKind, style: ButtonStyle | undefined, palette: ButtonPalette): ButtonPaint {
  return { ...themePaint(kind, palette), ...setColors(kind, style) };
}

const hasColors = (style: ButtonStyle | undefined) =>
  Boolean(style && (style.text || style.background || style.border || style.hover?.text || style.hover?.background || style.hover?.border));

/** What a transparent background or border shows: the surface under the button. */
const over = (color: string, surface: string) => (opaque(color) ? color : surface);

export type ButtonIssue = {
  kind: ButtonKind;
  /** text: the label at rest, hoverText: on hover, shape: the button against the page around it. */
  check: "text" | "hoverText" | "shape";
  foreground: string;
  background: string;
  ratio: number;
  required: number;
};

/**
 * Contrast problems of a kind's colors on a surface. Only pairs the site's style touches are judged
 * (the theme's own colors are checked, and adjusted, by the theme). A shape needs 3:1 from its
 * background or its border; a button without either (only a label) has no shape to judge.
 */
export function buttonIssues(kind: ButtonKind, style: ButtonStyle | undefined, palette: ButtonPalette, surface = palette.background.primary): ButtonIssue[] {
  if (!style || !hasColors(style)) return [];

  const set = setColors(kind, style);
  const paint = buttonPaint(kind, style, palette);
  const width = style.borderWidth ?? 1;
  const issues: ButtonIssue[] = [];
  const judge = (check: ButtonIssue["check"], foreground: string, background: string, required: number) => {
    const ratio = contrast(foreground, background);
    if (ratio + 1e-9 < required) issues.push({ kind, check, foreground, background, ratio: round(ratio, 2), required });
  };

  if (set.text || set.background) judge("text", paint.text, over(paint.background, surface), TEXT_CONTRAST);
  if (set.hoverText || set.hoverBackground) judge("hoverText", paint.hoverText, over(paint.hoverBackground, surface), TEXT_CONTRAST);

  if (set.background || set.border) {
    const filled = opaque(paint.background);
    const outlined = width > 0 && opaque(paint.border);
    if (filled || outlined) {
      const best = Math.max(filled ? contrast(paint.background, surface) : 0, outlined ? contrast(paint.border, surface) : 0);
      if (best + 1e-9 < SHAPE_CONTRAST) {
        issues.push({ kind, check: "shape", foreground: filled ? paint.background : paint.border, background: surface, ratio: round(best, 2), required: SHAPE_CONTRAST });
      }
    }
  }

  return issues;
}

/**
 * The kinds whose site colors would vanish in a part of the page with its own palette (an accent or
 * inverse section, a dark bar, a footer, the other color scheme): their color properties are reset
 * there, and the theme's buttons adapted to that part stay. Their shape, text and effects still apply.
 */
export function vanishingKinds(styles: ButtonStyles | undefined, palette: ButtonPalette): ButtonKind[] {
  return BUTTON_KINDS.filter((kind) => buttonIssues(kind, styles?.[kind], palette).length > 0);
}

/** The nearest color (same hue and chroma, only lightness moved) with `min` contrast against `against`. */
export function fixContrast(color: string, against: string, min: number): string {
  if (contrast(color, against) + 1e-9 >= min) return color;

  const darker = adjustForContrast(color, [against], min, -1);
  const lighter = adjustForContrast(color, [against], min, 1);
  const distance = (candidate: string) => Math.abs(hexToOklch(candidate).l - hexToOklch(color).l);
  const reaches = (candidate: string) => contrast(candidate, against) + 1e-9 >= min;
  const candidates = [darker, lighter].filter(reaches).sort((a, b) => distance(a) - distance(b));

  return candidates[0] ?? (contrast("#000000", against) > contrast("#ffffff", against) ? "#000000" : "#ffffff");
}

/** A color the build changed so a kind passes: which property, from what, to what. */
export type ButtonFix = { kind: ButtonKind; property: "background" | "border" | "text" | "hover.text"; from: string; to: string };

/**
 * v3.12: a kind's style with its contrast problems on a surface fixed by the nearest colors that pass (fixContrast),
 * in the order the checks depend on each other: the shape first (the background the site set, else the border), then
 * the label on it, then the label on hover (its background follows the fixed one). What passes stays as the site set it.
 */
export function fixButtonStyle(kind: ButtonKind, style: ButtonStyle, palette: ButtonPalette, surface = palette.background.primary): { style: ButtonStyle; fixes: ButtonFix[] } {
  const next: ButtonStyle = { ...style, ...(style.hover ? { hover: { ...style.hover } } : {}) };
  const fixes: ButtonFix[] = [];
  const failing = (check: ButtonIssue["check"]) => buttonIssues(kind, next, palette, surface).find((issue) => issue.check === check);

  if (failing("shape")) {
    const paint = buttonPaint(kind, next, palette);
    const bordered = (next.borderWidth ?? 1) > 0 && opaque(paint.border);
    const property = bordered && (setColors(kind, next).background === undefined || !opaque(paint.background)) ? "border" : "background";
    const to = fixContrast(paint[property], surface, SHAPE_CONTRAST);
    fixes.push({ kind, property, from: paint[property], to });
    next[property] = to;
  }

  const text = failing("text");
  if (text) {
    next.text = fixContrast(text.foreground, text.background, TEXT_CONTRAST);
    fixes.push({ kind, property: "text", from: text.foreground, to: next.text });
  }

  const hoverText = failing("hoverText");
  if (hoverText) {
    next.hover = { ...next.hover, text: fixContrast(hoverText.foreground, hoverText.background, TEXT_CONTRAST) };
    fixes.push({ kind, property: "hover.text", from: hoverText.foreground, to: next.hover.text! });
  }

  return { style: next, fixes };
}

/**
 * v3.12: the site's button styles as the build shows them: every kind fixed on the palette of the scheme the site shows
 * first (fixButtonStyle), so a client's choice never puts unreadable buttons on a live page. Parts with their own palette
 * keep or reset these colors as before (buttonScopeVars). Only the operator's theme.allowLowContrastButtons keeps the
 * site's colors as they are.
 */
export function fixButtonStyles(styles: ButtonStyles | undefined, palette: ButtonPalette): { styles: ButtonStyles | undefined; fixes: ButtonFix[] } {
  if (!styles) return { styles, fixes: [] };

  const fixed: ButtonStyles = { ...styles };
  const fixes: ButtonFix[] = [];
  for (const kind of BUTTON_KINDS) {
    const style = styles[kind];
    if (!style) continue;
    const result = fixButtonStyle(kind, style, palette);
    fixed[kind] = result.style;
    fixes.push(...result.fixes);
  }

  return { styles: fixed, fixes };
}

/**
 * A part of the page with its own palette (an accent or inverse section, a bar, a footer, the other color scheme):
 * each kind's colors again, the site's where they stay visible there, "initial" where they would vanish (the theme's
 * button adapted to that part stays). `own`: the palette of the scheme the site shows, nothing to re-declare (contrast
 * there is only a warning: the part shows the site's buttons like the page does).
 */
export function buttonScopeVars(styles: ButtonStyles | undefined, palette: ButtonPalette, { own = false } = {}): Record<string, string> {
  if (own) return {};
  const vars = buttonVars(styles);
  const vanishing = vanishingKinds(styles, palette);
  return Object.fromEntries(
    BUTTON_KINDS.flatMap((kind) =>
      buttonColorVars(kind).filter((name) => name in vars).map((name) => [name, vanishing.includes(kind) ? "initial" : vars[name]]),
    ),
  );
}

/** The color custom properties of a kind (without "--"): reset where the kind would vanish. */
export const buttonColorVars = (kind: ButtonKind) =>
  ["text", "bg", "border", "hover-text", "hover-bg", "hover-border", "glow-color"].map((name) => `button-${kind}-${name}`);

// "none" as a shadow that draws nothing: the value sits in a list with the hover glow (the keyword would void it).
const SHADOWS: Record<ButtonShadow, string> = { none: "0 0 #0000", soft: "var(--elevation-card)", strong: "var(--elevation-dropdown)" };
const COLOR_VARS: [keyof ButtonPaint, string][] = [
  ["text", "text"], ["background", "bg"], ["border", "border"],
  ["hoverText", "hover-text"], ["hoverBackground", "hover-bg"], ["hoverBorder", "hover-border"],
];

/**
 * The custom properties of a site's button styles (names without "--"), only for what it sets:
 * a site without theme.buttons gets none, and looks exactly as before.
 */
export function buttonVars(styles: ButtonStyles | undefined): Record<string, string> {
  const vars: Record<string, string> = {};

  for (const kind of BUTTON_KINDS) {
    const style = styles?.[kind];
    if (!style) continue;

    const name = (property: string) => `button-${kind}-${property}`;
    const colors = setColors(kind, style);
    for (const [key, property] of COLOR_VARS) if (colors[key]) vars[name(property)] = colors[key];

    if (style.paddingX !== undefined) {
      for (const [size, scale] of Object.entries(BUTTON_SIZE_SCALE)) vars[name(`padding-x-${size}`)] = `${round(style.paddingX * scale)}rem`;
    }
    if (style.paddingY !== undefined) vars[name("padding-y")] = `${round(style.paddingY)}rem`;
    if (style.borderWidth !== undefined) vars[name("border-width")] = `${style.borderWidth}px`;
    if (style.radius !== undefined) vars[name("radius")] = style.radius === "pill" ? "999px" : style.radius === "0" ? "0" : `${style.radius}rem`;
    if (style.weight !== undefined) vars[name("weight")] = String(style.weight);
    if (style.uppercase !== undefined) vars[name("case")] = style.uppercase ? "uppercase" : "none";
    if (style.letterSpacing !== undefined) vars[name("tracking")] = `${round(style.letterSpacing, 3)}em`;
    if (style.shadow !== undefined) vars[name("shadow")] = SHADOWS[style.shadow];

    if (style.hoverEffect && style.hoverEffect !== "lift") vars[name("lift")] = "0px";
    if (style.hoverEffect === "glow") {
      vars[name("glow")] = "0.25rem";
      // The ring in the hover background's color; a button without one (transparent) glows in its text's color.
      const transparentHover = colors.hoverBackground === TRANSPARENT || (kind === "ghost" && colors.hoverBackground === undefined);
      const glow = opaque(colors.hoverBackground) ? colors.hoverBackground : colors.text ?? (transparentHover ? "currentColor" : undefined);
      if (glow) vars[name("glow-color")] = glow;
    }
  }

  return vars;
}
