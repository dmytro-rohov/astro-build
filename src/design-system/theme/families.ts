/**
 * Accent color families. Two designs for one brief look alike when their
 * accents come from the same family, even with different archetypes — the
 * orchestrator must pick accents from different families (site:compare checks it).
 */
import { hexToOklch } from "./color";

export const ACCENT_FAMILIES = ["red", "orange", "yellow", "green", "teal", "blue", "purple", "pink", "neutral"] as const;
export type AccentFamily = (typeof ACCENT_FAMILIES)[number];

/** OKLCH hue ranges (degrees) of each family; low chroma is "neutral". */
const HUES: [AccentFamily, number, number][] = [
  ["pink", 0, 5],
  ["red", 5, 35],
  ["orange", 35, 72],
  ["yellow", 72, 110],
  ["green", 110, 165],
  ["teal", 165, 230],
  ["blue", 230, 280],
  ["purple", 280, 320],
  ["pink", 320, 360],
];

export function accentFamily(hex: string): AccentFamily {
  const { c, h } = hexToOklch(hex);
  if (c < 0.04) return "neutral";
  return HUES.find(([, from, to]) => h >= from && h < to)?.[0] ?? "pink";
}
