import fs from "node:fs";
import path from "node:path";
import { expect, test } from "vitest";
import { sectionTypes } from "../../src/site/registry";

// SectionShell puts `s-<type>` and `s-<type>--<variant>` on the <section>. An inner
// element with the same class gets the section's styles (twice the section collapsed
// into a narrow grid column) — inner elements use `s-<type>__<element>` or another block.
test("no section component reuses the section's own class names", () => {
  const files = fs.readdirSync("src/sections", { recursive: true, encoding: "utf8" }).filter((file) => file.endsWith(".astro") && !file.includes("_shared"));

  for (const file of files) {
    const source = fs.readFileSync(path.join("src/sections", file), "utf8");
    for (const { type } of sectionTypes) {
      const clash = new RegExp(`["'\`\\s]s-${type}(--[\\w$\\{\\}-]+)?["'\`\\s]`);
      expect(clash.test(source), `${file} uses class "s-${type}"`).toBe(false);
    }
  }
});
