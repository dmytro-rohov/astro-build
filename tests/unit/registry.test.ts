import fs from "node:fs";
import { expect, test } from "vitest";
import { sectionTypes } from "../../src/site/registry";

// src/site/components.ts imports .astro files, so it is checked as text.
const components = fs.readFileSync("src/site/components.ts", "utf8");

test.each(sectionTypes.flatMap((type) => Object.keys(type.variants).map((variant) => [type.type, variant])))(
  "section %s/%s has a component",
  (type, variant) => {
    const line = components.split("\n").find((entry) => entry.trim().startsWith(`${type}:`) || entry.trim().startsWith(`"${type}":`));
    expect(line, `no entry for "${type}" in components.ts`).toBeTruthy();
    expect(line).toMatch(new RegExp(`["']?${variant}["']?\\s*:`));
  },
);

test("every section type has a label, description and content schema", () => {
  for (const type of sectionTypes) {
    expect(type.label.length).toBeGreaterThan(2);
    expect(type.description.length).toBeGreaterThan(10);
    expect(Object.keys(type.content.shape).length).toBeGreaterThan(0);
  }
});
