import { expect, test } from "vitest";
import { autoColumns, bentoSizes, highlightIndex } from "../../src/sections/features/layout";

test("auto columns: one row up to 4 items, then full or fuller last rows", () => {
  const columns = Array.from({ length: 11 }, (_, index) => autoColumns(index + 2));
  expect(columns).toEqual(["2", "3", "4", "3", "3", "4", "4", "3", "4", "4", "4"]);
});

test("highlight: the 1-based prop when it exists, else the middle of the first row", () => {
  expect(highlightIndex(3, "3")).toBe(1);
  expect(highlightIndex(4, "4")).toBe(1);
  expect(highlightIndex(2, "2")).toBe(0);
  expect(highlightIndex(6, "3")).toBe(1);
  expect(highlightIndex(3, "3", 3)).toBe(2);
  expect(highlightIndex(3, "3", 9)).toBe(1);
});

test("bento: tiles always fill the 4-column grid", () => {
  const area = { lead: 4, pair: 4, tall: 2, wide: 2 };

  for (let count = 2; count <= 12; count++) {
    const sizes = bentoSizes(count);
    const cells = sizes.reduce((sum, size) => sum + (size ? area[size] : 1), 0);
    expect(sizes[0], `${count} items`).toBe("lead");
    expect(cells % 4, `${count} items: ${sizes.join(",")}`).toBe(0);
  }
});
