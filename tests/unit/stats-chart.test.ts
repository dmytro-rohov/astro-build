import { expect, test } from "vitest";
import { areaPath, chartBars, chartSeries, endPoint, linePath } from "../../src/sections/stats/chart";

test("the series is deterministic per item and differs between items", () => {
  expect(chartSeries("clients:1 200+")).toEqual(chartSeries("clients:1 200+"));
  expect(chartSeries("clients:1 200+")).not.toEqual(chartSeries("years:25 lat"));
});

test("the series has the requested length, stays in [0.2, 1] and ends at its top", () => {
  for (const seed of ["a:1", "rating:4,9/5", "max-17:Najwyższej jakoś", ""]) {
    const series = chartSeries(seed, 8);
    expect(series).toHaveLength(8);
    expect(Math.min(...series)).toBeGreaterThanOrEqual(0.2);
    expect(series.at(-1)).toBe(1);
    expect(Math.max(...series.slice(0, -1))).toBeLessThan(1);
  }
});

test("the series rises: the second half is higher than the first on average", () => {
  for (const seed of ["one:10", "two:200+", "three:98%", "four:4,9"]) {
    const series = chartSeries(seed);
    const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
    expect(average(series.slice(5))).toBeGreaterThan(average(series.slice(0, 5)));
  }
});

test("bars fill the width in equal slots, as SVG percentages", () => {
  const bars = chartBars([0.5, 1], 0.5);
  expect(bars).toEqual([
    { x: "12.5%", y: "50%", width: "25%", height: "50%" },
    { x: "62.5%", y: "0%", width: "25%", height: "100%" },
  ]);
});

test("the line runs from the left edge to the end point; the area closes on the baseline", () => {
  const series = [0.2, 0.6, 1];
  expect(linePath(series, 100, 40, 6)).toMatch(/^M0 33.2 C.* 100 6$/);
  expect(endPoint(series, 100, 40, 6)).toEqual({ x: 100, y: 6 });
  expect(areaPath(series, 100, 40, 6)).toBe(`${linePath(series, 100, 40, 6)} L100 40 L0 40 Z`);
});
