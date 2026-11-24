import fs from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";
import { fontFamilies, fontPairs, pairScripts, preloadSubsets } from "../../src/design-system/fonts/library";
import { availableLanguages } from "../../src/i18n/dictionaries";
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

test("preloads latin-ext for languages whose letters are in it", () => {
  expect(preloadSubsets("pl")).toEqual(["latin", "latin-ext"]);
  expect(preloadSubsets("cs")).toEqual(["latin", "latin-ext"]);
  expect(preloadSubsets("tr")).toEqual(["latin", "latin-ext"]);
  expect(preloadSubsets("de")).toEqual(["latin"]);
  expect(preloadSubsets("pt-BR")).toEqual(["latin"]);
  expect(preloadSubsets("uk")).toEqual(["cyrillic"]);
});

// Letters of each engine language outside the latin subset (U+0000-00FF, ı, œ, Œ): they need latin-ext.
test("every engine language with letters beyond latin preloads latin-ext", () => {
  const LATIN = /^[\u0000-\u00ff\u0131\u0152\u0153\u2000-\u206f\u20ac\u2122]*$/;
  const letters: Record<string, string> = {
    cs: "ěščřžýáíéůú", de: "äöüß", en: "", es: "ñáéíóúü", fr: "àâçéèêëîïôùûüÿœ", it: "àèéìòù", nl: "éëïö",
    pl: "ąćęłńóśźż", pt: "ãâáàçéêíóôõú", ru: "", tr: "çğıİöşü", uk: "",
  };

  expect(Object.keys(letters).sort()).toEqual(availableLanguages);
  for (const [lang, text] of Object.entries(letters)) {
    expect(preloadSubsets(lang).includes("latin-ext"), lang).toBe(!LATIN.test(text));
  }
});
