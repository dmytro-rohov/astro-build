/**
 * Opening hours from business.hours: rows for display (in the site language)
 * and schema.org OpeningHoursSpecification for JSON-LD.
 */
import type { Dictionary } from "@/i18n/dictionaries";
import { DAYS, type Site } from "./schema/site";

type Day = (typeof DAYS)[number];
type Entry = Site["business"]["hours"][number];

const SCHEMA_DAYS: Record<Day, string> = {
  mo: "Monday", tu: "Tuesday", we: "Wednesday", th: "Thursday", fr: "Friday", sa: "Saturday", su: "Sunday",
};

/** "Pn–Pt", "Sb", "Pn, Śr" — consecutive days become a range. */
function dayLabel(days: readonly Day[], t: Dictionary): string {
  const sorted = [...days].sort((a, b) => DAYS.indexOf(a) - DAYS.indexOf(b));
  const groups: Day[][] = [];

  for (const day of sorted) {
    const last = groups.at(-1);
    if (last && DAYS.indexOf(day) === DAYS.indexOf(last.at(-1)!) + 1) last.push(day);
    else groups.push([day]);
  }

  return groups
    .map((group) =>
      group.length >= 3
        ? `${t.days[group[0]].short}–${t.days[group.at(-1)!].short}`
        : group.map((day) => t.days[day].short).join(", "),
    )
    .join(", ");
}

export type HoursRow = { days: string; daysLong: string; value: string; closed: boolean };

export function hoursRows(hours: readonly Entry[], t: Dictionary): HoursRow[] {
  return [...hours]
    .sort((a, b) => DAYS.indexOf(a.days[0]) - DAYS.indexOf(b.days[0]))
    .map((entry) => ({
      days: dayLabel(entry.days, t),
      daysLong: entry.days.map((day) => t.days[day].long).join(", "),
      value: entry.closed ? t.sections.closed : `${entry.opens}–${entry.closes}`,
      closed: Boolean(entry.closed),
    }));
}

export function openingHoursSpecification(hours: readonly Entry[]) {
  return hours
    .filter((entry) => !entry.closed)
    .map((entry) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: entry.days.map((day) => SCHEMA_DAYS[day]),
      opens: entry.opens,
      closes: entry.closes,
    }));
}
