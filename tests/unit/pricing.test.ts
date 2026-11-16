import { expect, test } from "vitest";
import { featuredOrder, featureRows } from "../../src/site/pricing";

const plans = (names: string, highlighted?: string) =>
  names.split("").map((name) => ({ name, features: [], highlighted: name === highlighted || undefined }));
const order = (names: string, highlighted?: string) => {
  const result = featuredOrder(plans(names, highlighted));
  return `${result.plans.map((plan) => plan.name).join("")}:${result.featured}`;
};

test("the highlighted plan moves to the middle, the others keep their order", () => {
  expect(order("abc", "b")).toBe("abc:1");
  expect(order("abc", "a")).toBe("bac:1");
  expect(order("abc", "c")).toBe("acb:1");
  expect(order("abcd", "a")).toBe("bacd:1");
  expect(order("abcd", "d")).toBe("abdc:2");
  expect(order("abcd", "b")).toBe("abcd:1");
  expect(order("abcd", "c")).toBe("abcd:2");
  expect(order("ab", "a")).toBe("ab:0");
});

test("without a highlighted plan the middle one (upper middle for even counts) is featured", () => {
  expect(order("a")).toBe("a:0");
  expect(order("ab")).toBe("ab:1");
  expect(order("abc")).toBe("abc:1");
  expect(order("abcd")).toBe("abcd:2");
});

test("table rows: union of the features in order of first appearance, matched by text", () => {
  const rows = featureRows([
    { features: ["Wstęp na siłownię", "Szafka"] },
    { features: ["wstęp  na siłownię ", "Szafka", "Sauna"] },
    { features: ["Trener", "Sauna"] },
  ]);

  expect(rows).toEqual([
    { feature: "Wstęp na siłownię", included: [true, true, false] },
    { feature: "Szafka", included: [true, true, false] },
    { feature: "Sauna", included: [false, true, true] },
    { feature: "Trener", included: [false, false, true] },
  ]);
});

test("table rows: no features, no rows; a repeated feature is one row", () => {
  expect(featureRows([{ features: [] }, { features: [] }])).toEqual([]);
  expect(featureRows([{ features: ["A", "a"] }])).toEqual([{ feature: "A", included: [true] }]);
});
