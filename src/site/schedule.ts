/** Class schedule helpers: items grouped by day (Monday first) and sorted by time, and the matrix of rows × days. */
import { DAYS, type Day } from "./schema/fields";

type Item = { day: Day; start: string; end: string };
type MatrixItem = Item & { title: string; instructor?: string };

export function scheduleByDay<T extends Item>(items: readonly T[]): { day: Day; items: T[] }[] {
  return DAYS.map((day) => ({
    day,
    items: items.filter((item) => item.day === day).sort((a, b) => a.start.localeCompare(b.start) || a.end.localeCompare(b.end)),
  })).filter((group) => group.items.length > 0);
}

const rowKey = (label: string) => label.trim().replace(/\s+/g, " ").toLocaleLowerCase();

/**
 * The schedule as a matrix: a row per instructor or per class name, a column per day with
 * classes; every cell holds the row's classes of that day, sorted by time (empty when none).
 * Rows are instructors when every class has one and there are two or more of them (or when
 * `rows` asks for it and every class has one), otherwise class names. Names are matched
 * ignoring case and spacing (the first spelling wins); rows follow their first class in the week.
 */
export function scheduleMatrix<T extends MatrixItem>(
  items: readonly T[],
  rows?: "instructor" | "class",
): { by: "instructor" | "class"; days: Day[]; rows: { label: string; cells: T[][] }[] } {
  const days = scheduleByDay(items);
  const sorted = days.flatMap((group) => group.items);
  const instructors = new Set(sorted.map((item) => rowKey(item.instructor ?? "")));
  const every = sorted.every((item) => item.instructor);
  const by = rows !== "class" && every && (rows === "instructor" || instructors.size > 1) ? "instructor" : "class";
  const labelOf = (item: T) => (by === "instructor" ? item.instructor! : item.title);

  const labels = new Map<string, string>();
  for (const item of sorted) {
    if (!labels.has(rowKey(labelOf(item)))) labels.set(rowKey(labelOf(item)), labelOf(item).trim());
  }

  return {
    by,
    days: days.map((group) => group.day),
    rows: [...labels].map(([key, label]) => ({
      label,
      cells: days.map((group) => group.items.filter((item) => rowKey(labelOf(item)) === key)),
    })),
  };
}
