/** Class schedule helpers: items grouped by day (Monday first) and sorted by time. */
import { DAYS, type Day } from "./schema/fields";

type Item = { day: Day; start: string; end: string };

export function scheduleByDay<T extends Item>(items: readonly T[]): { day: Day; items: T[] }[] {
  return DAYS.map((day) => ({
    day,
    items: items.filter((item) => item.day === day).sort((a, b) => a.start.localeCompare(b.start) || a.end.localeCompare(b.end)),
  })).filter((group) => group.items.length > 0);
}
