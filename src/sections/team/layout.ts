/** Layout decisions shared by the team variants (pure functions, unit-tested). */
import { autoColumns, type Columns } from "../features/layout";

/** Columns on wide screens: one person alone, two side by side, then like the features grid. */
export function teamColumns(count: number): "1" | Columns {
  return count === 1 ? "1" : autoColumns(count);
}

/** People per row in balanced rows of at most `max` (8 → 4 + 4, 7 → 4 + 3, never 6 + 1). */
export function balancedRow(count: number, max: number): number {
  return Math.ceil(count / Math.ceil(count / max));
}

/**
 * Up to two initials for a person without a photo: first and last name ("Anna Maria Nowak" →
 * "AN"), skipping titles in lowercase or with a dot ("dr hab. Jan Kos" → "JK").
 */
export function initials(name: string): string {
  const words = name.split(/\s+/).filter((word) => /\p{L}/u.test(word));
  const names = words.filter((word) => /^\P{L}*\p{Lu}/u.test(word) && !word.endsWith("."));
  const parts = names.length ? names : words;
  const ends = parts.length > 1 ? [parts[0], parts[parts.length - 1]] : parts;

  return ends.map((word) => word.match(/\p{L}/u)?.[0] ?? "").join("").toLocaleUpperCase();
}

/**
 * Members reordered so the featured one (1-based `highlight`, else the first — usually the
 * owner) sits in the middle of the first row of `perRow`; with an even row in the middle slot
 * nearest to where they were. The others keep their order.
 */
export function spotlightOrder<T>(members: readonly T[], perRow: number, highlight?: number): { members: T[]; featured: number } {
  const from = highlight && highlight <= members.length ? highlight - 1 : 0;
  const row = Math.min(members.length, perRow);
  const slots = row % 2 ? [(row - 1) / 2] : [row / 2 - 1, row / 2];
  const to = slots.reduce((best, slot) => (Math.abs(slot - from) < Math.abs(best - from) ? slot : best));
  const rest = members.filter((_, index) => index !== from);

  return { members: [...rest.slice(0, to), members[from], ...rest.slice(to)], featured: to };
}
