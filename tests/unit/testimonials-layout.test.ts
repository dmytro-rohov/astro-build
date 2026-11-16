import { expect, test } from "vitest";
import { loadSite } from "../../src/site/loader";
import { cardColumns, initials, quoteSize, ratingSummary } from "../../src/sections/testimonials/layout";
import { testimonials } from "../../src/sections/testimonials/schema";
import { demoSite, writeSite } from "./helpers";

test("initials: first and last word, letters only, upper case", () => {
  expect(initials("Anna K.")).toBe("AK");
  expect(initials("Małgorzata Zielińska-Kowalczyk")).toBe("MZ");
  expect(initials("Jan Maria Rokita")).toBe("JR");
  expect(initials("  łucja ")).toBe("Ł");
  expect(initials("„Ewa” Nowak")).toBe("EN");
  expect(initials("Олена Коваль")).toBe("ОК");
  expect(initials("123")).toBe("");
});

test("quote size: short quotes larger, long ones smaller", () => {
  expect(quoteSize("x".repeat(120))).toBe("lg");
  expect(quoteSize("x".repeat(121))).toBe("md");
  expect(quoteSize("x".repeat(260))).toBe("md");
  expect(quoteSize("x".repeat(420))).toBe("sm");
  expect(quoteSize("x".repeat(40), "x".repeat(200))).toBe("md");
});

test("card columns: one row up to three, four as 2 × 2, then three", () => {
  expect(Array.from({ length: 9 }, (_, index) => cardColumns(index + 1))).toEqual(["1", "2", "3", "2", "3", "3", "3", "3", "3"]);
});

test("rating summary: the profile's figures first, else the average of rated reviews, else nothing", () => {
  const items = [{ rating: 5 }, { rating: 4 }, {}, { rating: 5 }];

  expect(ratingSummary({ ratingAverage: 4.9, ratingCount: 127, ratingSource: "Google", items })).toEqual({ average: 4.9, count: 127, source: "Google" });
  expect(ratingSummary({ ratingAverage: 4.7, items })).toEqual({ average: 4.7, count: undefined, source: undefined });
  expect(ratingSummary({ items })).toEqual({ average: 4.7, count: 3 });
  expect(ratingSummary({ items: [{ rating: 5 }] })).toEqual({ average: 5, count: 1 });
  expect(ratingSummary({ items: [{}, {}] })).toBeUndefined();
});

test("portraits without photos and spotlight with more than three reviews are reported", () => {
  const site = demoSite();
  const items = Array.from({ length: 4 }, (_, index) => ({ id: `r${index}`, quote: "Polecam.", author: "Anna K." }));
  site.pages[0].sections.push(
    { id: "opinie", type: "testimonials", variant: "portraits", props: {}, content: { title: "Opinie", items } },
    { id: "opinie-2", type: "testimonials", variant: "spotlight", props: {}, content: { title: "Opinie", items } },
  );

  const warnings = loadSite(writeSite(site, { hero: { file: "hero.jpg", alt: "Hero" }, icon: { file: "icon.png", alt: "" } }, ["hero.jpg", "icon.png"])).warnings;
  expect(warnings.filter((warning) => warning.includes('"portraits"'))).toEqual([expect.stringMatching(/initials for 4 of 4 testimonials/)]);
  expect(warnings.filter((warning) => warning.includes('"spotlight"'))).toEqual([expect.stringMatching(/first 3 of 4 testimonials/)]);
});

test("rating count and source need the overall score", () => {
  const content = { title: "Opinie", items: [{ id: "a", quote: "Super.", author: "Anna K." }] };
  const parse = (extra: Record<string, unknown>) => testimonials.content.safeParse({ ...content, ...extra });

  expect(parse({}).success).toBe(true);
  expect(parse({ ratingAverage: 4.8, ratingCount: 52, ratingSource: "Google" }).success).toBe(true);
  expect(parse({ ratingLink: { label: "Wszystkie opinie", href: "https://example.com/" } }).success).toBe(true);
  expect(parse({ ratingCount: 52 }).error?.issues.map((issue) => issue.path.join("."))).toEqual(["ratingCount"]);
  expect(parse({ ratingSource: "Google" }).error?.issues.map((issue) => issue.path.join("."))).toEqual(["ratingSource"]);
});
