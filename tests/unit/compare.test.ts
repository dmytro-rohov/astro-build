import { expect, test } from "vitest";
import { archetypes } from "../../src/design-system/archetypes";
import { accentFamily } from "../../src/design-system/theme/families";
import { compareDesigns } from "../../src/site/compare";
import { loadSite } from "../../src/site/loader";

test("accent families by hue", () => {
  expect(accentFamily("#dc2626")).toBe("red");
  expect(accentFamily("#ea580c")).toBe("orange");
  expect(accentFamily("#ca8a04")).toBe("yellow");
  expect(accentFamily("#16a34a")).toBe("green");
  expect(accentFamily("#0f766e")).toBe("teal");
  expect(accentFamily("#2563eb")).toBe("blue");
  expect(accentFamily("#7c3aed")).toBe("purple");
  expect(accentFamily("#db2777")).toBe("pink");
  expect(accentFamily("#18181b")).toBe("neutral");
});

test("every archetype recommends its own accent first and only different families", () => {
  for (const [id, archetype] of Object.entries(archetypes)) {
    expect(archetype.recommendedAccents[0], id).toBe(archetype.accent);
    const families = archetype.recommendedAccents.map(accentFamily);
    expect(new Set(families).size, `${id}: ${families}`).toBe(families.length);
  }
});

test("the fixture pairs are clearly different designs", () => {
  const site = (id: string) => loadSite(`sites/_fixtures/${id}`).site;
  for (const [a, b] of [["dance-elegant", "dance-energetic"], ["auto-corporate", "auto-bold"], ["cafe-warm", "cafe-premium-dark"]]) {
    expect(compareDesigns(site(a), site(b)).problems, `${a} vs ${b}`).toEqual([]);
  }
});

test("same archetype, accent family and hero are reported with a suggestion", () => {
  const a = loadSite("sites/_fixtures/cafe-warm").site;
  const b = structuredClone(a);
  b.theme.accent = "#c2410c";

  const result = compareDesigns(a, b);
  expect(result.distinct).toBe(false);
  expect(result.problems.map((problem) => problem.split(":")[0])).toEqual(["archetype", "accentFamily", "heroVariant"]);
  expect(result.problems[1]).toMatch(/pick one for design B from another family, e\.g\. #9f1239/);
  expect(compareDesigns(a, { ...b, theme: { ...b.theme, archetype: "bold" } }, { sameBrandAccent: true }).problems).toEqual(["heroVariant: both designs use \"split-image\"."]);
});
