import { expect, test } from "vitest";
import pl from "../../src/i18n/dictionaries/pl";
import { addressLines, directionsUrl, hoursRows, openDays, openingHoursSpecification, timeZoneOf, weekHours } from "../../src/site/hours";

type Entry = Parameters<typeof hoursRows>[0][number];

const hours: Entry[] = [
  { days: ["mo", "tu", "we", "th", "fr"], opens: "09:00", closes: "18:00" },
  { days: ["sa"], opens: "10:00", closes: "14:00" },
  { days: ["su"], closed: true },
];

test("rows in the site language, consecutive days as a range", () => {
  expect(hoursRows(hours, pl)).toEqual([
    { days: "Pn–Pt", daysLong: "Poniedziałek, Wtorek, Środa, Czwartek, Piątek", dayIds: ["mo", "tu", "we", "th", "fr"], value: "9:00–18:00", closed: false },
    { days: "Sb", daysLong: "Sobota", dayIds: ["sa"], value: "10:00–14:00", closed: false },
    { days: "Nd", daysLong: "Niedziela", dayIds: ["su"], value: "Zamknięte", closed: true },
  ]);
});

test("days listed one by one with the same hours become one row; midnight closes at 24:00", () => {
  const daily: Entry[] = [
    { days: ["tu"], opens: "08:00", closes: "16:00" },
    { days: ["mo"], opens: "08:00", closes: "16:00" },
    { days: ["we"], opens: "12:00", closes: "20:00" },
    { days: ["th"], opens: "08:00", closes: "16:00" },
    { days: ["fr"], opens: "18:00", closes: "00:00" },
    { days: ["sa"], closed: true },
    { days: ["su"], closed: true },
  ];

  expect(hoursRows(daily, pl).map((row) => `${row.days} ${row.value}`)).toEqual([
    "Pn, Wt, Cz 8:00–16:00",
    "Śr 12:00–20:00",
    "Pt 18:00–24:00",
    "Sb, Nd Zamknięte",
  ]);
});

test("the week has all seven days; days missing from the hours are closed", () => {
  const week = weekHours([{ days: ["mo", "we"], opens: "08:00", closes: "02:00" }], pl);

  expect(week.map((day) => day.day)).toEqual(["mo", "tu", "we", "th", "fr", "sa", "su"]);
  expect(week[0]).toEqual({ day: "mo", opens: "08:00", closes: "02:00", value: "8:00–2:00", closed: false });
  expect(week[1]).toEqual({ day: "tu", value: "Zamknięte", closed: true });
  expect(openDays(hours)).toHaveLength(6);
});

test("schema.org opening hours skip closed days", () => {
  expect(openingHoursSpecification(hours)).toEqual([
    { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "09:00", closes: "18:00" },
    { "@type": "OpeningHoursSpecification", dayOfWeek: ["Saturday"], opens: "10:00", closes: "14:00" },
  ]);
});

test("address lines, route planner and time zone", () => {
  const address = { street: "ul. Długa 42", city: "Kraków", postalCode: "31-146", country: "PL" };

  expect(addressLines(address)).toEqual(["ul. Długa 42", "31-146 Kraków"]);
  expect(directionsUrl(address)).toBe("https://www.google.com/maps/dir/?api=1&destination=ul.%20D%C5%82uga%2042%2C%2031-146%20Krak%C3%B3w");
  expect(directionsUrl({ postalCode: "31-146" })).toBeUndefined();
  expect(addressLines(undefined)).toEqual([]);
  expect(timeZoneOf("UA")).toBe("Europe/Kiev");
  expect(timeZoneOf(undefined)).toBe("Europe/Warsaw");
  expect(timeZoneOf("US")).toBe("Europe/Warsaw");
});
