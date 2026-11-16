/** Layout decisions shared by the gallery variants (pure functions, unit-tested). */

export type Shape = "portrait" | "landscape" | "square";

/** Portrait when clearly taller than wide, landscape when clearly wider, else square. */
export function shapeOf(size: { width: number; height: number }): Shape {
  const ratio = size.height / size.width;
  return ratio > 1.15 ? "portrait" : ratio < 0.87 ? "landscape" : "square";
}

/**
 * `sizes` of a tile that takes 1/columns of the content width from tablets up (the container
 * stops growing at 1224px) and 1/phoneColumns on phones.
 */
export function tileSizes(columns: number, phoneColumns = 1): string {
  return `(min-width: 1280px) ${Math.round(1224 / columns)}px, (min-width: 768px) ${Math.round(100 / columns)}vw, ${Math.round(100 / phoneColumns)}vw`;
}

export type MosaicTile = "large" | "wide" | undefined;

/**
 * Mosaic tiles on a grid of square cells (4 columns from tablets, 2 on phones): the first photo
 * is 2 × 2, the rest 1 × 1, and the count decides what closes the rectangle — nothing (5, 9…),
 * a wide last tile (4, 8…), two wide last tiles (3, 7…) or a second large tile two rows from
 * the end, opposite the first (2, 6, 10…). Each case also leaves full rows of two on phones.
 */
export function mosaicTiles(count: number): MosaicTile[] {
  const tiles: MosaicTile[] = Array.from({ length: count }, (_, index) => (index === 0 ? "large" : undefined));
  const rest = count % 4;

  if (rest === 0) tiles[count - 1] = "wide";
  if (rest === 3) tiles[count - 2] = tiles[count - 1] = "wide";
  if (rest === 2) tiles[Math.max(1, count - 3)] = "large";

  return tiles;
}

/** Photos per slider page: at most five, as even as possible, fuller pages first (8 → 4 + 4, 11 → 4 + 4 + 3). */
export function sliderPages(count: number): number[] {
  const pages = Math.ceil(count / 5);
  return Array.from({ length: pages }, (_, index) => Math.floor(count / pages) + (index < count % pages ? 1 : 0));
}

/** Tiles of a slider page on wide screens, by the number of photos on it (see _gallery.scss). */
export type SliderTile = "big" | "wide" | "tall" | "small" | "half";

export const SLIDER_TILES: Record<number, readonly SliderTile[]> = {
  2: ["half", "half"],
  3: ["big", "wide", "wide"],
  4: ["tall", "wide", "wide", "tall"],
  5: ["tall", "wide", "small", "small", "tall"],
};

/** Grid rows per column width in the masonry grid; one more row is the gap under a photo. */
export const MASONRY_UNIT = 20;
// Spans between 16:10 and 2:3: evening out the columns never crops a photo further than that.
const MIN_SPAN = Math.round(MASONRY_UNIT * 0.625) + 1;
const MAX_SPAN = Math.round(MASONRY_UNIT * 1.5) + 1;

export type MasonryTile = { column: number; span: number };

/**
 * Masonry placement for photos of the given proportions (height / width): each photo goes to
 * the shortest column (in rows of MASONRY_UNIT per column width), then the spans are evened
 * out, a row at a time from the bottom of each column, so the columns end level.
 */
export function masonryLayout(ratios: number[], columns: number): MasonryTile[] {
  const tiles = ratios.map((ratio) => ({ column: 0, span: Math.min(MAX_SPAN, Math.max(MIN_SPAN, Math.round(MASONRY_UNIT * ratio) + 1)) }));
  const heights: number[] = Array(columns).fill(0);

  for (const tile of tiles) {
    tile.column = heights.indexOf(Math.min(...heights));
    heights[tile.column] += tile.span;
  }

  // The common height every column can reach within the span limits, closest to the average.
  const used = heights.map((_, column) => tiles.filter((tile) => tile.column === column));
  const reachable = used.filter((own) => own.length);
  const low = Math.max(...reachable.map((own) => own.length * MIN_SPAN));
  const high = Math.min(...reachable.map((own) => own.length * MAX_SPAN));
  const average = Math.round(heights.reduce((sum, height) => sum + height, 0) / reachable.length);
  const target = low <= high ? Math.min(high, Math.max(low, average)) : average;

  for (const own of reachable) {
    let rest = target - own.reduce((sum, tile) => sum + tile.span, 0);

    for (let index = own.length - 1, idle = 0; rest !== 0 && idle < own.length; index = (index || own.length) - 1) {
      const tile = own[index];
      const next = tile.span + Math.sign(rest);
      if (next < MIN_SPAN || next > MAX_SPAN) {
        idle++;
        continue;
      }
      tile.span = next;
      rest -= Math.sign(rest);
      idle = 0;
    }
  }

  return tiles;
}

/** Masonry proportions (height / width): portraits stay tall; landscapes alternate short, tall and square for rhythm. */
export function masonryRatio(shape: Shape, index: number): number {
  if (shape === "portrait") return 4 / 3;
  if (shape === "square") return 1;
  return [0.75, 1.25, 1][index % 3];
}
