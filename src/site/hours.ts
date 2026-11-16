/**
 * Opening hours and the place from business: rows for display (in the site language), the
 * whole week, schema.org OpeningHoursSpecification for JSON-LD, the business time zone (for
 * the "open now" status, src/site/open-now.ts) and the address with a route planner link.
 */
import type { Dictionary } from "@/i18n/dictionaries";
import { clock, type OpenDay } from "./open-now";
import { DAYS, type Site } from "./schema/site";

type Day = (typeof DAYS)[number];
type Entry = Site["business"]["hours"][number];
type Address = Site["business"]["address"];

const SCHEMA_DAYS: Record<Day, string> = {
  mo: "Monday", tu: "Tuesday", we: "Wednesday", th: "Thursday", fr: "Friday", sa: "Saturday", su: "Sunday",
};

const byWeek = (a: Day, b: Day) => DAYS.indexOf(a) - DAYS.indexOf(b);

/** "Pn–Pt", "Sb", "Pn, Śr" — consecutive days become a range. */
function dayLabel(days: readonly Day[], t: Dictionary): string {
  const sorted = [...days].sort(byWeek);
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

/** Opening and closing time as shown: "9:00–18:00", "18:00–2:00". */
export const hoursSpan = (opens: string, closes: string) => `${clock(opens)}–${clock(closes, true)}`;

export type HoursRow = { days: string; daysLong: string; dayIds: Day[]; value: string; closed: boolean };

/** Rows of days with the same hours ("Pn–Pt 9:00–18:00"), also when they are listed day by day. */
export function hoursRows(hours: readonly Entry[], t: Dictionary): HoursRow[] {
  const groups = new Map<string, Entry>();

  for (const entry of hours) {
    const key = entry.closed ? "closed" : `${entry.opens}–${entry.closes}`;
    const group = groups.get(key);
    groups.set(key, group ? { ...group, days: [...group.days, ...entry.days] } : entry);
  }

  return [...groups.values()]
    .map((entry) => ({ ...entry, days: [...entry.days].sort(byWeek) }))
    .sort((a, b) => byWeek(a.days[0], b.days[0]))
    .map((entry) => ({
      days: dayLabel(entry.days, t),
      daysLong: entry.days.map((day) => t.days[day].long).join(", "),
      dayIds: entry.days,
      value: entry.closed ? t.sections.closed : hoursSpan(entry.opens!, entry.closes!),
      closed: Boolean(entry.closed),
    }));
}

export type WeekDay = { day: Day; opens?: string; closes?: string; value: string; closed: boolean };

/** All seven days from Monday; a day missing from the hours is closed. */
export function weekHours(hours: readonly Entry[], t: Dictionary): WeekDay[] {
  return DAYS.map((day) => {
    const entry = hours.find((item) => item.days.includes(day));
    return entry && !entry.closed
      ? { day, opens: entry.opens, closes: entry.closes, value: hoursSpan(entry.opens!, entry.closes!), closed: false }
      : { day, value: t.sections.closed, closed: true };
  });
}

/** The open days for the "open now" script. */
export const openDays = (hours: readonly Entry[]): OpenDay[] =>
  hours.flatMap((entry) => (entry.closed ? [] : entry.days.map((day) => ({ day, opens: entry.opens!, closes: entry.closes! }))));

// Countries with one time zone; others (and sites without a country) use the engine default.
const TIME_ZONES: Record<string, string> = {
  PL: "Europe/Warsaw", UA: "Europe/Kiev", DE: "Europe/Berlin", CZ: "Europe/Prague", SK: "Europe/Bratislava",
  LT: "Europe/Vilnius", LV: "Europe/Riga", EE: "Europe/Tallinn", AT: "Europe/Vienna", CH: "Europe/Zurich",
  NL: "Europe/Amsterdam", BE: "Europe/Brussels", FR: "Europe/Paris", IT: "Europe/Rome", GB: "Europe/London",
  IE: "Europe/Dublin", DK: "Europe/Copenhagen", SE: "Europe/Stockholm", NO: "Europe/Oslo", FI: "Europe/Helsinki",
  HU: "Europe/Budapest", RO: "Europe/Bucharest", BG: "Europe/Sofia", GR: "Europe/Athens", HR: "Europe/Zagreb",
  SI: "Europe/Ljubljana", RS: "Europe/Belgrade", BY: "Europe/Minsk", MD: "Europe/Chisinau",
};

/** IANA time zone of the business: from the address country, Europe/Warsaw by default. */
export const timeZoneOf = (country?: string) => TIME_ZONES[country ?? ""] ?? "Europe/Warsaw";

/** "ul. Długa 42", "31-146 Kraków" — the address lines that are set. */
export const addressLines = (address: Address) =>
  [address?.street, [address?.postalCode, address?.city].filter(Boolean).join(" ")].filter((line): line is string => Boolean(line));

/** Route planner to the address (Google Maps; opens the app on phones). None without a street or city. */
export function directionsUrl(address: Address): string | undefined {
  if (!address?.street && !address?.city) return undefined;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addressLines(address).join(", "))}`;
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
