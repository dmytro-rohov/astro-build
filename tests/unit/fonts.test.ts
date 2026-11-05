import fs from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";
import { fontFamilies, fontPairs, pairScripts } from "../../src/design-system/fonts/library";
import { archetypes } from "../../src/design-system/archetypes";

describe.each(Object.entries(fontFamilies))("font family %s", (_id, family) => {
  const dir = path.resolve("node_modules/@fontsource-variable", family.package);

  test("package is installed with a license", () => {
    expect(fs.existsSync(path.join(dir, "LICENSE"))).toBe(true);
    expect(JSON.parse(fs.readFileSync(path.join(dir, "metadata.json"), "utf8")).license.type).toBe("OFL-1.1");
  });

  test("declared scripts match the package subsets", () => {
    const files = fs.readdirSync(path.join(dir, "files"));
    const has = (subset: string) => files.includes(`${family.package}-${subset}-wght-normal.woff2`);

    for (const script of family.scripts) expect(has(script), script).toBe(true);
    expect(has("cyrillic")).toBe((family.scripts as readonly string[]).includes("cyrillic"));
  });
});

test("every archetype uses an existing font pair", () => {
  for (const archetype of Object.values(archetypes)) {
    expect(fontPairs[archetype.fontPair]).toBeDefined();
  }
});

test("Cyrillic support of pairs", () => {
  expect(pairScripts("inter")).toContain("cyrillic");
  expect(pairScripts("space-grotesk+inter")).not.toContain("cyrillic");
});
