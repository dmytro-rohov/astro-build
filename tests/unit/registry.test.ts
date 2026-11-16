import fs from "node:fs";
import { expect, test } from "vitest";
import { sectionComponentPaths } from "../../src/site/components";
import { sectionTypes } from "../../src/site/registry";

test.each(sectionTypes.flatMap((type) => Object.keys(type.variants).map((variant) => [type.type, variant])))(
  "section %s/%s has a component",
  (type, variant) => {
    const file = sectionComponentPaths[type]?.[variant];
    expect(file, `no entry for "${type}/${variant}" in components.ts`).toBeTruthy();
    expect(fs.existsSync(file.replace(/^@\//, "src/")), `${file} does not exist`).toBe(true);
  },
);

test("components.ts has no variant the schemas do not know", () => {
  const known = new Set(sectionTypes.flatMap((type) => Object.keys(type.variants).map((variant) => `${type.type}/${variant}`)));
  const mapped = Object.entries(sectionComponentPaths).flatMap(([type, variants]) => Object.keys(variants).map((variant) => `${type}/${variant}`));

  expect(mapped.filter((entry) => !known.has(entry))).toEqual([]);
});

test("every section type has a label, description and content schema", () => {
  for (const type of sectionTypes) {
    expect(type.label.length).toBeGreaterThan(2);
    expect(type.description.length).toBeGreaterThan(10);
    expect(Object.keys(type.content.shape).length).toBeGreaterThan(0);
  }
});
