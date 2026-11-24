/**
 * v3.9: calendar dates of site.json ("YYYY-MM-DD") for people and feeds. A date has no time zone:
 * it is read at noon UTC, so no zone moves it to the day before or after. Pure TS (tests).
 */
const at = (iso: string) => new Date(`${iso}T12:00:00Z`);

/** "18 listopada 2026" (long), "18 lis 2026" (medium), "18.11.2026" (short) in the site's language. */
export function formatDate(iso: string, lang: string, style: "long" | "medium" | "short" = "long"): string {
  return new Intl.DateTimeFormat(lang, { dateStyle: style, timeZone: "UTC" }).format(at(iso));
}

/** "Listopad 2026": a month as a heading (first letter capitalized), from "2026-11" or a whole date. */
export function monthLabel(iso: string, lang: string): string {
  const label = new Intl.DateTimeFormat(lang, { month: "long", year: "numeric", timeZone: "UTC" }).format(at(`${iso.slice(0, 7)}-15`));
  return label.charAt(0).toLocaleUpperCase(lang) + label.slice(1);
}

/** RFC 822 date for RSS: "Wed, 18 Nov 2026 12:00:00 GMT". */
export const rssDate = (iso: string) => at(iso).toUTCString();

/**
 * v3.12: a date as an ISO 8601 date and time for structured data and article meta, which want a time and a zone:
 * noon in the business time zone, with that zone's offset on that day ("2026-11-18T12:00:00+01:00").
 */
export function isoDateTime(iso: string, timeZone: string): string {
  const zone = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "longOffset" }).formatToParts(at(iso)).find((part) => part.type === "timeZoneName")?.value;
  // "GMT+01:00", "GMT-03:30"; plain "GMT" is UTC.
  const offset = zone?.match(/^GMT([+-]\d{2}:\d{2})$/)?.[1] ?? "+00:00";
  return `${iso}T12:00:00${offset}`;
}
