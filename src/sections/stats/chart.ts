/**
 * Mini charts of the stats "chart-cards" variant (v3.3). They are decorative, not data: the
 * series comes from the item itself (id and value), so the same content draws the same chart
 * in every build, and it rises towards the last point — every card reads as growth.
 * Pure functions, no Astro imports (unit tested).
 */

/** FNV-1a: a 32-bit hash of a string. */
function hash(text: string): number {
  let value = 0x811c9dc5;
  for (let index = 0; index < text.length; index++) {
    value ^= text.charCodeAt(index);
    value = Math.imul(value, 0x01000193);
  }
  return value >>> 0;
}

/** Mulberry32: a tiny seeded generator of numbers in [0, 1). */
function generator(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let next = Math.imul(state ^ (state >>> 15), 1 | state);
    next = (next + Math.imul(next ^ (next >>> 7), 61 | next)) ^ next;
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

const round = (value: number) => Math.round(value * 100) / 100;

/** `count` values in [0.2, 1]: an upward trend with a seeded wobble; the last one is 1. */
export function chartSeries(seed: string, count = 10): number[] {
  const random = generator(hash(seed));
  // Where the line starts (a third to a half of the height) and how much it wobbles.
  const start = 0.3 + random() * 0.2;
  const wobble = 0.1 + random() * 0.08;

  return Array.from({ length: count }, (_, index) => {
    if (index === count - 1) return 1;
    const trend = start + ((1 - start) * index) / (count - 1);
    return round(Math.min(0.92, Math.max(0.2, trend + (random() - 0.5) * 2 * wobble)));
  });
}

export type ChartBar = { x: string; y: string; width: string; height: string };

/**
 * Bars as SVG percentages (the chart has no viewBox, so rounded corners stay round at any
 * width); `gap` is the space between bars as a share of one bar's slot.
 */
export function chartBars(series: number[], gap = 0.35): ChartBar[] {
  const slot = 100 / series.length;
  const percent = (value: number) => `${round(value)}%`;

  return series.map((value, index) => ({
    x: percent(index * slot + (slot * gap) / 2),
    y: percent((1 - value) * 100),
    width: percent(slot * (1 - gap)),
    height: percent(value * 100),
  }));
}

/** Points of the series in a `width` × `height` box; `top` keeps room for the end dot. */
function points(series: number[], width: number, height: number, top: number) {
  return series.map((value, index) => ({
    x: round((width * index) / Math.max(1, series.length - 1)),
    y: round(top + (1 - value) * (height - top)),
  }));
}

/** Smooth line through the series (Catmull-Rom as cubic Béziers), SVG path data. */
export function linePath(series: number[], width = 100, height = 40, top = 6): string {
  const p = points(series, width, height, top);
  let path = `M${p[0].x} ${p[0].y}`;

  for (let index = 0; index < p.length - 1; index++) {
    const [before, from, to, after] = [p[Math.max(0, index - 1)], p[index], p[index + 1], p[Math.min(p.length - 1, index + 2)]];
    const c1 = { x: round(from.x + (to.x - before.x) / 6), y: round(from.y + (to.y - before.y) / 6) };
    const c2 = { x: round(to.x - (after.x - from.x) / 6), y: round(to.y - (after.y - from.y) / 6) };
    path += ` C${c1.x} ${c1.y} ${c2.x} ${c2.y} ${to.x} ${to.y}`;
  }

  return path;
}

/** The line closed down to the baseline: the soft area under it. */
export function areaPath(series: number[], width = 100, height = 40, top = 6): string {
  return `${linePath(series, width, height, top)} L${width} ${height} L0 ${height} Z`;
}

/** Last point of the line (the end dot). */
export function endPoint(series: number[], width = 100, height = 40, top = 6): { x: number; y: number } {
  return points(series, width, height, top).at(-1)!;
}
