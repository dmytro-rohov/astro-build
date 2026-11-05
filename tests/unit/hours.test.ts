import { expect, test } from "vitest";
import pl from "../../src/i18n/dictionaries/pl";
import { hoursRows, openingHoursSpecification } from "../../src/site/hours";

const hours = [
  { days: ["mo", "tu", "we", "th", "fr"] as const, opens: "09:00", closes: "18:00" },
  { days: ["sa"] as const, opens: "10:00", closes: "14:00" },
  { days: ["su"] as const, closed: true },
].map((entry) => ({ ...entry, days: [...entry.days] }));

test("rows in the site language, consecutive days as a range", () => {
  expect(hoursRows(hours, pl)).toEqual([
    { days: "Pn–Pt", daysLong: "Poniedziałek, Wtorek, Środa, Czwartek, Piątek", value: "09:00–18:00", closed: false },
    { days: "Sb", daysLong: "Sobota", value: "10:00–14:00", closed: false },
    { days: "Nd", daysLong: "Niedziela", value: "Zamknięte", closed: true },
  ]);
});

test("schema.org opening hours skip closed days", () => {
  expect(openingHoursSpecification(hours)).toEqual([
    { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "09:00", closes: "18:00" },
    { "@type": "OpeningHoursSpecification", dayOfWeek: ["Saturday"], opens: "10:00", closes: "14:00" },
  ]);
});
