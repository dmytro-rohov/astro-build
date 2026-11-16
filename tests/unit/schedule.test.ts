import { expect, test } from "vitest";
import { scheduleByDay, scheduleMatrix } from "../../src/site/schedule";
import type { Day } from "../../src/site/schema/fields";

type Item = { day: Day; start: string; end: string; title: string; instructor?: string };

const item = (day: Day, start: string, title: string, instructor?: string): Item => ({ day, start, end: `${start.slice(0, 2)}:50`, title, instructor });
const cells = (matrix: ReturnType<typeof scheduleMatrix<Item>>) =>
  matrix.rows.map((row) => `${row.label}: ${row.cells.map((cell) => cell.map((entry) => entry.start).join("+") || "-").join(" ")}`);

test("days start on Monday, classes are sorted by time and days without classes are left out", () => {
  const days = scheduleByDay([item("su", "10:00", "A"), item("mo", "18:00", "B"), item("mo", "09:00", "C"), item("we", "12:00", "D")]);

  expect(days.map((group) => `${group.day}:${group.items.map((entry) => entry.title).join("")}`)).toEqual(["mo:CB", "we:D", "su:A"]);
});

test("matrix: a row per instructor and a column per day with classes, rows in order of their first class", () => {
  const matrix = scheduleMatrix([
    item("we", "18:00", "Salsa", "Ola"),
    item("mo", "19:00", "Bachata", "Jan"),
    item("mo", "17:00", "Salsa", "ola "),
    item("we", "17:00", "Zumba", "Ola"),
    item("fr", "10:00", "Joga", "Jan"),
  ]);

  expect(matrix.by).toBe("instructor");
  expect(matrix.days).toEqual(["mo", "we", "fr"]);
  expect(cells(matrix)).toEqual(["ola: 17:00 17:00+18:00 -", "Jan: 19:00 - 10:00"]);
});

test("matrix: class rows with one instructor, a class without one, or when the rows prop asks for them", () => {
  const one = [item("mo", "17:00", "Salsa", "Ola"), item("tu", "17:00", "Bachata", "Ola"), item("th", "18:00", "salsa", "Ola")];
  expect(scheduleMatrix(one).by).toBe("class");
  expect(cells(scheduleMatrix(one))).toEqual(["Salsa: 17:00 - 18:00", "Bachata: - 17:00 -"]);

  const missing = [item("mo", "17:00", "Salsa", "Ola"), item("tu", "17:00", "Bachata")];
  expect(scheduleMatrix(missing).by).toBe("class");
  expect(scheduleMatrix(missing, "instructor").by).toBe("class");

  const two = [item("mo", "17:00", "Salsa", "Ola"), item("tu", "17:00", "Bachata", "Jan")];
  expect(scheduleMatrix(two).by).toBe("instructor");
  expect(scheduleMatrix(two, "class").by).toBe("class");
  expect(scheduleMatrix(one, "instructor").by).toBe("instructor");
});
