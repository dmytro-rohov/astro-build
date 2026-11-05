import { describe, expect, test } from "vitest";
import { ARCHETYPE_IDS } from "../../src/design-system/archetypes";
import { accentPalette, checkContrast, resolveTheme } from "../../src/design-system/theme";
import { contrast } from "../../src/design-system/theme/color";

describe.each(ARCHETYPE_IDS)("archetype %s", (archetype) => {
  test("passes WCAG AA with its own accent", () => {
    expect(checkContrast(resolveTheme({ archetype }))).toEqual([]);
  });

  test.each(["#fde047", "#22d3ee", "#a3e635", "#f472b6", "#1e3a8a", "#000000", "#ffffff", "#e4572e"])(
    "passes WCAG AA with a client accent %s (auto-adjusted)",
    (accent) => {
      expect(checkContrast(resolveTheme({ archetype, accent }))).toEqual([]);
    },
  );
});

test("default archetype without accent keeps the v2 palette", () => {
  const theme = resolveTheme({});
  expect(theme.light.action.primary).toBe("#2563eb");
  expect(theme.adjustments).toEqual([]);
});

test("a too light accent is darkened and reported", () => {
  const theme = resolveTheme({ archetype: "warm", accent: "#fde047" });
  expect(theme.adjustments.some((item) => item.scheme === "light" && item.from === "#fde047")).toBe(true);
});

test("manual overrides are checked, not adjusted", () => {
  const theme = resolveTheme({ archetype: "minimal", overrides: { light: { "text.muted": "#bbbbbb" } } });
  expect(checkContrast(theme).some((failure) => failure.foreground.startsWith("text.muted"))).toBe(true);
});

test.each(ARCHETYPE_IDS)("accent sections of %s keep text and buttons readable", (archetype) => {
  const theme = resolveTheme({ archetype });

  for (const scheme of ["light", "dark"] as const) {
    const accent = accentPalette(theme[scheme]);
    expect(contrast(accent.text.primary, accent.background.primary)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(accent.action.primaryText, accent.action.primary)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(accent.border.control, accent.background.primary)).toBeGreaterThanOrEqual(3);
  }
});
