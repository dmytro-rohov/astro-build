import { expect, test } from "vitest";
import { logoRows, logoShape, marqueeRepeats, pages, tileColumns } from "../../src/sections/logo-cloud/layout";

test("shape: size class by proportions", () => {
  expect([[80, 120], [120, 120], [200, 120], [360, 120], [480, 120], [900, 120]].map(([width, height]) => logoShape(width, height))).toEqual([
    "tall",
    "square",
    "landscape",
    "wide",
    "wider",
    "widest",
  ]);
  expect(logoShape(100, 0)).toBe("widest");
});

test("rows: balanced per breakpoint, never a lonely last logo", () => {
  expect(logoRows(3, [3, 4, 6])).toEqual({ sm: 3, md: 3, lg: 3 });
  expect(logoRows(4, [3, 4, 6])).toEqual({ sm: 2, md: 4, lg: 4 });
  expect(logoRows(7, [3, 4, 6])).toEqual({ sm: 3, md: 4, lg: 4 });
  expect(logoRows(12, [3, 4, 6])).toEqual({ sm: 3, md: 4, lg: 6 });
  expect(logoRows(24, [2, 3, 6])).toEqual({ sm: 2, md: 3, lg: 6 });
});

test("color tiles: never five columns (the colors repeat every five)", () => {
  expect([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 24].map((count) => tileColumns(count).lg)).toEqual([2, 3, 4, 3, 3, 4, 4, 3, 4, 4, 4, 6, 6]);
  expect([2, 3, 4, 12].map((count) => tileColumns(count).md)).toEqual([2, 3, 2, 3]);
});

test("pages of six; marquee loops of at least sixteen logos", () => {
  expect(pages([1, 2, 3, 4, 5, 6, 7, 8], 6)).toEqual([[1, 2, 3, 4, 5, 6], [7, 8]]);
  expect(pages([1, 2], 6)).toEqual([[1, 2]]);
  expect([2, 3, 5, 12, 16, 24].map((count) => marqueeRepeats(count))).toEqual([8, 6, 4, 2, 1, 1]);
  // logo-cloud/_marquee.scss has a speed class for loops of 16–30 logos.
  const loops = Array.from({ length: 23 }, (_, index) => (index + 2) * marqueeRepeats(index + 2));
  expect([Math.min(...loops), Math.max(...loops)]).toEqual([16, 30]);
});
