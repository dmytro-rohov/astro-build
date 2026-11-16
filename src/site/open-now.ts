/**
 * "Open now" from the opening hours: the build cannot know the time, so the status is
 * computed in the visitor's browser, in the business time zone. No imports — the module
 * is bundled into the page script of the hours-location variants.
 */
const WEEK = ["mo", "tu", "we", "th", "fr", "sa", "su"] as const;
const DAY = 24 * 60;

export type Day = (typeof WEEK)[number];
/** One open day ("HH:MM"); a closing time not later than the opening one is after midnight. */
export type OpenDay = { day: Day; opens: string; closes: string };
export type Moment = { day: Day; time: string };
/** `days` until the next opening: 0 today, 1 tomorrow, 7 the same day next week. */
export type OpenStatus = { open: true; closes: string } | { open: false; next?: { days: number; day: Day; opens: string } };

const minutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));

/** "09:00" → "9:00"; a closing "00:00" is the end of the day: "24:00". */
export function clock(time: string, closing = false): string {
  return closing && time === "00:00" ? "24:00" : time.replace(/^0(?=\d)/, "");
}

/** Day of the week and "HH:MM" of `date` in an IANA time zone. */
export function momentIn(date: Date, timeZone: string): Moment {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(date);
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  // "Mon" → "mo", "Thu" → "th"…
  return { day: part("weekday").slice(0, 2).toLowerCase() as Day, time: `${part("hour")}:${part("minute")}` };
}

/**
 * Open or closed at `now`: when open, the closing time; when closed, the next opening.
 * Fri 20:00–02:00 is still open on Saturday at 01:00; equal times mean 24 hours.
 */
export function openStatus(hours: readonly OpenDay[], now: Moment): OpenStatus {
  const at = WEEK.indexOf(now.day) * DAY + minutes(now.time);
  let next: { wait: number; entry: OpenDay } | undefined;

  for (const entry of hours) {
    const start = WEEK.indexOf(entry.day) * DAY + minutes(entry.opens);
    const span = minutes(entry.closes) - minutes(entry.opens);
    // Minutes since this day's opening, counted round the week (Sunday night runs into Monday).
    const since = (at - start + 7 * DAY) % (7 * DAY);

    if (since < (span > 0 ? span : span + DAY)) return { open: true, closes: entry.closes };

    const wait = 7 * DAY - since;
    if (!next || wait < next.wait) next = { wait, entry };
  }

  if (!next) return { open: false };
  return { open: false, next: { days: Math.floor((minutes(now.time) + next.wait) / DAY), day: next.entry.day, opens: next.entry.opens } };
}
