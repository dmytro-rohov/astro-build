/**
 * Site theme: archetype defaults + site.json theme → resolved colors, fonts
 * and shape tokens. Pure TypeScript, used by the token generator (Node),
 * the loader (validation) and the layouts (theme-color, manifest).
 */
import { archetypes, type Archetype, type ArchetypeId } from "../archetypes";
import { fontPairs, type FontPairId } from "../fonts/library";
import { semanticColors as v2Light, semanticColorsDark as v2Dark } from "../tokens/semantic/color-semantic";
import { adjustForContrast, bestText, contrast, mix, withLightness, hexToOklch } from "./color";
import { neutralScale } from "./neutrals";

export type SemanticPalette = {
  text: { primary: string; secondary: string; muted: string; inverse: string };
  background: { primary: string; secondary: string; muted: string; surface: string; inverse: string };
  border: { default: string; strong: string; control: string; inverse: string };
  action: { primary: string; primaryHover: string; primaryText: string; secondary: string; secondaryHover: string; secondaryText: string };
  focus: { ring: string };
  feedback: { success: string; error: string; warning: string };
};

/** Token keys a site may override manually, e.g. "action.primary". */
export const OVERRIDABLE_KEYS = [
  "text.primary", "text.secondary", "text.muted",
  "background.primary", "background.secondary", "background.muted", "background.surface",
  "action.primary", "action.primaryHover", "action.primaryText",
] as const;

export type OverrideKey = (typeof OVERRIDABLE_KEYS)[number];

export type ThemeInput = {
  archetype?: ArchetypeId;
  colorScheme?: "light" | "dark" | "auto";
  accent?: string;
  fontPair?: FontPairId;
  overrides?: { light?: Partial<Record<OverrideKey, string>>; dark?: Partial<Record<OverrideKey, string>> };
};

export type ContrastAdjustment = { scheme: "light" | "dark"; token: string; from: string; to: string };

export type ResolvedTheme = {
  archetypeId: ArchetypeId;
  archetype: Archetype;
  colorScheme: "light" | "dark" | "auto";
  fontPair: FontPairId;
  accent: string;
  light: SemanticPalette;
  dark: SemanticPalette;
  /** Accent changes made automatically to reach WCAG AA (reported in the build). */
  adjustments: ContrastAdjustment[];
};

