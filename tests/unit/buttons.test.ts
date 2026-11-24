import { describe, expect, test } from "vitest";
import { buttonDefaults } from "../../src/design-system/theme/button-defaults";
import { buttonIssues, buttonPaint, buttonScopeVars, buttonVars, fixButtonStyle, fixButtonStyles, fixContrast, hoverShade, setColors, vanishingKinds } from "../../src/design-system/theme/buttons";
import { contrast } from "../../src/design-system/theme/color";
import { accentPalette, resolveTheme } from "../../src/design-system/theme";
import { loadSite, SiteValidationError } from "../../src/site/loader";
import { demoSite, writeSite } from "./helpers";

// v3.11: the site's own button styles (theme.buttons, design-system/theme/buttons.ts).
const theme = resolveTheme({ archetype: "warm", accent: "#c2410c" });

function load(buttons: unknown, extra: Record<string, unknown> = {}) {
  const site = demoSite();
  site.theme = { ...site.theme, buttons, ...extra };
  try {
    return { warnings: loadSite(writeSite(site, { hero: { file: "hero.jpg", alt: "Hero" }, icon: { file: "icon.png", alt: "" } }, ["hero.jpg", "icon.png"])).warnings, issues: [] as string[] };
  } catch (error) {
    if (error instanceof SiteValidationError) return { warnings: [] as string[], issues: error.issues };
    throw error;
  }
}

