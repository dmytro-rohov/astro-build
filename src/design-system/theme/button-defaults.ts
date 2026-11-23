/**
 * v3.11: a site's buttons as the theme draws them, for an editor of theme.buttons (the factory panel,
 * through the catalog's button-styles.mjs): each kind's colors in both schemes, the page they sit
 * on, and the shape a site style starts from.
 */
import { BUTTON_KINDS, themePaint, type ButtonKind, type ButtonPaint, type ButtonPalette } from "./buttons";
import { resolveTheme, type SemanticPalette, type ThemeInput } from "./index";
import { shapeTokens } from "./shape";

export type ButtonDefaults = {
  /** The scheme the site shows first ("auto" sites: light). */
  scheme: "light" | "dark";
  palettes: Record<"light" | "dark", ButtonPalette>;
  /** Each kind's colors in the site's first scheme. */
  paint: Record<ButtonKind, ButtonPaint>;
  /** The page behind the buttons, its text, and the brand color (quick picks in an editor). */
  page: string;
  text: string;
  accent: string;
  /** The theme's corners ("999px" for a pill), weight, and the usual size's side padding in rem. */
  radius: string;
  weight: number;
  paddingX: number;
};

const buttonPalette = (palette: SemanticPalette): ButtonPalette => ({
  background: { primary: palette.background.primary, muted: palette.background.muted },
  border: { default: palette.border.default },
  action: { ...palette.action },
});

export function buttonDefaults(input: ThemeInput = {}): ButtonDefaults {
  const theme = resolveTheme(input);
  const scheme = theme.colorScheme === "dark" ? "dark" : "light";
  const palettes = { light: buttonPalette(theme.light), dark: buttonPalette(theme.dark) };
  const palette = theme[scheme];

  return {
    scheme,
    palettes,
    paint: Object.fromEntries(BUTTON_KINDS.map((kind) => [kind, themePaint(kind, palettes[scheme])])) as Record<ButtonKind, ButtonPaint>,
    page: palette.background.primary,
    text: palette.text.primary,
    accent: palette.action.primary,
    radius: shapeTokens(theme.archetype)["radius-button"],
    weight: 600,
    paddingX: 1.5,
  };
}
