/** Helpers shared by the process variants (pure TS, no Astro). */

/** "01"…"08": the big step numbers (decorative, the <ol> carries the order). */
export const stepNumber = (index: number) => String(index + 1).padStart(2, "0");

/**
 * Steps per row on wide screens. Up to `max` steps share one row; longer lists wrap into
 * balanced rows (5 → 3 + 2, 6 → 3 + 3, 7 → 4 + 3, 8 → 4 + 4) and the CSS centers a short last row.
 */
export function columnsFor(count: number, max: 4 | 5): number {
  if (count <= max) return count;
  return count <= 6 ? 3 : 4;
}

/** Classes of the step list: variant, step count and, for layouts in rows, steps per row. */
export function listClasses(variant: string, count: number, max?: 4 | 5) {
  return [
    "s-process__list",
    `s-process__list--${variant}`,
    `s-process__list--count-${count}`,
    max && `s-process__list--cols-${columnsFor(count, max)}`,
  ];
}