describe("theme.buttons in site.json", () => {
  test("a style per kind: colors, sizes, text and effects", () => {
    const { issues } = load({
      primary: { background: "#123456", text: "#ffffff", hover: { background: "#0b2238" }, paddingX: 1.75, paddingY: 0.25, borderWidth: 2, radius: "pill", weight: 700, uppercase: true, letterSpacing: 0.05, shadow: "soft", hoverEffect: "glow" },
      secondary: { background: "transparent", border: "#123456", text: "#123456" },
      ghost: { text: "#123456" },
    });
    expect(issues).toEqual([]);
  });

  test("out of range, off the step, unknown kinds and colors are refused", () => {
    const { issues } = load({ primary: { paddingX: 3, paddingY: 0.3, borderWidth: 1.5, radius: "2", weight: 800, text: "transparent", background: "red" }, danger: { text: "#ffffff" } });
    const text = issues.join("\n");
    for (const field of ["paddingX", "paddingY", "borderWidth", "radius", "weight", "text", "background", "danger"]) expect(text).toContain(field);
  });

  test("weak contrast is a warning, never an error; the warning says what the build uses instead", () => {
    const { issues, warnings } = load({ primary: { background: "#eeeeee", text: "#ffffff" } });
    expect(issues).toEqual([]);
    expect(warnings.filter((line) => line.startsWith("theme.buttons.primary"))).toEqual([
      expect.stringContaining("the label (#ffffff on #eeeeee)"),
      expect.stringContaining("the label on hover"),
      expect.stringContaining("the button against the page"),
      expect.stringMatching(/the build uses the nearest colors that pass: background #eeeeee → #[0-9a-f]{6}, text #ffffff → #[0-9a-f]{6}/),
    ]);
  });

  test("v3.12: only the operator's flag keeps failing colors, still with the warning", () => {
    const { issues, warnings } = load({ primary: { background: "#eeeeee", text: "#ffffff" } }, { allowLowContrastButtons: true });
    expect(issues).toEqual([]);
    const lines = warnings.filter((line) => line.startsWith("theme.buttons.primary"));
    expect(lines).toHaveLength(3);
    for (const line of lines) expect(line).toContain("Kept as set (theme.allowLowContrastButtons).");
    expect(load({ primary: { text: "#ffffff" } }, { allowLowContrastButtons: "yes" }).issues.join("\n")).toContain("allowLowContrastButtons");
  });
});

describe("colors", () => {
  test("hover follows the resting colors; a primary border follows its background", () => {
    const colors = setColors("primary", { background: "#123456", text: "#ffffff" });
    expect(colors).toMatchObject({ background: "#123456", border: "#123456", text: "#ffffff", hoverText: "#ffffff" });
    expect(colors.hoverBackground).not.toBe("#123456");
    expect(colors.hoverBorder).toBe(colors.hoverBackground);
    // A border set stays on hover; a secondary border does not follow its background.
    expect(setColors("primary", { background: "#123456", border: "#ff0000" }).hoverBorder).toBe("#ff0000");
    expect(setColors("secondary", { background: "#123456" }).border).toBeUndefined();
    // Transparent stays transparent on hover; nothing set, nothing returned.
    expect(setColors("ghost", { background: "transparent" }).hoverBackground).toBe("transparent");
    expect(setColors("primary", {})).toEqual({});
  });

  test("hover shows also on black", () => {
    expect(contrast(hoverShade("#000000"), "#000000")).toBeGreaterThan(1.2);
    expect(contrast(hoverShade("#ffffff"), "#ffffff")).toBeGreaterThan(1.1);
  });

  test("the theme's colors where the site sets none", () => {
    expect(buttonPaint("primary", { text: "#000000" }, theme.light)).toMatchObject({ text: "#000000", background: theme.light.action.primary });
    expect(buttonPaint("ghost", undefined, theme.light)).toMatchObject({ background: "transparent", hoverBackground: theme.light.background.muted });
  });
});

describe("custom properties", () => {
  test("only what the site sets; side padding per size; pill; glow", () => {
    expect(buttonVars(undefined)).toEqual({});
    expect(buttonVars({ primary: {} })).toEqual({});
    const vars = buttonVars({ primary: { paddingX: 1.5, radius: "pill", weight: 500, uppercase: false, hoverEffect: "glow", background: "#123456" }, ghost: { radius: "0", letterSpacing: 0.05, shadow: "strong", hoverEffect: "none" } });
    expect(vars).toMatchObject({
      "button-primary-padding-x-sm": "1rem",
      "button-primary-padding-x-md": "1.5rem",
      "button-primary-padding-x-lg": "2rem",
      "button-primary-radius": "999px",
      "button-primary-weight": "500",
      "button-primary-case": "none",
      "button-primary-lift": "0px",
      "button-primary-glow": "0.25rem",
      "button-ghost-radius": "0",
      "button-ghost-tracking": "0.05em",
      "button-ghost-shadow": "var(--elevation-dropdown)",
      "button-ghost-lift": "0px",
    });
    expect(vars["button-primary-glow-color"]).toBe(vars["button-primary-hover-bg"]);
    // "No shadow" draws nothing but keeps the hover glow's list valid.
    expect(buttonVars({ primary: { shadow: "none", hoverEffect: "glow" } })["button-primary-shadow"]).toBe("0 0 #0000");
    // A button without a hover background glows in its text's color.
    expect(buttonVars({ ghost: { hoverEffect: "glow" } })["button-ghost-glow-color"]).toBe("currentColor");
    expect(buttonVars({ secondary: { background: "transparent", text: "#123456", hoverEffect: "glow" } })["button-secondary-glow-color"]).toBe("#123456");
    expect(vars["button-ghost-glow"]).toBeUndefined();
    expect(Object.keys(vars).some((name) => name.startsWith("button-secondary"))).toBe(false);
  });
});

describe("contrast", () => {
  test("only pairs the site touches are judged", () => {
    // The theme's secondary button is a quiet grey on the page: not the site's choice, no issue.
    expect(buttonIssues("secondary", { paddingX: 2 }, theme.light)).toEqual([]);
    expect(buttonIssues("secondary", { text: "#111111" }, theme.light).map((issue) => issue.check)).toEqual([]);
    expect(buttonIssues("primary", { background: "#ffffff", text: "#ffffff" }, theme.light).map((issue) => issue.check)).toEqual(["text", "hoverText", "shape"]);
    // An outlined button is seen by its border.
    expect(buttonIssues("primary", { background: "transparent", border: "#123456", text: "#123456" }, theme.light)).toEqual([]);
  });

  test("a part of the page with its own palette keeps the theme's buttons where the site's would vanish", () => {
    const styles = { primary: { background: theme.light.action.primary, text: "#ffffff" }, ghost: { text: "#123456" } };
    // On the accent background the brand-colored button would disappear; on the page it is fine.
    expect(vanishingKinds(styles, accentPalette(theme.light))).toContain("primary");
    expect(vanishingKinds(styles, theme.light)).toEqual([]);
    // Dark navy text without a background vanishes on the dark palette.
    expect(vanishingKinds(styles, theme.dark)).toContain("ghost");
    // A part re-declares each kind: reset where it vanishes, the site's colors where they show; its own scheme: nothing.
    const scope = buttonScopeVars({ ...styles, ghost: { text: "#ffffff" } }, accentPalette(theme.light));
    expect(scope["button-primary-bg"]).toBe("initial");
    expect(scope["button-ghost-text"]).toBe("#ffffff");
    expect(buttonScopeVars(styles, theme.light, { own: true })).toEqual({});
  });

  test("a fix moves only the lightness, to the nearest color that reads", () => {
    const fixed = fixContrast("#ffffff", "#eeeeee", 4.5);
    expect(contrast(fixed, "#eeeeee")).toBeGreaterThanOrEqual(4.5);
    expect(fixContrast("#000000", "#ffffff", 4.5)).toBe("#000000");
  });

  test("v3.12: a style is fixed shape first, then its label, then the label on hover; what passes stays", () => {
    const page = theme.light.background.primary;
    // White on a pale grey: the background darkens to 3:1 against the page, the label then reads on it,
    // and on the hover shade that follows the new background.
    const pale = fixButtonStyle("primary", { background: "#eeeeee", text: "#ffffff", radius: "pill" }, theme.light);
    expect(pale.fixes.map((fix) => fix.property)).toEqual(["background", "text", "hover.text"]);
    expect(pale.style.radius).toBe("pill");
    expect(contrast(pale.style.background!, page)).toBeGreaterThanOrEqual(3);
    expect(buttonIssues("primary", pale.style, theme.light)).toEqual([]);

    // An outlined button is fixed by its border; a hover background the site set gets a label that reads on it.
    const outlined = fixButtonStyle("secondary", { background: "transparent", border: "#f4f4f4", text: "#123456", hover: { background: "#123456" } }, theme.light);
    expect(outlined.fixes.map((fix) => fix.property)).toEqual(["border", "hover.text"]);
    expect(outlined.style.background).toBe("transparent");
    expect(buttonIssues("secondary", outlined.style, theme.light)).toEqual([]);

    // Nothing failing: the very same colors.
    const fine = { background: "#123456", text: "#ffffff" };
    expect(fixButtonStyle("primary", fine, theme.light)).toEqual({ style: fine, fixes: [] });
  });

  test("v3.12: the site's styles as built: every kind passes in the scheme it shows", () => {
    const styles = { primary: { background: "#ffffff", text: "#ffffff" }, ghost: { text: "#fafafa" }, secondary: { paddingX: 2 } };
    const { styles: fixed, fixes } = fixButtonStyles(styles, theme.light);
    for (const kind of ["primary", "secondary", "ghost"] as const) expect(buttonIssues(kind, fixed?.[kind], theme.light)).toEqual([]);
    expect(fixed?.secondary).toEqual({ paddingX: 2 });
    expect(new Set(fixes.map((fix) => fix.kind))).toEqual(new Set(["primary", "ghost"]));
    expect(fixButtonStyles(undefined, theme.light)).toEqual({ styles: undefined, fixes: [] });
  });
});

test("the theme's buttons for an editor: both palettes, the first scheme's colors, the shape", () => {
  const defaults = buttonDefaults({ archetype: "warm", accent: "#c2410c" });
  expect(defaults.scheme).toBe("light");
  expect(defaults.paint.primary.background).toBe(theme.light.action.primary);
  expect(defaults.palettes.dark.background.primary).toBe(theme.dark.background.primary);
  expect(defaults).toMatchObject({ weight: 600, paddingX: 1.5, page: theme.light.background.primary });
  expect(buttonDefaults({ archetype: "warm", colorScheme: "dark" }).scheme).toBe("dark");
});
