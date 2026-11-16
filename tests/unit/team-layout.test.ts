import { expect, test } from "vitest";
import { balancedRow, initials, spotlightOrder, teamColumns } from "../../src/sections/team/layout";

test("columns: one person alone, two side by side, then like the features grid", () => {
  expect([1, 2, 3, 4, 5, 8].map(teamColumns)).toEqual(["1", "2", "3", "4", "3", "4"]);
});

test("balanced rows: never a lonely last person", () => {
  expect([3, 6, 7, 8, 9, 11, 12].map((count) => balancedRow(count, 6))).toEqual([3, 6, 4, 4, 5, 6, 6]);
  expect([3, 5, 6, 7, 8].map((count) => balancedRow(count, 4))).toEqual([3, 3, 3, 4, 4]);
});

test("initials: first and last name, titles skipped", () => {
  expect(initials("Anna Kowalczyk-Wiśniewska")).toBe("AK");
  expect(initials("Anna Maria Nowak")).toBe("AN");
  expect(initials("dr hab. Piotr Wójcik")).toBe("PW");
  expect(initials("Dr. Łucja Żak")).toBe("ŁŻ");
  expect(initials("„Ola” Kos")).toBe("OK");
  expect(initials("ola")).toBe("O");
  expect(initials("mgr  inż.")).toBe("MI");
});

test("spotlight: the featured person moves to the middle of the first row", () => {
  const people = ["a", "b", "c", "d", "e"];
  expect(spotlightOrder(people.slice(0, 3), 3)).toEqual({ members: ["b", "a", "c"], featured: 1 });
  expect(spotlightOrder(people.slice(0, 3), 3, 3)).toEqual({ members: ["a", "c", "b"], featured: 1 });
  expect(spotlightOrder(people.slice(0, 4), 4)).toEqual({ members: ["b", "a", "c", "d"], featured: 1 });
  expect(spotlightOrder(people.slice(0, 4), 4, 4)).toEqual({ members: ["a", "b", "d", "c"], featured: 2 });
  expect(spotlightOrder(people, 3, 9)).toEqual({ members: ["b", "a", "c", "d", "e"], featured: 1 });
  expect(spotlightOrder(people.slice(0, 1), 1)).toEqual({ members: ["a"], featured: 0 });
});
