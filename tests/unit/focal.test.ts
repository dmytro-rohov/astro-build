import { expect, test } from "vitest";
import { focalToPosition } from "../../src/site/focal";

test.each([
  [undefined, "centre"],
  [{ x: 50, y: 50 }, "centre"],
  [{ x: 10, y: 10 }, "left top"],
  [{ x: 90, y: 50 }, "right"],
  [{ x: 50, y: 80 }, "bottom"],
  [{ x: 80, y: 90 }, "right bottom"],
])("%o → %s", (focal, position) => {
  expect(focalToPosition(focal)).toBe(position);
});
