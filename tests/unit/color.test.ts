import { expect, test } from "vitest";
import { adjustForContrast, contrast, hexToOklch, mix, oklchToHex } from "../../src/design-system/theme/color";
import { hueDistance } from "./helpers";

test("hex → OKLCH → hex round trip", () => {
  for (const hex of ["#2563eb", "#e4572e", "#111827", "#ffffff", "#000000", "#16a34a"]) {
    expect(oklchToHex(hexToOklch(hex))).toBe(hex);
  }
});

test("WCAG contrast matches known values", () => {
  expect(contrast("#ffffff", "#000000")).toBeCloseTo(21, 1);
  expect(contrast("#2563eb", "#ffffff")).toBeCloseTo(5.17, 2);
});

test("adjustForContrast keeps the hue and reaches the target", () => {
  const original = "#f6b73c"; // light amber: 1.8:1 on white
  const adjusted = adjustForContrast(original, ["#ffffff", "#f3f4f6"], 4.5, -1);

  expect(contrast(adjusted, "#ffffff")).toBeGreaterThanOrEqual(4.5);
  expect(Math.abs(hexToOklch(adjusted).h - hexToOklch(original).h)).toBeLessThan(6);
});

test("mix halfway", () => {
  expect(mix("#000000", "#ffffff", 0)).toBe("#000000");
  expect(mix("#000000", "#ffffff", 1)).toBe("#ffffff");
});

test.each(["#2563eb", "#dc2626", "#ea580c", "#16a34a"])("mixing %s with white or near-black keeps its hue", (accent) => {
  // Neutrals have no hue of their own (chroma ≈ 0): an OKLCH mix turned blue + white teal.
  for (const neutral of ["#ffffff", "#000000", "#111111"]) {
    for (const amount of [0.12, 0.35, 0.6]) {
      expect(hueDistance(mix(accent, neutral, amount), accent), `${neutral} ${amount}`).toBeLessThan(3);
      expect(hueDistance(mix(neutral, accent, 1 - amount), accent), `${neutral} ${1 - amount} reversed`).toBeLessThan(3);
    }
  }
});
