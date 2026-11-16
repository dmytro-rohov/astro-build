import { describe, expect, test } from "vitest";
import { clock, momentIn, openStatus, type OpenDay } from "../../src/site/open-now";

// A bakery: Mon–Fri 7:00–18:00, Saturday 8:00–14:00, Sunday closed.
const bakery: OpenDay[] = [
  ...(["mo", "tu", "we", "th", "fr"] as const).map((day) => ({ day, opens: "07:00", closes: "18:00" })),
  { day: "sa", opens: "08:00", closes: "14:00" },
];

// A bar: Thu–Sat 18:00 until 2:00 at night, Sunday until midnight.
const bar: OpenDay[] = [
  ...(["th", "fr", "sa"] as const).map((day) => ({ day, opens: "18:00", closes: "02:00" })),
  { day: "su", opens: "16:00", closes: "00:00" },
];

describe("momentIn", () => {
  test("day and time in the business time zone, not the visitor's", () => {
    // Monday 16 Nov 2026, 23:30 UTC = Tuesday 0:30 in Warsaw (CET, UTC+1).
    expect(momentIn(new Date("2026-11-16T23:30:00Z"), "Europe/Warsaw")).toEqual({ day: "tu", time: "00:30" });
    expect(momentIn(new Date("2026-11-16T23:30:00Z"), "Europe/London")).toEqual({ day: "mo", time: "23:30" });
    // Summer time (CEST, UTC+2) and midnight as 00, not 24.
    expect(momentIn(new Date("2026-07-04T22:00:00Z"), "Europe/Warsaw")).toEqual({ day: "su", time: "00:00" });
  });
});

describe("openStatus", () => {
  test("open: until the closing time", () => {
    expect(openStatus(bakery, { day: "we", time: "07:00" })).toEqual({ open: true, closes: "18:00" });
    expect(openStatus(bakery, { day: "sa", time: "13:59" })).toEqual({ open: true, closes: "14:00" });
  });

  test("closed later today, tomorrow and at the closing minute", () => {
    expect(openStatus(bakery, { day: "tu", time: "06:15" })).toEqual({ open: false, next: { days: 0, day: "tu", opens: "07:00" } });
    expect(openStatus(bakery, { day: "tu", time: "18:00" })).toEqual({ open: false, next: { days: 1, day: "we", opens: "07:00" } });
  });

  test("the next opening across a closed Sunday and a weekend", () => {
    expect(openStatus(bakery, { day: "sa", time: "15:00" })).toEqual({ open: false, next: { days: 2, day: "mo", opens: "07:00" } });
    expect(openStatus(bakery, { day: "su", time: "12:00" })).toEqual({ open: false, next: { days: 1, day: "mo", opens: "07:00" } });

    const weekdays = bakery.slice(0, 5);
    expect(openStatus(weekdays, { day: "fr", time: "19:00" })).toEqual({ open: false, next: { days: 3, day: "mo", opens: "07:00" } });
  });

  test("closing after midnight belongs to the day before", () => {
    expect(openStatus(bar, { day: "fr", time: "01:30" })).toEqual({ open: true, closes: "02:00" });
    expect(openStatus(bar, { day: "sa", time: "23:00" })).toEqual({ open: true, closes: "02:00" });
    // Saturday's night runs into Sunday; Sunday's own hours end at midnight.
    expect(openStatus(bar, { day: "su", time: "01:00" })).toEqual({ open: true, closes: "02:00" });
    expect(openStatus(bar, { day: "su", time: "02:00" })).toEqual({ open: false, next: { days: 0, day: "su", opens: "16:00" } });
    expect(openStatus(bar, { day: "su", time: "23:59" })).toEqual({ open: true, closes: "00:00" });
    // Monday after Sunday's midnight: closed until Thursday evening.
    expect(openStatus(bar, { day: "mo", time: "00:00" })).toEqual({ open: false, next: { days: 3, day: "th", opens: "18:00" } });
  });

  test("the only opening earlier today is next week; equal times are 24 hours; no hours", () => {
    const once: OpenDay[] = [{ day: "mo", opens: "09:00", closes: "12:00" }];
    expect(openStatus(once, { day: "mo", time: "13:00" })).toEqual({ open: false, next: { days: 7, day: "mo", opens: "09:00" } });
    expect(openStatus([{ day: "we", opens: "00:00", closes: "00:00" }], { day: "we", time: "23:59" })).toEqual({ open: true, closes: "00:00" });
    expect(openStatus([], { day: "we", time: "12:00" })).toEqual({ open: false });
  });
});

test("clock drops the leading zero; a closing midnight is 24:00", () => {
  expect(clock("09:05")).toBe("9:05");
  expect(clock("00:30")).toBe("0:30");
  expect(clock("18:00")).toBe("18:00");
  expect(clock("00:00", true)).toBe("24:00");
});