const FEEDBACK = {
  light: { success: "#15803d", error: "#b91c1c", warning: "#b45309" },
  dark: { success: "#4ade80", error: "#f87171", warning: "#fbbf24" },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/** Palette from a neutral scale and an accent (accent is adjusted for contrast). */
function buildPalette(archetype: Archetype, accent: string, scheme: "light" | "dark", adjustments: ContrastAdjustment[]): SemanticPalette {
  const n = neutralScale(archetype.neutral);
  // Grey or black accents would only make backgrounds look dirty: no tint then.
  const tintable = archetype.tint > 0 && hexToOklch(accent).c >= 0.04;
  const tint = (color: string, amount: number) => (tintable ? mix(color, accent, archetype.tint * amount) : color);
  const feedback = (colors: SemanticPalette["feedback"], against: string[], direction: -1 | 1) => ({
    success: adjustForContrast(colors.success, against, 4.5, direction),
    error: adjustForContrast(colors.error, against, 4.5, direction),
    warning: adjustForContrast(colors.warning, against, 4.5, direction),
  });

  if (scheme === "light") {
    const background = {
      primary: tint("#ffffff", 0.5),
      secondary: tint(n[50], 1),
      muted: tint(n[100], 1.4),
      surface: tint("#ffffff", 0.3),
      inverse: n[900],
    };
    const surfaces = [background.primary, background.secondary, background.muted, background.surface];

    // Links use the accent as text, buttons use it as background with white text.
    const primary = adjustForContrast(accent, [...surfaces, "#ffffff"], 4.5, -1);
    if (primary !== accent) adjustments.push({ scheme, token: "action.primary", from: accent, to: primary });

    const primaryText = bestText(primary, ["#ffffff", n[950]]);
    const hover = withLightness(primary, hexToOklch(primary).l - 0.07);

    return {
      text: {
        primary: n[900],
        secondary: adjustForContrast(n[600], surfaces, 4.5, -1),
        muted: adjustForContrast(n[550], surfaces, 4.5, -1),
        inverse: "#ffffff",
      },
      background,
      border: {
        default: n[200],
        strong: n[400],
        control: adjustForContrast(n[500], surfaces, 3, -1),
        inverse: "rgb(255 255 255 / 0.16)",
      },
      action: {
        primary,
        primaryHover: hover,
        primaryText,
        secondary: n[100],
        secondaryHover: n[200],
        secondaryText: n[900],
      },
      focus: { ring: primary },
      feedback: feedback(FEEDBACK.light, surfaces, -1),
    };
  }

  const background = { primary: n[900], secondary: n[800], muted: n[850], surface: n[800], inverse: n[50] };
  const surfaces = [background.primary, background.secondary, background.muted, background.surface];

  const primary = adjustForContrast(accent, surfaces, 4.5, 1);
  if (primary !== accent) adjustments.push({ scheme, token: "action.primary", from: accent, to: primary });

  const primaryText = bestText(primary, [n[950], "#000000", "#ffffff"]);
  const hover = withLightness(primary, Math.min(0.97, hexToOklch(primary).l + 0.07));

  return {
    text: {
      primary: n[50],
      secondary: adjustForContrast(n[300], surfaces, 4.5, 1),
      muted: adjustForContrast(n[400], surfaces, 4.5, 1),
      inverse: n[900],
    },
    background,
    border: {
      default: n[700],
      strong: n[500],
      control: adjustForContrast(n[400], surfaces, 3, 1),
      inverse: "rgb(0 0 0 / 0.16)",
    },
    action: {
      primary,
      primaryHover: hover,
      primaryText,
      secondary: n[800],
      secondaryHover: n[700],
      secondaryText: n[50],
    },
    focus: { ring: primary },
    feedback: feedback(FEEDBACK.dark, surfaces, 1),
  };
}

function applyOverrides(palette: SemanticPalette, overrides: Partial<Record<OverrideKey, string>> = {}): SemanticPalette {
  const result = clone(palette);

  for (const [key, value] of Object.entries(overrides)) {
    const [group, token] = key.split(".") as [keyof SemanticPalette, string];
    (result[group] as Record<string, string>)[token] = value as string;
  }

  return result;
}

export function resolveTheme(input: ThemeInput = {}): ResolvedTheme {
  const archetypeId = input.archetype ?? "default";
  const archetype: Archetype = archetypes[archetypeId];
  const accent = input.accent ?? archetype.accent;
  const adjustments: ContrastAdjustment[] = [];

  // The default archetype keeps the hand-tuned v2 palette unless the site sets an accent.
  const useV2 = archetypeId === "default" && !input.accent;

  const light = useV2 ? (clone(v2Light) as SemanticPalette) : buildPalette(archetype, accent, "light", adjustments);
  const dark = useV2 ? (clone(v2Dark) as SemanticPalette) : buildPalette(archetype, accent, "dark", adjustments);

  return {
    archetypeId,
    archetype,
    colorScheme: input.colorScheme ?? archetype.colorScheme,
    fontPair: input.fontPair ?? archetype.fontPair,
    accent,
    light: applyOverrides(light, input.overrides?.light),
    dark: applyOverrides(dark, input.overrides?.dark),
    adjustments,
  };
}

export type ContrastFailure = { scheme: "light" | "dark"; foreground: string; background: string; ratio: number; required: number };

/** Every text/background/UI pair the components use, with its WCAG AA minimum. */
export function checkContrast(theme: Pick<ResolvedTheme, "light" | "dark">): ContrastFailure[] {
  const failures: ContrastFailure[] = [];

  for (const scheme of ["light", "dark"] as const) {
    const p = theme[scheme];
    const surfaces = { "background.primary": p.background.primary, "background.secondary": p.background.secondary, "background.muted": p.background.muted, "background.surface": p.background.surface };
    const pairs: [string, string, string, string, number][] = [];

    for (const [bgName, bg] of Object.entries(surfaces)) {
      pairs.push(
        ["text.primary", p.text.primary, bgName, bg, 4.5],
        ["text.secondary", p.text.secondary, bgName, bg, 4.5],
        ["text.muted", p.text.muted, bgName, bg, 4.5],
        ["action.primary (links)", p.action.primary, bgName, bg, 4.5],
        ["border.control", p.border.control, bgName, bg, 3],
        ["focus.ring", p.focus.ring, bgName, bg, 3],
        ["feedback.error", p.feedback.error, bgName, bg, 4.5],
        ["feedback.success", p.feedback.success, bgName, bg, 4.5],
        ["feedback.warning", p.feedback.warning, bgName, bg, 4.5],
      );
    }

    pairs.push(
      ["text.inverse", p.text.inverse, "background.inverse", p.background.inverse, 4.5],
      ["action.primaryText", p.action.primaryText, "action.primary", p.action.primary, 4.5],
      ["action.primaryText", p.action.primaryText, "action.primaryHover", p.action.primaryHover, 4.5],
      ["action.secondaryText", p.action.secondaryText, "action.secondary", p.action.secondary, 4.5],
      ["action.secondaryText", p.action.secondaryText, "action.secondaryHover", p.action.secondaryHover, 4.5],
    );

    for (const [fgName, fg, bgName, bg, required] of pairs) {
      const ratio = contrast(fg, bg);
      if (ratio + 1e-9 < required) {
        failures.push({ scheme, foreground: `${fgName} ${fg}`, background: `${bgName} ${bg}`, ratio: Math.round(ratio * 100) / 100, required });
      }
    }
  }

  return failures;
}

export { fontPairs };
