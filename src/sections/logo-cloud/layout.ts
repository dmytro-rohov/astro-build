/** Decisions shared by the logo-cloud variants (pure functions, unit-tested). */
import { balancedRow } from "../team/layout";

export type LogoShape = "tall" | "square" | "landscape" | "wide" | "wider" | "widest";

/**
 * Size class of a logo by its proportions. Logos are set to about the same area, not the same
 * height: a long wordmark gets lower, a square mark taller, so a row of them looks even.
 */
export function logoShape(width: number, height: number): LogoShape {
  const ratio = width / Math.max(height, 1);
  if (ratio < 0.85) return "tall";
  if (ratio < 1.4) return "square";
  if (ratio < 2.2) return "landscape";
  if (ratio < 3.2) return "wide";
  return ratio < 4.6 ? "wider" : "widest";
}

/** Logos per row on phones, tablets and wide screens: balanced rows of at most `max` each. */
export function logoRows(count: number, [sm, md, lg]: readonly [number, number, number]): { sm: number; md: number; lg: number } {
  return { sm: balancedRow(count, sm), md: balancedRow(count, md), lg: balancedRow(count, lg) };
}

/**
 * Columns of color tiles on tablets and wide screens (phones: two). Tile colors repeat every
 * five, so five columns would stack equal colors: three or four up to twelve logos, six for more.
 */
export function tileColumns(count: number): { md: number; lg: number } {
  const md = count === 2 || count === 4 ? 2 : 3;
  if (count <= 4) return { md, lg: count };
  return { md, lg: count > 12 ? 6 : [5, 6, 9].includes(count) ? 3 : 4 };
}

/** Logos in groups of `size` (pages of the split-image slider). */
export function pages<T>(items: readonly T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, index) => items.slice(index * size, (index + 1) * size));
}

/**
 * Marquee: how many times the logos repeat in one loop so that it is wider than the band
 * (at least `min` logos) — two logos are shown eight times, twelve once.
 */
export function marqueeRepeats(count: number, min = 16): number {
  return Math.ceil(min / count);
}
