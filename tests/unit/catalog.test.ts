import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { expect, test } from "vitest";
import { ARCHETYPE_IDS } from "../../src/design-system/archetypes";
import { sectionTypes } from "../../src/site/registry";

test("the generated catalog covers every variant with min and max content and validates", () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), "catalog-"));
  // make-catalog validates its own output and exits with 1 when it is invalid.
  execFileSync("npx", ["tsx", "scripts/site/make-catalog.ts", "--out", out], { stdio: "pipe" });

  const site = JSON.parse(fs.readFileSync(path.join(out, "site.json"), "utf8"));
  const ids = new Set(site.pages.flatMap((page: { sections: { id: string }[] }) => page.sections.map((section) => section.id)));

  for (const type of sectionTypes) {
    for (const variant of Object.keys(type.variants)) {
      expect(ids.has(`${type.type}-${variant}-min`), `${type.type}/${variant} min`).toBe(true);
      expect(ids.has(`${type.type}-${variant}-max`), `${type.type}/${variant} max`).toBe(true);
    }
  }
}, 60_000);

test("catalog.json describes every section, variant and archetype; the LLM schema has no regex patterns", () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), "ai-catalog-"));
  execFileSync("npx", ["tsx", "scripts/site/catalog.ts", "--out", out], { stdio: "pipe" });

  const catalog = JSON.parse(fs.readFileSync(path.join(out, "catalog.json"), "utf8"));
  const llm = fs.readFileSync(path.join(out, "site.schema.llm.json"), "utf8");
  const full = JSON.parse(fs.readFileSync(path.join(out, "site.schema.json"), "utf8"));

  for (const type of sectionTypes) {
    const entry = catalog.sections.find((section: { type: string }) => section.type === type.type);
    expect(entry, type.type).toBeDefined();
    expect(entry.variants.map((variant: { id: string }) => variant.id)).toEqual(Object.keys(type.variants));
    expect(entry.content.length, `${type.type} content fields`).toBeGreaterThan(0);
  }

  expect(catalog.archetypes.map((archetype: { id: string }) => archetype.id)).toEqual(ARCHETYPE_IDS);
  expect(catalog.fontPairs.length).toBeGreaterThan(0);
  expect(catalog.icons.length).toBeGreaterThan(0);
  // Every dictionary is a site language, with its own name, Open Graph locale and the scripts its fonts need.
  const languages = new Map(catalog.languages.map((language: { code: string }) => [language.code, language]));
  expect(languages.get("pl")).toMatchObject({ name: "polski", englishName: "Polish", ogLocale: "pl_PL", dir: "ltr", scripts: ["latin", "latin-ext"] });
  expect(languages.get("uk")).toMatchObject({ name: "українська", scripts: ["latin", "cyrillic"] });
  expect([...languages.keys()]).toEqual(fs.readdirSync("src/i18n/dictionaries").filter((file) => file !== "index.ts").map((file) => file.replace(/\.ts$/, "")).sort());
  expect(full.properties.pages).toBeDefined();
  expect(llm).not.toMatch(/"pattern"/);
  expect(llm).toMatch(/max \d+ characters/);
}, 60_000);
