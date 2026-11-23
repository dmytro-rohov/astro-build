import { describe, expect, test } from "vitest";
import { buttonDefaults } from "../../src/design-system/theme/button-defaults";
import { buttonIssues, buttonPaint, buttonVars, fixContrast, setColors, vanishingKinds } from "../../src/design-system/theme/buttons";
import { contrast } from "../../src/design-system/theme/color";
import { accentPalette, resolveTheme } from "../../src/design-system/theme";
import { loadSite, SiteValidationError } from "../../src/site/loader";
import { demoSite, writeSite } from "./helpers";

// v3.11: the site's own button styles (theme.buttons, design-system/theme/buttons.ts).
const theme = resolveTheme({ archetype: "warm", accent: "#c2410c" });

function load(buttons: unknown) {
  const site = demoSite();
  site.theme = { ...site.theme, buttons };
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

  test("weak contrast is a warning, never an error", () => {
    const { issues, warnings } = load({ primary: { background: "#eeeeee", text: "#ffffff" } });
    expect(issues).toEqual([]);
    expect(warnings.filter((line) => line.startsWith("theme.buttons.primary"))).toEqual([
      expect.stringContaining("the label (#ffffff on #eeeeee)"),
      expect.stringContaining("the label on hover"),
      expect.stringContaining("the button against the page"),
    ]);
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
  });

  test("a fix moves only the lightness, to the nearest color that reads", () => {
    const fixed = fixContrast("#ffffff", "#eeeeee", 4.5);
    expect(contrast(fixed, "#eeeeee")).toBeGreaterThanOrEqual(4.5);
    expect(fixContrast("#000000", "#ffffff", 4.5)).toBe("#000000");
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
