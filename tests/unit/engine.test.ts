import { expect, test } from "vitest";
import { satisfiesEngine } from "../../src/site/engine";

test.each([
  ["^3.0.0", "3.2.1", true],
  ["^3.0.0", "4.0.0", false],
  ["^3.1.0", "3.0.9", false],
  ["~3.1.0", "3.1.5", true],
  ["~3.1.0", "3.2.0", false],
  [">=3.0.0", "5.0.0", true],
  ["3.0.0", "3.0.0", true],
  ["3.0.0", "3.0.1", false],
  ["latest", "3.0.0", false],
])("%s with engine %s → %s", (range, version, expected) => {
  expect(satisfiesEngine(range, version)).toBe(expected);
});
