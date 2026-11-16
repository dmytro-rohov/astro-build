/** Layout decisions shared by the features variants (pure functions, unit-tested). */

export type Columns = "2" | "3" | "4";

/**
 * Columns on wide screens for `count` items: one row up to 4, then 3 or 4 —
 * whichever leaves full rows, else the fuller last row (7 → 4 + 3, not 3 + 3 + 1).
 */
export function autoColumns(count: number): Columns {
  if (count <= 4) return String(Math.max(count, 2)) as Columns;

  const lastRow = (columns: number) => count % columns || columns;
  return lastRow(4) > lastRow(3) ? "4" : "3";
}

/** Zero-based item to emphasize: the 1-based prop when it exists, else the middle of the first row. */
export function highlightIndex(count: number, columns: Columns, highlight?: number): number {
  if (highlight && highlight <= count) return highlight - 1;

  const perRow = Math.min(count, Number(columns));
  return Math.ceil(perRow / 2) - 1;
}

/** Tile size in the 4-column bento grid; tiles without one are 1 × 1. */
export type BentoSize = "lead" | "pair" | "tall" | "wide";

/**
 * Bento tiles on wide screens: the first tile is 2 × 2, then rows of four. Choosing what
 * sits beside the lead leaves either full rows or two tiles for the last row, which then
 * span two columns each — no gaps for any count.
 */
export function bentoSizes(count: number): (BentoSize | undefined)[] {
  const sizes: (BentoSize | undefined)[] = Array.from({ length: count }, (_, index) => (index === 0 ? "lead" : undefined));

  if (count === 2) sizes[1] = "pair";
  else if (count === 3) sizes[1] = sizes[2] = "wide";
  else {
    // Beside the lead: one tall and two small tiles for an even count, four small for an odd one.
    const beside = count % 2 === 0 ? 3 : 4;
    if (beside === 3) sizes[1] = "tall";
    if ((count - 1 - beside) % 4 === 2) sizes[count - 2] = sizes[count - 1] = "wide";
  }

  return sizes;
}
